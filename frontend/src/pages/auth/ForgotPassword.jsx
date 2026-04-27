import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Phone, ArrowRight, ShieldCheck, Lock, Eye, EyeOff } from 'lucide-react';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState('email');
  const [contact, setContact] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOTP = (e) => {
    e.preventDefault();
    if (!contact) {
      setError(`Please enter your ${method}`);
      return;
    }
    setError('');
    setLoading(true);
    // Request password reset OTP
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 1500);
  };

  const handleVerifyOTP = (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length < 6) {
      setError('Please enter complete OTP');
      return;
    }
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // For demo, accept any 6 digits starting with 1 or the standard 123456
      if (otpValue.length === 6) { 
        setStep(3);
      } else {
        setError('Invalid OTP code. Try 123456');
      }
    }, 1500);
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setLoading(true);
    
    // In a real app, this would call api.post('accounts/reset-password/', { contact, otp, newPassword })
    // For now, we simulate a successful local reset for demo flow
    setTimeout(() => {
      setLoading(false);
      setStep(4);
      setTimeout(() => navigate('/login'), 3000);
    }, 1000);
  };

  const updateOtp = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    // Optional: auto focus next input could go here
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white relative overflow-hidden font-['Inter']">
      
      {/* Background Shapes (Matching Login) */}
      <div className="absolute top-[-10%] left-[-5%] w-[40vw] h-[40vw] rounded-full bg-red-50 opacity-40 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[35vw] h-[35vw] rounded-full bg-zinc-100 opacity-60 blur-3xl pointer-events-none"></div>
      <div className="absolute top-[20%] right-[15%] w-64 h-64 rounded-full border border-red-100 opacity-20 pointer-events-none"></div>

      {/* Back Button */}
      <Link to="/login" className="fixed top-6 left-6 z-50 flex items-center gap-2 text-zinc-600 hover:text-[#c71e1e] font-medium transition-all bg-white/80 backdrop-blur-md rounded-full border border-gray-200 shadow-sm hover:shadow-md hover:-translate-x-1" style={{ padding: '12px 24px' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        Back to Login
      </Link>

      <div className="relative z-10 w-full max-w-md mx-6 p-8 md:p-10 bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 border border-red-100">
            {step === 1 && <ShieldCheck className="w-8 h-8 text-[#c71e1e]" />}
            {step === 2 && <Mail className="w-8 h-8 text-[#c71e1e]" />}
            {step === 3 && <Lock className="w-8 h-8 text-[#c71e1e]" />}
            {step === 4 && <ShieldCheck className="w-8 h-8 text-green-500" />}
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            {step === 1 && 'Forgot Password'}
            {step === 2 && 'Verify OTP'}
            {step === 3 && 'New Password'}
            {step === 4 && 'Success!'}
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-2">
            {step === 1 && 'Choose how you want to reset your password'}
            {step === 2 && `We sent a 6-digit code to your ${method}`}
            {step === 3 && 'Create a strong, secure new password'}
            {step === 4 && 'Your password has been successfully reset. Redirecting...'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-100 text-[#c71e1e] text-sm text-center font-bold">
            {error}
          </div>
        )}

        {/* STEP 1: Request OTP */}
        {step === 1 && (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => { setMethod('email'); setContact(''); setError(''); }}
                className={`flex-1 p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all font-bold text-sm ${method === 'email' ? 'border-[#c71e1e] bg-red-50 text-[#c71e1e]' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}
              >
                <Mail size={24} />
                Email
              </button>
              <button
                type="button"
                onClick={() => { setMethod('phone'); setContact(''); setError(''); }}
                className={`flex-1 p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all font-bold text-sm ${method === 'phone' ? 'border-[#c71e1e] bg-red-50 text-[#c71e1e]' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}
              >
                <Phone size={24} />
                Phone
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider pl-1">
                {method === 'email' ? 'Email Address' : 'Phone Number'}
              </label>
              <input
                type={method === 'email' ? 'email' : 'tel'}
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder={method === 'email' ? 'name@company.com' : '+1 (555) 000-0000'}
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#c71e1e] focus:bg-white transition-all text-sm font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#c71e1e] hover:bg-[#a51515] text-white rounded-2xl font-bold transition-all shadow-lg hover:-translate-y-1 hover:shadow-red-200 flex justify-center items-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {loading ? 'Sending...' : 'Send Reset Code'} <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* STEP 2: Verify OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div className="flex justify-between gap-2 px-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => updateOtp(index, e.target.value)}
                  className="w-12 h-14 text-center text-xl font-black rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#c71e1e] focus:outline-none transition-all"
                />
              ))}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#c71e1e] hover:bg-[#a51515] text-white rounded-2xl font-bold transition-all shadow-lg hover:-translate-y-1 hover:shadow-red-200 flex justify-center items-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {loading ? 'Verifying...' : 'Verify Code'} <ShieldCheck size={18} />
            </button>
            <div className="text-center">
              <button type="button" onClick={() => setStep(1)} className="text-sm font-bold text-slate-500 hover:text-[#c71e1e]">
                Resend Code
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div className="relative">
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider pl-1">New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#c71e1e] focus:bg-white transition-all text-sm font-medium"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-[38px] p-2 text-slate-400 hover:text-[#c71e1e]">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="relative">
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider pl-1">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#c71e1e] focus:bg-white transition-all text-sm font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 bg-[#c71e1e] hover:bg-[#a51515] text-white rounded-2xl font-bold transition-all shadow-lg hover:-translate-y-1 hover:shadow-red-200 flex justify-center items-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {loading ? 'Updating...' : 'Update Password'} <Lock size={18} />
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default ForgotPassword;
