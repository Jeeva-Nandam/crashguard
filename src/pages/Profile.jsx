import { useState } from 'react';
import { useAuth, API } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import './Profile.css';

const INDUSTRIES = ['SaaS', 'Ecommerce', 'Agency', 'Other'];
const STAGES = ['Startup', 'Growth', 'Mature'];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    company_name: user?.business_profile?.company_name || '',
    industry_type: user?.business_profile?.industry_type || '',
    business_stage: user?.business_profile?.business_stage || '',
    number_of_employees: user?.business_profile?.number_of_employees || '',
    monthly_recurring_revenue: user?.business_profile?.monthly_recurring_revenue || '',
    website: user?.business_profile?.website || '',
  });

  // Change password state
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwVisible, setPwVisible] = useState(false);

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const pick = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const handlePw = e => setPwForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        number_of_employees: Number(form.number_of_employees),
        monthly_recurring_revenue: form.monthly_recurring_revenue ? Number(form.monthly_recurring_revenue) : undefined,
      };
      const { data } = await API.post('/auth/onboarding/business-profile', payload);
      updateUser(data.user);
      setEditing(false);
      toast('Profile updated!', 'success');
    } catch {
      toast('Update failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm) return toast('New passwords do not match.', 'error');
    setPwLoading(true);
    try {
      await API.post('/auth/change-password', {
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      });
      toast('Password changed! Please log in again.', 'success');
      setPwForm({ current_password: '', new_password: '', confirm: '' });
      setPwVisible(false);
      // Log user out so they re-authenticate with new password
      setTimeout(() => { window.location.href = '/login'; }, 1500);
    } catch (err) {
      toast(err.response?.data?.detail || 'Password change failed.', 'error');
    } finally {
      setPwLoading(false);
    }
  };

  const bp = user?.business_profile;
  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="profile-page animate-fadeUp">
      <div className="page-header">
        <h1>Profile</h1>
        <p>Your account and business settings</p>
      </div>

      {/* Account card */}
      <div className="profile-section card animate-fadeUp delay-1">
        <div className="profile-hero">
          <div className="profile-avatar-lg">{initials}</div>
          <div>
            <h2>{user?.full_name}</h2>
            <p>{user?.email}</p>
            <div className="profile-tags">
              <span className="badge badge-green">{user?.role}</span>
              {user?.is_email_verified && <span className="badge badge-blue">✓ Verified</span>}
            </div>
          </div>
        </div>

        <div className="divider" />

        <div className="account-details">
          {[
            ['Phone', user?.phone_number],
            ['Member since', new Date(user?.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })],
            ['Onboarding', user?.onboarding_complete ? 'Complete' : 'Incomplete'],
          ].map(([k, v]) => (
            <div key={k} className="detail-row">
              <span className="detail-key">{k}</span>
              <span className="detail-val">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Change / Forgot Password ── */}
      <div className="profile-section card animate-fadeUp delay-2">
        <div className="section-header-row">
          <h3>Password & security</h3>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setPwVisible(v => !v)}
          >
            {pwVisible ? 'Cancel' : '🔒 Change password'}
          </button>
        </div>

        {!pwVisible ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 14, color: 'var(--text-2)' }}>Password</p>
              <p style={{ fontSize: 13, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                ••••••••••••
              </p>
            </div>
            <a
              href="/forgot-password"
              style={{ fontSize: 13, color: 'var(--text-3)', textDecoration: 'none' }}
              onMouseOver={e => e.target.style.color = 'var(--acid)'}
              onMouseOut={e => e.target.style.color = 'var(--text-3)'}
            >
              Forgot password? →
            </a>
          </div>
        ) : (
          <form onSubmit={changePassword} className="edit-form">
            <div className="field">
              <label>Current password</label>
              <input
                name="current_password" type="password"
                placeholder="Enter your current password"
                value={pwForm.current_password} onChange={handlePw} required
              />
            </div>
            <div className="field-row">
              <div className="field">
                <label>New password</label>
                <input
                  name="new_password" type="password"
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  value={pwForm.new_password} onChange={handlePw} required
                />
              </div>
              <div className="field">
                <label>Confirm new password</label>
                <input
                  name="confirm" type="password"
                  placeholder="Repeat new password"
                  value={pwForm.confirm} onChange={handlePw} required
                />
                {pwForm.confirm && pwForm.new_password !== pwForm.confirm && (
                  <span style={{ fontSize: 12, color: 'var(--ember)', marginTop: 4, display: 'block' }}>
                    Passwords do not match
                  </span>
                )}
              </div>
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              style={{ width: 'fit-content' }}
              disabled={pwLoading || !pwForm.current_password || !pwForm.new_password || pwForm.new_password !== pwForm.confirm}
            >
              {pwLoading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Changing…</> : 'Update password'}
            </button>
          </form>
        )}
      </div>

      {/* Business profile */}
      <div className="profile-section card animate-fadeUp delay-3">
        <div className="section-header-row">
          <h3>Business profile</h3>
          {!editing
            ? <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>✎ Edit</button>
            : <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
                {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Save'}
              </button>
            </div>
          }
        </div>

        {!editing ? (
          bp ? (
            <div className="bp-grid">
              {[
                ['Company', bp.company_name],
                ['Industry', bp.industry_type],
                ['Stage', bp.business_stage],
                ['Employees', bp.number_of_employees],
                ['MRR', bp.monthly_recurring_revenue ? `₹${bp.monthly_recurring_revenue.toLocaleString('en-IN')}` : '—'],
                ['Website', bp.website || '—'],
              ].map(([k, v]) => (
                <div key={k} className="bp-item">
                  <span className="bp-key">{k}</span>
                  <span className="bp-val">{v}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-bp">
              <p>No business profile set up yet.</p>
              <button className="btn btn-primary btn-sm" onClick={() => setEditing(true)}>Set up now →</button>
            </div>
          )
        ) : (
          <div className="edit-form">
            <div className="field-row">
              <div className="field">
                <label>Company name</label>
                <input name="company_name" value={form.company_name} onChange={handle} placeholder="Acme Inc." />
              </div>
              <div className="field">
                <label>Website</label>
                <input name="website" value={form.website} onChange={handle} placeholder="https://acme.io" />
              </div>
            </div>
            <div>
              <label className="edit-label">Industry</label>
              <div className="pill-grid">
                {INDUSTRIES.map(i => (
                  <button type="button" key={i} className={`pill ${form.industry_type === i ? 'active' : ''}`} onClick={() => pick('industry_type', i)}>{i}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="edit-label">Stage</label>
              <div className="stage-grid-sm">
                {STAGES.map(s => (
                  <button type="button" key={s} className={`stage-card-sm ${form.business_stage === s ? 'active' : ''}`} onClick={() => pick('business_stage', s)}>{s}</button>
                ))}
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Employees</label>
                <input name="number_of_employees" type="number" value={form.number_of_employees} onChange={handle} />
              </div>
              <div className="field">
                <label>Monthly Revenue (₹)</label>
                <input name="monthly_recurring_revenue" type="number" value={form.monthly_recurring_revenue} onChange={handle} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Integrations */}
      <div className="profile-section card animate-fadeUp delay-4">
        <h3>Integrations <span className="badge badge-amber" style={{ fontSize: 10, verticalAlign: 'middle', marginLeft: 8 }}>Coming soon</span></h3>
        <div className="integrations-list">
          {[
            { name: 'Stripe', desc: 'Auto-sync revenue data', color: '#635BFF', icon: '💳' },
            { name: 'QuickBooks', desc: 'Auto-sync expense data', color: '#2CA01C', icon: '📒' },
            { name: 'Google Sheets', desc: 'Import from spreadsheet', color: '#0F9D58', icon: '📊' },
          ].map(({ name, desc, color, icon }) => (
            <div key={name} className="integration-row">
              <div className="int-icon" style={{ background: `${color}20`, border: `1px solid ${color}40` }}>{icon}</div>
              <div className="int-info">
                <span className="int-name">{name}</span>
                <span className="int-desc">{desc}</span>
              </div>
              <button className="btn btn-ghost btn-sm" disabled style={{ opacity: 0.4 }}>Connect</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
