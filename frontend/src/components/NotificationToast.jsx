import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Flame, Shield, X, CheckCircle, AlertOctagon, Info } from 'lucide-react';

let addToastFn = null;

export const showToast = (message, priority = 3) => {
  if (addToastFn) addToastFn(message, priority);
};

showToast.success = (msg) => showToast(msg, 'success');
showToast.error = (msg) => showToast(msg, 'error');
showToast.info = (msg) => showToast(msg, 'info');

const NotificationToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, priority = 3) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, priority, exiting: false }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
      setTimeout(() => { setToasts(prev => prev.filter(t => t.id !== id)); }, 300);
    }, 6000);
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => { addToastFn = null; };
  }, [addToast]);

  const removeToast = (id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => { setToasts(prev => prev.filter(t => t.id !== id)); }, 300);
  };

  const getToastStyle = (priority) => {
    switch (priority) {
      case 1: return { className: 'toast-critical', Icon: Flame, colorVar: '--priority-critical', label: 'CRITICAL' };
      case 2: return { className: 'toast-medium', Icon: AlertTriangle, colorVar: '--priority-medium', label: 'MEDIUM' };
      case 3: return { className: 'toast-normal', Icon: Shield, colorVar: '--priority-normal', label: 'NORMAL' };
      case 'success': return { className: 'toast-success', Icon: CheckCircle, colorVar: '--success', label: 'SUCCESS' };
      case 'error': return { className: 'toast-error', Icon: AlertOctagon, colorVar: '--danger', label: 'ERROR' };
      case 'info': return { className: 'toast-info', Icon: Info, colorVar: '--info', label: 'INFO' };
      default: return { className: 'toast-info', Icon: Info, colorVar: '--info', label: 'INFO' };
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(toast => {
        const style = getToastStyle(toast.priority);
        const Icon = style.Icon;
        // Use an explicit background style for the icon circle to ensure it looks good across themes
        let bgStyle = `var(${style.colorVar}-bg, rgba(0,0,0,0.05))`;
        if (typeof toast.priority === 'string') {
          // Add a generic transparent light background for the new standard types
          bgStyle = `var(--bg-elevated)`;
        }

        return (
          <div key={toast.id} className={`toast ${style.className} ${toast.exiting ? 'toast-exit' : ''}`}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-[var(--border)]"
              style={{ background: bgStyle, color: `var(${style.colorVar})` }}>
              <Icon size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: `var(${style.colorVar})` }}>
                {style.label} {typeof toast.priority === 'number' ? 'ALERT' : ''}
              </p>
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{toast.message}</p>
            </div>
            <button onClick={() => removeToast(toast.id)} className="p-1 transition-colors shrink-0"
              style={{ color: 'var(--text-muted)', background: 'transparent' }}>
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default NotificationToast;
