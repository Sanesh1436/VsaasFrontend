import React from 'react';
import { MessageSquare } from 'lucide-react';

const RemarksLog = ({ remarks = [] }) => {
  // Sort ascending by time
  const sorted = [...remarks].sort((a, b) => new Date(a.time) - new Date(b.time));

  if (sorted.length === 0) {
    return (
      <div className="text-center py-4 text-xs" style={{ color: 'var(--text-muted)' }}>
        No remarks yet
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {sorted.map((remark, idx) => (
        <div key={idx} className="flex gap-3 relative">
          {/* Timeline line */}
          {idx < sorted.length - 1 && (
            <div className="absolute left-[11px] top-[24px] w-[2px] bottom-0"
              style={{ background: 'var(--border)' }} />
          )}
          {/* Timeline dot */}
          <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 relative z-10"
            style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
            <MessageSquare size={10} />
          </div>
          {/* Content */}
          <div className="flex-1 pb-4">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                {remark.author || 'System'}
              </span>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {new Date(remark.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {' · '}
                {new Date(remark.time).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {remark.text}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RemarksLog;
