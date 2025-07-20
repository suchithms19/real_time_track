export interface VisitorEvent {
  type: "pageview";
  page: string;
  session_id: string;
  timestamp: string;
  country: string;
  metadata: {
    device: string;
    referrer: string;
  };
}

export interface AnalyticsSummary {
  total_active: number;
  total_today: number;
  pages_visited: Record<string, number>;
}

export interface SessionData {
  session_id: string;
  current_page: string;
  journey: string[];
  duration: number;
  country: string;
  device: string;
  last_activity: string;
}

export interface WebSocketMessage {
  type: string;
  data?: any;
  filter?: any;
  action?: string;
  details?: any;
}

// WebSocket Events
export interface VisitorUpdateEvent {
  type: "visitor_update";
  data: {
    event: VisitorEvent;
    stats: AnalyticsSummary;
  };
}

export interface UserConnectedEvent {
  type: "user_connected";
  data: {
    total_dashboards: number;
    connected_at: string;
  };
}

export interface UserDisconnectedEvent {
  type: "user_disconnected";
  data: {
    total_dashboards: number;
  };
}

export interface SessionActivityEvent {
  type: "session_activity";
  data: SessionData;
}

export interface AlertEvent {
  type: "alert";
  data: {
    level: "info" | "warning" | "error";
    message: string;
    details: Record<string, any>;
  };
}

export type ConnectionStatus = "connected" | "connecting" | "reconnecting" | "disconnected";

export interface DashboardState {
  connectionStatus: ConnectionStatus;
  analytics: AnalyticsSummary;
  activeSessions: SessionData[];
  recentEvents: VisitorEvent[];
  totalDashboards: number;
  alerts: AlertEvent["data"][];
}

export interface FilterState {
  country?: string;
  page?: string;
} 