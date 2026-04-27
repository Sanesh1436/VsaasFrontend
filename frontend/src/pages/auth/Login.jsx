import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { showToast } from '../../components/NotificationToast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

const Login = ({ expectedRole }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await login(username, password);
      // Strict Segregation Rule
      if (expectedRole === 'TEAM_LEAD' && data.role !== 'TEAM_LEAD') {
        setError('Unauthorized: Please use the Agent portal');
        showToast.error('Unauthorized: Please use the Agent portal');
        return;
      }
      if (expectedRole === 'AGENT' && data.role === 'TEAM_LEAD') {
        setError('Unauthorized: Please use the Team Lead portal');
        showToast.error('Unauthorized: Please use the Team Lead portal');
        return;
      }

      showToast.success(`Welcome back, ${data.name || data.username}!`);

      if (data.role === 'TEAM_LEAD') {
        navigate('/dashboard/tl');
      } else if (data.role === 'CONTRACT_WORKER') {
        navigate('/dashboard/worker');
      } else {
        navigate('/dashboard/agent');
      }
    } catch (err) {
      setError('Invalid username or password');
      showToast.error('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white relative overflow-hidden font-['Inter']">

      <Link to="/" className="fixed top-6 left-6 z-50 flex items-center gap-2 text-zinc-600 hover:text-[#c71e1e] font-medium transition-all bg-white/80 backdrop-blur-md rounded-full border border-gray-200 shadow-sm hover:shadow-md hover:-translate-x-1" style={{ padding: '12px 24px' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        Back
      </Link>

      {/* Decorative Background Shape - Left aligned half circle logic matching image */}
      <div className="absolute w-[180vw] h-[180vw] md:w-[120vw] md:h-[120vw] lg:w-[1800px] lg:h-[1800px] bg-[#f4edd9] rounded-full -left-[75vw] md:-left-[60vw] lg:-left-[800px] top-[50%] -translate-y-1/2 -z-10 transition-all duration-500 ease-in-out" />

      {/* Top Logo - Aligned absolute top */}
      <div className="absolute top-8 md:top-12 left-0 w-full flex justify-center pb-8 z-20">
        <img
          className="w-auto h-20 md:h-28 object-contain"
          src="/logos/protect.png"
          alt="Protect Logo"
        />
      </div>

      {/* Main Container */}
      <div className="z-10 w-full max-w-md px-6 py-12 flex flex-col items-center mt-16 animate-in fade-in zoom-in duration-500">

        {/* Title */}
        <h1 className="text-4xl text-zinc-900 font-semibold mb-12 tracking-tight">
          {expectedRole === 'TEAM_LEAD' ? 'Team Lead Login' : 'Agent Login'}
        </h1>

        {/* Error Message */}
        {error && (
          <div className="w-full text-center text-red-600 bg-red-50 border border-red-200 rounded-lg py-3 mb-6 font-medium shadow-sm flex items-center justify-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col items-center space-y-6">
          <div className="absolute w-[1000px] h-[1000px] bg-[#f4ebda] rounded-full top-1/2 -left-[250px] -translate-y-1/2 opacity-90 -z-10"></div>          <div className="w-full space-y-6 ">
            {/* USERNAME FIELD */}
            <div className="group relative ">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full h-16 pl-12 pr-4 bg-gray-50/50 border-2 border-gray-100 rounded-2xl outline-none transition-all duration-300
                   placeholder:text-gray-400 text-zinc-800 text-lg
                   focus:bg-white focus:border-[#c71e1e] focus:ring-4 focus:ring-red-50"
              />
            </div>

            {/* PASSWORD FIELD */}
            <div className="group relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-16 pl-12 pr-14 bg-gray-50/50 border-2 border-gray-100 rounded-2xl outline-none transition-all duration-300
                   placeholder:text-gray-400 text-zinc-800 text-lg
                   focus:bg-white focus:border-[#c71e1e] focus:ring-4 focus:ring-red-50"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg text-gray-400 hover:text-[#c71e1e] hover:bg-red-50 transition-all"
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="group w-full md:w-64 h-16 mt-8 bg-[#c71e1e] hover:bg-[#a51515] text-white rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-red-200 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            <span className="text-lg font-bold tracking-wider">
              {loading ? 'AUTHENTICATING...' : 'LOG IN'}
            </span>
            {!loading && (
              <svg
                className="transform transition-transform group-hover:translate-x-1"
                width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            )}
          </button>
        </form>
        {/* FORGOT PASSWORD LINK */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <Link to="/forgot-password" className="text-zinc-600 text-sm font-medium hover:text-[#c71e1e] border-b border-zinc-600 hover:border-[#c71e1e] pb-0.5 transition-colors">
            Forgot password?
          </Link>
          {expectedRole === 'AGENT' && (
            <Link to="/signup" className="text-zinc-500 text-sm font-medium hover:text-[#c71e1e] transition-colors">
              Don't have an account? <span className="font-bold text-[#c71e1e]">Sign Up</span>
            </Link>
          )}
        </div>

        {/* BOTTOM VSaaS LOGO */}
      </div>

      <div className="absolute bottom-8 left-0 w-full flex justify-center pb-4 z-20 pointer-events-none">
        <img
          className="w-auto h-20 md:h-24 object-contain opacity-90"
          src="/logos/vsaas.png"
          alt="VSaaS Powered by VProtect"
        />
      </div>

      {/* Helper popup for demo purposes - Out of the way
      <div className="fixed top-4 right-4 bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-gray-100 shadow-xl text-sm z-50">
        <h3 className="font-bold border-b border-gray-200 pb-2 mb-2 text-zinc-800 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
          Demo Accounts
        </h3>
        {expectedRole === 'TEAM_LEAD' && (
          <p className="text-zinc-600 mb-1 flex justify-between gap-4"><span>Admin:</span> <strong className="text-zinc-900 font-mono">admin / admin123</strong></p>
        )}
        {expectedRole === 'AGENT' && (
          <p className="text-zinc-600 flex justify-between gap-4"><span>Agent:</span> <strong className="text-zinc-900 font-mono">agent1 / agent123</strong></p>
        )}
      </div> */}
    </div>
  );
};

export default Login;
