import { defineTable } from "convex/server";
import { v } from "convex/values";
import { wasteStatus } from "./validators";

// Audit trail for waste status changes
export const wasteStatusHistory = defineTable({
	wasteBagId: v.id("wasteBags"),
	fromStatus: v.optional(wasteStatus),
	toStatus: wasteStatus,
	changedBy: v.id("users"),
	notes: v.optional(v.string()),
	location: v.optional(
		v.object({
			latitude: v.number(),
			longitude: v.number(),
		})
	),
	timestamp: v.number(),
})
	.index("by_waste_bag", ["wasteBagId"])
	.index("by_waste_bag_timestamp", ["wasteBagId", "timestamp"]);
