# Real-Time Visitor Analytics System

A complete real-time visitor analytics system with tactical-style dashboard. Built with Bun + Express + TypeScript backend and React + TypeScript frontend.

## 🏗️ Architecture

```
├── backend/     # Bun + Express API + WebSocket Server
└── frontend/    # React + TypeScript Dashboard
```

## ✅ Features Implemented

### Backend
- ✅ REST API endpoints (`POST /api/events`, `GET /api/analytics/*`)
- ✅ Real-time WebSocket server with bidirectional communication
- ✅ Session tracking and visitor journey analytics
- ✅ In-memory data storage with automatic cleanup
- ✅ Postman collection for API testing

### Frontend  
- ✅ Tactical-style real-time dashboard
- ✅ Live visitor metrics and activity feed
- ✅ Interactive session tracking with journey visualization
- ✅ Country/page filtering with WebSocket communication
- ✅ Auto-reconnecting WebSocket connection management
- ✅ System alerts and status monitoring

### WebSocket Events
- ✅ **Server→Client**: `visitor_update`, `session_activity`, `user_connected/disconnected`, `alert`
- ✅ **Client→Server**: `request_detailed_stats`, `track_dashboard_action`

## 📖 Documentation

- **[Backend Documentation](./backend/README.md)** - API endpoints, WebSocket events, deployment
- **[Frontend Documentation](./frontend/README.md)** - Dashboard features, configuration, development

## 🧪 Testing

```bash
# Test backend API
cd backend && bun run start
# Import Postman collection from backend/docs/

# Test frontend  
cd frontend && npm run dev
```

## 🛠️ Tech Stack

- **Backend**: Bun, Express.js, TypeScript, WebSocket (ws)
- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite
- **Real-time**: WebSocket bidirectional communication
- **Validation**: Zod schemas with TypeScript integration 