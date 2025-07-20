import type { AnalyticsService } from "../services/analytics_service.js";
import type { WebSocketService } from "../services/websocket_service.js";
import type { ServerConfig } from "../config/server_config.js";

/**
 * Manages periodic cleanup tasks and graceful server shutdown
 * Handles data cleanup, memory management, and shutdown procedures
 */
export class CleanupManager {
	private cleanup_interval?: NodeJS.Timeout;
	private is_shutting_down = false;

	constructor(
		private analytics_service: AnalyticsService,
		private websocket_service: WebSocketService,
		private config: ServerConfig,
	) {}

	/**
	 * Starts periodic cleanup tasks
	 * Runs data cleanup at configured intervals
	 */
	public start_cleanup_scheduler(): void {
		const interval_ms = this.config.cleanup_interval_minutes * 60 * 1000;

		console.log(
			`🧹 Starting cleanup scheduler (interval: ${this.config.cleanup_interval_minutes} minutes)`,
		);

		this.cleanup_interval = setInterval(() => {
			this.perform_cleanup();
		}, interval_ms);

		// Run initial cleanup after a short delay
		setTimeout(() => {
			this.perform_cleanup();
		}, 30000); // 30 seconds after start
	}

	/**
	 * Performs data cleanup operations
	 * Removes old sessions and events from memory
	 */
	private perform_cleanup(): void {
		if (this.is_shutting_down) {
			return;
		}

		try {
			const before_memory = process.memoryUsage();

			// Clean up old data from analytics service
			this.analytics_service.cleanup_old_data();

			const after_memory = process.memoryUsage();
			const memory_freed = before_memory.heapUsed - after_memory.heapUsed;

			if (memory_freed > 1024 * 1024) {
				// Only log if freed > 1MB
				console.log(`🧹 Cleanup freed: ${this.format_bytes(memory_freed)}`);
			}
		} catch (error) {
			console.error("❌ Error during cleanup:", error);
		}
	}

	/**
	 * Sets up graceful shutdown handlers for process signals
	 * Handles SIGINT, SIGTERM, and uncaught exceptions
	 */
	public setup_graceful_shutdown(): void {
		// Handle Ctrl+C (SIGINT)
		process.on("SIGINT", () => {
			console.log(
				"\n🛑 Received SIGINT (Ctrl+C). Initiating graceful shutdown...",
			);
			this.graceful_shutdown("SIGINT");
		});

		// Handle termination signal (SIGTERM)
		process.on("SIGTERM", () => {
			console.log("\n🛑 Received SIGTERM. Initiating graceful shutdown...");
			this.graceful_shutdown("SIGTERM");
		});

		// Handle uncaught exceptions
		process.on("uncaughtException", (error) => {
			console.error("💥 Uncaught Exception:", error);
			this.graceful_shutdown("UNCAUGHT_EXCEPTION");
		});

		// Handle unhandled promise rejections
		process.on("unhandledRejection", (reason, promise) => {
			console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
			this.graceful_shutdown("UNHANDLED_REJECTION");
		});
	}

	/**
	 * Performs graceful shutdown of all services
	 * @param signal - The signal that triggered the shutdown
	 */
	private async graceful_shutdown(signal: string): Promise<void> {
		if (this.is_shutting_down) {
			console.log("🔄 Shutdown already in progress...");
			return;
		}

		this.is_shutting_down = true;
		console.log(`🛑 Starting graceful shutdown (triggered by: ${signal})`);

		try {
			// Stop cleanup scheduler
			if (this.cleanup_interval) {
				clearInterval(this.cleanup_interval);
			}

			// Perform final cleanup
			console.log("🧹 Performing final data cleanup...");
			this.analytics_service.cleanup_old_data();

			// Close WebSocket connections
			console.log("🔌 Closing WebSocket connections...");
			await this.websocket_service.close();

			// Give a moment for everything to close
			await this.sleep(1000);

			console.log("✅ Graceful shutdown completed");
			process.exit(0);
		} catch (error) {
			console.error("❌ Error during graceful shutdown:", error);
			process.exit(1);
		}
	}

	/**
	 * Stops the cleanup scheduler
	 */
	public stop_cleanup_scheduler(): void {
		if (this.cleanup_interval) {
			clearInterval(this.cleanup_interval);
			this.cleanup_interval = undefined;
		}
	}

	/**
	 * Logs current system statistics
	 * Shows memory usage, uptime, and connection stats
	 */
	public log_system_stats(): void {
		const memory = process.memoryUsage();
		const uptime = process.uptime();
		const connection_stats = this.websocket_service.get_connection_stats();

		console.log("📊 System Statistics:");
		console.log(`   Uptime: ${this.format_uptime(uptime)}`);
		console.log(`   Memory Usage:`);
		console.log(`     Heap Used: ${this.format_bytes(memory.heapUsed)}`);
		console.log(`     Heap Total: ${this.format_bytes(memory.heapTotal)}`);
		console.log(`     RSS: ${this.format_bytes(memory.rss)}`);
		console.log(
			`   WebSocket Connections: ${connection_stats.total_connections}`,
		);
	}

	/**
	 * Formats bytes into human-readable format
	 * @param bytes - Number of bytes
	 * @returns Formatted string (e.g., "1.5 MB")
	 */
	private format_bytes(bytes: number): string {
		if (bytes === 0) return "0 Bytes";

		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));

		return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
	}

	/**
	 * Formats uptime into human-readable format
	 * @param seconds - Uptime in seconds
	 * @returns Formatted string (e.g., "2h 30m 15s")
	 */
	private format_uptime(seconds: number): string {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = Math.floor(seconds % 60);

		const parts: string[] = [];
		if (hours > 0) parts.push(`${hours}h`);
		if (minutes > 0) parts.push(`${minutes}m`);
		if (secs > 0) parts.push(`${secs}s`);

		return parts.join(" ") || "0s";
	}

	/**
	 * Helper function for async sleep
	 * @param ms - Milliseconds to sleep
	 * @returns Promise that resolves after the specified time
	 */
	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
