import { NavLink } from 'react-router-dom';
import { Home, BarChart3, Eye, User, Zap, LogOut } from 'lucide-react';
import { useHabits } from '../context/HabitsContext';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', icon: Home, label: 'Today', exact: true },
  { to: '/overview', icon: Eye, label: 'Overview' },
  { to: '/statistics', icon: BarChart3, label: 'Statistics' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function Sidebar() {
  const { totalPoints, habits } = useHabits();
  const { displayName, avatarInitial, signOut } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon" style={{ padding: 0, overflow: 'hidden', background: 'transparent', boxShadow: '0 0 16px rgba(124,58,237,0.45)' }}>
          <img src="/logo.png" alt="HabitFlow" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
        </div>
        <span className="logo-text">HabitFlow</span>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {navItems.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon className="nav-icon" />
            <span className="nav-label">{label}</span>
            {label === 'Today' && (
              <span className="nav-badge">{habits.length}</span>
            )}
          </NavLink>
        ))}

        <div className="nav-section-label" style={{ marginTop: 16 }}>Points</div>
        <div className="nav-item" style={{ cursor: 'default' }}>
          <Zap className="nav-icon" style={{ color: '#f59e0b' }} />
          <span className="nav-label" style={{ color: '#f59e0b', fontWeight: 700 }}>
            {totalPoints.toLocaleString()} pts
          </span>
        </div>
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/profile" className="user-card" style={{ textDecoration: 'none' }}>
          <div className="user-avatar">{avatarInitial}</div>
          <div className="user-info">
            <div className="user-name">{displayName}</div>
            <div className="user-points">⚡ {totalPoints.toLocaleString()} points</div>
          </div>

          {/* Sign Out button */}
          <button
            onClick={signOut}
            id="sign-out-btn"
            title="Sign out"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255,255,255,0.07)',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }}
            onMouseOver={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
            onMouseOut={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'transparent'; }}
          >
            <LogOut size={16} />
          </button>
        </NavLink>


      </div>
    </aside>
  );
}
