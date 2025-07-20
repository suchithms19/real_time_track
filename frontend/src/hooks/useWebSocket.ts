import { useEffect, useRef, useState, useCallback } from 'react';
import type {
  DashboardState,
  ConnectionStatus,
  SessionData,
  FilterState,
} from '../types/analytics';
import { useNotificationSound } from './useNotificationSound';

const WS_URL = 'ws://localhost:8080';
const RECONNECT_INTERVAL = 3000;
const MAX_RECONNECT_ATTEMPTS = 10;

export const useWebSocket = () => {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | undefined>(undefined);
  const reconnectAttempts = useRef(0);
  const [isManualDisconnect, setIsManualDisconnect] = useState(false);

  // Sound notification hook
  const {
    sound_state,
    play_notification,
    play_double_beep,
    toggle_sound,
    set_volume,
    cleanup: cleanup_sound,
  } = useNotificationSound();

  const [dashboardState, setDashboardState] = useState<DashboardState>({
    connectionStatus: 'disconnected',
    analytics: {
      total_active: 0,
      total_today: 0,
      pages_visited: {},
    },
    activeSessions: [],
    recentEvents: [],
    totalDashboards: 0,
    alerts: [],
  });

  // Visual notification state
  const [is_new_visitor_flash, setIsNewVisitorFlash] = useState(false);

  const updateConnectionStatus = useCallback((status: ConnectionStatus) => {
    setDashboardState(prev => ({
      ...prev,
      connectionStatus: status,
    }));
  }, []);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'visitor_update':
          setDashboardState(prev => ({
            ...prev,
            analytics: message.data.stats,
            recentEvents: [message.data.event, ...prev.recentEvents].slice(0, 50),
          }));
          // Play notification sound for new visitor
          play_notification();
          // Trigger visual flash
          setIsNewVisitorFlash(true);
          setTimeout(() => setIsNewVisitorFlash(false), 1000);
          break;

        case 'session_activity':
          setDashboardState(prev => ({
            ...prev,
            activeSessions: updateSessionInList(prev.activeSessions, message.data),
          }));
          break;

        case 'user_connected':
        case 'user_disconnected':
          setDashboardState(prev => ({
            ...prev,
            totalDashboards: message.data.total_dashboards,
          }));
          break;

        case 'alert':
          setDashboardState(prev => ({
            ...prev,
            alerts: [message.data, ...prev.alerts].slice(0, 10),
          }));
          // Play double beep for alerts
          if (message.data.level === 'warning' || message.data.level === 'error') {
            play_double_beep();
          }
          break;

        case 'detailed_stats_response':
          setDashboardState(prev => ({
            ...prev,
            analytics: message.data.summary,
            activeSessions: message.data.sessions || [],
            recentEvents: message.data.recent_events || [],
          }));
          break;

        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }, []);

  const updateSessionInList = (sessions: SessionData[], newSession: SessionData): SessionData[] => {
    const existingIndex = sessions.findIndex(s => s.session_id === newSession.session_id);
    
    if (existingIndex >= 0) {
      const updatedSessions = [...sessions];
      updatedSessions[existingIndex] = newSession;
      return updatedSessions;
    } else {
      return [newSession, ...sessions].slice(0, 20); // Keep latest 20 sessions
    }
  };

  const sendMessage = useCallback((message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message:', message);
    }
  }, []);

  const requestDetailedStats = useCallback((filter?: FilterState) => {
    sendMessage({
      type: 'request_detailed_stats',
      filter,
    });
  }, [sendMessage]);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      return;
    }

    updateConnectionStatus('connecting');

    try {
      ws.current = new WebSocket(WS_URL);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        updateConnectionStatus('connected');
        reconnectAttempts.current = 0;
        
        // Request initial stats
        requestDetailedStats();
      };

      ws.current.onmessage = handleMessage;

      ws.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        updateConnectionStatus('disconnected');
        
        // Auto-reconnect if not manually disconnected
        if (!isManualDisconnect && reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          updateConnectionStatus('reconnecting');
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, RECONNECT_INTERVAL);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        updateConnectionStatus('disconnected');
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      updateConnectionStatus('disconnected');
    }
  }, [handleMessage, isManualDisconnect, updateConnectionStatus, requestDetailedStats]);

  const disconnect = useCallback(() => {
    setIsManualDisconnect(true);
    
    if (reconnectTimeoutRef.current !== undefined) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    
    updateConnectionStatus('disconnected');
  }, [updateConnectionStatus]);

  const reconnect = useCallback(() => {
    setIsManualDisconnect(false);
    reconnectAttempts.current = 0;
    disconnect();
    setTimeout(connect, 100);
  }, [connect, disconnect]);

  const trackDashboardAction = useCallback((action: string, details: Record<string, any>) => {
    sendMessage({
      type: 'track_dashboard_action',
      action,
      details,
    });
  }, [sendMessage]);

  const clearAlerts = useCallback(() => {
    setDashboardState(prev => ({
      ...prev,
      alerts: [],
    }));
  }, []);

  const clearEvents = useCallback(() => {
    setDashboardState(prev => ({
      ...prev,
      recentEvents: [],
    }));
    trackDashboardAction('clear_events', {});
  }, [trackDashboardAction]);

  const clearSessions = useCallback(() => {
    setDashboardState(prev => ({
      ...prev,
      activeSessions: [],
    }));
    trackDashboardAction('clear_sessions', {});
  }, [trackDashboardAction]);

  // Auto-connect on mount
  useEffect(() => {
    setIsManualDisconnect(false);
    connect();

    return () => {
      setIsManualDisconnect(true);
      if (reconnectTimeoutRef.current !== undefined) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ws.current) {
        ws.current.close();
      }
      cleanup_sound();
    };
  }, []);

  return {
    dashboardState,
    connect,
    disconnect,
    reconnect,
    requestDetailedStats,
    trackDashboardAction,
    clearAlerts,
    clearEvents,
    clearSessions,
    // Sound notification controls
    sound_state,
    toggle_sound,
    set_volume,
    // Visual notification state
    is_new_visitor_flash,
  };
}; 