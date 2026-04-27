import React from 'react';
import { User, Coffee, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const AgentStatusCard = ({ agent, ticketCount = 0, onClick }) => {
  const isOverloaded = ticketCount >= 8;
  const isMaxed = ticketCount >= 10;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      onClick={onClick}
      className={`p-5 rounded-2xl transition-all ${onClick ? 'cursor-pointer' : ''}`}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${isOverloaded ? 'var(--danger)' : 'var(--border)'}`,
        boxShadow: isOverloaded ? '0 0 16px rgba(239, 68, 68, 0.1)' : 'var(--shadow-card)',
      }}
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
          style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
          {(agent.name || agent.username || 'U').substring(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
            {agent.name || agent.username}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: 'var(--text-muted)' }}>
            {agent.agent_type || agent.role?.replace('_', ' ')}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{
            background: agent.is_paused ? 'var(--warning)' : isOverloaded ? 'var(--danger)' : 'var(--success)',
          }} />
          <span className="text-[10px] font-bold uppercase" style={{
            color: agent.is_paused ? 'var(--warning)' : isOverloaded ? 'var(--danger)' : 'var(--success)',
          }}>
            {agent.is_paused ? 'Break' : isOverloaded ? 'Overloaded' : 'Active'}
          </span>
        </div>
      </div>

      {/* Ticket load bar */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] font-bold mb-1">
          <span style={{ color: 'var(--text-muted)' }}>Ticket Load</span>
          <span style={{ color: isOverloaded ? 'var(--danger)' : 'var(--text-muted)' }}>
            {ticketCount}/10
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(ticketCount / 10) * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{
              background: isMaxed ? 'var(--danger)' : isOverloaded ? 'var(--warning)' : 'var(--primary)',
            }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-4 text-[10px]">
        <div className="flex items-center gap-1" style={{ color: 'var(--success)' }}>
          <span className="font-bold">{agent.tickets_resolved}</span>
          <span style={{ color: 'var(--text-muted)' }}>resolved</span>
        </div>
        <div className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
          <span className="font-bold">{agent.top_alert}</span>
        </div>
      </div>

      {/* Overloaded warning */}
      {isOverloaded && (
        <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold"
          style={{ color: 'var(--danger)' }}>
          <AlertTriangle size={10} />
          {isMaxed ? 'MAX CAPACITY — Cannot assign more' : 'Near capacity — reassign recommended'}
        </div>
      )}
    </motion.div>
  );
};

export default AgentStatusCard;
