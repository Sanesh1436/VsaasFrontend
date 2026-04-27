import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import TicketCard, { PRIORITY_CONFIG, STATUS_LABELS } from '../../components/TicketCard';
import { Search, SlidersHorizontal, Ticket, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AllTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const { user } = useAuth();

  const fetchTickets = async () => {
    try {
      let url = 'tickets/?';
      if (filterStatus) url += `status=${filterStatus}&`;
      if (filterPriority) url += `priority=${filterPriority}&`;
      const res = await api.get(url);
      setTickets(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch tickets');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [filterStatus, filterPriority]);

  const filteredTickets = tickets.filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.ticket_id.toLowerCase().includes(q) ||
      t.title.toLowerCase().includes(q) ||
      (t.site_name || '').toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q) ||
      (t.alert_type_detail?.name || '').toLowerCase().includes(q)
    );
  });

  const statusCounts = {
    ALL: tickets.length,
    NEW: tickets.filter(t => t.status === 'NEW').length,
    ASSIGNED: tickets.filter(t => t.status === 'ASSIGNED').length,
    IN_PROGRESS: tickets.filter(t => t.status === 'IN_PROGRESS').length,
    PARKED: tickets.filter(t => t.status === 'PARKED').length,
    RESOLVED: tickets.filter(t => t.status === 'RESOLVED').length,
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }}></div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-6">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by ID, title, site, alert type..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} style={{ color: 'var(--text-muted)' }} />
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
              className="text-sm py-2.5 px-3 rounded-xl"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              <option value="">All Priorities</option>
              <option value="1">ðŸ”´ P1 â€” Critical</option>
              <option value="2">ðŸŸ¡ P2 â€” Medium</option>
              <option value="3">ðŸŸ¢ P3 â€” Normal</option>
            </select>
          </div>

          {(filterStatus || filterPriority || search) && (
            <button onClick={() => { setFilterStatus(''); setFilterPriority(''); setSearch(''); }}
              className="text-xs font-bold flex items-center gap-1 transition-colors"
              style={{ color: 'var(--text-muted)', background: 'transparent' }}>
              <X size={14} /> Clear
            </button>
          )}
        </div>

        {/* Status Tabs */}
        <div className="flex gap-4 mt-6 flex-wrap">
          {[
            { key: '', label: 'All', count: statusCounts.ALL },
            { key: 'NEW', label: 'New', count: statusCounts.NEW },
            { key: 'ASSIGNED', label: 'Assigned', count: statusCounts.ASSIGNED },
            { key: 'IN_PROGRESS', label: 'In Progress', count: statusCounts.IN_PROGRESS },
            { key: 'PARKED', label: 'Parked', count: statusCounts.PARKED },
            { key: 'RESOLVED', label: 'Resolved', count: statusCounts.RESOLVED },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
              style={filterStatus === tab.key
                ? { background: 'var(--primary)', color: 'white', boxShadow: '0 4px 12px var(--primary-glow)' }
                : { background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
              }
            >
              {tab.label}
              <span className="ml-2 px-1.5 py-0.5 rounded text-[10px]"
                style={{ background: filterStatus === tab.key ? 'rgba(255,255,255,0.2)' : 'var(--border-light)' }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Ticket Grid */}
      {filteredTickets.length > 0 ? (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1 }}
        >
          {filteredTickets.map(ticket => (
            <motion.div key={ticket.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <TicketCard ticket={ticket} onClick={() => setSelectedTicket(ticket)} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="card text-center py-16">
          <Ticket size={40} className="mx-auto mb-3" style={{ color: 'var(--border)' }} />
          <p className="font-medium" style={{ color: 'var(--text-muted)' }}>No tickets match your filters</p>
        </div>
      )}

      {/* Ticket Detail Modal */}
      <AnimatePresence>
      {selectedTicket && (
        <motion.div 
          className="modal-overlay" 
          onClick={() => setSelectedTicket(null)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="modal-content max-w-2xl" 
            onClick={e => e.stopPropagation()}
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="modal-header">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{
                  background: selectedTicket.priority === 1 ? 'var(--priority-critical-bg)' :
                    selectedTicket.priority === 2 ? 'var(--priority-medium-bg)' : 'var(--priority-normal-bg)',
                  color: selectedTicket.priority === 1 ? 'var(--priority-critical)' :
                    selectedTicket.priority === 2 ? 'var(--priority-medium)' : 'var(--priority-normal)',
                }}>
                <Ticket size={24} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{selectedTicket.ticket_id}</h3>
                  <span className={`badge ${selectedTicket.priority === 1 ? 'badge-critical' : selectedTicket.priority === 2 ? 'badge-medium' : 'badge-normal'}`}>
                    P{selectedTicket.priority}
                  </span>
                  <span className={`badge badge-status badge-${selectedTicket.status.toLowerCase().replace('_', '-')}`}>
                    {STATUS_LABELS[selectedTicket.status]}
                  </span>
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{selectedTicket.title}</p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="p-2" style={{ color: 'var(--text-muted)', background: 'transparent' }}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body space-y-4">
              {selectedTicket.description && (
                <div>
                  <p className="text-xs uppercase tracking-wider font-bold mb-1" style={{ color: 'var(--text-muted)' }}>Description</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{selectedTicket.description}</p>
                </div>
              )}

              {selectedTicket.snapshot && (
                <div className="rounded-xl overflow-hidden border border-(--border-light) relative w-full h-auto">
                  <img src={selectedTicket.snapshot} alt="Alert Snapshot" className="object-cover w-full max-h-64" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Alert Type', value: selectedTicket.alert_type_detail?.name || selectedTicket.alert_type || 'N/A' },
                  { label: 'Site', value: selectedTicket.site_name || 'N/A' },
                  { label: 'Branch Code', value: selectedTicket.branch_code || 'N/A', mono: true },
                  { label: 'Assigned To', value: selectedTicket.assigned_to_detail?.name || 'Unassigned' },
                  { label: 'Camera Name', value: selectedTicket.camera_name || 'N/A' },
                  { label: 'Category', value: selectedTicket.alert_type_detail?.category || 'N/A' },
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                    <p className="text-xs font-bold mb-1" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
                    <p className={`text-sm font-semibold ${item.mono ? 'font-mono' : ''}`} style={{ color: 'var(--text-primary)' }}>{item.value}</p>
                  </div>
                ))}
              </div>

              {selectedTicket.camera_error_info && (
                <div className="p-3 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                  <p className="text-xs font-bold mb-1" style={{ color: 'var(--text-muted)' }}>Camera Info</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{selectedTicket.camera_error_info}</p>
                </div>
              )}

              {selectedTicket.contacts_info && (
                <div className="p-3 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                  <p className="text-xs font-bold mb-1" style={{ color: 'var(--text-muted)' }}>Emergency Contacts</p>
                  <p className="text-sm whitespace-pre-line" style={{ color: 'var(--text-secondary)' }}>{selectedTicket.contacts_info}</p>
                </div>
              )}

              {selectedTicket.cooldown_until && (
                <div className="p-3 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                  <p className="text-xs font-bold mb-1" style={{ color: 'var(--text-muted)' }}>Cooldown Until</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{new Date(selectedTicket.cooldown_until).toLocaleString()}</p>
                </div>
              )}

              {selectedTicket.parked_reason && (
                <div className="p-3 rounded-xl" style={{ background: 'var(--priority-medium-bg)', border: '1px solid var(--priority-medium-border)' }}>
                  <p className="text-xs font-bold mb-1" style={{ color: 'var(--priority-medium)' }}>Parked Reason</p>
                  <p className="text-sm" style={{ color: 'var(--priority-medium)' }}>{selectedTicket.parked_reason}</p>
                </div>
              )}

              {selectedTicket.reassignment_requested && (
                <div className="p-3 rounded-xl" style={{ background: 'var(--priority-medium-bg)', border: '1px solid var(--priority-medium-border)' }}>
                  <p className="text-xs font-bold mb-1" style={{ color: 'var(--warning)' }}>Reassignment Requested</p>
                  <p className="text-sm" style={{ color: 'var(--warning)' }}>{selectedTicket.reassignment_reason || 'Pending review'}</p>
                </div>
              )}

              {/* Remarks Log */}
              {Array.isArray(selectedTicket.remarks) && selectedTicket.remarks.length > 0 && (
                <div className="p-3 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                  <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-muted)' }}>Remarks Log ({selectedTicket.remarks.length})</p>
                  <div className="space-y-2 max-h-[150px] overflow-y-auto">
                    {selectedTicket.remarks.map((r, idx) => (
                      <div key={idx} className="p-2 rounded-lg text-xs" style={{ background: 'var(--bg-main)', border: '1px solid var(--border-light)' }}>
                        <div className="flex justify-between mb-1">
                          <span className="font-bold" style={{ color: 'var(--primary)' }}>{r.author || 'Agent'}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{r.time || r.timestamp ? new Date(r.time || r.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }) : ''}</span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)' }}>{r.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedTicket.report && (
                <div className="p-3 rounded-xl" style={{ background: 'var(--priority-normal-bg)', border: '1px solid var(--priority-normal-border)' }}>
                  <p className="text-xs font-bold mb-1" style={{ color: 'var(--priority-normal)' }}>Resolution Report</p>
                  <p className="text-sm" style={{ color: 'var(--priority-normal)' }}>{selectedTicket.report.remarks}</p>
                  {selectedTicket.report.action_taken && (
                    <p className="text-sm mt-1" style={{ color: 'var(--priority-normal)' }}><strong>Action:</strong> {selectedTicket.report.action_taken}</p>
                  )}
                </div>
              )}

              {/* Full Timestamps */}
              <div className="grid grid-cols-2 gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                <div><strong>Created:</strong> {new Date(selectedTicket.created_at).toLocaleString()}</div>
                {selectedTicket.assigned_at && <div><strong>Assigned:</strong> {new Date(selectedTicket.assigned_at).toLocaleString()}</div>}
                {selectedTicket.attended_at && <div><strong>Attended:</strong> {new Date(selectedTicket.attended_at).toLocaleString()}</div>}
                {selectedTicket.resolved_at && <div><strong>Resolved:</strong> {new Date(selectedTicket.resolved_at).toLocaleString()}</div>}
                {selectedTicket.updated_at && <div><strong>Last Updated:</strong> {new Date(selectedTicket.updated_at).toLocaleString()}</div>}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};

export default AllTickets;
