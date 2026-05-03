import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NavItem = ({ to, icon, label }) => (
  <NavLink to={to} className={({ isActive }) =>
    `nav-item ${isActive ? 'active' : ''}`
  } style={({ isActive }) => ({
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 12px', borderRadius: '8px', fontSize: '14px',
    fontWeight: 500, color: isActive ? '#fff' : '#7070a0',
    background: isActive ? 'rgba(124,106,255,0.15)' : 'transparent',
    border: isActive ? '1px solid rgba(124,106,255,0.25)' : '1px solid transparent',
    transition: 'all 0.15s', marginBottom: '2px', textDecoration: 'none'
  })}>
    <span style={{ fontSize: '18px' }}>{icon}</span>
    {label}
  </NavLink>
);

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        {/* Logo */}
        <div style={{ padding: '8px 12px 24px' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '22px', fontWeight: 800, background: 'linear-gradient(135deg, #7c6aff, #ff6ab0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            TaskFlow
          </div>
          <div style={{ fontSize: '11px', color: '#7070a0', marginTop: 2 }}>Team Task Manager</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1 }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#7070a0', padding: '4px 12px 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Main</div>
          <NavItem to="/dashboard" icon="⚡" label="Dashboard" />
          <NavItem to="/projects" icon="📁" label="Projects" />
          <NavItem to="/my-tasks" icon="✓" label="My Tasks" />
        </nav>

        {/* User */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '8px', marginBottom: '8px' }}>
            <div className="avatar avatar-sm">{initials}</div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize: '11px', color: '#7070a0' }}>{user?.globalRole === 'admin' ? '⭐ Admin' : 'Member'}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
            Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
