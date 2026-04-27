import React from 'react';
import { Flame, AlertTriangle, Shield } from 'lucide-react';

const PriorityIndicator = ({ priority, size = 'md', showLabel = true }) => {
  const config = {
    1: { label: 'Critical', color: 'var(--priority-critical)', bg: 'var(--priority-critical-bg)', border: 'var(--priority-critical-border)', Icon: Flame },
    2: { label: 'Medium', color: 'var(--priority-medium)', bg: 'var(--priority-medium-bg)', border: 'var(--priority-medium-border)', Icon: AlertTriangle },
    3: { label: 'Normal', color: 'var(--priority-normal)', bg: 'var(--priority-normal-bg)', border: 'var(--priority-normal-border)', Icon: Shield },
  };

  const c = config[priority] || config[3];
  const Icon = c.Icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-3 py-1 text-xs gap-1.5',
    lg: 'px-4 py-2 text-sm gap-2',
  };

  const iconSize = { sm: 10, md: 12, lg: 16 };

  return (
    <div
      className={`inline-flex items-center rounded-full font-bold uppercase tracking-wider ${sizeClasses[size]} ${priority === 1 ? 'pulse-critical' : ''}`}
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
    >
      <Icon size={iconSize[size]} />
      {showLabel && <span>P{priority} — {c.label}</span>}
    </div>
  );
};

export default PriorityIndicator;
