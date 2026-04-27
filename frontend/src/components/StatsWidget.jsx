import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

const StatsWidget = ({ label, value, icon: Icon, trend, trendValue, color, subtitle }) => {
  const trendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const TrendIcon = trendIcon;
  const trendColor = trend === 'up' ? 'var(--danger)' : trend === 'down' ? 'var(--success)' : 'var(--text-muted)';

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className="p-6 rounded-2xl transition-all"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        {Icon && (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: color ? `${color}15` : 'var(--primary-light)', color: color || 'var(--primary)' }}>
            <Icon size={20} />
          </div>
        )}
        {trend && (
          <div className="flex items-center gap-1 text-xs font-bold" style={{ color: trendColor }}>
            <TrendIcon size={14} />
            {trendValue && <span>{trendValue}</span>}
          </div>
        )}
      </div>
      <p className="text-2xl font-black mb-1.5" style={{ color: color || 'var(--text-primary)' }}>
        {value}
      </p>
      <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
      {subtitle && (
        <p className="text-[10px] mt-2 font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {subtitle}
        </p>
      )}
    </motion.div>
  );
};

export default StatsWidget;
