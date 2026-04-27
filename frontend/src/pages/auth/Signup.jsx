import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { ShieldCheck } from 'lucide-react';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '', password: '', email: '', name: '', phone: '', role: 'MONITORING_AGENT'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('accounts/register/', formData);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.username?.[0] || err.response?.data?.password?.[0] || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Link to="/" className="fixed top-6 left-6 z-50 flex items-center gap-2 text-zinc-600 hover:text-[var(--primary)] font-medium transition-all bg-white/80 backdrop-blur-md rounded-full border border-gray-200 shadow-sm hover:shadow-md hover:-translate-x-1" style={{ padding: '12px 24px' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        Back
      </Link>
      <div className="auth-card">
        <div className="flex items-center gap-3 mb-4">
          <ShieldCheck size={32} style={{ color: 'var(--primary)' }} />
          <h1 className="auth-title">Join WatchTower</h1>
        </div>
        <p className="auth-subtitle">Create a tactical monitoring account</p>

        {error && (
          <div className="mb-4 p-3 rounded-xl text-sm font-medium"
            style={{ background: 'var(--priority-critical-bg)', color: 'var(--priority-critical)', border: '1px solid var(--priority-critical-border)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label>Full Name</label>
              <input name="name" type="text" onChange={handleChange} required placeholder="John Doe" />
            </div>
            <div className="form-group">
              <label>Username</label>
              <input name="username" type="text" onChange={handleChange} required placeholder="johndoe" />
            </div>
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input name="email" type="email" onChange={handleChange} required placeholder="john@example.com" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label>Contact Number</label>
              <input name="phone" type="text" onChange={handleChange} placeholder="+91-9876543210" />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select name="role" onChange={handleChange} value={formData.role}>
                <option value="MONITORING_AGENT">Monitoring Agent</option>
                <option value="CONTRACT_WORKER">Contract Worker</option>
                <option value="TEAM_LEAD">Team Lead</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Password</label>
            <input name="password" type="password" onChange={handleChange} required placeholder="Min 8 characters" />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
