import { defineTable } from "convex/server";
import { v } from "convex/values";
import { disposalBatchStatus } from "./validators";

// Disposal batches (aggregated treated waste for final disposal)
export const disposalBatches = defineTable({
	treaterId: v.id("treaters"),
	haulerId: v.optional(v.id("haulers")),

	// Batch identifier
	batchNumber: v.string(),

	// Status
	status: disposalBatchStatus,

	// Disposal details
	totalBagCount: v.optional(v.number()),
	totalWeightKg: v.optional(v.number()),

	// Assigned driver for disposal pickup
	driverId: v.optional(v.id("users")),

	// Pickup and disposal timestamps
	pickupRequestedAt: v.optional(v.number()),
	pickedUpAt: v.optional(v.number()),
	disposedAt: v.optional(v.number()),

	// Disposal destination
	disposalSite: v.optional(v.string()),
	disposalMethod: v.optional(v.string()),

	createdBy: v.id("users"),
	createdAt: v.number(),
	updatedAt: v.number(),
})
	.index("by_treater", ["treaterId"])
	.index("by_status", ["status"])
	.index("by_treater_status", ["treaterId", "status"])
	.index("by_batch_number", ["batchNumber"]);
