import type { Request, Response, NextFunction } from "express";

/**
 * Request logging middleware
 * Logs all incoming HTTP requests with method, URL, and timestamp
 */
export function request_logger(
	req: Request,
	res: Response,
	next: NextFunction,
): void {
	// Add timestamp to request for response time calculation
	req.timestamp = Date.now();

	// Log request completion
	res.on("finish", () => {
		const method = req.method;
		const url = req.url;
		const status_code = res.statusCode;
		const response_time = Date.now() - req.timestamp;
		console.log(`${method} ${url} - ${status_code} (${response_time}ms)`);
	});

	next();
}

/**
 * Global error handler middleware
 * Catches and handles all unhandled errors in the Express application
 */
export function error_handler(
	error: Error,
	req: Request,
	res: Response,
	_next: NextFunction,
): void {
	console.error("Unhandled error:", error);

	// Default error response
	const error_response = {
		error: "Internal server error",
		message: error.message || "An unexpected error occurred",
		timestamp: new Date().toISOString(),
		path: req.path,
		method: req.method,
	};

	// Add stack trace in development
	if (process.env.NODE_ENV === "development") {
		(error_response as any).stack = error.stack;
	}

	// Send error response
	res.status(500).json(error_response);
}

/**
 * 404 Not Found handler middleware
 * Handles requests to non-existent endpoints
 */
export function not_found_handler(req: Request, res: Response): void {
	res.status(404).json({
		error: "Not Found",
		message: `Cannot ${req.method} ${req.path}`,
		timestamp: new Date().toISOString(),
		available_endpoints: [
			"POST /api/events",
			"GET /api/analytics/summary",
			"GET /api/analytics/sessions",
			"GET /api/analytics/detailed",
			"GET /api/status",
		],
	});
}

/**
 * CORS configuration middleware
 * Enables Cross-Origin Resource Sharing for the API
 */
export function cors_middleware(
	req: Request,
	res: Response,
	next: NextFunction,
): void {
	// Allow specific origins in production, all origins in development
	const allowed_origins =
		process.env.NODE_ENV === "production"
			? ["http://localhost:3000", "https://yourdomain.com"]
			: "*";

	if (allowed_origins === "*") {
		res.header("Access-Control-Allow-Origin", "*");
	} else {
		const origin = req.get("Origin");
		if (origin && allowed_origins.includes(origin)) {
			res.header("Access-Control-Allow-Origin", origin);
		}
	}

	res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
	res.header(
		"Access-Control-Allow-Headers",
		"Origin, X-Requested-With, Content-Type, Accept, Authorization",
	);
	res.header("Access-Control-Allow-Credentials", "true");

	// Handle preflight requests
	if (req.method === "OPTIONS") {
		res.sendStatus(200);
		return;
	}

	next();
}

// Extend Request interface to include timestamp
declare global {
	namespace Express {
		interface Request {
			timestamp: number;
		}
	}
}
