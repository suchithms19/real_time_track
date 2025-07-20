/**
 * Server configuration settings
 * Centralizes all configuration with environment variable support
 */
export interface ServerConfig {
	// Server settings
	port: number;
	host: string;
	node_env: string;

	// WebSocket settings
	websocket_port: number;

	// CORS settings
	cors_origins: string[];

	// Analytics settings
	cleanup_interval_minutes: number;
	session_timeout_minutes: number;
	alert_threshold_visitors_per_minute: number;
}

/**
 * Loads and validates server configuration from environment variables
 * @returns Validated server configuration object
 */
export function load_server_config(): ServerConfig {
	const config: ServerConfig = {
		// Server settings
		port: parseInt(process.env.PORT || "3000", 10),
		host: process.env.HOST || "0.0.0.0",
		node_env: process.env.NODE_ENV || "development",

		// WebSocket settings
		websocket_port: parseInt(process.env.WEBSOCKET_PORT || "8080", 10),

		// CORS settings
		cors_origins: process.env.CORS_ORIGINS
			? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
			: ["http://localhost:3000"],

		// Analytics settings
		cleanup_interval_minutes: parseInt(
			process.env.CLEANUP_INTERVAL_MINUTES || "60",
			10,
		),
		session_timeout_minutes: parseInt(
			process.env.SESSION_TIMEOUT_MINUTES || "30",
			10,
		),
		alert_threshold_visitors_per_minute: parseInt(
			process.env.ALERT_THRESHOLD || "10",
			10,
		),
	};

	// Validate configuration
	validate_config(config);

	return config;
}

/**
 * Validates server configuration settings
 * @param config - Configuration to validate
 * @throws Error if configuration is invalid
 */
function validate_config(config: ServerConfig): void {
	const errors: string[] = [];

	// Validate port numbers
	if (config.port < 1 || config.port > 65535) {
		errors.push(`Invalid port: ${config.port}. Must be between 1 and 65535.`);
	}

	if (config.websocket_port < 1 || config.websocket_port > 65535) {
		errors.push(
			`Invalid WebSocket port: ${config.websocket_port}. Must be between 1 and 65535.`,
		);
	}

	// Check for port conflicts
	if (config.port === config.websocket_port) {
		errors.push(`HTTP and WebSocket ports cannot be the same: ${config.port}`);
	}

	// Validate timeout settings
	if (config.session_timeout_minutes < 1) {
		errors.push(
			`Session timeout must be at least 1 minute, got: ${config.session_timeout_minutes}`,
		);
	}

	if (config.cleanup_interval_minutes < 1) {
		errors.push(
			`Cleanup interval must be at least 1 minute, got: ${config.cleanup_interval_minutes}`,
		);
	}

	// Validate environment
	if (!["development", "production", "test"].includes(config.node_env)) {
		errors.push(
			`Invalid NODE_ENV: ${config.node_env}. Must be 'development', 'production', or 'test'.`,
		);
	}

	if (errors.length > 0) {
		throw new Error(`Invalid server configuration:\n${errors.join("\n")}`);
	}
}

/**
 * Prints current configuration to console (for debugging)
 * @param config - Configuration to display
 */
export function log_config(config: ServerConfig): void {
	console.log("🔧 Server Configuration:");
	console.log(`   HTTP Server: http://${config.host}:${config.port}`);
	console.log(
		`   WebSocket Server: ws://${config.host}:${config.websocket_port}`,
	);
	console.log(`   Environment: ${config.node_env}`);
	console.log(`   CORS Origins: ${config.cors_origins.join(", ")}`);
	console.log(`   Session Timeout: ${config.session_timeout_minutes} minutes`);
	console.log(
		`   Cleanup Interval: ${config.cleanup_interval_minutes} minutes`,
	);
	console.log(
		`   Alert Threshold: ${config.alert_threshold_visitors_per_minute} visitors/minute`,
	);
}
