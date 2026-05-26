// client/src/components/ui/SkillsSection.jsx
import { useState } from 'react';
import { Plus, X, ThumbsUp } from 'lucide-react';
import api from '../../lib/axios';
import UseAuthStore from '../../store/authStore';

const CATEGORIES = ['technique', 'cuisine', 'dietary', 'equipment', 'management', 'other'];

const CATEGORY_COLORS = {
  technique:  'bg-terracotta/10 text-terracotta',
  cuisine:    'bg-amber-100 text-amber-700',
  dietary:    'bg-green-100 text-green-700',
  equipment:  'bg-blue-100 text-blue-600',
  management: 'bg-purple-100 text-purple-700',
  other:      'bg-parchment-100 text-ink/60',
};

export const SkillsSection = ({ profileUser, onSkillsChange, toast }) => {
  const { user: currentUser } = useAuthStore();
  const isOwner = currentUser?._id === profileUser?._id;

  const [skills, setSkills]     = useState(profileUser?.skills || []);
  const [newSkill, setNewSkill] = useState('');
  const [newCat, setNewCat]     = useState('technique');
  const [adding, setAdding]     = useState(false);
  const [showForm, setShowForm] = useState(false);

  const username = profileUser?.username;

  const handleAdd = async () => {
    if (!newSkill.trim()) return;
    setAdding(true);
    try {
      const { data } = await api.post(`/users/${username}/skills`, {
        name: newSkill.trim(),
        category: newCat,
      });
      setSkills(data);
      onSkillsChange?.(data);
      setNewSkill('');
      setShowForm(false);
      toast?.success('Skill added');
    } catch (err) {
      toast?.error(err.response?.data?.message || 'Failed to add skill');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (skillId) => {
    try {
      const { data } = await api.delete(`/users/${username}/skills/${skillId}`);
      setSkills(data);
      onSkillsChange?.(data);
    } catch {
      toast?.error('Failed to remove skill');
    }
  };

  const handleEndorse = async (skillId) => {
    try {
      const { data } = await api.post(`/users/${username}/skills/${skillId}/endorse`);
      setSkills(prev => prev.map(s =>
        s._id === skillId
          ? { ...s, endorseCount: data.endorseCount,
              endorsedBy: data.endorsed
                ? [...s.endorsedBy, { user: currentUser._id }]
                : s.endorsedBy.filter(e => e.user !== currentUser._id) }
          : s
      ));
    } catch {
      toast?.error('Failed to endorse');
    }
  };

  const isEndorsed = (skill) =>
    skill.endorsedBy?.some(e => e.user === currentUser?._id || e.user?._id === currentUser?._id);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-bold text-ink">Skills</h3>
        {isOwner && (
          <button
            onClick={() => setShowForm(f => !f)}
            className="flex items-center gap-1 text-sm text-terracotta hover:opacity-80 transition-opacity font-body"
          >
            <Plus size={15} />
            Add Skill
          </button>
        )}
      </div>

      {/* Add skill form */}
      {isOwner && showForm && (
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="e.g. Knife Skills"
            value={newSkill}
            onChange={e => setNewSkill(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="input text-sm flex-1"
          />
          <select
            value={newCat}
            onChange={e => setNewCat(e.target.value)}
            className="input text-sm w-36"
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            disabled={adding}
            className="btn-primary text-sm px-4"
          >
            {adding ? '...' : 'Add'}
          </button>
        </div>
      )}

      {/* Skills list */}
      {skills.length === 0 ? (
        <p className="text-sm text-ink/40 font-body">No skills added yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {skills.map(skill => (
            <div
              key={skill._id}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-body ${CATEGORY_COLORS[skill.category] || CATEGORY_COLORS.other}`}
            >
              <span>{skill.name}</span>

              {/* Endorse button — only for others */}
              {!isOwner && currentUser && (
                <button
                  onClick={() => handleEndorse(skill._id)}
                  className={`flex items-center gap-1 text-xs transition-opacity hover:opacity-80 ${
                    isEndorsed(skill) ? 'opacity-100 font-medium' : 'opacity-50'
                  }`}
                  title={isEndorsed(skill) ? 'Remove endorsement' : 'Endorse'}
                >
                  <ThumbsUp size={11} fill={isEndorsed(skill) ? 'currentColor' : 'none'} />
                  {skill.endorseCount > 0 && <span>{skill.endorseCount}</span>}
                </button>
              )}

              {/* Endorse count display for owner */}
              {isOwner && skill.endorseCount > 0 && (
                <span className="flex items-center gap-1 text-xs opacity-60">
                  <ThumbsUp size={11} />
                  {skill.endorseCount}
                </span>
              )}

              {/* Delete — owner only */}
              {isOwner && (
                <button
                  onClick={() => handleDelete(skill._id)}
                  className="opacity-40 hover:opacity-100 transition-opacity ml-1"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};