import React, { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

const CooldownBadge = ({ seconds, label = 'Cooldown Active' }) => {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [remaining]);

  if (remaining <= 0) return null;

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold animate-pulse"
      style={{
        background: 'rgba(99, 102, 241, 0.15)',
        color: '#818cf8',
        border: '1px solid rgba(99, 102, 241, 0.3)',
      }}>
      <Timer size={12} className="animate-spin" style={{ animationDuration: '3s' }} />
      <span>{label}</span>
      <span className="font-mono">{mins}:{String(secs).padStart(2, '0')}</span>
    </div>
  );
};

export default CooldownBadge;
