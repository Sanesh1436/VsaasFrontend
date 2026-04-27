import React, { useState, useMemo } from 'react';
import { useTickets } from '../../context/TicketContext';
import AgentStatusCard from '../../components/AgentStatusCard';
import {
  UserPlus, Search, Users, Clock, Activity,
  MoreHorizontal, X, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { showToast } from '../../components/NotificationToast';

const AgentManagement = () => {
  const { agents, addAgent, getAgentTicketCount, generateActivityLogs, tickets } = useTickets();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newAgent, setNewAgent] = useState({ username: '', password: '', name: '', email: '', phone: '', role: 'MONITORING_AGENT' });
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedAgent, setSelectedAgent] = useState(null);

  const filteredAgents = useMemo(() => {
    let list = agents;
    if (filterType) list = list.filter(a => a.role === filterType || a.frontend_role === filterType);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        (a.name || '').toLowerCase().includes(q) ||
        (a.username || '').toLowerCase().includes(q) ||
        (a.email || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [agents, search, filterType]);

  const handleAddAgent = async (e) => {
    e.preventDefault();
    if (!newAgent.username || !newAgent.name) {
      showToast.error('Username and Name are required');
      return;
    }
    const result = await addAgent(newAgent);
    if (result.success) {
      setShowAddModal(false);
      setNewAgent({ username: '', password: '', name: '', email: '', phone: '', role: 'MONITORING_AGENT' });
    }
  };

  const activityLogs = selectedAgent ? generateActivityLogs(selectedAgent.id) : [];
  const selectedAgentTickets = selectedAgent
    ? tickets.filter(t => t.assigned_to === selectedAgent.id && t.status !== 'RESOLVED')
    : [];
  const selectedAgentResolved = selectedAgent
    ? tickets.filter(t => t.assigned_to === selectedAgent.id && t.status === 'RESOLVED')
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={14} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text" placeholder="Search agents..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2.5 rounded-xl text-sm w-64 transition-all"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="text-sm py-2.5 px-3 rounded-xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            <option value="">All Types</option>
            <option value="AGENT">Monitoring Agent</option>
            <option value="CONTRACT_WORKER">Contract Worker</option>
          </select>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm transition-all"
          style={{ background: 'var(--primary)', boxShadow: '0 4px 16px var(--primary-glow)' }}>
          <UserPlus size={18} /> Add Agent
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <div className="kpi-card" style={{ borderTopColor: 'var(--primary)' }}>
          <p className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>Total Personnel</p>
          <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{agents.length}</p>
        </div>
        <div className="kpi-card" style={{ borderTopColor: 'var(--success)' }}>
          <p className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>Active Now</p>
          <p className="text-2xl font-black" style={{ color: 'var(--success)' }}>{agents.filter(a => !a.is_paused).length}</p>
        </div>
        <div className="kpi-card" style={{ borderTopColor: 'var(--warning)' }}>
          <p className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>On Break</p>
          <p className="text-2xl font-black" style={{ color: 'var(--warning)' }}>{agents.filter(a => a.is_paused).length}</p>
        </div>
        <div className="kpi-card" style={{ borderTopColor: 'var(--danger)' }}>
          <p className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>Overloaded (â‰¥8)</p>
          <p className="text-2xl font-black" style={{ color: 'var(--danger)' }}>
            {agents.filter(a => getAgentTicketCount(a.id) >= 8).length}
          </p>
        </div>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredAgents.map(agent => (
          <AgentStatusCard
            key={agent.id}
            agent={agent}
            ticketCount={getAgentTicketCount(agent.id)}
            onClick={() => setSelectedAgent(agent)}
          />
        ))}
      </div>

      {/* Agent Detail Table */}
      <div className="card">
        <h3 className="text-base font-bold mb-6 flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
          <Users style={{ color: 'var(--primary)' }} size={18} /> Agent Details
        </h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Agent</th>
                <th>Type</th>
                <th>Status</th>
                <th>Tickets</th>
                <th>Resolved</th>
                <th>Login Time</th>
                <th>Contact</th>
              </tr>
            </thead>
            <tbody>
              {filteredAgents.map(agent => (
                <tr key={agent.id} className="cursor-pointer" onClick={() => setSelectedAgent(agent)}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
                        style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                        {(agent.name || 'U').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{agent.name}</p>
                        <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>@{agent.username}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="text-xs font-bold px-2 py-1 rounded-lg"
                      style={{
                        background: agent.agent_type === 'Contract Worker' ? 'rgba(139, 92, 246, 0.1)' : 'var(--primary-light)',
                        color: agent.agent_type === 'Contract Worker' ? '#8b5cf6' : 'var(--primary)',
                      }}>
                      {agent.agent_type}
                    </span>
                  </td>
                  <td>
                    <span className="flex items-center gap-1.5 text-xs font-bold"
                      style={{ color: agent.is_paused ? 'var(--warning)' : 'var(--success)' }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: agent.is_paused ? 'var(--warning)' : 'var(--success)' }} />
                      {agent.is_paused ? 'BREAK' : 'ACTIVE'}
                    </span>
                  </td>
                  <td>
                    <span className={`text-sm font-bold ${getAgentTicketCount(agent.id) >= 8 ? '' : ''}`}
                      style={{ color: getAgentTicketCount(agent.id) >= 8 ? 'var(--danger)' : 'var(--text-primary)' }}>
                      {getAgentTicketCount(agent.id)}/10
                    </span>
                  </td>
                  <td><span className="text-sm font-bold" style={{ color: 'var(--success)' }}>{agent.tickets_resolved}</span></td>
                  <td><span className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(agent.login_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></td>
                  <td><span className="text-xs" style={{ color: 'var(--text-muted)' }}>{agent.phone}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Agent Detail Modal */}
      <AnimatePresence>
      {selectedAgent && (
        <motion.div className="modal-overlay" onClick={() => setSelectedAgent(null)}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}
            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}>
            <div className="modal-header">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg"
                style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                {(selectedAgent.name || 'U').substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{selectedAgent.name}</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>@{selectedAgent.username} Â· {selectedAgent.agent_type}</p>
              </div>
              <button onClick={() => setSelectedAgent(null)} className="p-2" style={{ color: 'var(--text-muted)', background: 'transparent' }}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body space-y-4">
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Email', value: selectedAgent.email },
                  { label: 'Phone', value: selectedAgent.phone },
                  { label: 'Login Time', value: new Date(selectedAgent.login_time).toLocaleString() },
                  { label: 'Status', value: selectedAgent.is_paused ? 'On Break' : 'Active' },
                  { label: 'Active Tickets', value: `${getAgentTicketCount(selectedAgent.id)}/10` },
                  { label: 'Total Resolved', value: selectedAgent.tickets_resolved },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                    <p className="text-xs font-bold mb-1.5" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Break Status */}
              {selectedAgent.is_paused && (
                <div className="p-4 rounded-xl flex items-center gap-3" style={{ background: 'var(--priority-medium-bg)', border: '1px solid var(--priority-medium-border)' }}>
                  <Clock size={18} style={{ color: 'var(--warning)' }} />
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--warning)' }}>Currently On Break</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>New tickets won't be auto-assigned</p>
                  </div>
                </div>
              )}

              {/* Assigned Tickets */}
              {selectedAgentTickets.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Active Tickets ({selectedAgentTickets.length})</p>
                  <div className="space-y-2.5 max-h-[160px] overflow-y-auto">
                    {selectedAgentTickets.map(t => (
                      <div key={t.id} className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${t.priority === 1 ? 'badge-critical' : t.priority === 2 ? 'badge-medium' : 'badge-normal'}`}>P{t.priority}</span>
                          <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{t.ticket_id}</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>{t.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolved Tickets with Reports */}
              {selectedAgentResolved.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--success)' }}>
                    <Activity size={12} /> Resolved Tickets ({selectedAgentResolved.length})
                  </p>
                  <div className="space-y-2.5 max-h-[200px] overflow-y-auto">
                    {selectedAgentResolved.slice(-10).map(t => (
                      <div key={t.id} className="p-3 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)' }}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded badge-normal">P{t.priority}</span>
                            <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{t.ticket_id}</span>
                          </div>
                          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            {t.resolved_at ? new Date(t.resolved_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-secondary)' }}>{t.title}</p>
                        {t.report && (
                          <div className="mt-2 p-2 rounded-lg text-xs" style={{ background: 'var(--priority-normal-bg)', border: '1px solid var(--priority-normal-border)' }}>
                            <p style={{ color: 'var(--priority-normal)' }}><strong>Report:</strong> {t.report.remarks}</p>
                            {t.report.action_taken && (
                              <p className="mt-1" style={{ color: 'var(--priority-normal)' }}><strong>Action:</strong> {t.report.action_taken}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity Log */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                  <Activity size={12} /> Activity Log (10-min intervals)
                </p>
                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                  {activityLogs.map((log, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs py-1.5" style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <span className="font-mono text-[10px] w-16 shrink-0" style={{ color: 'var(--text-muted)' }}>
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span style={{ color: 'var(--text-primary)' }}>{log.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Add Agent Modal */}
      <AnimatePresence>
      {showAddModal && (
        <motion.div className="modal-overlay" onClick={() => setShowAddModal(false)}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="modal-content max-w-xl" onClick={e => e.stopPropagation()}
            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}>
            <div className="modal-header">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white" style={{ background: 'var(--primary)' }}>
                <UserPlus size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Add New Agent</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Register monitoring personnel</p>
              </div>
            </div>
            <form onSubmit={handleAddAgent}>
              <div className="modal-body space-y-4 light-form">
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input value={newAgent.name} onChange={e => setNewAgent({ ...newAgent, name: e.target.value })} required placeholder="John Doe" />
                  </div>
                  <div className="form-group">
                    <label>Username *</label>
                    <input value={newAgent.username} onChange={e => setNewAgent({ ...newAgent, username: e.target.value })} required placeholder="johndoe" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={newAgent.email} onChange={e => setNewAgent({ ...newAgent, email: e.target.value })} placeholder="john@example.com" />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input value={newAgent.phone} onChange={e => setNewAgent({ ...newAgent, phone: e.target.value })} placeholder="+91-98765-43210" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label>Password</label>
                    <input type="password" value={newAgent.password} onChange={e => setNewAgent({ ...newAgent, password: e.target.value })} placeholder="Min 8 characters" />
                  </div>
                  <div className="form-group">
                    <label>Agent Type</label>
                    <select value={newAgent.role} onChange={e => setNewAgent({ ...newAgent, role: e.target.value })}>
                      <option value="MONITORING_AGENT">Monitoring Agent</option>
                      <option value="CONTRACT_WORKER">Contract Worker</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 rounded-xl font-bold transition-all"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'transparent' }}>Cancel</button>
                <button type="submit" className="flex-1 py-3 rounded-xl font-bold text-white transition-all"
                  style={{ background: 'var(--primary)', boxShadow: '0 4px 16px var(--primary-glow)' }}>Register Agent</button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};

export default AgentManagement;
