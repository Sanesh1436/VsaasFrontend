import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTickets } from '../../context/TicketContext';
import TicketCard from '../../components/TicketCard';
import CooldownBadge from '../../components/CooldownBadge';
import PriorityIndicator from '../../components/PriorityIndicator';
import DetectionTypeIcon from '../../components/DetectionTypeIcon';
import RemarksLog from '../../components/RemarksLog';
import {
  Play, Pause, Clock, CheckCircle, ParkingCircle,
  FileText, Phone, Camera, MapPin, ChevronRight,
  RotateCcw, AlertCircle, Shield, MessageSquare,
  Coffee, LogOut, Ban
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { showToast } from '../../components/NotificationToast';

const AgentDashboardV2 = () => {
  const { user } = useAuth();
  const {
    tickets, attendTicket, parkTicket, unparkTicket, resolveTicket,
    requestReassignment, addRemark, toggleAgentPause, agents,
    getAgentTickets, getStats, getMyResolvedCount, isCooldownActive, getCooldownRemaining,
    getPendingTicketCount,
  } = useTickets();

  const [activeTicketId, setActiveTicketId] = useState(null);
  const [reportText, setReportText] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showParkModal, setShowParkModal] = useState(false);
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [parkReason, setParkReason] = useState('');
  const [remarkText, setRemarkText] = useState('');
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignTicketId, setReassignTicketId] = useState(null);
  const [reassignReason, setReassignReason] = useState('');

  // Get agent ID from user
  const agentId = user?.user_id;
  const currentAgent = agents.find(a => a.id === agentId);
  const isPaused = currentAgent?.is_paused || false;

  // Agent's tickets sorted by priority
  const myTickets = useMemo(() => {
    return tickets
      .filter(t => t.assigned_to === agentId && !['RESOLVED'].includes(t.status))
      .sort((a, b) => a.priority - b.priority);
  }, [tickets, agentId]);

  const activeTicket = useMemo(() => {
    return tickets.find(t => t.id === activeTicketId && t.status === 'IN_PROGRESS');
  }, [tickets, activeTicketId]);

  const parkedTickets = myTickets.filter(t => t.status === 'PARKED');
  const pendingTickets = myTickets.filter(t => ['NEW', 'ASSIGNED'].includes(t.status));
  const stats = getStats();
  const pendingCount = getPendingTicketCount(agentId);
  const myResolvedCount = getMyResolvedCount(agentId);

  // Auto-detect active IN_PROGRESS ticket on mount/refresh
  useEffect(() => {
    if (!activeTicketId) {
      const inProgress = tickets.find(t => t.assigned_to === agentId && t.status === 'IN_PROGRESS');
      if (inProgress) {
        setActiveTicketId(inProgress.id);
      }
    }
  }, [tickets, agentId, activeTicketId]);

  const handleAttend = async (ticket) => {
    const result = await attendTicket(ticket.id, agentId);
    if (result.error) {
      showToast.error(result.error);
      return;
    }
    setActiveTicketId(ticket.id);
  };

  const handlePark = () => {
    if (!activeTicket) return;
    parkTicket(activeTicket.id, parkReason || 'Contacted emergency services');
    setShowParkModal(false);
    setParkReason('');
    setActiveTicketId(null);
  };

  const handleResolve = async () => {
    if (!reportText.trim()) {
      showToast.error('Report is mandatory before resolving.');
      return;
    }
    const result = await resolveTicket(activeTicket.id, { remarks: reportText, action_taken: actionTaken });
    if (result.error) {
      showToast.error(result.error);
      return;
    }
    setActiveTicketId(null);
    setReportText('');
    setActionTaken('');
    setShowReportModal(false);
  };

  const handleUnpark = (ticket) => {
    unparkTicket(ticket.id);
    setActiveTicketId(ticket.id);
  };

  const handleAddRemark = () => {
    if (!remarkText.trim()) return;
    addRemark(activeTicket.id, remarkText, currentAgent.name);
    setRemarkText('');
    setShowRemarkModal(false);
  };

  const handleReassign = () => {
    if (!reassignReason.trim()) return;
    requestReassignment(reassignTicketId, reassignReason);
    setReassignTicketId(null);
    setReassignReason('');
    setShowReassignModal(false);
  };

  const handleTogglePause = () => {
    toggleAgentPause(agentId);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      {/* Main Column */}
      <div className="xl:col-span-2 flex flex-col gap-7">

        {/* Cannot Logout Warning */}
        {pendingCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-5 py-3.5 rounded-xl text-xs font-bold"
            style={{ background: 'var(--priority-critical-bg)', color: 'var(--priority-critical)', border: '1px solid var(--priority-critical-border)' }}
          >
            <Ban size={14} />
            <span>You have {pendingCount} pending ticket(s) â€” logout is disabled until all tickets are resolved.</span>
          </motion.div>
        )}

        {/* Currently Attending */}
        <section className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                <Play size={20} fill="currentColor" />
              </div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Currently Attending</h2>
            </div>
            <button
              onClick={handleTogglePause}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all"
              style={{
                background: isPaused ? 'var(--priority-normal-bg)' : 'var(--priority-medium-bg)',
                color: isPaused ? 'var(--priority-normal)' : 'var(--priority-medium)',
              }}
            >
              {isPaused ? <><Play size={14} /> Resume</> : <><Coffee size={14} /> Tea Break</>}
            </button>
          </div>

          <AnimatePresence mode="wait">
          {activeTicket ? (
            <motion.div
              key={activeTicket.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className={`ticket-card priority-${activeTicket.priority} ${activeTicket.priority === 1 ? 'pulse-critical' : ''}`}
            >
              <div className="flex justify-between items-start mb-5">
                <div>
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <PriorityIndicator priority={activeTicket.priority} size="md" />
                    <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{activeTicket.ticket_id}</span>
                    <DetectionTypeIcon type={activeTicket.alert_type} category={activeTicket.alert_type_detail?.category} size={16} showLabel />
                    {activeTicket.cooldown_until && getCooldownRemaining(activeTicket.camera_name, activeTicket.alert_type) > 0 && (
                      <CooldownBadge seconds={getCooldownRemaining(activeTicket.camera_name, activeTicket.alert_type)} />
                    )}
                  </div>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{activeTicket.title}</h3>
                  {activeTicket.description && (
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{activeTicket.description}</p>
                  )}
                </div>
              </div>

              {activeTicket.snapshot && (
                <div className="mb-4 rounded-xl overflow-hidden border border-(--border-light) aspect-video relative">
                  <img src={activeTicket.snapshot} alt="Alert Snapshot" className="object-cover w-full h-full absolute inset-0" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)' }}>
                  <Camera style={{ color: 'var(--text-muted)' }} size={18} />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: 'var(--text-muted)' }}>Camera</p>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{activeTicket.camera_name || activeTicket.camera_error_info || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)' }}>
                  <MapPin style={{ color: 'var(--text-muted)' }} size={18} />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: 'var(--text-muted)' }}>Site</p>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{activeTicket.site_name || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {activeTicket.contacts_info && (
                <div className="p-4 rounded-xl mb-5" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)' }}>
                  <p className="text-[10px] uppercase tracking-wider font-bold mb-1 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                    <Phone size={11} /> Emergency Contacts
                  </p>
                  <p className="text-sm whitespace-pre-line" style={{ color: 'var(--text-secondary)' }}>{activeTicket.contacts_info}</p>
                </div>
              )}

              {/* Remarks Log */}
              {activeTicket.remarks && activeTicket.remarks.length > 0 && (
                <div className="mb-5 p-4 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)' }}>
                  <p className="text-[10px] uppercase tracking-wider font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                    <MessageSquare size={11} /> Remarks Log
                  </p>
                  <RemarksLog remarks={activeTicket.remarks} />
                </div>
              )}

              <div className="flex gap-4 flex-wrap mt-2">
                <button
                  onClick={() => setShowRemarkModal(true)}
                  className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm transition-all"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                >
                  <MessageSquare size={16} /> Add Remark
                </button>
                <button
                  onClick={() => setShowParkModal(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm transition-all"
                  style={{ background: 'var(--priority-medium-bg)', color: 'var(--priority-medium)', border: '1px solid var(--priority-medium-border)' }}
                >
                  <ParkingCircle size={16} /> PARK
                </button>
                <button
                  onClick={() => setShowReportModal(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm transition-all"
                  style={{ background: 'var(--priority-normal-bg)', color: 'var(--priority-normal)', border: '1px solid var(--priority-normal-border)' }}
                >
                  <CheckCircle size={16} /> RESOLVE
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16 rounded-2xl"
              style={{ background: 'var(--bg-elevated)', border: '2px dashed var(--border)' }}
            >
              <Clock size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="font-medium" style={{ color: 'var(--text-muted)' }}>No active ticket. Select from queue below.</p>
            </motion.div>
          )}
          </AnimatePresence>
        </section>

        {/* Parked Tickets */}
        {parkedTickets.length > 0 && (
          <section className="card" style={{ borderLeft: '4px solid var(--warning)' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--priority-medium-bg)', color: 'var(--priority-medium)' }}>
                <ParkingCircle size={20} />
              </div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Parked Tickets</h2>
              <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ color: 'var(--priority-medium)', background: 'var(--priority-medium-bg)' }}>{parkedTickets.length}</span>
            </div>
            <div className="space-y-3">
              {parkedTickets.map(ticket => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  compact
                  actions={
                    <button
                      onClick={() => handleUnpark(ticket)}
                      disabled={!!activeTicket}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all"
                      style={activeTicket
                        ? { background: 'var(--bg-elevated)', color: 'var(--text-muted)', cursor: 'not-allowed' }
                        : { background: 'var(--primary-light)', color: 'var(--primary)' }
                      }
                    >
                      <RotateCcw size={14} /> Unpark & Resume
                    </button>
                  }
                />
              ))}
            </div>
          </section>
        )}

        {/* Ticket Queue */}
        <section className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                <AlertCircle size={20} />
              </div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Assigned Tickets</h2>
            </div>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              {myTickets.length}/10 ACTIVE
            </span>
          </div>

          <div className="space-y-3">
            {pendingTickets.length > 0 ? pendingTickets.map(ticket => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                actions={
                  <>
                    {ticket.cooldown_until && getCooldownRemaining(ticket.camera_name, ticket.alert_type) > 0 && (
                      <CooldownBadge seconds={getCooldownRemaining(ticket.camera_name, ticket.alert_type)} />
                    )}
                    <button
                      onClick={() => {
                        setReassignTicketId(ticket.id);
                        setShowReassignModal(true);
                      }}
                      className="px-3 py-2 text-xs font-bold transition-colors"
                      style={{ color: 'var(--text-muted)', background: 'transparent' }}
                    >
                      Reassign
                    </button>
                    <button
                      onClick={() => handleAttend(ticket)}
                      disabled={!!activeTicket}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all"
                      style={activeTicket
                        ? { background: 'var(--bg-elevated)', color: 'var(--text-muted)', cursor: 'not-allowed' }
                        : { background: 'var(--primary)', color: 'white', boxShadow: '0 4px 12px var(--primary-glow)' }
                      }
                    >
                      Attend <ChevronRight size={14} />
                    </button>
                  </>
                }
              />
            )) : (
              <div className="text-center py-14">
                <CheckCircle size={28} className="mx-auto mb-2" style={{ color: 'var(--priority-normal)' }} />
                <p className="font-medium" style={{ color: 'var(--text-muted)' }}>All clear! No pending tickets.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Stats Sidebar */}
      <div className="flex flex-col gap-7">
        <section className="card border-none text-white" style={{ background: 'var(--gradient-hero)' }}>
          <h3 className="font-bold mb-6 flex items-center gap-3 text-white/90">
            <Shield size={18} /> Shift Summary
          </h3>
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-white/60 text-xs">Resolved Today</p>
                <p className="text-3xl font-black">{myResolvedCount}</p>
              </div>
              <p className="text-white/60 text-xs font-bold">TODAY</p>
            </div>
            <div className="h-1.5 bg-black/20 rounded-full overflow-hidden">
              <div className="h-full bg-white/30 rounded-full transition-all" style={{ width: `${Math.min(100, (myResolvedCount / 20) * 100)}%` }} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'My Tickets', value: myTickets.length },
                { label: 'Parked', value: parkedTickets.length },
                { label: 'Critical (P1)', value: myTickets.filter(t => t.priority === 1).length, danger: true },
                { label: 'Total System', value: stats?.total || 0 },
              ].map(s => (
                <div key={s.label} className="bg-white/10 rounded-xl p-4">
                  <p className={`text-xs ${s.danger ? 'text-red-300' : 'text-white/60'}`}>{s.label}</p>
                  <p className={`text-xl font-black ${s.danger ? 'text-red-300' : ''}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="card">
          <h3 className="font-bold mb-4 flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
            <FileText style={{ color: 'var(--primary)' }} size={18} /> Active Ticket Info
          </h3>
          <div className="space-y-4 text-sm">
            {[
              { label: 'Current Site', value: activeTicket?.site_name || 'N/A' },
              { label: 'Branch Code', value: activeTicket?.branch_code || 'N/A', mono: true },
              { label: 'Alert Type', value: activeTicket?.alert_type || 'N/A' },
              { label: 'Camera', value: activeTicket?.camera_name || 'N/A' },
              { label: 'Status', value: activeTicket ? 'IN PROGRESS' : 'No active ticket' },
            ].map((item, i) => (
              <div key={i} className="flex justify-between pb-3" style={{ borderBottom: i < 4 ? '1px solid var(--border-light)' : 'none' }}>
                <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                <span className={item.mono ? 'font-mono' : ''} style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Pause Status */}
        {isPaused && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card text-center"
            style={{ border: '2px solid var(--warning)' }}
          >
            <Coffee size={32} className="mx-auto mb-2" style={{ color: 'var(--warning)' }} />
            <p className="font-bold" style={{ color: 'var(--warning)' }}>Tea Break Active</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>New tickets won't be assigned during break</p>
          </motion.div>
        )}
      </div>

      {/* â”€â”€ MODALS â”€â”€â”€ */}
      {/* Park Modal */}
      <AnimatePresence>
      {showParkModal && (
        <motion.div className="modal-overlay" onClick={() => setShowParkModal(false)}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}
            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}>
            <div className="modal-header">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--priority-medium-bg)', color: 'var(--priority-medium)' }}>
                <ParkingCircle size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Park Ticket</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Ticket {activeTicket?.ticket_id} â€” calling emergency services</p>
              </div>
            </div>
            <div className="modal-body light-form">
              <div className="form-group">
                <label>Action Being Taken</label>
                <textarea rows={3} placeholder="e.g., Called Police, dispatching unit..." value={parkReason} onChange={e => setParkReason(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowParkModal(false)} className="flex-1 py-3 rounded-xl font-bold transition-all"
                style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'transparent' }}>Cancel</button>
              <button onClick={handlePark} className="flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                style={{ background: 'var(--priority-medium)', color: 'white' }}>
                <ParkingCircle size={18} /> Park Ticket
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Resolve Modal */}
      <AnimatePresence>
      {showReportModal && (
        <motion.div className="modal-overlay" onClick={() => setShowReportModal(false)}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}
            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}>
            <div className="modal-header">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--priority-normal-bg)', color: 'var(--priority-normal)' }}>
                <FileText size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Incident Report</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Report is mandatory to resolve {activeTicket?.ticket_id}</p>
              </div>
            </div>
            <div className="modal-body light-form space-y-4">
              <div className="form-group">
                <label>Incident Remarks *</label>
                <textarea rows={4} placeholder="Describe what happened and resolution..." value={reportText} onChange={e => setReportText(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Action Taken</label>
                <textarea rows={2} placeholder="Specific actions to resolve..." value={actionTaken} onChange={e => setActionTaken(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowReportModal(false)} className="flex-1 py-3 rounded-xl font-bold transition-all"
                style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'transparent' }}>Cancel</button>
              <button onClick={handleResolve} className="flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                style={{ background: 'var(--priority-normal)', color: 'white' }}>
                <CheckCircle size={18} /> Resolve & Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Remark Modal */}
      <AnimatePresence>
      {showRemarkModal && (
        <motion.div className="modal-overlay" onClick={() => setShowRemarkModal(false)}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}
            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}>
            <div className="modal-header">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                <MessageSquare size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Add Remark</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{activeTicket?.ticket_id}</p>
              </div>
            </div>
            <div className="modal-body light-form">
              <div className="form-group">
                <label>Remark</label>
                <textarea rows={3} placeholder="Add a time-stamped remark..." value={remarkText} onChange={e => setRemarkText(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowRemarkModal(false)} className="flex-1 py-3 rounded-xl font-bold transition-all"
                style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'transparent' }}>Cancel</button>
              <button onClick={handleAddRemark} className="flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                style={{ background: 'var(--primary)', color: 'white' }}>
                <MessageSquare size={18} /> Save Remark
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Reassignment Modal */}
      <AnimatePresence>
      {showReassignModal && (
        <motion.div className="modal-overlay" onClick={() => setShowReassignModal(false)}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}
            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}>
            <div className="modal-header">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--priority-critical-bg)', color: 'var(--priority-critical)' }}>
                <RotateCcw size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Request Reassignment</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>This will be reviewed by Team Lead</p>
              </div>
            </div>
            <div className="modal-body light-form">
              <div className="form-group">
                <label>Reason for Reassignment</label>
                <textarea rows={3} placeholder="Why can't you handle this ticket?" value={reassignReason} onChange={e => setReassignReason(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowReassignModal(false)} className="flex-1 py-3 rounded-xl font-bold transition-all"
                style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'transparent' }}>Cancel</button>
              <button onClick={handleReassign} className="flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                style={{ background: 'var(--priority-critical)', color: 'white' }}>
                <RotateCcw size={18} /> Submit Request
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};

export default AgentDashboardV2;
