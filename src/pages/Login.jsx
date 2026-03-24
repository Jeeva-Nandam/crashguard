import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import './Login.css';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const nav = useNavigate();

  const handle = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast('Welcome back.', 'success');
      nav(user.onboarding_complete ? '/dashboard' : '/onboarding');
    } catch (err) {
      const detail = err.response?.data?.detail || 'Login failed.';
      // If unverified, guide them to re-verify
      if (err.response?.status === 403) {
        toast('Please verify your email first. Check your inbox for the code.', 'error');
      } else {
        toast(detail, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="grid-overlay" />
      </div>

      <div className="auth-left animate-fadeIn">
        <div className="brand-mark">
          <div className="brand-icon">⬡</div>
          <span className="brand-name">CrashGuard</span>
        </div>
        <div className="hero-text">
          <h1>
            Know before<br />
            <span className="accent-text">it crashes.</span>
          </h1>
          <p>Startup financial intelligence that predicts runway exhaustion before it's too late.</p>
        </div>
        <div className="stats-row">
          {[['98%', 'Prediction accuracy'], ['< 2s', 'Real-time analysis'], ['4 signals', 'Risk scoring']].map(([v, l]) => (
            <div key={l} className="stat-chip">
              <span className="stat-val">{v}</span>
              <span className="stat-label">{l}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="auth-right animate-fadeUp">
        <div className="auth-card">
          <div className="auth-card-header">
            <h2>Sign in</h2>
            <p>Access your financial dashboard</p>
          </div>

          <form onSubmit={submit} className="auth-form">
            <div className="field">
              <label>Email</label>
              <input
                name="email" type="email"
                placeholder="founder@company.com"
                value={form.email} onChange={handle}
                required
              />
            </div>
            <div className="field">
              <label>Password</label>
              <input
                name="password" type="password"
                placeholder="••••••••"
                value={form.password} onChange={handle}
                required
              />
              {/* Forgot password link */}
              <div style={{ textAlign: 'right', marginTop: 6 }}>
                <Link
                  to="/forgot-password"
                  style={{ fontSize: 13, color: 'var(--text-3)', textDecoration: 'none' }}
                  onMouseOver={e => e.target.style.color = 'var(--acid)'}
                  onMouseOut={e => e.target.style.color = 'var(--text-3)'}
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Signing in…</> : 'Sign in →'}
            </button>
          </form>

          <div className="auth-footer">
            <p>No account? <Link to="/register">Create one</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
