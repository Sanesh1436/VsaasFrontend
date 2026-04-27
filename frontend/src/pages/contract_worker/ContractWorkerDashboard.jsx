import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import TicketCard from '../../components/TicketCard';
import {
  Play, Pause, Clock, CheckCircle, ParkingCircle,
  FileText, Phone, Camera, MapPin, ChevronRight,
  RotateCcw, AlertCircle, Shield, HardHat
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { showToast } from '../../components/NotificationToast';

const ContractWorkerDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [reportText, setReportText] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showParkModal, setShowParkModal] = useState(false);
  const [parkReason, setParkReason] = useState('');
  const [stats, setStats] = useState(null);
  const { user, fetchActiveCount } = useAuth();

  const fetchTickets = useCallback(async () => {
    try {
      const [ticketsRes, statsRes] = await Promise.all([
        api.get('agent/tickets/'),
        api.get('tickets/stats/'),
      ]);
      setTickets(Array.isArray(ticketsRes.data) ? ticketsRes.data : []);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to fetch tickets', err);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 15000);
    return () => clearInterval(interval);
  }, [fetchTickets]);

  const handleTogglePause = async () => {
    try {
      const res = await api.post('accounts/toggle-pause/');
      setIsPaused(res.data.is_paused);
    } catch (err) {
      showToast.error(err.response?.data?.error || 'Failed to toggle pause');
    }
  };

  const handleAttendTicket = async (ticket) => {
    try {
      await api.post(`tickets/${ticket.id}/attend/`);
      setActiveTicket(ticket);
      fetchTickets();
    } catch (err) {
      showToast.error(err.response?.data?.error || 'Failed to attend task');
    }
  };

  const handleParkTicket = async () => {
    if (!activeTicket) return;
    try {
      await api.post(`tickets/${activeTicket.id}/park/`, {
        reason: parkReason || 'Required additional resources / Escalated'
      });
      setShowParkModal(false);
      setParkReason('');
      setActiveTicket(null);
      fetchTickets();
      fetchActiveCount();
    } catch (err) {
      showToast.error(err.response?.data?.error || 'Failed to park task');
    }
  };

  const handleUnparkTicket = async (ticket) => {
    try {
      await api.post(`tickets/${ticket.id}/unpark/`);
      setActiveTicket(ticket);
      fetchTickets();
    } catch (err) {
      showToast.error(err.response?.data?.error || 'Failed to unpark task');
    }
  };

  const handleResolveTicket = async () => {
    if (!reportText.trim()) {
      showToast.error('Please complete the field report before resolving.');
      return;
    }
    try {
      await api.post(`tickets/${activeTicket.id}/resolve/`, {
        remarks: reportText,
        action_taken: actionTaken,
      });
      setActiveTicket(null);
      setReportText('');
      setActionTaken('');
      setShowReportModal(false);
      fetchTickets();
      fetchActiveCount();
    } catch (err) {
      showToast.error(err.response?.data?.error || 'Failed to resolve task');
    }
  };

  const handleRequestReassignment = async (ticketId) => {
    const reason = prompt('Reason for requesting task reassignment:');
    if (reason) {
      await api.post(`tickets/${ticketId}/request_reassignment/`, { reason });
      fetchTickets();
    }
  };

  const activeTickets = tickets.filter(t => !['PARKED', 'RESOLVED'].includes(t.status));
  const parkedTickets = tickets.filter(t => t.status === 'PARKED');

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Main Column */}
      <div className="xl:col-span-2 flex flex-col gap-6">

        {/* Current Active Task */}
        <section className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                <HardHat size={20} />
              </div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Current Field Task</h2>
            </div>
            <button
              onClick={handleTogglePause}
              className="flex items-center gap-2 px-5 py-2 rounded-full font-bold text-sm transition-all"
              style={{
                background: isPaused ? 'var(--priority-normal-bg)' : 'var(--priority-medium-bg)',
                color: isPaused ? 'var(--priority-normal)' : 'var(--priority-medium)',
              }}
            >
              {isPaused ? <><Play size={14} /> Resume Field Duty</> : <><Pause size={14} /> Take Break</>}
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
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`badge ${activeTicket.priority === 1 ? 'badge-critical' : activeTicket.priority === 2 ? 'badge-medium' : 'badge-normal'}`}>
                      P{activeTicket.priority}
                    </span>
                    <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{activeTicket.ticket_id}</span>
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

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)' }}>
                  <MapPin style={{ color: 'var(--text-muted)' }} size={18} />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: 'var(--text-muted)' }}>Dispatch Site</p>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{activeTicket.site_name || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)' }}>
                  <Camera style={{ color: 'var(--text-muted)' }} size={18} />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: 'var(--text-muted)' }}>Equipment Info</p>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{activeTicket.camera_error_info || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {activeTicket.contacts_info && (
                <div className="p-3 rounded-xl mb-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)' }}>
                  <p className="text-[10px] uppercase tracking-wider font-bold mb-1 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                    <Phone size={11} /> Site Contacts
                  </p>
                  <p className="text-sm whitespace-pre-line" style={{ color: 'var(--text-secondary)' }}>{activeTicket.contacts_info}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowParkModal(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all"
                  style={{ background: 'var(--priority-medium-bg)', color: 'var(--priority-medium)', border: '1px solid var(--priority-medium-border)' }}
                >
                  <ParkingCircle size={16} /> PARK (Need Assistance)
                </button>
                <button
                  onClick={() => setShowReportModal(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all"
                  style={{ background: 'var(--priority-normal-bg)', color: 'var(--priority-normal)', border: '1px solid var(--priority-normal-border)' }}
                >
                  <CheckCircle size={16} /> RESOLVE TASK
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12 rounded-2xl" 
              style={{ background: 'var(--bg-elevated)', border: '2px dashed var(--border)' }}
            >
              <Clock size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="font-medium" style={{ color: 'var(--text-muted)' }}>No active field task. Review assigned tasks below.</p>
            </motion.div>
          )}
          </AnimatePresence>
        </section>

        {/* Pending Field Tasks Queue */}
        <section className="card">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                <AlertCircle size={20} />
              </div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Assigned Field Tasks</h2>
            </div>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              {activeTickets.length} TASKS
            </span>
          </div>

          <div className="space-y-3">
            {activeTickets.length > 0 ? activeTickets.map(ticket => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                actions={
                  <>
                    <button
                      onClick={() => handleRequestReassignment(ticket.id)}
                      className="px-3 py-2 text-xs font-bold transition-colors"
                      style={{ color: 'var(--text-muted)', background: 'transparent' }}
                    >
                      Can't Attend
                    </button>
                    <button
                      onClick={() => handleAttendTicket(ticket)}
                      disabled={activeTicket !== null}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all"
                      style={activeTicket
                        ? { background: 'var(--bg-elevated)', color: 'var(--text-muted)', cursor: 'not-allowed' }
                        : { background: 'var(--primary)', color: 'white', boxShadow: '0 4px 12px var(--primary-glow)' }
                      }
                    >
                      Go To Site <ChevronRight size={14} />
                    </button>
                  </>
                }
              />
            )) : (
              <div className="text-center py-10">
                <CheckCircle size={28} className="mx-auto mb-2" style={{ color: 'var(--priority-normal)' }} />
                <p className="font-medium" style={{ color: 'var(--text-muted)' }}>All clear! You have no assigned field tasks.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Stats Sidebar */}
      <div className="flex flex-col gap-6">
        <section className="card border-none text-white" style={{ background: 'var(--gradient-hero)' }}>
          <h3 className="font-bold mb-5 flex items-center gap-2 text-white/90">
            <Shield size={18} /> Daily Action Report
          </h3>
          <div className="space-y-5">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-white/60 text-xs">Resolved Sites Today</p>
                <p className="text-3xl font-black">{stats?.resolved_today || 0}</p>
              </div>
              <p className="text-white/60 text-xs font-bold">TODAY</p>
            </div>
            <div className="h-1.5 bg-black/20 rounded-full overflow-hidden">
              <div className="h-full bg-white/30 rounded-full transition-all" style={{ width: `${Math.min(100, ((stats?.resolved_today || 0) / 10) * 100)}%` }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Assigned', value: stats?.active || 0 },
                { label: 'Parked', value: stats?.parked || 0 },
                { label: 'Critical Tasks', value: stats?.critical || 0, danger: true },
                { label: 'Total', value: stats?.total || 0 },
              ].map(s => (
                <div key={s.label} className="bg-white/10 rounded-xl p-3">
                  <p className={`text-xs ${s.danger ? 'text-red-300' : 'text-white/60'}`}>{s.label}</p>
                  <p className={`text-xl font-black ${s.danger ? 'text-red-300' : ''}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Parked Field Tasks */}
        {parkedTickets.length > 0 && (
          <section className="card" style={{ borderLeft: '4px solid var(--warning)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--priority-medium-bg)', color: 'var(--priority-medium)' }}>
                <ParkingCircle size={20} />
              </div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Parked Tasks</h2>
            </div>
            <div className="space-y-3">
              {parkedTickets.map(ticket => (
                <div key={ticket.id} className="p-3 rounded-xl" style={{ border: '1px solid var(--border-light)' }}>
                  <p className="text-sm font-bold truncate mb-2">{ticket.title}</p>
                  <button
                    onClick={() => handleUnparkTicket(ticket)}
                    className="w-full flex justify-center items-center gap-2 px-3 py-2 rounded-lg font-bold text-xs transition-all"
                    style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}
                  >
                    <RotateCcw size={14} /> Resume Task
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
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
                <ParkingCircle size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Park Field Task</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Pausing task {activeTicket?.ticket_id}</p>
              </div>
            </div>
            <div className="modal-body light-form">
              <div className="form-group">
                <label>Reason for Parking</label>
                <textarea
                  rows={3}
                  placeholder="e.g., Awaiting spare parts, police intervention required..."
                  value={parkReason}
                  onChange={e => setParkReason(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowParkModal(false)} className="flex-1 py-3 rounded-xl font-bold transition-all"
                style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'transparent' }}>
                Cancel
              </button>
              <button onClick={handleParkTicket} className="flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                style={{ background: 'var(--priority-medium)', color: 'white' }}>
                <ParkingCircle size={18} /> Park Task
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
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Field Action Report</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Resolve Task {activeTicket?.ticket_id}</p>
              </div>
            </div>
            <div className="modal-body light-form space-y-4">
              <div className="form-group">
                <label>Field Remarks / Situation Report *</label>
                <textarea rows={4} placeholder="Describe the ground situation and resolution..." value={reportText} onChange={e => setReportText(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Corrective Action Taken</label>
                <textarea rows={2} placeholder="e.g., Replaced hard drive, extinguished fire..." value={actionTaken} onChange={e => setActionTaken(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowReportModal(false)} className="flex-1 py-3 rounded-xl font-bold transition-all"
                style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'transparent' }}>
                Cancel
              </button>
              <button onClick={handleResolveTicket} className="flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                style={{ background: 'var(--priority-normal)', color: 'white' }}>
                <CheckCircle size={18} /> Resolve & Close Task
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};

export default ContractWorkerDashboard;
