import React, { useState, useMemo } from 'react';
import { useTickets } from '../../context/TicketContext';
import TicketCard from '../../components/TicketCard';
import PriorityIndicator from '../../components/PriorityIndicator';
import DetectionTypeIcon from '../../components/DetectionTypeIcon';
import CooldownBadge from '../../components/CooldownBadge';
import {
  ArrowUpDown, Filter, Search, Zap, Users,
  Camera as CameraIcon, Edit3, X, Save, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { showToast } from '../../components/NotificationToast';

const TicketAssignment = () => {
  const {
    tickets, agents, assignTicket, autoAssignAll,
    getAgentTicketCount, alertTypes,
    updateTicketField, getCooldownRemaining,
  } = useTickets();

  const [filterAlertType, setFilterAlertType] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterCamera, setFilterCamera] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [editingTicketId, setEditingTicketId] = useState(null);
  const [editPriority, setEditPriority] = useState(3);
  const [editAlertType, setEditAlertType] = useState('');
  const [groupBy, setGroupBy] = useState('none');

  const monitoringAgents = agents.filter(a => a.frontend_role === 'MONITORING_AGENT' || a.role === 'AGENT' || a.role === 'MONITORING_AGENT');

  const filteredTickets = useMemo(() => {
    let list = tickets.filter(t => t.status !== 'RESOLVED');
    if (filterAlertType) list = list.filter(t => t.alert_type === filterAlertType);
    if (filterPriority) list = list.filter(t => t.priority === parseInt(filterPriority));
    if (filterCamera) list = list.filter(t => t.camera_name === filterCamera);
    if (filterStatus) list = list.filter(t => t.status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.ticket_id.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        (t.site_name || '').toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => a.priority - b.priority);
  }, [tickets, filterAlertType, filterPriority, filterCamera, filterStatus, search]);

  const uniqueAlertTypes = useMemo(() => [...new Set(tickets.map(t => t.alert_type).filter(Boolean))], [tickets]);
  const uniqueCameras = useMemo(() => [...new Set(tickets.map(t => t.camera_name).filter(Boolean))], [tickets]);

  // Group tickets by camera
  const groupedTickets = useMemo(() => {
    if (groupBy === 'camera') {
      const groups = {};
      filteredTickets.forEach(t => {
        const key = t.camera_name || 'Unknown Camera';
        if (!groups[key]) groups[key] = [];
        groups[key].push(t);
      });
      return groups;
    }
    if (groupBy === 'priority') {
      const groups = { 'Priority 1': [], 'Priority 2': [], 'Priority 3': [] };
      filteredTickets.forEach(t => {
        const key = `Priority ${t.priority}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(t);
      });
      return groups;
    }
    return null;
  }, [filteredTickets, groupBy]);

  const handleAssign = async (ticketId, agentId) => {
    if (!agentId) return;
    const result = await assignTicket(ticketId, parseInt(agentId));
    if (result.error) showToast.error(result.error);
  };

  const handleAutoAssignAll = async () => {
    const result = await autoAssignAll();
  };

  const handleEditTicket = (ticket) => {
    setEditingTicketId(ticket.id);
    setEditPriority(ticket.priority);
    setEditAlertType(ticket.alert_type);
  };

  const handleSaveEdit = () => {
    updateTicketField(editingTicketId, 'priority', editPriority);
    updateTicketField(editingTicketId, 'alert_type', editAlertType);
    updateTicketField(editingTicketId, 'alert_type_detail', {
      name: editAlertType,
      category: alertTypes.find(a => a.name === editAlertType)?.category || 'Security'
    });
    setEditingTicketId(null);
  };

  const renderTicketRow = (ticket) => (
    <motion.div
      key={ticket.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-5 p-5 rounded-xl transition-all"
      style={{ background: 'var(--bg-card)', border: `1px solid ${ticket.priority === 1 ? 'var(--priority-critical-border)' : 'var(--border)'}` }}
    >
      {/* Priority */}
      <PriorityIndicator priority={ticket.priority} size="sm" showLabel={false} />

      {/* Ticket Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{ticket.ticket_id}</span>
          <DetectionTypeIcon type={ticket.alert_type} category={ticket.alert_type_detail?.category} size={14} showLabel />
          {ticket.cooldown_until && getCooldownRemaining(ticket.camera_name, ticket.alert_type) > 0 && (
            <CooldownBadge seconds={getCooldownRemaining(ticket.camera_name, ticket.alert_type)} />
          )}
        </div>
        <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{ticket.title}</p>
        <div className="flex gap-4 mt-1.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
          <span>{ticket.camera_name || 'N/A'}</span>
          <span>{ticket.site_name || 'N/A'}</span>
        </div>
      </div>

      {/* Status */}
      <span className={`badge badge-status badge-${ticket.status.toLowerCase().replace('_', '-')}`}>
        {ticket.status.replace('_', ' ')}
      </span>

      {/* Edit Button */}
      <button onClick={() => handleEditTicket(ticket)} className="p-2 rounded-lg transition-all"
        style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
        <Edit3 size={14} />
      </button>

      {/* Assigned or Assign */}
      {ticket.assigned_to_detail ? (
        <div className="flex items-center gap-2 min-w-[120px]">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
            {(ticket.assigned_to_detail.name || 'U').charAt(0)}
          </div>
          <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
            {ticket.assigned_to_detail.name}
          </span>
        </div>
      ) : (
        <select
          className="text-xs p-2 rounded-lg min-w-[140px]"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          onChange={e => handleAssign(ticket.id, e.target.value)}
          value=""
        >
          <option value="">Assign to...</option>
          {monitoringAgents.filter(a => !a.is_paused).map(agent => (
            <option key={agent.id} value={agent.id} disabled={getAgentTicketCount(agent.id) >= 10}>
              {agent.name} ({getAgentTicketCount(agent.id)}/10)
            </option>
          ))}
        </select>
      )}
    </motion.div>
  );

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-5 mb-5">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={14} style={{ color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm transition-all"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
          </div>

          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
            className="text-sm py-2.5 px-3 rounded-xl"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            <option value="">All Priorities</option>
            <option value="1">ðŸ”´ P1</option>
            <option value="2">ðŸŸ¡ P2</option>
            <option value="3">ðŸŸ¢ P3</option>
          </select>

          <select value={filterAlertType} onChange={e => setFilterAlertType(e.target.value)}
            className="text-sm py-2.5 px-3 rounded-xl"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            <option value="">All Types</option>
            {uniqueAlertTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select value={filterCamera} onChange={e => setFilterCamera(e.target.value)}
            className="text-sm py-2.5 px-3 rounded-xl"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            <option value="">All Cameras</option>
            {uniqueCameras.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="text-sm py-2.5 px-3 rounded-xl"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            <option value="">All Status</option>
            <option value="NEW">New</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="PARKED">Parked</option>
          </select>
        </div>

        <div className="flex items-center gap-4">
          <select value={groupBy} onChange={e => setGroupBy(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            <option value="none">No Grouping</option>
            <option value="camera">Group by Camera</option>
            <option value="priority">Group by Priority</option>
          </select>

          <button onClick={handleAutoAssignAll}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
            style={{ background: 'var(--primary)', color: 'white', boxShadow: '0 4px 12px var(--primary-glow)' }}>
            <Zap size={14} /> Auto-Assign All Unassigned
          </button>

          {(filterAlertType || filterPriority || filterCamera || filterStatus || search) && (
            <button onClick={() => { setFilterAlertType(''); setFilterPriority(''); setFilterCamera(''); setFilterStatus(''); setSearch(''); }}
              className="text-xs font-bold flex items-center gap-1"
              style={{ color: 'var(--text-muted)', background: 'transparent' }}>
              <X size={14} /> Clear All
            </button>
          )}

          <span className="ml-auto text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
            {filteredTickets.length} tickets
          </span>
        </div>
      </div>

      {/* Agent Availability Strip */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {monitoringAgents.map(agent => {
          const count = getAgentTicketCount(agent.id);
          return (
            <div key={agent.id} className="shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-xl"
              style={{ background: 'var(--bg-card)', border: `1px solid ${count >= 10 ? 'var(--danger)' : 'var(--border)'}` }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: agent.is_paused ? 'var(--warning)' : count >= 10 ? 'var(--danger)' : 'var(--success)' }} />
              <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{agent.name.split(' ')[1] || agent.name}</span>
              <span className="text-[10px] font-mono" style={{ color: count >= 8 ? 'var(--danger)' : 'var(--text-muted)' }}>{count}/10</span>
            </div>
          );
        })}
      </div>

      {/* Ticket List */}
      {groupedTickets ? (
        Object.entries(groupedTickets).map(([group, tix]) => (
          tix.length > 0 && (
            <div key={group} className="space-y-4">
              <div className="flex items-center gap-3">
                <CameraIcon size={14} style={{ color: 'var(--text-muted)' }} />
                <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{group}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                  {tix.length}
                </span>
              </div>
              <div className="space-y-3">
                {tix.map(renderTicketRow)}
              </div>
            </div>
          )
        ))
      ) : (
        <div className="space-y-3">
          {filteredTickets.map(renderTicketRow)}
        </div>
      )}

      {filteredTickets.length === 0 && (
        <div className="card text-center py-16">
          <CheckCircle2 size={32} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
          <p className="font-medium" style={{ color: 'var(--text-muted)' }}>No tickets match your filters</p>
        </div>
      )}

      {/* Edit Ticket Modal */}
      <AnimatePresence>
      {editingTicketId && (
        <motion.div className="modal-overlay" onClick={() => setEditingTicketId(null)}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="modal-content max-w-md" onClick={e => e.stopPropagation()}
            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}>
            <div className="modal-header">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                <Edit3 size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Edit Ticket</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Modify alert type and priority (UI only)</p>
              </div>
            </div>
            <div className="modal-body light-form space-y-4">
              <div className="form-group">
                <label>Alert Type</label>
                <select value={editAlertType} onChange={e => setEditAlertType(e.target.value)}>
                  {alertTypes.filter(a => a.name !== 'Heatmap').map(at => (
                    <option key={at.id} value={at.name}>{at.name} ({at.category})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select value={editPriority} onChange={e => setEditPriority(parseInt(e.target.value))}>
                  <option value={1}>ðŸ”´ Priority 1 â€” Critical</option>
                  <option value={2}>ðŸŸ¡ Priority 2 â€” Medium</option>
                  <option value={3}>ðŸŸ¢ Priority 3 â€” Normal</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setEditingTicketId(null)} className="flex-1 py-3 rounded-xl font-bold transition-all"
                style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'transparent' }}>Cancel</button>
              <button onClick={handleSaveEdit} className="flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                style={{ background: 'var(--primary)', color: 'white' }}>
                <Save size={18} /> Save Changes
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};

export default TicketAssignment;
