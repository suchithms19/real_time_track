import type { VisitorEvent, SessionData, AnalyticsSummary } from "../interfaces/types.js";

/**
 * Core analytics service that manages visitor sessions and statistics in memory
 * Provides real-time tracking and analytics calculations
 */
export class AnalyticsService {
	private sessions: Map<string, SessionData> = new Map();
	private daily_events: VisitorEvent[] = [];
	private page_views: Map<string, number> = new Map();
	private country_stats: Map<string, number> = new Map();

	/**
	 * Processes a new visitor event and updates all relevant statistics
	 * @param event - The visitor event to process
	 * @returns Updated session data and summary statistics
	 */
	public process_visitor_event(event: VisitorEvent): {
		session: SessionData;
		summary: AnalyticsSummary;
	} {
		// Update session data
		const session = this.update_session(event);

		// Add to daily events
		this.daily_events.push(event);

		// Update page view counters
		const current_count = this.page_views.get(event.page) || 0;
		this.page_views.set(event.page, current_count + 1);

		// Update country statistics
		const country_count = this.country_stats.get(event.country) || 0;
		this.country_stats.set(event.country, country_count + 1);

		// Generate summary
		const summary = this.generate_summary();

		return { session, summary };
	}

	/**
	 * Updates or creates session data for a visitor
	 * @param event - The visitor event
	 * @returns Updated session data
	 */
	private update_session(event: VisitorEvent): SessionData {
		const existing_session = this.sessions.get(event.session_id);

		if (existing_session) {
			// Update existing session
			const updated_session: SessionData = {
				...existing_session,
				current_page: event.page,
				journey: [...existing_session.journey, event.page],
				duration: this.calculate_session_duration(
					existing_session.last_activity,
					event.timestamp,
				),
				last_activity: event.timestamp,
			};

			this.sessions.set(event.session_id, updated_session);
			return updated_session;
		}

		// Create new session
		const new_session: SessionData = {
			session_id: event.session_id,
			current_page: event.page,
			journey: [event.page],
			duration: 0,
			country: event.country,
			device: event.metadata.device,
			last_activity: event.timestamp,
		};

		this.sessions.set(event.session_id, new_session);
		return new_session;
	}

	/**
	 * Calculates session duration in seconds
	 * @param start_time - Session start timestamp
	 * @param end_time - Current timestamp
	 * @returns Duration in seconds
	 */
	private calculate_session_duration(start_time: string, end_time: string): number {
		const start = new Date(start_time).getTime();
		const end = new Date(end_time).getTime();
		return Math.floor((end - start) / 1000);
	}

	/**
	 * Generates current analytics summary
	 * @returns Current analytics summary
	 */
	public generate_summary(): AnalyticsSummary {
		// Count active sessions (active in last 30 minutes)
		const thirty_minutes_ago = Date.now() - 30 * 60 * 1000;
		const active_sessions = Array.from(this.sessions.values()).filter(
			(session) => new Date(session.last_activity).getTime() > thirty_minutes_ago,
		).length;

		// Convert page views map to object
		const pages_visited: Record<string, number> = {};
		for (const [page, count] of this.page_views.entries()) {
			pages_visited[page] = count;
		}

		return {
			total_active: active_sessions,
			total_today: this.daily_events.length,
			pages_visited,
		};
	}

	/**
	 * Gets all active sessions with optional filtering
	 * @param filter - Optional filter criteria
	 * @returns Array of active session data
	 */
	public get_active_sessions(filter?: {
		country?: string;
		page?: string;
	}): SessionData[] {
		const thirty_minutes_ago = Date.now() - 30 * 60 * 1000;

		let sessions = Array.from(this.sessions.values()).filter(
			(session) => new Date(session.last_activity).getTime() > thirty_minutes_ago,
		);

		// Apply filters if provided
		if (filter?.country) {
			sessions = sessions.filter((session) => session.country === filter.country);
		}

		if (filter?.page) {
			sessions = sessions.filter((session) => session.current_page === filter.page);
		}

		return sessions.sort(
			(a, b) =>
				new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime(),
		);
	}

	/**
	 * Gets detailed statistics with optional filtering
	 * @param filter - Optional filter criteria
	 * @returns Detailed analytics data
	 */
	public get_detailed_stats(filter?: { country?: string; page?: string }): {
		summary: AnalyticsSummary;
		sessions: SessionData[];
		country_breakdown: Record<string, number>;
		recent_events: VisitorEvent[];
	} {
		const sessions = this.get_active_sessions(filter);
		let filtered_events = this.daily_events;

		// Apply event filtering
		if (filter?.country) {
			filtered_events = filtered_events.filter(
				(event) => event.country === filter.country,
			);
		}

		if (filter?.page) {
			filtered_events = filtered_events.filter((event) => event.page === filter.page);
		}

		// Get recent events (last 50)
		const recent_events = filtered_events
			.slice(-50)
			.sort(
				(a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
			);

		// Country breakdown
		const country_breakdown: Record<string, number> = {};
		for (const [country, count] of this.country_stats.entries()) {
			country_breakdown[country] = count;
		}

		return {
			summary: this.generate_summary(),
			sessions,
			country_breakdown,
			recent_events,
		};
	}

	/**
	 * Checks for visitor spikes and generates alerts
	 * @returns Alert data if spike detected, null otherwise
	 */
	public check_for_alerts(): {
		level: "info" | "warning" | "error";
		message: string;
		details: Record<string, any>;
	} | null {
		// Check for visitor spike in last minute
		const one_minute_ago = Date.now() - 60 * 1000;
		const visitors_last_minute = this.daily_events.filter(
			(event) => new Date(event.timestamp).getTime() > one_minute_ago,
		).length;

		if (visitors_last_minute > 10) {
			return {
				level: "info",
				message: "High visitor activity detected!",
				details: {
					visitors_last_minute,
					threshold: 10,
				},
			};
		}

		return null;
	}

	/**
	 * Cleans up old sessions and events (for memory management)
	 */
	public cleanup_old_data(): void {
		const twenty_four_hours_ago = Date.now() - 24 * 60 * 60 * 1000;

		// Remove old sessions
		for (const [session_id, session] of this.sessions.entries()) {
			if (new Date(session.last_activity).getTime() < twenty_four_hours_ago) {
				this.sessions.delete(session_id);
			}
		}

		// Keep only today's events
		const today_start = new Date();
		today_start.setHours(0, 0, 0, 0);

		this.daily_events = this.daily_events.filter(
			(event) => new Date(event.timestamp).getTime() >= today_start.getTime(),
		);
	}
} 