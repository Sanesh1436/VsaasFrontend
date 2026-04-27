import React from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { showToast } from '../components/NotificationToast';
import {
  LayoutDashboard, LogOut, Settings, Ticket,
  User as UserIcon, ShieldAlert, Sun, Moon,
  BarChart3, Users, ArrowUpDown
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout, activeTicketsCount, fetchActiveCount } = useAuth();
  const { theme, toggleTheme, themeInfo } = useTheme();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user && user.role !== 'TEAM_LEAD') {
      fetchActiveCount();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      // Error toast already shown by AuthContext.logout()
    }
  };

  const isTeamLead = user?.role === 'TEAM_LEAD';

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src="/logos/protect.png" alt="Protect Logo" className="h-10 object-contain" />
        </div>

        <nav>
          {isTeamLead ? (
            <NavLink to="/dashboard/tl" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>
          ) : user?.role === 'CONTRACT_WORKER' ? (
            <NavLink to="/dashboard/worker" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={18} />
              <span>Field Operations</span>
            </NavLink>
          ) : (
            <NavLink to="/dashboard/agent" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={18} />
              <span>Monitoring Desk</span>
            </NavLink>
          )}

          <NavLink to="/tickets" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Ticket size={18} />
            <span>All Tickets</span>
          </NavLink>

          {isTeamLead && (
            <>
              <NavLink to="/analytics" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <BarChart3 size={18} />
                <span>Analytics</span>
              </NavLink>
              <NavLink to="/agent-management" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Users size={18} />
                <span>Agent Management</span>
              </NavLink>
              <NavLink to="/ticket-assignment" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <ArrowUpDown size={18} />
                <span>Ticket Assignment</span>
              </NavLink>
              <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Settings size={18} />
                <span>Settings</span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="flex flex-col gap-3 w-full">
            {/* Theme Toggle */}
            <button onClick={toggleTheme} className="theme-toggle" title={`Switch to ${theme === 'dark' ? 'Azure Day' : 'Crimson Night'}`}>
              {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
              <span className="flex-1 text-left">{theme === 'dark' ? 'Crimson Night' : 'Azure Day'}</span>
              <div className="theme-toggle-track">
                <div className="theme-toggle-thumb" />
              </div>
            </button>

            {/* User Info */}
            <div className="flex items-center gap-3 px-2 py-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: 'rgba(255,255,255,0.12)' }}>
                {(user?.name || user?.username || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: 'var(--sidebar-text)' }}>
                  {user?.name || user?.username}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: 'var(--sidebar-text-muted)' }}>
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold w-full"
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.7)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
            >
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="page-header">
          <h1>
            {window.location.pathname.includes('/tl') ? 'Strategic Overview' :
             window.location.pathname.includes('/worker') ? 'Field Operations' :
             window.location.pathname.includes('/analytics') ? 'Analytics Dashboard' :
             window.location.pathname.includes('/agent-management') ? 'Agent Management' :
             window.location.pathname.includes('/ticket-assignment') ? 'Ticket Assignment' :
             window.location.pathname.includes('/tickets') ? 'Ticket Management' :
             window.location.pathname.includes('/settings') ? 'System Settings' :
             'Active Monitoring'}
          </h1>
          <p>Real-time surveillance & incident response management</p>
        </header>
        {children}
      </main>
    </div>
  );
};

export default Layout;
