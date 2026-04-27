import { useState, useEffect, useCallback, useRef } from 'react';
import { showToast } from '../components/NotificationToast';

/**
 * WebSocket hook for real-time ticket notifications.
 * Authenticates via JWT token in query string.
 * Auto-reconnects with exponential backoff.
 */
const useWebSocket = (userId, onMessage) => {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT = 5;

  const connect = useCallback(() => {
    if (!userId) return;

    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (!token) return;

    // Close existing connection
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }

    try {
      // Use relative path — Vite proxy handles /ws → ws://localhost:8000
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws/notifications/?token=${token}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        console.log('[WS] Connected to WatchTower notifications');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Show toast for important events
          if (data.type === 'TICKET_ASSIGNED') {
            showToast(`New ticket assigned: ${data.title || data.ticket_id}`, data.priority || 2);
          } else if (data.type === 'NEW_TICKET') {
            showToast(`New alert: ${data.title || data.ticket_id}`, data.priority || 2);
          } else if (data.type === 'TICKET_PARKED') {
            showToast(`Ticket ${data.ticket_id} parked by ${data.agent}`, 2);
          } else if (data.type === 'TICKET_RESOLVED') {
            showToast(`Ticket ${data.ticket_id} resolved by ${data.agent}`, 3);
          } else if (data.type === 'REASSIGNMENT_REQUEST') {
            showToast(`Reassignment request: ${data.ticket_id} from ${data.agent}`, 1);
          }

          onMessage?.(data);
        } catch (e) {
          console.error('[WS] Failed to parse message', e);
        }
      };

      ws.onclose = (event) => {
        setIsConnected(false);

        // Don't reconnect on intentional close (4001 = unauthorized)
        if (event.code === 4001) {
          console.warn('[WS] Unauthorized — not reconnecting');
          return;
        }

        // Try reconnecting with exponential backoff
        if (reconnectAttemptsRef.current < MAX_RECONNECT) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`[WS] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch (e) {
      console.error('[WS] Connection error', e);
    }
  }, [userId, onMessage]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [connect]);

  // Send a message over WebSocket
  const sendMessage = useCallback((data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { isConnected, sendMessage };
};

export default useWebSocket;
