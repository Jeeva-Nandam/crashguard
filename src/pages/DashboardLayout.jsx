import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import './Dashboard.css';

const NAV = [
  { to: '/dashboard', icon: '◈', label: 'Overview', end: true },
  { to: '/dashboard/analyze', icon: '⬡', label: 'Analyze' },
  { to: '/dashboard/history', icon: '◷', label: 'History' },
  { to: '/dashboard/profile', icon: '◎', label: 'Profile' },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast('See you next time.', 'info');
    nav('/login');
  };

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || 'U';
  const riskColor = { 'HIGH RISK': 'var(--ember)', 'MEDIUM RISK': 'var(--amber)', 'LOW RISK': 'var(--acid)' };

  return (
    <div className={`dashboard-shell ${sidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <span className="brand-icon" style={{fontSize:20}}>⬡</span>
            <span className="brand-name">CrashGuard</span>
          </div>

          <nav className="sidebar-nav">
            {NAV.map(({ to, icon, label, end }) => (
              <NavLink key={to} to={to} end={end}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}>
                <span className="nav-icon">{icon}</span>
                <span>{label}</span>
              </NavLink>
            ))}
            {/* {user?.role === 'Founder' && (
              <NavLink to="/admin"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}>
                <span className="nav-icon">⊞</span>
                <span>Admin</span>
              </NavLink>
            )} */}
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="user-chip">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <span className="user-name">{user?.full_name?.split(' ')[0]}</span>
              <span className="user-role">{user?.role}</span>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm sidebar-logout" onClick={handleLogout}>
            ⇥ Logout
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />

      {/* Main */}
      <main className="dashboard-main">
        <div className="top-bar">
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
          <div className="top-bar-right">
            {user?.business_profile?.company_name && (
              <span className="company-badge">{user.business_profile.company_name}</span>
            )}
            <div className="user-avatar-sm">{initials}</div>
          </div>
        </div>
        <div className="dashboard-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
