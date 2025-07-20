import type { Request, Response } from "express";
import { VisitorEventSchema, AnalyticsQuerySchema } from "../schemas/validation.js";
import { AnalyticsService } from "../services/analytics_service.js";
import { WebSocketService } from "../services/websocket_service.js";

/**
 * Controller for handling analytics REST API endpoints
 * Processes visitor events and provides analytics data
 */
export class AnalyticsController {
	constructor(
		private analytics_service: AnalyticsService,
		private websocket_service: WebSocketService,
	) {}

	/**
	 * POST /api/events
	 * Receives and processes visitor events from websites
	 */
	public async receive_visitor_event(req: Request, res: Response): Promise<void> {
		try {
			// Validate the incoming event data
			const validation_result = VisitorEventSchema.safeParse(req.body);
			
			if (!validation_result.success) {
				res.status(400).json({
					error: "Invalid event data",
					details: validation_result.error.issues,
				});
				return;
			}

			const visitor_event = validation_result.data;
			
			// Process the event through analytics service
			const { session, summary } = this.analytics_service.process_visitor_event(visitor_event);

			// Broadcast the update to all connected WebSocket clients
			this.websocket_service.broadcast_visitor_update(visitor_event, summary);
			this.websocket_service.broadcast_session_activity(session);

			// Check for alerts and broadcast if any
			const alert = this.analytics_service.check_for_alerts();
			if (alert) {
				this.websocket_service.broadcast_alert(alert.level, alert.message, alert.details);
			}

			// Send successful response
			res.status(201).json({
				success: true,
				message: "Event processed successfully",
				data: {
					session_id: session.session_id,
					current_stats: summary,
				},
			});

		} catch (error) {
			console.error("Error processing visitor event:", error);
			res.status(500).json({
				error: "Internal server error",
				message: "Failed to process visitor event",
			});
		}
	}

	/**
	 * GET /api/analytics/summary
	 * Returns current analytics summary statistics
	 */
	public async get_analytics_summary(req: Request, res: Response): Promise<void> {
		try {
			// Validate query parameters
			const query_validation = AnalyticsQuerySchema.safeParse(req.query);
			
			if (!query_validation.success) {
				res.status(400).json({
					error: "Invalid query parameters",
					details: query_validation.error.issues,
				});
				return;
			}

			const query_params = query_validation.data;
			
			// Generate current summary
			const summary = this.analytics_service.generate_summary();

			// Get filtered detailed stats if filters are provided
			const filter = {
				country: query_params.country,
				page: query_params.page,
			};

			const has_filters = filter.country || filter.page;
			const detailed_stats = has_filters 
				? this.analytics_service.get_detailed_stats(filter)
				: undefined;

			res.json({
				success: true,
				data: {
					summary,
					...(detailed_stats && { filtered_data: detailed_stats }),
					generated_at: new Date().toISOString(),
				},
			});

		} catch (error) {
			console.error("Error getting analytics summary:", error);
			res.status(500).json({
				error: "Internal server error",
				message: "Failed to retrieve analytics summary",
			});
		}
	}

	/**
	 * GET /api/analytics/sessions
	 * Returns active sessions with their journey information
	 */
	public async get_active_sessions(req: Request, res: Response): Promise<void> {
		try {
			// Validate query parameters
			const query_validation = AnalyticsQuerySchema.safeParse(req.query);
			
			if (!query_validation.success) {
				res.status(400).json({
					error: "Invalid query parameters",
					details: query_validation.error.issues,
				});
				return;
			}

			const query_params = query_validation.data;
			
			// Get active sessions with optional filtering
			const filter = {
				country: query_params.country,
				page: query_params.page,
			};

			const sessions = this.analytics_service.get_active_sessions(filter);

			// Apply limit if specified
			const limited_sessions = query_params.limit 
				? sessions.slice(0, query_params.limit)
				: sessions;

			res.json({
				success: true,
				data: {
					sessions: limited_sessions,
					total_count: sessions.length,
					filters_applied: filter,
					retrieved_at: new Date().toISOString(),
				},
			});

		} catch (error) {
			console.error("Error getting active sessions:", error);
			res.status(500).json({
				error: "Internal server error",
				message: "Failed to retrieve active sessions",
			});
		}
	}

	/**
	 * GET /api/analytics/detailed
	 * Returns comprehensive analytics data with filtering options
	 */
	public async get_detailed_analytics(req: Request, res: Response): Promise<void> {
		try {
			// Validate query parameters
			const query_validation = AnalyticsQuerySchema.safeParse(req.query);
			
			if (!query_validation.success) {
				res.status(400).json({
					error: "Invalid query parameters",
					details: query_validation.error.issues,
				});
				return;
			}

			const query_params = query_validation.data;
			
			// Get detailed statistics
			const filter = {
				country: query_params.country,
				page: query_params.page,
			};

			const detailed_stats = this.analytics_service.get_detailed_stats(filter);

			res.json({
				success: true,
				data: detailed_stats,
				filters_applied: filter,
				generated_at: new Date().toISOString(),
			});

		} catch (error) {
			console.error("Error getting detailed analytics:", error);
			res.status(500).json({
				error: "Internal server error",
				message: "Failed to retrieve detailed analytics",
			});
		}
	}

	/**
	 * GET /api/status
	 * Returns server and WebSocket connection status
	 */
	public async get_server_status(req: Request, res: Response): Promise<void> {
		try {
			const connection_stats = this.websocket_service.get_connection_stats();
			const summary = this.analytics_service.generate_summary();

			res.json({
				success: true,
				data: {
					server_status: "healthy",
					websocket_connections: connection_stats.total_connections,
					current_analytics: summary,
					uptime: process.uptime(),
					timestamp: new Date().toISOString(),
				},
			});

		} catch (error) {
			console.error("Error getting server status:", error);
			res.status(500).json({
				error: "Internal server error",
				message: "Failed to retrieve server status",
			});
		}
	}
} 