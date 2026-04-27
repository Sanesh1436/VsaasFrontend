import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { ShieldPlus, UserPlus, Trash2, Save, MoreHorizontal } from 'lucide-react';
import { showToast } from '../../components/NotificationToast';

const Settings = () => {
    const [alertTypes, setAlertTypes] = useState([]);
    const [newAlert, setNewAlert] = useState({ name: '', default_priority: 3 });
    const [agents, setAgents] = useState([]);
    const [showAgentModal, setShowAgentModal] = useState(false);
    const [newAgent, setNewAgent] = useState({ username: '', password: '', role: 'MONITORING_AGENT', name: '', phone: '' });

    const fetchData = async () => {
        try {
            const [typesRes, agentsRes] = await Promise.all([
                api.get('tickets/alert-types/'),
                api.get('accounts/agents/')
            ]);
            setAlertTypes(typesRes.data);
            setAgents(agentsRes.data);
        } catch (err) {
            console.error('Settings sync failed');
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleAddAlert = async () => {
        if (!newAlert.name) return;
        try {
            await api.post('tickets/alert-types/', newAlert);
            setNewAlert({ name: '', default_priority: 3 });
            fetchData();
            showToast.success('Alert type added');
        } catch (err) {
            showToast.error('Failed to add alert type');
        }
    };

    const handleDeleteAlert = async (id) => {
        try {
            await api.delete(`tickets/alert-types/${id}/`);
            fetchData();
            showToast.success('Alert type deleted');
        } catch (err) {
            showToast.error('Deletion restricted');
        }
    };

    const handleRegisterAgent = async (e) => {
        e.preventDefault();
        try {
            await api.post('accounts/register/', newAgent);
            setShowAgentModal(false);
            setNewAgent({ username: '', password: '', role: 'MONITORING_AGENT', name: '', phone: '' });
            fetchData();
            showToast.success('Agent registered successfully');
        } catch (err) {
            showToast.error('Agent registration failed');
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Alert Configuration */}
            <div className="card">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <ShieldPlus style={{ color: 'var(--primary)' }} size={24} /> Alert Intelligence
                    </h3>
                </div>

                <div className="p-6 rounded-2xl mb-8" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    <p className="text-sm mb-6 uppercase tracking-widest font-bold" style={{ color: 'var(--text-muted)' }}>New Alert Definition</p>
                    <div className="flex flex-col gap-4">
                        <div className="form-group light-form">
                            <label>Internal Name</label>
                            <input
                                placeholder="e.g. Unauthorized Intrusion"
                                value={newAlert.name}
                                onChange={(e) => setNewAlert({ ...newAlert, name: e.target.value })}
                            />
                        </div>
                        <div className="form-group light-form">
                            <label>Standard Priority Rating</label>
                            <select
                                value={newAlert.default_priority}
                                onChange={(e) => setNewAlert({ ...newAlert, default_priority: parseInt(e.target.value) })}
                            >
                                <option value={1}>Priority 1 (Immediate Escalation)</option>
                                <option value={2}>Priority 2 (High Attention)</option>
                                <option value={3}>Priority 3 (Standard Monitoring)</option>
                            </select>
                        </div>
                        <button onClick={handleAddAlert} className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white transition-all"
                            style={{ background: 'var(--primary)' }}>
                            <Save size={18} /> Initialize Alert Type
                        </button>
                    </div>
                </div>

                <div className="space-y-3">
                    {alertTypes.map(type => (
                        <div key={type.id} className="flex items-center justify-between p-4 rounded-xl group transition-all"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
                            <div>
                                <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{type.name}</p>
                                <p className="text-[10px] font-black tracking-tighter"
                                    style={{ color: type.default_priority === 1 ? 'var(--priority-critical)' : type.default_priority === 2 ? 'var(--priority-medium)' : 'var(--primary)' }}>
                                    P{type.default_priority} DEFAULT
                                </p>
                            </div>
                            <button onClick={() => handleDeleteAlert(type.id)}
                                className="p-2 transition-colors opacity-0 group-hover:opacity-100"
                                style={{ color: 'var(--text-muted)', background: 'transparent' }}>
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Agent Management */}
            <div className="card">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <UserPlus style={{ color: 'var(--primary)' }} size={24} /> Workforce Logistics
                    </h3>
                </div>

                <div className="p-6 rounded-2xl mb-8" style={{ background: 'var(--primary-light)', border: '1px solid var(--border)' }}>
                    <p className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Onboard New Personnel</p>
                    <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>Register monitoring agents or contract workers and assign them to your tactical team.</p>
                    <button onClick={() => setShowAgentModal(true)}
                        className="w-full text-white font-black py-3 rounded-xl transition-colors"
                        style={{ background: 'var(--primary)', boxShadow: '0 4px 16px var(--primary-glow)' }}>
                        Open Enrollment Form
                    </button>
                </div>

                <div className="space-y-4">
                    <p className="text-xs uppercase tracking-widest font-black" style={{ color: 'var(--text-muted)' }}>Currently Active Workforce</p>
                    {agents.map(agent => (
                        <div key={agent.id} className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center font-black"
                                style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid var(--border)' }}>
                                {agent.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{agent.name || agent.username}</p>
                                <p className="text-[10px] font-mono tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>{agent.role}</p>
                            </div>
                            <button style={{ color: 'var(--text-muted)', background: 'transparent' }}><MoreHorizontal size={18} /></button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Agent Modal */}
            {showAgentModal && (
                <div className="modal-overlay">
                    <div className="modal-content max-w-xl" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white" style={{ background: 'var(--primary)' }}>
                                <UserPlus size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Personnel Registration</h3>
                                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Issue new monitoring credentials</p>
                            </div>
                        </div>

                        <form onSubmit={handleRegisterAgent}>
                            <div className="modal-body space-y-5 light-form">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label>Operational Username</label>
                                        <input value={newAgent.username} onChange={(e) => setNewAgent({ ...newAgent, username: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Access Password</label>
                                        <input type="password" value={newAgent.password} onChange={(e) => setNewAgent({ ...newAgent, password: e.target.value })} required />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Full Legal Name</label>
                                    <input value={newAgent.name} onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })} required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label>Role Classification</label>
                                        <select value={newAgent.role} onChange={(e) => setNewAgent({ ...newAgent, role: e.target.value })}>
                                            <option value="MONITORING_AGENT">Monitoring Agent</option>
                                            <option value="CONTRACT_WORKER">Contract Worker</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Contact Link (Phone)</label>
                                        <input value={newAgent.phone} onChange={(e) => setNewAgent({ ...newAgent, phone: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowAgentModal(false)}
                                    className="flex-1 py-3 rounded-xl font-bold transition-all"
                                    style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'transparent' }}>
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 py-3 rounded-xl font-black text-white transition-all"
                                    style={{ background: 'var(--primary)', boxShadow: '0 4px 16px var(--primary-glow)' }}>
                                    Enable Credentials
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
