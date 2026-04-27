import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Users, LayoutDashboard } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const LandingPage = () => {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)' }}>
      {/* Navigation Bar */}
      <nav className="w-full px-8 py-6 flex justify-between items-center border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <img src="/logos/protect.png" alt="Protect Logo" className="h-10 object-contain" />
        </div>

        <div className="flex gap-4 items-center">
          <Link
            to="/login/admin"
            className="flex items-center gap-4 rounded-xl font-semibold transition-all hover:opacity-80"
            style={{ padding: '20px 10px', backgroundColor: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          >
            <Users size={30} />
            Team Lead Login
          </Link>

          <Link
            to="/login/agent"
            className="flex items-center gap-4 rounded-xl font-bold text-white transition-all shadow-lg hover:-translate-y-0.5"
            style={{ padding: '20px 10px', backgroundColor: 'var(--primary)', boxShadow: 'var(--priority-critical-glow)' }}
          >
            <LayoutDashboard size={20} />
            Monitoring Agent Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="max-w-4xl space-y-8">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
            Advanced Tactical <br />
            <span style={{ color: 'var(--primary)' }}>Surveillance Center</span>
          </h1>

          <p className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Empowering security teams with real-time alerts, incident tracking, and intelligent dashboarding. Choose your access level to begin the session.
          </p>

          <div className="pt-8 flex justify-center gap-6">
            <Link
              to="/login/agent"
              className="inline-block text-lg rounded-xl font-bold text-white transition-all hover:-translate-y-1"
              style={{ padding: '20px 40px', backgroundColor: 'var(--primary)', boxShadow: 'var(--priority-critical-glow)' }}
            >
              Enter WatchTower Portal
            </Link>
          </div>
        </div>

        {/* Feature Cards Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full" style={{ marginTop: '50px' }}>
          <div className="p-8 rounded-2xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <h3 className="text-xl font-bold mb-3">Real-time Alarms</h3>
            <p style={{ color: 'var(--text-muted)' }}>Immediate dispatch configurations driven by incoming signal feeds.</p>
          </div>
          <div className="p-8 rounded-2xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <h3 className="text-xl font-bold mb-3">Status Management</h3>
            <p style={{ color: 'var(--text-muted)' }}>Keep track of 'Parked', 'Attended', and 'Resolved' events reliably.</p>
          </div>
          <div className="p-8 rounded-2xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <h3 className="text-xl font-bold mb-3">Role-based Access</h3>
            <p style={{ color: 'var(--text-muted)' }}>Isolated views for Monitoring Agents vs Team Leads / Admins.</p>
          </div>
        </div>
      </main>

      <footer className="w-full p-8 flex justify-center items-center border-t" style={{ borderColor: 'var(--border)' }}>
        <img src="/logos/vsaas.png" alt="VSaaS Logo" className="h-14 object-contain opacity-80" />
      </footer>
    </div>
  );
};

export default LandingPage;
