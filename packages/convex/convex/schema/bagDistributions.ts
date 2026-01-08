import { defineTable } from "convex/server";
import { v } from "convex/values";
import { bagDistributionStatus } from "./validators";

// Bag shipments from treater to hospital
export const bagDistributions = defineTable({
	treaterId: v.id("treaters"),
	generatorId: v.id("generators"),

	// Shipment details
	quantity: v.number(),
	shippedAt: v.number(),
	receivedAt: v.optional(v.number()),

	// Status
	status: bagDistributionStatus,

	// Tracking
	trackingNumber: v.optional(v.string()),
	notes: v.optional(v.string()),

	createdBy: v.id("users"),
	createdAt: v.number(),
	updatedAt: v.number(),
})
	.index("by_treater", ["treaterId"])
	.index("by_generator", ["generatorId"])
	.index("by_status", ["status"])
	.index("by_treater_generator", ["treaterId", "generatorId"]);
