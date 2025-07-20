import { WebSocket, WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";
import type {
	ServerToClientEvents,
	VisitorEvent,
	AnalyticsSummary,
	SessionData,
} from "../interfaces/types.js";
import {
	ClientToServerMessageSchema,
	type RequestDetailedStatsInput,
	type TrackDashboardActionInput,
} from "../schemas/validation.js";
import type { AnalyticsService } from "./analytics_service.js";

interface WebSocketClient {
	id: string;
	websocket: WebSocket;
	connected_at: Date;
}

/**
 * WebSocket service that manages real-time communication with dashboard clients
 * Handles connection management and event broadcasting
 */
export class WebSocketService {
	private wss: WebSocketServer;
	private clients: Map<string, WebSocketClient> = new Map();

	constructor(
		private analytics_service: AnalyticsService,
		port: number = 8080,
	) {
		this.wss = new WebSocketServer({ port });
		this.setup_server();
		console.log(`WebSocket server started on port ${port}`);
	}

	/**
	 * Sets up WebSocket server event handlers
	 */
	private setup_server(): void {
		this.wss.on("connection", (ws: WebSocket) => {
			const client_id = uuidv4();
			const client: WebSocketClient = {
				id: client_id,
				websocket: ws,
				connected_at: new Date(),
			};

			this.clients.set(client_id, client);
			console.log(`Dashboard client connected: ${client_id}`);

			// Send welcome message with current stats
			this.send_user_connected_event(client_id);

			// Set up message handler
			ws.on("message", (data: Buffer) => {
				try {
					this.handle_client_message(client_id, data);
				} catch (error) {
					console.error("Error handling client message:", error);
					this.send_error_to_client(client_id, "Invalid message format");
				}
			});

			// Handle client disconnect
			ws.on("close", () => {
				this.handle_client_disconnect(client_id);
			});

			// Handle connection errors
			ws.on("error", (error) => {
				console.error(`WebSocket error for client ${client_id}:`, error);
				this.handle_client_disconnect(client_id);
			});
		});
	}

	/**
	 * Handles incoming messages from dashboard clients
	 * @param client_id - ID of the client sending the message
	 * @param data - Raw message data
	 */
	private handle_client_message(client_id: string, data: Buffer): void {
		const message_text = data.toString();
		let parsed_message: any;

		try {
			parsed_message = JSON.parse(message_text);
		} catch (_error) {
			throw new Error("Invalid JSON format");
		}

		// Validate message against schema
		const validation_result =
			ClientToServerMessageSchema.safeParse(parsed_message);
		if (!validation_result.success) {
			throw new Error(
				`Invalid message schema: ${validation_result.error.message}`,
			);
		}

		const validated_message = validation_result.data;
		console.log(`Received message from ${client_id}:`, validated_message.type);

		// Route message based on type
		switch (validated_message.type) {
			case "request_detailed_stats":
				this.handle_detailed_stats_request(
					client_id,
					validated_message as RequestDetailedStatsInput,
				);
				break;

			case "track_dashboard_action":
				this.handle_dashboard_action(
					client_id,
					validated_message as TrackDashboardActionInput,
				);
				break;

			default:
				console.warn(
					`Unknown message type: ${(validated_message as any).type}`,
				);
		}
	}

	/**
	 * Handles request for detailed statistics
	 * @param client_id - Client requesting the stats
	 * @param message - The stats request message
	 */
	private handle_detailed_stats_request(
		client_id: string,
		message: RequestDetailedStatsInput,
	): void {
		const detailed_stats = this.analytics_service.get_detailed_stats(
			message.filter,
		);

		// Send detailed stats back to requesting client
		this.send_to_client(client_id, {
			type: "detailed_stats_response",
			data: detailed_stats,
		});
	}

	/**
	 * Handles dashboard action tracking
	 * @param client_id - Client performing the action
	 * @param message - The action tracking message
	 */
	private handle_dashboard_action(
		client_id: string,
		message: TrackDashboardActionInput,
	): void {
		console.log(
			`Dashboard action from ${client_id}: ${message.action}`,
			message.details,
		);

		// Could store dashboard actions for analytics if needed
		// For now, just log the action
	}

	/**
	 * Handles client disconnect
	 * @param client_id - ID of disconnected client
	 */
	private handle_client_disconnect(client_id: string): void {
		this.clients.delete(client_id);
		console.log(`Dashboard client disconnected: ${client_id}`);

		// Broadcast user disconnected event to remaining clients
		this.broadcast_user_disconnected_event();
	}

	/**
	 * Broadcasts visitor update to all connected clients
	 * @param event - The visitor event
	 * @param stats - Updated analytics summary
	 */
	public broadcast_visitor_update(
		event: VisitorEvent,
		stats: AnalyticsSummary,
	): void {
		const message: ServerToClientEvents = {
			type: "visitor_update",
			data: { event, stats },
		};

		this.broadcast_to_all_clients(message);
	}

	/**
	 * Broadcasts session activity update to all connected clients
	 * @param session_data - Updated session information
	 */
	public broadcast_session_activity(session_data: SessionData): void {
		const message: ServerToClientEvents = {
			type: "session_activity",
			data: session_data,
		};

		this.broadcast_to_all_clients(message);
	}

	/**
	 * Broadcasts alert to all connected clients
	 * @param level - Alert severity level
	 * @param message_text - Alert message
	 * @param details - Additional alert details
	 */
	public broadcast_alert(
		level: "info" | "warning" | "error",
		message_text: string,
		details: Record<string, any>,
	): void {
		const message: ServerToClientEvents = {
			type: "alert",
			data: {
				level,
				message: message_text,
				details,
			},
		};

		this.broadcast_to_all_clients(message);
	}

	/**
	 * Sends user connected event to specific client and broadcasts to others
	 * @param new_client_id - ID of the newly connected client
	 */
	private send_user_connected_event(new_client_id: string): void {
		const message: ServerToClientEvents = {
			type: "user_connected",
			data: {
				total_dashboards: this.clients.size,
				connected_at: new Date().toISOString(),
			},
		};

		// Send to the new client
		this.send_to_client(new_client_id, message);

		// Broadcast to all other clients about the new connection
		this.broadcast_to_all_clients(message, new_client_id);
	}

	/**
	 * Broadcasts user disconnected event to all remaining clients
	 */
	private broadcast_user_disconnected_event(): void {
		const message: ServerToClientEvents = {
			type: "user_disconnected",
			data: {
				total_dashboards: this.clients.size,
			},
		};

		this.broadcast_to_all_clients(message);
	}

	/**
	 * Sends a message to a specific client
	 * @param client_id - Target client ID
	 * @param message - Message to send
	 */
	private send_to_client(client_id: string, message: any): void {
		const client = this.clients.get(client_id);
		if (!client || client.websocket.readyState !== WebSocket.OPEN) {
			console.warn(`Cannot send message to client ${client_id}: not connected`);
			return;
		}

		try {
			client.websocket.send(JSON.stringify(message));
		} catch (error) {
			console.error(`Error sending message to client ${client_id}:`, error);
			this.handle_client_disconnect(client_id);
		}
	}

	/**
	 * Broadcasts a message to all connected clients
	 * @param message - Message to broadcast
	 * @param exclude_client_id - Optional client ID to exclude from broadcast
	 */
	private broadcast_to_all_clients(
		message: any,
		exclude_client_id?: string,
	): void {
		const message_string = JSON.stringify(message);

		for (const [client_id, client] of this.clients.entries()) {
			if (exclude_client_id && client_id === exclude_client_id) {
				continue;
			}

			if (client.websocket.readyState === WebSocket.OPEN) {
				try {
					client.websocket.send(message_string);
				} catch (error) {
					console.error(`Error broadcasting to client ${client_id}:`, error);
					this.handle_client_disconnect(client_id);
				}
			}
		}
	}

	/**
	 * Sends error message to specific client
	 * @param client_id - Target client ID
	 * @param error_message - Error message to send
	 */
	private send_error_to_client(client_id: string, error_message: string): void {
		this.send_to_client(client_id, {
			type: "error",
			message: error_message,
		});
	}

	/**
	 * Gets current connection statistics
	 * @returns Connection statistics
	 */
	public get_connection_stats(): {
		total_connections: number;
		connected_clients: string[];
	} {
		return {
			total_connections: this.clients.size,
			connected_clients: Array.from(this.clients.keys()),
		};
	}

	/**
	 * Gracefully closes the WebSocket server
	 */
	public close(): Promise<void> {
		return new Promise((resolve) => {
			// Close all client connections
			for (const client of this.clients.values()) {
				client.websocket.close();
			}

			// Close the server
			this.wss.close(() => {
				console.log("WebSocket server closed");
				resolve();
			});
		});
	}
}
