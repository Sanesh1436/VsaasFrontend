import React from 'react';
import { Clock, MapPin, AlertTriangle, Flame, Shield, Camera } from 'lucide-react';
import { motion } from 'framer-motion';

const PRIORITY_CONFIG = {
  1: { label: 'Critical', badge: 'badge-critical', icon: Flame, color: 'var(--priority-critical)' },
  2: { label: 'Medium', badge: 'badge-medium', icon: AlertTriangle, color: 'var(--priority-medium)' },
  3: { label: 'Normal', badge: 'badge-normal', icon: Shield, color: 'var(--priority-normal)' },
};

const STATUS_LABELS = {
  NEW: 'New',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  PARKED: 'Parked',
  RESOLVED: 'Resolved',
  ATTENDED: 'Attended',
  PENDING: 'Pending',
};

const TicketCard = ({ ticket, onClick, actions, compact = false }) => {
  const config = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG[3];
  const PriorityIcon = config.icon;
  const statusClass = `badge-${ticket.status.toLowerCase().replace('_', '-')}`;
  const isParked = ticket.status === 'PARKED';
  const isResolved = ticket.status === 'RESOLVED';

  return (
    <motion.div
      whileHover={onClick ? { scale: 1.02, y: -2 } : { y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`ticket-card priority-${ticket.priority} ${isParked ? 'status-parked' : ''} ${isResolved ? 'opacity-60' : ''} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`badge ${config.badge} flex items-center gap-1`}>
            <PriorityIcon size={12} />
            P{ticket.priority} — {config.label}
          </span>
          <span className={`badge badge-status ${statusClass}`}>
            {STATUS_LABELS[ticket.status] || ticket.status}
          </span>
        </div>
        <span className="text-xs font-mono whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
          {ticket.ticket_id}
        </span>
      </div>

      {ticket.snapshot && !compact && (
        <div className="mb-3 rounded-lg overflow-hidden border border-(--border-light) aspect-video relative">
          <img src={ticket.snapshot} alt="Alert Snapshot" className="object-cover w-full h-full absolute inset-0" />
        </div>
      )}

      <h4 className="font-bold text-sm mb-2 leading-snug" style={{ color: 'var(--text-primary)' }}>
        {ticket.title}
      </h4>

      {!compact && ticket.description && (
        <p className="text-xs mb-4 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
          {ticket.description}
        </p>
      )}

      <div className="flex items-center gap-5 text-xs flex-wrap" style={{ color: 'var(--text-muted)' }}>
        {ticket.site_name && (
          <span className="flex items-center gap-1">
            <MapPin size={12} /> {ticket.site_name}
          </span>
        )}
        {ticket.alert_type_detail && (
          <span className="flex items-center gap-1">
            <Camera size={12} /> {ticket.alert_type_detail.name}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock size={12} /> {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {isParked && ticket.parked_reason && (
        <div className="mt-4 p-3 rounded-lg text-xs" style={{ background: 'var(--priority-medium-bg)', border: '1px solid var(--priority-medium-border)', color: 'var(--priority-medium)' }}>
          <strong>Parked:</strong> {ticket.parked_reason}
        </div>
      )}

      {actions && (
        <div className="flex items-center gap-3 mt-5 pt-4" style={{ borderTop: '1px solid var(--border-light)' }}>
          {actions}
        </div>
      )}
    </motion.div>
  );
};

export { PRIORITY_CONFIG, STATUS_LABELS };
export default TicketCard;
