import { z } from "zod";

// Visitor event validation schema
export const VisitorEventSchema = z.object({
	type: z.literal("pageview"),
	page: z.string().min(1),
	session_id: z.string().min(1),
	timestamp: z.string().datetime(),
	country: z.string().min(1),
	metadata: z.object({
		device: z.string().min(1),
		referrer: z.string().min(1),
	}),
});

// WebSocket message schemas
export const RequestDetailedStatsSchema = z.object({
	type: z.literal("request_detailed_stats"),
	filter: z
		.object({
			country: z.string().optional(),
			page: z.string().optional(),
		})
		.optional(),
});

export const TrackDashboardActionSchema = z.object({
	type: z.literal("track_dashboard_action"),
	action: z.string().min(1),
	details: z.record(z.any()),
});

// Union schema for client to server WebSocket messages
export const ClientToServerMessageSchema = z.union([
	RequestDetailedStatsSchema,
	TrackDashboardActionSchema,
]);

// Query parameters validation
export const AnalyticsQuerySchema = z.object({
	country: z.string().optional(),
	page: z.string().optional(),
	limit: z
		.string()
		.transform((val) => parseInt(val, 10))
		.optional(),
});

export type VisitorEventInput = z.infer<typeof VisitorEventSchema>;
export type RequestDetailedStatsInput = z.infer<
	typeof RequestDetailedStatsSchema
>;
export type TrackDashboardActionInput = z.infer<
	typeof TrackDashboardActionSchema
>;
export type ClientToServerMessageInput = z.infer<
	typeof ClientToServerMessageSchema
>;
export type AnalyticsQueryInput = z.infer<typeof AnalyticsQuerySchema>;
