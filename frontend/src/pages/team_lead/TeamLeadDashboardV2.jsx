import React, { useState, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useTickets } from '../../context/TicketContext';
import TicketCard from '../../components/TicketCard';
import TicketCreateModal from '../../components/TicketCreateModal';
import AgentStatusCard from '../../components/AgentStatusCard';
import PriorityIndicator from '../../components/PriorityIndicator';
import CooldownBadge from '../../components/CooldownBadge';
import DetectionTypeIcon from '../../components/DetectionTypeIcon';
import {
  BarChart3, Users, AlertTriangle, TrendingUp,
  CheckCircle2, XCircle, Search, PlusCircle,
  ShieldAlert, Settings, History, Flame, Filter,
  Eye, Zap, ArrowUpDown, Camera as CameraIcon
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { motion, AnimatePresence } from 'framer-motion';
import { showToast } from '../../components/NotificationToast';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const TeamLeadDashboardV2 = () => {
  const { theme } = useTheme();
  const {
    tickets, agents, autoAssign, setAutoAssign,
    assignTicket, handleReassignment, autoAssignAll,
    parkTicket, unparkTicket, getStats, getAgentTicketCount,
    analyticsData, getCooldownRemaining,
  } = useTickets();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchAgent, setSearchAgent] = useState('');
  const [filterAlertType, setFilterAlertType] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterCamera, setFilterCamera] = useState('');
  const [showParkModal, setShowParkModal] = useState(false);
  const [parkingTicketId, setParkingTicketId] = useState(null);
  const [parkReason, setParkReason] = useState('');

  const stats = getStats();

  const newTickets = useMemo(() => {
    let filtered = tickets.filter(t => t.status === 'NEW');
    if (filterAlertType) filtered = filtered.filter(t => t.alert_type === filterAlertType);
    if (filterPriority) filtered = filtered.filter(t => t.priority === parseInt(filterPriority));
    if (filterCamera) filtered = filtered.filter(t => t.camera_name === filterCamera);
    return filtered.sort((a, b) => a.priority - b.priority);
  }, [tickets, filterAlertType, filterPriority, filterCamera]);

  const criticalTickets = useMemo(() =>
    tickets.filter(t => t.priority === 1 && t.status !== 'RESOLVED'),
    [tickets]
  );
  const parkedTickets = useMemo(() => tickets.filter(t => t.status === 'PARKED'), [tickets]);
  const reassignmentRequests = useMemo(() => tickets.filter(t => t.reassignment_requested), [tickets]);

  const monitoringAgents = useMemo(() =>
    agents.filter(a => a.frontend_role === 'MONITORING_AGENT' || a.role === 'AGENT' || a.role === 'MONITORING_AGENT'),
    [agents]
  );

  const filteredAgents = useMemo(() =>
    monitoringAgents.filter(a =>
      (a.name || '').toLowerCase().includes(searchAgent.toLowerCase()) ||
      (a.username || '').toLowerCase().includes(searchAgent.toLowerCase())
    ),
    [monitoringAgents, searchAgent]
  );

  // Unique alert types and cameras from tickets
  const alertTypes = useMemo(() => [...new Set(tickets.map(t => t.alert_type).filter(Boolean))], [tickets]);
  const cameraNames = useMemo(() => [...new Set(tickets.map(t => t.camera_name).filter(Boolean))], [tickets]);

  const handleManualAssign = async (ticketId, agentId) => {
    if (!agentId) return;
    const result = await assignTicket(ticketId, parseInt(agentId));
    if (result.error) showToast.error(result.error);
  };

  const handleAutoAssignAll = async () => {
    const result = await autoAssignAll();
  };

  const handleToggleAutoAssign = () => {
    setAutoAssign(!autoAssign);
    if (!autoAssign) {
      handleAutoAssignAll();
    }
  };

  const handleParkTicket = (ticketId) => {
    setParkingTicketId(ticketId);
    setShowParkModal(true);
  };

  const handleConfirmPark = () => {
    parkTicket(parkingTicketId, parkReason || 'Parked by Team Lead');
    setShowParkModal(false);
    setParkingTicketId(null);
    setParkReason('');
  };

  // Chart colors
  const cs = getComputedStyle(document.documentElement);
  const chartLine = cs.getPropertyValue('--chart-line').trim() || '#950606';
  const chartFill = cs.getPropertyValue('--chart-fill').trim() || 'rgba(149,6,6,0.1)';
  const chartGrid = cs.getPropertyValue('--chart-grid').trim() || '#2a2f2f';
  const chartTick = cs.getPropertyValue('--chart-tick').trim() || '#6b7280';

  const chartData = {
    labels: analyticsData.alerts_over_time.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [{
      label: 'Alerts',
      data: analyticsData.alerts_over_time.map(d => d.count),
      borderColor: chartLine,
      backgroundColor: chartFill,
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: chartLine,
      borderWidth: 2,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: '#1e293b', titleColor: '#94a3b8', bodyColor: '#f8fafc', padding: 12, cornerRadius: 12, displayColors: false }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: chartTick, font: { size: 11 } } },
      y: { grid: { color: chartGrid }, ticks: { color: chartTick, font: { size: 11 } }, beginAtZero: true }
    }
  };

  return (
    <div className="space-y-8">
      {/* Actions */}
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div className="flex gap-2 items-center">
          <button
            onClick={handleAutoAssignAll}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all"
            style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          >
            <Zap size={16} style={{ color: 'var(--warning)' }} /> Auto-Assign All
          </button>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm transition-all"
          style={{ background: 'var(--primary)', boxShadow: '0 4px 16px var(--primary-glow)' }}
        >
          <PlusCircle size={18} /> Create Ticket
        </button>
      </div>

      {/* KPI Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div whileHover={{ scale: 1.02 }} className="kpi-card" style={{ borderTopColor: 'var(--kpi-1)' }}>
          <div className="flex items-center justify-between mb-3">
            <TrendingUp size={16} style={{ color: 'var(--text-muted)' }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>Total</span>
          </div>
          <p className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>{stats.total}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>All Tickets</p>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} className="kpi-card" style={{ borderTopColor: 'var(--kpi-2)' }}>
          <div className="flex items-center justify-between mb-2">
            <Users size={16} style={{ color: 'var(--text-muted)' }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--secondary)' }}>Team</span>
          </div>
          <p className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>
            {monitoringAgents.filter(a => !a.is_paused).length}/{monitoringAgents.length}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Active Agents</p>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} className="kpi-card" style={{ borderTopColor: 'var(--kpi-3)' }}>
          <div className="flex items-center justify-between mb-2">
            <Flame size={16} style={{ color: 'var(--text-muted)' }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--danger)' }}>Critical</span>
          </div>
          <p className="text-3xl font-black" style={{ color: 'var(--danger)' }}>{criticalTickets.length}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Unresolved P1</p>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} className="kpi-card" style={{ borderTopColor: 'var(--kpi-4)' }}>
          <div className="flex items-center justify-between mb-2">
            <ShieldAlert size={16} style={{ color: 'var(--text-muted)' }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--warning)' }}>Engine</span>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{autoAssign ? 'ON' : 'OFF'}</p>
            <button onClick={handleToggleAutoAssign} className="p-2 rounded-lg transition-all"
              style={{ background: autoAssign ? 'var(--priority-medium-bg)' : 'var(--bg-elevated)', color: autoAssign ? 'var(--priority-medium)' : 'var(--text-muted)' }}>
              <Settings size={16} />
            </button>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Auto-Assignment</p>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} className="kpi-card" style={{ borderTopColor: 'var(--success)' }}>
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 size={16} style={{ color: 'var(--text-muted)' }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--success)' }}>Resolved</span>
          </div>
          <p className="text-3xl font-black" style={{ color: 'var(--success)' }}>{stats.resolved_today}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Resolved Tickets</p>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} className="kpi-card" style={{ borderTopColor: 'var(--kpi-1)' }}>
          <div className="flex items-center justify-between mb-2">
            <BarChart3 size={16} style={{ color: 'var(--text-muted)' }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>Monthly</span>
          </div>
          <p className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>{stats.total_month_alerts || 0}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Alerts This Month</p>
        </motion.div>
      </motion.div>

      {/* Critical P1 Alerts Highlighted */}
      {criticalTickets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card pulse-critical"
          style={{ borderLeft: '4px solid var(--danger)', background: 'var(--priority-critical-bg)' }}
        >
          <h3 className="text-sm font-bold mb-5 flex items-center gap-3" style={{ color: 'var(--danger)' }}>
            <Flame size={16} /> Priority 1 Alerts â€” Immediate Attention ({criticalTickets.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {criticalTickets.slice(0, 4).map(ticket => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                compact
                actions={
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => handleParkTicket(ticket.id)}
                      className="flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all"
                      style={{ background: 'var(--priority-medium-bg)', color: 'var(--priority-medium)' }}
                    >Park</button>
                    <select
                      className="flex-1 text-xs p-2 rounded-lg"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                      onChange={e => handleManualAssign(ticket.id, e.target.value)}
                      value=""
                    >
                      <option value="">Assign to...</option>
                      {monitoringAgents.filter(a => !a.is_paused).map(agent => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name} ({getAgentTicketCount(agent.id)}/10)
                        </option>
                      ))}
                    </select>
                  </div>
                }
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Reassignment Requests */}
      {reassignmentRequests.length > 0 && (
        <div className="card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <h3 className="text-sm font-bold mb-5 flex items-center gap-3" style={{ color: 'var(--warning)' }}>
            <ShieldAlert size={16} /> Reassignment Requests ({reassignmentRequests.length})
          </h3>
          <div className="flex flex-wrap gap-4">
            {reassignmentRequests.map(ticket => (
              <div key={ticket.id} className="p-4 rounded-xl flex items-center gap-4 min-w-[280px]" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <PriorityIndicator priority={ticket.priority} size="sm" showLabel={false} />
                    <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{ticket.title}</p>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>From: {ticket.assigned_to_detail?.name}</p>
                  <p className="text-xs mt-1 italic" style={{ color: 'var(--warning)' }}>"{ticket.reassignment_reason}"</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleReassignment(ticket.id, 'accept')} className="p-2 rounded-lg transition-all"
                    style={{ background: 'var(--priority-normal-bg)', color: 'var(--priority-normal)' }}>
                    <CheckCircle2 size={16} />
                  </button>
                  <button onClick={() => handleReassignment(ticket.id, 'decline')} className="p-2 rounded-lg transition-all"
                    style={{ background: 'var(--priority-critical-bg)', color: 'var(--priority-critical)' }}>
                    <XCircle size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-7">
        {/* Alert Trend Chart */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="xl:col-span-2 card">
          <div className="flex items-center justify-between mb-7">
            <h3 className="text-base font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
              <BarChart3 style={{ color: 'var(--primary)' }} size={18} /> Alert Trend (7 Days)
            </h3>
          </div>
          <div className="h-[280px] w-full">
            <Line key={theme} data={chartData} options={chartOptions} />
          </div>
        </motion.div>

        {/* Unassigned Queue with Filters */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
              <History style={{ color: 'var(--primary)' }} size={18} /> Unassigned
            </h3>
            <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{newTickets.length}</span>
          </div>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <select className="text-[10px] p-1.5 rounded-lg flex-1 min-w-0"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
              <option value="">All P</option>
              <option value="1">P1</option>
              <option value="2">P2</option>
              <option value="3">P3</option>
            </select>
            <select className="text-[10px] p-1.5 rounded-lg flex-1 min-w-0"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              value={filterAlertType} onChange={e => setFilterAlertType(e.target.value)}>
              <option value="">All Types</option>
              {alertTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {newTickets.length > 0 ? newTickets.map(ticket => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                compact
                actions={
                  <select
                    className="text-xs p-2 rounded-lg w-full"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    onChange={e => handleManualAssign(ticket.id, e.target.value)}
                    value=""
                  >
                    <option value="">Assign to...</option>
                    {monitoringAgents.filter(a => !a.is_paused).map(agent => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name} ({getAgentTicketCount(agent.id)}/10)
                      </option>
                    ))}
                  </select>
                }
              />
            )) : (
              <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                All tickets assigned âœ“
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Parked Tickets */}
      {parkedTickets.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <h3 className="text-sm font-bold mb-5 flex items-center gap-3" style={{ color: 'var(--warning)' }}>
            <AlertTriangle size={16} /> Parked Tickets ({parkedTickets.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {parkedTickets.map(ticket => (
              <TicketCard key={ticket.id} ticket={ticket} compact
                actions={
                  <button
                    onClick={() => unparkTicket(ticket.id)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-xs transition-all"
                    style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}
                  >Unpark</button>
                }
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Live Agent Status */}
      <div className="card">
        <div className="flex items-center justify-between mb-7">
          <h3 className="text-base font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
            <Users style={{ color: 'var(--primary)' }} size={18} /> Live Agent Status
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={14} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search agents..."
              value={searchAgent}
              onChange={e => setSearchAgent(e.target.value)}
              className="pl-9 pr-4 py-2.5 rounded-xl text-sm w-60 transition-all"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredAgents.map(agent => (
            <AgentStatusCard
              key={agent.id}
              agent={agent}
              ticketCount={getAgentTicketCount(agent.id)}
            />
          ))}
        </div>
      </div>

      {/* Park Modal */}
      <AnimatePresence>
      {showParkModal && (
        <motion.div className="modal-overlay" onClick={() => setShowParkModal(false)}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}
            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}>
            <div className="modal-header">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--priority-medium-bg)', color: 'var(--priority-medium)' }}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Park Ticket</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Park for emergency coordination</p>
              </div>
            </div>
            <div className="modal-body light-form">
              <div className="form-group">
                <label>Reason for Parking</label>
                <textarea rows={3} placeholder="e.g., Coordinating with police..." value={parkReason} onChange={e => setParkReason(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowParkModal(false)} className="flex-1 py-3 rounded-xl font-bold transition-all"
                style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'transparent' }}>Cancel</button>
              <button onClick={handleConfirmPark} className="flex-1 py-3 rounded-xl font-bold transition-all"
                style={{ background: 'var(--priority-medium)', color: 'white' }}>Park Ticket</button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {showCreateModal && (
        <TicketCreateModal onClose={() => setShowCreateModal(false)} onCreated={() => {}} />
      )}
    </div>
  );
};

export default TeamLeadDashboardV2;
