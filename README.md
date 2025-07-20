# Real-Time Visitor Analytics Backend

A high-performance, real-time visitor analytics system built with **Bun**, **Express.js**, **TypeScript**, and **WebSocket**. This backend processes visitor events from websites and provides live analytics data through REST APIs and WebSocket connections.

## 🚀 Features

- **Real-time Event Processing**: Handles visitor pageview events with instant processing
- **Live Analytics Dashboard**: WebSocket-based real-time updates for dashboards
- **Session Tracking**: Tracks user journeys across pages with session management
- **Filtering & Analytics**: Advanced filtering by country, page, device, etc.
- **Memory Efficient**: In-memory storage with automatic cleanup and memory management
- **Graceful Shutdown**: Proper cleanup on server shutdown
- **TypeScript**: Full type safety with strict TypeScript configuration
- **Validation**: Robust input validation using Zod schemas
- **Error Handling**: Comprehensive error handling and logging

## 📊 System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Website       │───▶│  REST API        │───▶│  Analytics      │
│   (Events)      │    │  (Express.js)    │    │  Service        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
┌─────────────────┐    ┌──────────────────┐              │
│   Dashboard     │◄───│  WebSocket       │◄─────────────┘
│   (Real-time)   │    │  Server          │
└─────────────────┘    └──────────────────┘
```

## 🛠️ Tech Stack

- **Runtime**: Bun (JavaScript runtime)
- **Framework**: Express.js
- **Language**: TypeScript
- **WebSocket**: ws library
- **Validation**: Zod
- **CORS**: Built-in CORS support
- **Development**: Hot reload with `--watch`

## 📋 Prerequisites

- [Bun](https://bun.sh/) v1.0 or higher
- Node.js v18+ (for TypeScript support)

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone <repository-url>
cd real-time-visitor-analytics

# Install dependencies
bun install
```

### 2. Configuration

Create a `.env` file with your configuration:

```env
# Server Configuration
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# WebSocket Configuration
WEBSOCKET_PORT=8080

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Analytics Configuration
CLEANUP_INTERVAL_MINUTES=60
SESSION_TIMEOUT_MINUTES=30
ALERT_THRESHOLD=10
```

### 3. Start the Server

```bash
# Development mode (with hot reload)
bun run dev

# Production mode
bun run start
```

The server will start on:
- **HTTP API**: `http://localhost:3000`
- **WebSocket**: `ws://localhost:8080`

## 📖 API Documentation

### REST Endpoints

#### POST /api/events
Submit visitor events from your website.

**Request Body:**
```json
{
  "type": "pageview",
  "page": "/products",
  "session_id": "user-123",
  "timestamp": "2025-07-19T10:30:00Z",
  "country": "India",
  "metadata": {
    "device": "mobile",
    "referrer": "google.com"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Event processed successfully",
  "data": {
    "session_id": "user-123",
    "current_stats": {
      "total_active": 5,
      "total_today": 150,
      "pages_visited": { "/home": 45, "/products": 30 }
    }
  }
}
```

#### GET /api/analytics/summary
Get current analytics summary.

**Query Parameters:**
- `country` (optional): Filter by country
- `page` (optional): Filter by page

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_active": 5,
      "total_today": 150,
      "pages_visited": { "/home": 45, "/products": 30 }
    },
    "generated_at": "2025-07-19T10:30:00Z"
  }
}
```

#### GET /api/analytics/sessions
Get active sessions with journey information.

**Query Parameters:**
- `country` (optional): Filter by country
- `page` (optional): Filter by current page
- `limit` (optional): Limit number of results

**Response:**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "session_id": "user-123",
        "current_page": "/products",
        "journey": ["/home", "/products"],
        "duration": 45,
        "country": "India",
        "device": "mobile",
        "last_activity": "2025-07-19T10:30:00Z"
      }
    ],
    "total_count": 10
  }
}
```

#### GET /api/analytics/detailed
Get comprehensive analytics data.

#### GET /api/status
Get server and WebSocket status.

#### GET /health
Health check endpoint.

### WebSocket Events

#### Server → Client Events

**visitor_update**: New visitor event processed
```json
{
  "type": "visitor_update",
  "data": {
    "event": { /* visitor event */ },
    "stats": { /* updated statistics */ }
  }
}
```

**user_connected**: Dashboard client connected
```json
{
  "type": "user_connected",
  "data": {
    "total_dashboards": 3,
    "connected_at": "2025-07-19T10:30:00Z"
  }
}
```

**session_activity**: Session activity update
```json
{
  "type": "session_activity",
  "data": {
    "session_id": "user-123",
    "current_page": "/products",
    "journey": ["/home", "/products"],
    "duration": 45
  }
}
```

**alert**: System alerts
```json
{
  "type": "alert",
  "data": {
    "level": "info",
    "message": "High visitor activity detected!",
    "details": { "visitors_last_minute": 25 }
  }
}
```

#### Client → Server Events

**request_detailed_stats**: Request filtered analytics
```json
{
  "type": "request_detailed_stats",
  "filter": {
    "country": "India",
    "page": "/products"
  }
}
```

**track_dashboard_action**: Track dashboard user actions
```json
{
  "type": "track_dashboard_action",
  "action": "filter_applied",
  "details": {
    "filterType": "country",
    "value": "India"
  }
}
```

## 🔧 Development

### Project Structure

```
├── config/             # Configuration management
├── controllers/        # Request handlers
├── interfaces/         # TypeScript interfaces
├── middlewares/        # Express middleware
├── routes/            # API route definitions
├── schemas/           # Zod validation schemas
├── services/          # Core business logic
├── utils/             # Utility functions
├── index.ts           # Main server file
└── package.json       # Dependencies and scripts
```

### Scripts

```bash
bun run dev         # Start development server with hot reload
bun run start       # Start production server
bun run format      # Format code with Biome
bun run lint        # Lint code with Biome
```

---

**Built with ❤️ using Bun, TypeScript, and Express.js** 