// client/src/pages/CreatePostPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useNetworkStore from '../store/networkStore';

const POST_TYPES = [
  { value: 'general',         label: 'General Update' },
  { value: 'recipe_share',    label: 'Recipe Share' },
  { value: 'seeking_chef',    label: 'Seeking Chef' },
  { value: 'job_opportunity', label: 'Job Opportunity' },
  { value: 'collab_request',  label: 'Collab Request' },
  { value: 'tip_technique',   label: 'Tip / Technique' },
  { value: 'question',        label: 'Question' },
  { value: 'milestone',       label: 'Milestone' },
];

export const CreatePostPage = ({ toast }) => {
  const navigate = useNavigate();
  const { createPost } = useNetworkStore();

  const [form, setForm] = useState({
    content: '',
    postType: 'general',
    tags: '',
    visibility: 'public',
  });
  const [submitting, setSubmitting] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.content.trim()) { toast?.error('Content is required'); return; }
    setSubmitting(true);
    try {
      await createPost({
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      toast?.success('Post published!');
      navigate('/network');
    } catch {
      toast?.error('Failed to publish');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="font-display text-2xl font-bold text-ink mb-6">Create Post</h1>

      <div className="card p-6 space-y-5">

        {/* Post Type */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Post Type</label>
          <select
            value={form.postType}
            onChange={e => set('postType', e.target.value)}
            className="w-full input font-body text-sm"
          >
            {POST_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Content</label>
          <textarea
            rows={6}
            maxLength={2000}
            placeholder="What's on your mind, Chef?"
            value={form.content}
            onChange={e => set('content', e.target.value)}
            className="w-full input font-body text-sm resize-none"
          />
          <p className="text-xs text-ink/40 mt-1 text-right">{form.content.length}/2000</p>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            Tags <span className="text-ink/40 font-normal">(comma separated)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. pastry, mumbai, popup"
            value={form.tags}
            onChange={e => set('tags', e.target.value)}
            className="w-full input font-body text-sm"
          />
        </div>

        {/* Visibility */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Visibility</label>
          <div className="flex gap-3">
            {['public', 'connections_only'].map(v => (
              <label key={v} className="flex items-center gap-2 cursor-pointer font-body text-sm text-ink/70">
                <input
                  type="radio"
                  name="visibility"
                  value={v}
                  checked={form.visibility === v}
                  onChange={() => set('visibility', v)}
                />
                {v === 'public' ? 'Public' : 'Connections Only'}
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => navigate('/network')}
            className="btn-ghost flex-1 py-2.5 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary flex-1 py-2.5 text-sm"
          >
            {submitting ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  );
};