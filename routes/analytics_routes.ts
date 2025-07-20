import { Router } from "express";
import { AnalyticsController } from "../controllers/analytics_controller.js";

/**
 * Creates and configures analytics routes
 * @param analytics_controller - The analytics controller instance
 * @returns Configured Express router
 */
export function create_analytics_routes(analytics_controller: AnalyticsController): Router {
	const router = Router();

	// POST /api/events - Receive visitor events from websites
	router.post("/events", (req, res) => {
		analytics_controller.receive_visitor_event(req, res);
	});

	// GET /api/analytics/summary - Get current analytics summary
	router.get("/analytics/summary", (req, res) => {
		analytics_controller.get_analytics_summary(req, res);
	});

	// GET /api/analytics/sessions - Get active sessions with journey information
	router.get("/analytics/sessions", (req, res) => {
		analytics_controller.get_active_sessions(req, res);
	});

	// GET /api/analytics/detailed - Get comprehensive analytics data
	router.get("/analytics/detailed", (req, res) => {
		analytics_controller.get_detailed_analytics(req, res);
	});

	// GET /api/status - Get server and WebSocket status
	router.get("/status", (req, res) => {
		analytics_controller.get_server_status(req, res);
	});

	return router;
} 