# Real-Time Visitor Analytics Dashboard

A modern, tactical-style dashboard for monitoring website visitor analytics in real-time. Built with React, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Real-time Updates**: Live WebSocket connection to backend for instant data updates
- **Tactical UI Design**: Military/tactical-inspired dark theme with orange accents
- **Interactive Session Tracking**: Click on sessions to view visitor journeys
- **Advanced Filtering**: Filter data by country and page
- **Live Activity Feed**: Real-time visitor event stream
- **Alert System**: System notifications and alerts
- **Connection Management**: Auto-reconnect with connection status indicators

## 🛠️ Tech Stack

- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **WebSocket** for real-time communication
- **Vite** for development and building

## 📋 Prerequisites

- Node.js 18+ or Bun
- Backend server running on `http://localhost:3000`
- WebSocket server running on `ws://localhost:8080`

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Using npm
npm install

# Using bun
bun install
```

### 2. Start Development Server

```bash
# Using npm
npm run dev

# Using bun
bun run dev
```

The dashboard will be available at `http://localhost:5173`

### 3. Build for Production

```bash
# Using npm
npm run build

# Using bun
bun run build
```

## 🎯 Dashboard Features

### Real-Time Metrics
- **Active Visitors**: Current live sessions
- **Total Today**: Total visits for the day
- **Pages Tracked**: Number of unique pages
- **Active Alerts**: Current system alerts

### Activity Log
- Live feed of visitor events
- Country and device indicators
- Timestamp and referrer information
- Scrollable history with clear functionality

### Active Sessions
- Click to expand and view visitor journeys
- Session duration and last activity
- Country and device information
- Real-time session updates

### Filtering System
- Filter by country or page
- Visual filter indicators
- Real-time filter application
- Clear filters functionality

### System Monitoring
- WebSocket connection status
- Auto-reconnect functionality
- Dashboard count display
- System information panel

## 🔧 Configuration

### WebSocket Connection

The dashboard connects to the backend WebSocket server at `ws://localhost:8080`. To change this:

1. Edit `frontend/src/hooks/useWebSocket.ts`
2. Update the `WS_URL` constant:

```typescript
const WS_URL = 'ws://your-backend-host:8080';
```

## 📊 Real-Time Features

### WebSocket Events Handled
- `visitor_update`: New visitor events
- `session_activity`: Session changes
- `user_connected/disconnected`: Dashboard connections
- `alert`: System alerts

### Interactive Features
- Filter events by country/page
- Click sessions to view journeys
- Clear data and alerts
- Manual reconnection
- Real-time status updates

## 🔍 Development

### Project Structure
```
src/
├── components/          # React components
│   ├── Dashboard.tsx    # Main dashboard layout
│   ├── StatusIndicator.tsx
│   ├── MetricsCard.tsx
│   ├── ActivityLog.tsx
│   ├── ActiveSessions.tsx
│   ├── FilterControls.tsx
│   └── AlertsPanel.tsx
├── hooks/              # Custom React hooks
│   └── useWebSocket.ts # WebSocket management
├── types/              # TypeScript type definitions
│   └── analytics.ts
└── App.tsx            # Main app component
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
---
