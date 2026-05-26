// src/pages/SettingsPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UseAuthStore from '../store/useAuthStore';
import { SkillsSection } from '../components/ui/SkillsSection';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const TABS = ['Profile', 'Chef Info', 'Skills', 'Social Links', 'Password'];

export function SettingsPage({ toast }) {
  const { user, token, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Profile');
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    displayName:   user?.displayName   || '',
    bio:           user?.bio           || '',
    location:      user?.location      || '',
    role:          user?.role          || 'home_cook',
    isPrivate:     user?.isPrivate     || false,
    avatarUrl:     user?.avatarUrl     || '',
    coverImageUrl: user?.coverImageUrl || '',
  });

  const [chefInfo, setChefInfo] = useState({
    culinaryTitle:      user?.culinaryTitle      || '',
    culinaryPhilosophy: user?.culinaryPhilosophy || '',
    yearsOfExperience:  user?.yearsOfExperience  || 0,
    cuisineSpecialties: (user?.cuisineSpecialties || []).join(', '),
    dietaryExpertise:   (user?.dietaryExpertise   || []).join(', '),
  });

  const [social, setSocial] = useState({
    instagram: user?.socialLinks?.instagram || '',
    youtube:   user?.socialLinks?.youtube   || '',
    website:   user?.socialLinks?.website   || '',
    tiktok:    user?.socialLinks?.tiktok    || '',
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword:     '',
    confirmPassword: '',
  });

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization:  `Bearer ${token}`,
  };

  async function saveProfile() {
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/users/profile`, {
        method: 'PUT', headers: authHeaders, body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      updateUser(data.data);
      toast?.('Profile updated!', 'success');
    } catch (err) { toast?.(err.message, 'error'); }
    finally { setSaving(false); }
  }

  async function saveChefInfo() {
    setSaving(true);
    try {
      const body = {
        culinaryTitle:      chefInfo.culinaryTitle,
        culinaryPhilosophy: chefInfo.culinaryPhilosophy,
        yearsOfExperience:  Number(chefInfo.yearsOfExperience),
        cuisineSpecialties: chefInfo.cuisineSpecialties.split(',').map(s => s.trim()).filter(Boolean),
        dietaryExpertise:   chefInfo.dietaryExpertise.split(',').map(s => s.trim()).filter(Boolean),
      };
      const res = await fetch(`${API}/api/users/profile`, {
        method: 'PUT', headers: authHeaders, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      updateUser(data.data);
      toast?.('Chef info updated!', 'success');
    } catch (err) { toast?.(err.message, 'error'); }
    finally { setSaving(false); }
  }

  async function saveSocial() {
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/users/profile`, {
        method: 'PUT', headers: authHeaders, body: JSON.stringify({ socialLinks: social }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      updateUser(data.data);
      toast?.('Social links updated!', 'success');
    } catch (err) { toast?.(err.message, 'error'); }
    finally { setSaving(false); }
  }

  async function savePassword() {
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast?.('Passwords do not match', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/users/password`, {
        method: 'PUT', headers: authHeaders,
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword:     passwords.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast?.('Password changed!', 'success');
    } catch (err) { toast?.(err.message, 'error'); }
    finally { setSaving(false); }
  }

  const inputCls = 'w-full border border-ink-faint rounded-lg px-3 py-2 bg-white font-body text-sm text-ink focus:outline-none focus:ring-2 focus:ring-herb';
  const labelCls = 'block font-body text-xs text-ink-muted mb-1 uppercase tracking-wide';
  const sectionCls = 'space-y-4';

  return (
    <div className="min-h-screen bg-parchment pt-8 pb-16 px-4">
      <div className="max-w-2xl mx-auto">

        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate(-1)} className="text-ink-muted hover:text-ink text-xl">←</button>
          <h1 className="font-display text-3xl text-ink">Settings</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white border border-ink-faint rounded-xl p-1 flex-wrap">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-sm font-body rounded-lg transition-colors ${
                activeTab === tab ? 'bg-herb text-white' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="bg-white border border-ink-faint rounded-2xl p-6 space-y-6">

          {/* PROFILE TAB */}
          {activeTab === 'Profile' && (
            <div className={sectionCls}>
              <div>
                <label className={labelCls}>Display Name</label>
                <input className={inputCls} value={profile.displayName}
                  onChange={e => setProfile(p => ({ ...p, displayName: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Bio <span className="normal-case">(max 300)</span></label>
                <textarea className={inputCls} rows={3} maxLength={300} value={profile.bio}
                  onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Location</label>
                <input className={inputCls} value={profile.location}
                  onChange={e => setProfile(p => ({ ...p, location: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Avatar URL</label>
                <input className={inputCls} placeholder="https://..." value={profile.avatarUrl}
                  onChange={e => setProfile(p => ({ ...p, avatarUrl: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Cover Image URL</label>
                <input className={inputCls} placeholder="https://..." value={profile.coverImageUrl}
                  onChange={e => setProfile(p => ({ ...p, coverImageUrl: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Account Type</label>
                <select className={inputCls} value={profile.role}
                  onChange={e => setProfile(p => ({ ...p, role: e.target.value }))}>
                  <option value="home_cook">Home Cook</option>
                  <option value="professional_chef">Professional Chef</option>
                  <option value="food_blogger">Food Blogger</option>
                  <option value="culinary_student">Culinary Student</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="isPrivate" checked={profile.isPrivate}
                  onChange={e => setProfile(p => ({ ...p, isPrivate: e.target.checked }))}
                  className="w-4 h-4 accent-herb" />
                <label htmlFor="isPrivate" className="font-body text-sm text-ink">Private account</label>
              </div>
              <button onClick={saveProfile} disabled={saving}
                className="w-full py-3 bg-herb text-white rounded-xl font-body font-medium hover:bg-herb/90 disabled:opacity-50 transition-colors">
                {saving ? 'Saving…' : 'Save Profile'}
              </button>
            </div>
          )}

          {/* CHEF INFO TAB */}
          {activeTab === 'Chef Info' && (
            <div className={sectionCls}>
              <div>
                <label className={labelCls}>Culinary Title</label>
                <input className={inputCls} placeholder="e.g. Pastry Chef, Sous Chef" value={chefInfo.culinaryTitle}
                  onChange={e => setChefInfo(p => ({ ...p, culinaryTitle: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Culinary Philosophy <span className="normal-case">(max 600)</span></label>
                <textarea className={inputCls} rows={4} maxLength={600} value={chefInfo.culinaryPhilosophy}
                  onChange={e => setChefInfo(p => ({ ...p, culinaryPhilosophy: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Years of Experience</label>
                <input className={inputCls} type="number" min={0} max={70} value={chefInfo.yearsOfExperience}
                  onChange={e => setChefInfo(p => ({ ...p, yearsOfExperience: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Cuisine Specialties <span className="normal-case">(comma-separated)</span></label>
                <input className={inputCls} placeholder="Italian, French, Japanese" value={chefInfo.cuisineSpecialties}
                  onChange={e => setChefInfo(p => ({ ...p, cuisineSpecialties: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Dietary Expertise <span className="normal-case">(comma-separated)</span></label>
                <input className={inputCls} placeholder="Vegan, Gluten-free, Keto" value={chefInfo.dietaryExpertise}
                  onChange={e => setChefInfo(p => ({ ...p, dietaryExpertise: e.target.value }))} />
              </div>
              <button onClick={saveChefInfo} disabled={saving}
                className="w-full py-3 bg-herb text-white rounded-xl font-body font-medium hover:bg-herb/90 disabled:opacity-50 transition-colors">
                {saving ? 'Saving…' : 'Save Chef Info'}
              </button>
            </div>
          )}

          {/* SKILLS TAB */}
          {activeTab === 'Skills' && (
            <SkillsSection profileUser={user} toast={toast} />
          )}

          {/* SOCIAL LINKS TAB */}
          {activeTab === 'Social Links' && (
            <div className={sectionCls}>
              {['instagram', 'youtube', 'website', 'tiktok'].map(platform => (
                <div key={platform}>
                  <label className={labelCls}>{platform.charAt(0).toUpperCase() + platform.slice(1)}</label>
                  <input className={inputCls} placeholder={`https://${platform}.com/...`}
                    value={social[platform]}
                    onChange={e => setSocial(p => ({ ...p, [platform]: e.target.value }))} />
                </div>
              ))}
              <button onClick={saveSocial} disabled={saving}
                className="w-full py-3 bg-herb text-white rounded-xl font-body font-medium hover:bg-herb/90 disabled:opacity-50 transition-colors">
                {saving ? 'Saving…' : 'Save Social Links'}
              </button>
            </div>
          )}

          {/* PASSWORD TAB */}
          {activeTab === 'Password' && (
            <div className={sectionCls}>
              <div>
                <label className={labelCls}>Current Password</label>
                <input className={inputCls} type="password" value={passwords.currentPassword}
                  onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>New Password</label>
                <input className={inputCls} type="password" value={passwords.newPassword}
                  onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Confirm New Password</label>
                <input className={inputCls} type="password" value={passwords.confirmPassword}
                  onChange={e => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))} />
              </div>
              <button onClick={savePassword} disabled={saving}
                className="w-full py-3 bg-herb text-white rounded-xl font-body font-medium hover:bg-herb/90 disabled:opacity-50 transition-colors">
                {saving ? 'Saving…' : 'Change Password'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}