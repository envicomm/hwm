import { defineTable } from "convex/server";
import { v } from "convex/values";
import { qrMode } from "./validators";

// Generators - Hospitals that belong to a Treater
export const generators = defineTable({
	treaterId: v.id("treaters"),
	name: v.string(),
	address: v.string(),
	contactEmail: v.string(),
	contactPhone: v.string(),
	facilityCode: v.optional(v.string()),

	// QR code mode configuration (set by treater)
	qrMode: qrMode,

	// Storage capacity configuration
	maxStorageCapacityKg: v.optional(v.number()),
	maxBagCount: v.optional(v.number()),
	storageAlertThreshold: v.optional(v.number()), // Percentage threshold (e.g., 80 for 80%)

	// Location for map display
	location: v.optional(
		v.object({
			lat: v.number(),
			lng: v.number(),
		}),
	),

	isActive: v.boolean(),
	createdAt: v.number(),
	updatedAt: v.number(),
})
	.index("by_treater", ["treaterId"])
	.index("by_treater_active", ["treaterId", "isActive"]);
