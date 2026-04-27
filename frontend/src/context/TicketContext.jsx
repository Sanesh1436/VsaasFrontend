import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import api from '../api/axios';
import { showToast } from '../components/NotificationToast';
import { useAuth } from './AuthContext';
import useWebSocket from '../hooks/useWebSocket';

const TicketContext = createContext();

// ── NO mock data — everything from backend ──────────────

const POLL_INTERVAL = 15000; // 15 seconds

// Default empty analytics structure (used until backend responds)
const EMPTY_ANALYTICS = {
  total: 0,
  active: 0,
  resolved: 0,
  parked: 0,
  critical: 0,
  new: 0,
  total_month_alerts: 0,
  alerts_over_time: [],
  detection_counts: {},
  agent_performance: [],
  // These will come from backend if available, otherwise empty
  visitor_stats: {
    total_today: 0, unique_today: 0, repeat_today: 0,
    avg_stay_minutes: 0, peak_hour: 'N/A',
    hourly_data: [],
  },
  queue_stats: {
    current_queue_length: 0, avg_wait_time_mins: 0,
    max_wait_time_mins: 0, service_rate_per_hour: 0,
    total_served_today: 0, queues: [],
  },
  staff_stats: {
    total_staff: 0, present: 0, absent: 0,
    presence_pct: 0, seat_absences_today: 0,
    avg_seat_absence_mins: 0, shift_compliance: 0,
  },
  camera_health: {
    total: 0, active: 0, offline: 0, intermittent: 0,
    blackout_events_today: 0, avg_uptime_pct: 0, cameras: [],
  },
  face_recognition: {
    total_scans_today: 0, recognized: 0, unknown: 0,
    recognition_rate: 0, male: 0, female: 0, alerts_triggered: 0,
  },
};

export const TicketProvider = ({ children }) => {
  const [tickets, setTickets] = useState([]);
  const [agents, setAgents] = useState([]);
  const [alertTypes, setAlertTypes] = useState([]);
  const [autoAssign, setAutoAssign] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(EMPTY_ANALYTICS);
  const { user } = useAuth();
  const pollRef = useRef(null);
  const initialFetchDone = useRef(false);

  // ══════════════════════════════════════════════════════
  // API Fetchers
  // ══════════════════════════════════════════════════════

  const fetchTickets = useCallback(async () => {
    try {
      const res = await api.get('alerts/all/');
      if (Array.isArray(res.data)) {
        setTickets(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    }
  }, []);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await api.get('accounts/agents/');
      if (Array.isArray(res.data)) {
        setAgents(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch agents:', err);
    }
  }, []);

  const fetchAlertTypes = useCallback(async () => {
    try {
      const res = await api.get('tickets/alert-types/');
      if (Array.isArray(res.data)) {
        setAlertTypes(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch alert types:', err);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.get('settings/');
      if (Array.isArray(res.data)) {
        const autoSetting = res.data.find(s => s.key === 'auto_assign');
        if (autoSetting) setAutoAssign(autoSetting.value);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await api.get('analytics/summary/');
      if (res.data) {
        setAnalyticsData(prev => ({ ...prev, ...res.data }));
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  }, []);

  // ══════════════════════════════════════════════════════
  // WebSocket Handler
  // ══════════════════════════════════════════════════════

  const handleWebSocketMessage = useCallback((data) => {
    console.log('[TicketContext] WebSocket message:', data);
    
    // Refresh tickets for any relevant event
    if (['NEW_TICKET', 'TICKET_ASSIGNED', 'TICKET_UPDATE', 'TICKET_RESOLVED'].includes(data.type)) {
      fetchTickets();
      fetchAnalytics(); // Also refresh analytics
    }
  }, [fetchTickets, fetchAnalytics]);

  const { isConnected } = useWebSocket(user?.user_id, handleWebSocketMessage);

  // ── Initial data load + polling ─────────────────────────
  useEffect(() => {
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchTickets();
      fetchAgents();
      fetchAlertTypes();
      fetchSettings();
      fetchAnalytics();
    }

    // Poll for new tickets every 15 seconds
    pollRef.current = setInterval(() => {
      fetchTickets();
    }, POLL_INTERVAL);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchTickets, fetchAgents, fetchAlertTypes, fetchSettings, fetchAnalytics]);

  // ══════════════════════════════════════════════════════
  // Cooldown helpers (read from ticket.cooldown_until)
  // ══════════════════════════════════════════════════════

  const isCooldownActive = useCallback((cameraName, alertType) => {
    const matching = tickets.find(t =>
      t.camera_name === cameraName &&
      t.alert_type === alertType &&
      t.cooldown_until
    );
    if (matching && new Date(matching.cooldown_until) > new Date()) return true;
    return false;
  }, [tickets]);

  const getCooldownRemaining = useCallback((cameraName, alertType) => {
    const matching = tickets.find(t =>
      t.camera_name === cameraName &&
      t.alert_type === alertType &&
      t.cooldown_until
    );
    if (matching) {
      const remaining = (new Date(matching.cooldown_until) - new Date()) / 1000;
      return remaining > 0 ? Math.ceil(remaining) : 0;
    }
    return 0;
  }, [tickets]);

  // ══════════════════════════════════════════════════════
  // Auto-Assign Logic (find least loaded agent)
  // ══════════════════════════════════════════════════════

  const findLeastLoadedAgent = useCallback(() => {
    const monitoringAgents = agents.filter(a =>
      (a.frontend_role === 'MONITORING_AGENT' || a.role === 'MONITORING_AGENT' || a.role === 'AGENT') && !a.is_paused
    );
    if (monitoringAgents.length === 0) return null;

    let best = null;
    let bestCount = Infinity;
    for (const agent of monitoringAgents) {
      const count = tickets.filter(
        t => t.assigned_to === agent.id && !['RESOLVED'].includes(t.status)
      ).length;
      if (count < 10 && count < bestCount) {
        best = agent;
        bestCount = count;
      }
    }
    return best;
  }, [agents, tickets]);

  // ══════════════════════════════════════════════════════
  // Ticket Actions — All call real API
  // ══════════════════════════════════════════════════════

  const createTicket = useCallback(async (ticketData) => {
    try {
      const res = await api.post('tickets/create/', ticketData);
      if (res.data && !res.data.error) {
        await fetchTickets();
        showToast(`New alert: ${ticketData.title}`, ticketData.priority || 3);
        return { success: true, ticket: res.data };
      }
      return { error: res.data?.error || 'Failed to create ticket' };
    } catch (err) {
      return { error: err.response?.data?.error || 'Failed to create ticket' };
    }
  }, [fetchTickets]);

  const assignTicket = useCallback(async (ticketId, agentId) => {
    try {
      const res = await api.post(`tickets/${ticketId}/assign/`, { agent_id: agentId });
      if (res.data?.success) {
        await fetchTickets();
        showToast.success('Ticket assigned successfully');
        return { success: true };
      }
      return { error: res.data?.error || 'Assignment failed' };
    } catch (err) {
      const msg = err.response?.data?.error || 'Assignment failed';
      showToast.error(msg);
      return { error: msg };
    }
  }, [fetchTickets]);

  const attendTicket = useCallback(async (ticketId) => {
    try {
      const res = await api.post(`tickets/${ticketId}/attend/`);
      if (res.data?.success) {
        await fetchTickets();
        showToast.success('Ticket is now in progress');
        return { success: true };
      }
      return { error: res.data?.error || 'Failed to attend ticket' };
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to attend ticket';
      showToast.error(msg);
      return { error: msg };
    }
  }, [fetchTickets]);

  const parkTicket = useCallback(async (ticketId, reason) => {
    try {
      const res = await api.post(`tickets/${ticketId}/park/`, { reason });
      if (res.data?.success) {
        await fetchTickets();
        showToast.info('Ticket parked — awaiting action');
        return { success: true };
      }
      return { error: res.data?.error || 'Failed to park ticket' };
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to park ticket';
      showToast.error(msg);
      return { error: msg };
    }
  }, [fetchTickets]);

  const unparkTicket = useCallback(async (ticketId) => {
    try {
      const res = await api.post(`tickets/${ticketId}/unpark/`);
      if (res.data?.success) {
        await fetchTickets();
        showToast.success('Ticket unparked — resume work');
        return { success: true };
      }
      return { error: res.data?.error || 'Failed to unpark ticket' };
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to unpark ticket';
      showToast.error(msg);
      return { error: msg };
    }
  }, [fetchTickets]);

  const addRemark = useCallback(async (ticketId, text, author) => {
    try {
      const res = await api.post(`tickets/${ticketId}/remarks/`, { text, author });
      if (res.data?.success) {
        await fetchTickets();
        showToast.success('Remark added');
        return { success: true };
      }
      return { error: res.data?.error || 'Failed to add remark' };
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to add remark';
      showToast.error(msg);
      return { error: msg };
    }
  }, [fetchTickets]);

  const resolveTicket = useCallback(async (ticketId, report) => {
    if (!report.remarks || !report.remarks.trim()) {
      showToast.error('Report is mandatory before resolving');
      return { error: 'Report is mandatory before resolving' };
    }
    try {
      const res = await api.post(`tickets/${ticketId}/resolve/`, {
        remarks: report.remarks,
        action_taken: report.action_taken || '',
      });
      if (res.data?.success) {
        await fetchTickets();
        showToast.success('Ticket resolved successfully');
        return { success: true };
      }
      return { error: res.data?.error || 'Failed to resolve ticket' };
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to resolve ticket';
      showToast.error(msg);
      return { error: msg };
    }
  }, [fetchTickets]);

  const requestReassignment = useCallback(async (ticketId, reason) => {
    try {
      const res = await api.post(`tickets/${ticketId}/request_reassignment/`, { reason });
      if (res.data?.success) {
        await fetchTickets();
        showToast.info('Reassignment request sent to Team Lead');
        return { success: true };
      }
      return { error: res.data?.error || 'Failed to request reassignment' };
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed';
      showToast.error(msg);
      return { error: msg };
    }
  }, [fetchTickets]);

  const handleReassignment = useCallback(async (ticketId, action) => {
    try {
      const res = await api.post(`tickets/${ticketId}/handle_reassignment/`, { action });
      if (res.data?.success) {
        await fetchTickets();
        showToast.success(`Reassignment ${action === 'accept' ? 'accepted' : 'declined'}`);
        return { success: true };
      }
      return { error: res.data?.error || 'Failed' };
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed';
      showToast.error(msg);
      return { error: msg };
    }
  }, [fetchTickets]);

  const updateTicketField = useCallback(async (ticketId, field, value) => {
    // For simple field updates, use the legacy status endpoint or update locally
    setTickets(prev => prev.map(t =>
      t.id === ticketId ? { ...t, [field]: value } : t
    ));
    return { success: true };
  }, []);

  // ── Agent Actions ─────────────────────────────────────────

  const toggleAgentPause = useCallback(async (agentId) => {
    try {
      const res = await api.post('accounts/toggle-pause/');
      await fetchAgents();
      showToast.info(res.data?.message || 'Break status updated');
    } catch (err) {
      console.error('Failed to toggle pause:', err);
      showToast.error('Failed to update break status');
      // Optimistic update fallback
      setAgents(prev => prev.map(a =>
        a.id === agentId ? { ...a, is_paused: !a.is_paused } : a
      ));
    }
  }, [fetchAgents]);

  const addAgent = useCallback(async (agentData) => {
    try {
      const res = await api.post('accounts/register/', {
        username: agentData.username,
        name: agentData.name,
        email: agentData.email || '',
        phone: agentData.phone || '',
        password: agentData.password || 'Agent@12345',
        role: agentData.role || 'MONITORING_AGENT',
      });
      if (res.data) {
        await fetchAgents();
        showToast.success(`Agent "${agentData.name}" registered successfully`);
        return { success: true, agent: res.data };
      }
      return { error: 'Failed to add agent' };
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.username?.[0] || 'Failed to add agent';
      showToast.error(msg);
      return { error: msg };
    }
  }, [fetchAgents]);

  // ── Auto-assign all unassigned ──────────────────────────
  const autoAssignAll = useCallback(async () => {
    try {
      const res = await api.post('auto-assign/');
      await fetchTickets();
      const count = res.data?.assigned || 0;
      showToast.success(`Auto-assigned ${count} ticket(s)`);
      return { success: true, assigned: count };
    } catch (err) {
      const msg = err.response?.data?.error || 'Auto-assign failed';
      showToast.error(msg);
      return { error: msg };
    }
  }, [fetchTickets]);

  // ── Toggle auto-assign setting ──────────────────────────
  const toggleAutoAssign = useCallback(async (value) => {
    try {
      await api.post('settings/toggle_auto_assign/', { value });
      setAutoAssign(value);
      showToast.info(`Auto-assignment ${value ? 'enabled' : 'disabled'}`);
    } catch (err) {
      console.error('Failed to toggle auto-assign:', err);
      showToast.error('Failed to update auto-assign setting');
    }
  }, []);

  // ── Activity logs (generated from ticket history) ──────────
  const generateActivityLogs = useCallback((agentId) => {
    // Build activity logs from real ticket data
    const agentTickets = tickets.filter(t => t.assigned_to === agentId);
    const logs = [];

    agentTickets.forEach(ticket => {
      if (ticket.created_at) {
        logs.push({
          id: `${ticket.id}-created`,
          agent_id: agentId,
          action: `Ticket ${ticket.ticket_id} assigned`,
          timestamp: ticket.assigned_at || ticket.created_at,
        });
      }
      if (ticket.status === 'IN_PROGRESS' && ticket.attended_at) {
        logs.push({
          id: `${ticket.id}-attended`,
          agent_id: agentId,
          action: `Ticket ${ticket.ticket_id} attended`,
          timestamp: ticket.attended_at,
        });
      }
      if (ticket.status === 'RESOLVED' && ticket.resolved_at) {
        logs.push({
          id: `${ticket.id}-resolved`,
          agent_id: agentId,
          action: `Ticket ${ticket.ticket_id} resolved`,
          timestamp: ticket.resolved_at,
        });
      }
      if (ticket.status === 'PARKED') {
        logs.push({
          id: `${ticket.id}-parked`,
          agent_id: agentId,
          action: `Ticket ${ticket.ticket_id} parked`,
          timestamp: ticket.updated_at || ticket.created_at,
        });
      }
      // Add remarks as activity entries
      if (Array.isArray(ticket.remarks)) {
        ticket.remarks.forEach((r, idx) => {
          logs.push({
            id: `${ticket.id}-remark-${idx}`,
            agent_id: agentId,
            action: `Remark on ${ticket.ticket_id}: "${(r.text || '').substring(0, 50)}"`,
            timestamp: r.time || r.timestamp || ticket.created_at,
          });
        });
      }
    });

    // Sort ascending and limit to 20
    return logs
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .slice(-20);
  }, [tickets]);

  // ── Computed Stats ──────────────────────────────────────
  const getStats = useCallback(() => {
    const total = tickets.length;
    const active = tickets.filter(t => !['RESOLVED', 'PARKED'].includes(t.status)).length;
    const parked = tickets.filter(t => t.status === 'PARKED').length;
    const critical = tickets.filter(t => t.priority === 1 && t.status !== 'RESOLVED').length;
    const resolved = tickets.filter(t => t.status === 'RESOLVED').length;
    const newCount = tickets.filter(t => t.status === 'NEW').length;
    const totalMonth = analyticsData.total_month_alerts || 0;
    return { total, active, parked, critical, resolved_today: resolved, new: newCount, total_month_alerts: totalMonth };
  }, [tickets, analyticsData]);

  const getAgentTickets = useCallback((agentId) => {
    return tickets
      .filter(t => t.assigned_to === agentId && t.status !== 'RESOLVED')
      .sort((a, b) => a.priority - b.priority);
  }, [tickets]);

  const getAgentTicketCount = useCallback((agentId) => {
    return tickets.filter(t => t.assigned_to === agentId && !['RESOLVED'].includes(t.status)).length;
  }, [tickets]);

  const getMyResolvedCount = useCallback((agentId) => {
    return tickets.filter(t => t.assigned_to === agentId && t.status === 'RESOLVED').length;
  }, [tickets]);

  const getPendingTicketCount = useCallback((agentId) => {
    return tickets.filter(t => t.assigned_to === agentId && !['RESOLVED'].includes(t.status)).length;
  }, [tickets]);

  // ══════════════════════════════════════════════════════
  // Context Value
  // ══════════════════════════════════════════════════════

  const value = {
    tickets, agents, alertTypes, autoAssign,
    setAutoAssign: toggleAutoAssign,
    createTicket, assignTicket, attendTicket, parkTicket, unparkTicket,
    addRemark, resolveTicket, requestReassignment, handleReassignment,
    updateTicketField,
    toggleAgentPause, addAgent, autoAssignAll,
    getStats, getAgentTickets, getAgentTicketCount, getMyResolvedCount, getPendingTicketCount,
    isCooldownActive, getCooldownRemaining,
    analyticsData,
    generateActivityLogs,
    findLeastLoadedAgent,
    // Expose fetchers for manual refresh
    fetchTickets, fetchAgents, fetchAnalytics, fetchAlertTypes,
  };

  return (
    <TicketContext.Provider value={value}>
      {children}
    </TicketContext.Provider>
  );
};

export const useTickets = () => {
  const context = useContext(TicketContext);
  if (!context) throw new Error('useTickets must be used within TicketProvider');
  return context;
};
