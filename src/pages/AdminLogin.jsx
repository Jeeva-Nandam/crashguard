import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import './Login.css';
import './AdminLogin.css';

export default function AdminLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const nav = useNavigate();

  // Redirect if already logged in as admin
  if (localStorage.getItem('admin_token')) {
    nav('/admin/dashboard', { replace: true });
    return null;
  }

  const handle = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await adminAPI.post('/admin/login', form);
      localStorage.setItem('admin_token', data.access_token);
      toast('Admin access granted.', 'success');
      nav('/admin/dashboard');
    } catch (err) {
      toast(err.response?.data?.detail || 'Invalid admin credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-bg">
        <div className="admin-orb admin-orb-1" />
        <div className="admin-orb admin-orb-2" />
        <div className="grid-overlay" />
      </div>

      <div className="admin-login-center animate-fadeUp">
        <div className="admin-login-card">

          <div className="admin-login-icon">⊞</div>
          <h2>Admin access</h2>
          <p>This area is restricted. Only authorised personnel can sign in.</p>

          <form onSubmit={submit} className="auth-form" style={{ marginTop: 28 }}>
            <div className="field">
              <label>Admin email</label>
              <input
                name="email" type="email"
                placeholder="admin@crashguard.app"
                value={form.email} onChange={handle} required
              />
            </div>
            <div className="field">
              <label>Password</label>
              <input
                name="password" type="password"
                placeholder="••••••••"
                value={form.password} onChange={handle} required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading
                ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Verifying…</>
                : '⊞ Enter admin panel →'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <a href="/login" style={{ fontSize: 13, color: 'var(--text-3)', textDecoration: 'none' }}>
              ← Back to user login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
