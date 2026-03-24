import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer
} from 'recharts';
import './Admin.css';

const riskBadge = { 'HIGH RISK': 'badge-red', 'MEDIUM RISK': 'badge-amber', 'LOW RISK': 'badge-green' };

export default function Admin() {
  const nav = useNavigate();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedUser, setExpandedUser] = useState(null);
  const [userAnalyses, setUserAnalyses] = useState({});
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    adminAPI.get('/admin/users')
      .then(({ data }) => {
        setUsers(data.users);
        setStats(data.stats);
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          nav('/admin/login');
        } else {
          toast('Failed to load admin data.', 'error');
          setStats({ total_users: 0, verified_users: 0, onboarded_users: 0, total_analyses: 0, high_risk_count: 0 });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const loadUserAnalyses = async (uid) => {
    if (userAnalyses[uid]) return;
    try {
      const { data } = await adminAPI.get(`/admin/users/${uid}/analyses`);
      setUserAnalyses(prev => ({ ...prev, [uid]: data.analyses }));
    } catch {
      setUserAnalyses(prev => ({ ...prev, [uid]: [] }));
    }
  };

  const toggleUser = async (uid) => {
    const next = expandedUser === uid ? null : uid;
    setExpandedUser(next);
    if (next) loadUserAnalyses(uid);
  };

  const handleDelete = async (uid, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this user and all their data permanently?')) return;
    setDeleting(uid);
    try {
      await adminAPI.delete(`/admin/users/${uid}`);
      setUsers(prev => prev.filter(u => u.id !== uid));
      if (expandedUser === uid) setExpandedUser(null);
      toast('User deleted.', 'info');
    } catch {
      toast('Delete failed.', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('admin_token');
    nav('/admin/login');
  };

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.business_profile?.company_name?.toLowerCase().includes(search.toLowerCase())
  );

  const initials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div className="admin-shell">
      {/* Admin header bar */}
      <header className="admin-header">
        <div className="admin-header-left">
          <span className="brand-icon" style={{ fontSize: 20, color: 'var(--ember)' }}>⊞</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>CrashGuard Admin</span>
          <span className="badge badge-red" style={{ fontSize: 10 }}>SUPERADMIN</span>
        </div>
        <button className="btn btn-danger btn-sm" onClick={handleAdminLogout}>
          ⇥ Sign out
        </button>
      </header>

      <div className="admin-body animate-fadeUp">
        <div className="page-header">
          <h1>Admin panel</h1>
          <p>All registered users and their analysis history</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="admin-stats animate-fadeUp delay-1">
            {[
              { label: 'Total users', value: stats.total_users, icon: '◎', color: 'var(--acid)' },
              { label: 'Verified', value: stats.verified_users, icon: '✓', color: 'var(--blue)' },
              { label: 'Onboarded', value: stats.onboarded_users ?? '—', icon: '⬡', color: 'var(--teal, #00b4b4)' },
              { label: 'Analyses run', value: stats.total_analyses, icon: '◈', color: 'var(--amber)' },
              { label: 'High risk', value: stats.high_risk_count, icon: '⚠', color: 'var(--ember)' },
            ].map(s => (
              <div key={s.label} className="admin-stat-card card">
                <span className="ast-icon" style={{ color: s.color }}>{s.icon}</span>
                <span className="ast-val mono" style={{ color: s.color }}>{s.value}</span>
                <span className="ast-label">{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="admin-search animate-fadeUp delay-2">
          <input
            placeholder="Search by name, email or company…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* User list */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton-card" style={{ height: 72 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-icon">⊞</div>
            <h3>{users.length === 0 ? 'No users yet' : 'No results'}</h3>
            <p>{users.length === 0 ? 'Users will appear here once they register.' : 'Try a different search term.'}</p>
          </div>
        ) : (
          <div className="admin-user-list animate-fadeUp delay-3">
            {filtered.map((u) => {
              const isOpen = expandedUser === u.id;
              const analyses = userAnalyses[u.id] || [];
              const latestRisk = analyses[0]?.result?.risk_level;

              return (
                <div key={u.id} className={`admin-user-card card ${isOpen ? 'open' : ''}`}>
                  <div className="admin-user-row" onClick={() => toggleUser(u.id)}>
                    <div className="aur-left">
                      <div className="admin-avatar">{initials(u.full_name)}</div>
                      <div className="aur-meta">
                        <span className="aur-name">{u.full_name}</span>
                        <span className="aur-email">{u.email}</span>
                      </div>
                    </div>
                    <div className="aur-right">
                      {u.business_profile?.company_name && (
                        <span className="company-chip">{u.business_profile.company_name}</span>
                      )}
                      <span className="badge badge-blue" style={{ fontSize: 10 }}>{u.role}</span>
                      {u.is_email_verified
                        ? <span className="badge badge-green" style={{ fontSize: 10 }}>✓ Verified</span>
                        : <span className="badge badge-red" style={{ fontSize: 10 }}>Unverified</span>}
                      {latestRisk && <span className={`badge ${riskBadge[latestRisk]}`} style={{ fontSize: 10 }}>{latestRisk}</span>}
                      <span className="aur-date mono">
                        {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <button
                        className="btn btn-danger btn-sm"
                        style={{ padding: '5px 10px', fontSize: 12 }}
                        onClick={(e) => handleDelete(u.id, e)}
                        disabled={deleting === u.id}
                      >
                        {deleting === u.id ? '…' : '✕'}
                      </button>
                      <span className="expand-chevron">{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div className="admin-user-detail" onClick={e => e.stopPropagation()}>
                      <div className="divider" />
                      <div className="aud-grid">
                        {/* Business profile */}
                        <div>
                          <span className="detail-section-label">Business profile</span>
                          {u.business_profile ? (
                            <div className="aud-profile-grid">
                              {[
                                ['Industry', u.business_profile.industry_type],
                                ['Stage', u.business_profile.business_stage],
                                ['Employees', u.business_profile.number_of_employees],
                                ['MRR', u.business_profile.monthly_recurring_revenue
                                  ? `₹${Number(u.business_profile.monthly_recurring_revenue).toLocaleString('en-IN')}`
                                  : '—'],
                                ['Website', u.business_profile.website || '—'],
                              ].map(([k, v]) => (
                                <div key={k} className="aud-row">
                                  <span className="aud-key">{k}</span>
                                  <span className="aud-val">{v}</span>
                                </div>
                              ))}
                            </div>
                          ) : <p style={{ fontSize: 13, color: 'var(--text-3)' }}>No profile set up.</p>}
                        </div>

                        {/* Analyses */}
                        <div>
                          <span className="detail-section-label">
                            Analyses ({userAnalyses[u.id] ? userAnalyses[u.id].length : '…'})
                          </span>
                          {analyses.length === 0 ? (
                            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>No analyses yet.</p>
                          ) : (
                            <>
                              {/* Mini chart from latest analysis */}
                              {analyses[0]?.result?.revenue && (
                                <div style={{ marginBottom: 12 }}>
                                  <ResponsiveContainer width="100%" height={120}>
                                    <AreaChart
                                      data={analyses[0].result.revenue.map((rev, i) => ({
                                        m: `M${i + 1}`, rev, exp: analyses[0].result.expenses?.[i] ?? 0
                                      }))}
                                      margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                                    >
                                      <defs>
                                        <linearGradient id={`g${u.id}`} x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#00ff87" stopOpacity={0.3} />
                                          <stop offset="95%" stopColor="#00ff87" stopOpacity={0} />
                                        </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                      <XAxis dataKey="m" tick={{ fill: '#5a6882', fontSize: 10 }} />
                                      <YAxis tick={{ fill: '#5a6882', fontSize: 10 }} />
                                      <Tooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }} />
                                      <Area type="monotone" dataKey="rev" stroke="#00ff87" fill={`url(#g${u.id})`} strokeWidth={1.5} name="Revenue" />
                                      <Area type="monotone" dataKey="exp" stroke="#ff4d4d" fill="none" strokeWidth={1.5} name="Expenses" />
                                    </AreaChart>
                                  </ResponsiveContainer>
                                </div>
                              )}

                              <div className="aud-analyses">
                                {analyses.slice(0, 5).map(a => (
                                  <div key={a.id} className="aud-analysis-row">
                                    <div>
                                      <span className="aud-a-label">{a.label}</span>
                                      <span className="aud-a-date">
                                        {new Date(a.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                      </span>
                                    </div>
                                    <span className={`badge ${riskBadge[a.result.risk_level]}`} style={{ fontSize: 10 }}>
                                      {a.result.crash_score} · {a.result.risk_level}
                                    </span>
                                  </div>
                                ))}
                                {analyses.length > 5 && (
                                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>+{analyses.length - 5} more</span>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
