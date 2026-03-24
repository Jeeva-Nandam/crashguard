import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ── Regular user: must be logged in ──────────────────────────────────────────
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexDirection: 'column', gap: 16,
      background: 'var(--obsidian)'
    }}>
      <div style={{ fontSize: 32, color: 'var(--acid)', animation: 'glowPulse 1.5s ease-in-out infinite' }}>⬡</div>
      <div className="spinner" style={{ width: 24, height: 24 }} />
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// ── Onboarding: must be logged in + email verified ───────────────────────────
export function OnboardingRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexDirection: 'column', gap: 16,
      background: 'var(--obsidian)'
    }}>
      <div style={{ fontSize: 32, color: 'var(--acid)', animation: 'glowPulse 1.5s ease-in-out infinite' }}>⬡</div>
      <div className="spinner" style={{ width: 24, height: 24 }} />
    </div>
  );

  // Not logged in → go register first
  if (!user) return <Navigate to="/register" replace />;

  // Already completed onboarding → go to dashboard
  if (user.onboarding_complete) return <Navigate to="/dashboard" replace />;

  return children;
}

// ── Public: redirect to dashboard if already logged in ────────────────────────
export function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

// ── Admin: checks localStorage for admin_token ────────────────────────────────
export function AdminRoute({ children }) {
  const token = localStorage.getItem('admin_token');
  if (!token) return <Navigate to="/admin/login" replace />;
  return children;
}
