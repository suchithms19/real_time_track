import express from "express";
import cors from "cors";

// Import our services and configurations
import { load_server_config, log_config } from "./config/server_config.js";
import { AnalyticsService } from "./services/analytics_service.js";
import { WebSocketService } from "./services/websocket_service.js";
import { AnalyticsController } from "./controllers/analytics_controller.js";
import { create_analytics_routes } from "./routes/analytics_routes.js";
import { CleanupManager } from "./utils/cleanup_manager.js";
import {
	request_logger,
	error_handler,
	not_found_handler,
	cors_middleware,
} from "./middlewares/error_middleware.js";

/**
 * Real-Time Visitor Analytics Server
 *
 * A comprehensive backend system that:
 * - Receives visitor events via REST API
 * - Processes and stores analytics data in memory
 * - Provides real-time updates via WebSocket
 * - Offers analytics summary and session tracking
 * - Manages graceful shutdown and data cleanup
 */

async function start_server(): Promise<void> {
	try {
		// Load and validate configuration
		console.log("🚀 Starting Real-Time Visitor Analytics Server...");
		const config = load_server_config();
		log_config(config);

		// Initialize core services
		console.log("⚙️  Initializing services...");

		// Create analytics service (core business logic)
		const analytics_service = new AnalyticsService();
		console.log("✅ Analytics service initialized");

		// Create WebSocket service (real-time communication)
		const websocket_service = new WebSocketService(
			analytics_service,
			config.websocket_port,
		);
		console.log("✅ WebSocket service initialized");

		// Create cleanup manager (memory management & graceful shutdown)
		const cleanup_manager = new CleanupManager(
			analytics_service,
			websocket_service,
			config,
		);
		console.log("✅ Cleanup manager initialized");

		// Create Express app
		const app = express();

		// Apply middleware
		console.log("🔧 Configuring middleware...");

		// CORS middleware (custom implementation)
		app.use(cors_middleware);

		// Built-in CORS middleware as fallback
		app.use(
			cors({
				origin: config.cors_origins,
				credentials: true,
			}),
		);

		// Body parsing middleware
		app.use(express.json({ limit: "10mb" }));
		app.use(express.urlencoded({ extended: true, limit: "10mb" }));

		// Request logging middleware
		app.use(request_logger);

		// Create analytics controller and routes
		const analytics_controller = new AnalyticsController(
			analytics_service,
			websocket_service,
		);
		const analytics_routes = create_analytics_routes(analytics_controller);

		// Mount API routes
		app.use("/api", analytics_routes);

		// Health check endpoint
		app.get("/health", (_req, res) => {
			res.json({
				status: "healthy",
				timestamp: new Date().toISOString(),
				uptime: process.uptime(),
				memory: process.memoryUsage(),
				version: "1.0.0",
			});
		});

		// Root endpoint with API information
		app.get("/", (_req, res) => {
			res.json({
				service: "Real-Time Visitor Analytics API",
				version: "1.0.0",
				status: "running",
				endpoints: {
					"POST /api/events": "Submit visitor events",
					"GET /api/analytics/summary": "Get analytics summary",
					"GET /api/analytics/sessions": "Get active sessions",
					"GET /api/analytics/detailed": "Get detailed analytics",
					"GET /api/status": "Get server status",
					"GET /health": "Health check",
				},
				websocket: {
					url: `ws://${config.host}:${config.websocket_port}`,
					description: "Real-time analytics updates",
				},
				documentation: "See README.md for API documentation",
			});
		});

		// 404 handler for unknown routes
		app.use(not_found_handler);

		// Global error handler (must be last)
		app.use(error_handler);

		// Start HTTP server
		const http_server = app.listen(config.port, config.host, () => {
			console.log(
				`🌐 HTTP Server running on http://${config.host}:${config.port}`,
			);
		});

		// Setup graceful shutdown
		cleanup_manager.setup_graceful_shutdown();

		// Start cleanup scheduler
		cleanup_manager.start_cleanup_scheduler();

		// Log system stats periodically (every 10 minutes)
		setInterval(
			() => {
				cleanup_manager.log_system_stats();
			},
			10 * 60 * 1000,
		);

		// Log initial stats after 5 seconds
		setTimeout(() => {
			cleanup_manager.log_system_stats();
		}, 5000);

		console.log("🎉 Server startup completed successfully!");
		console.log("📡 Ready to receive visitor events and serve analytics data");

		// Handle HTTP server errors
		http_server.on("error", (error: Error) => {
			console.error("💥 HTTP server error:", error);
		});
	} catch (error) {
		console.error("💥 Failed to start server:", error);
		process.exit(1);
	}
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
	console.error(
		"💥 Unhandled Promise Rejection at:",
		promise,
		"reason:",
		reason,
	);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
	console.error("💥 Uncaught Exception:", error);
	process.exit(1);
});

// Start the server
start_server().catch((error) => {
	console.error("💥 Server startup failed:", error);
	process.exit(1);
});
