import { defineTable } from "convex/server";
import { v } from "convex/values";
import { collectionRequestStatus } from "./validators";

// Collection requests (batch pickups from generators)
export const collectionRequests = defineTable({
	generatorId: v.id("generators"),
	treaterId: v.id("treaters"),
	haulerId: v.optional(v.id("haulers")),

	// Request details
	requestedPickupDate: v.optional(v.number()),
	estimatedBagCount: v.optional(v.number()),
	notes: v.optional(v.string()),

	// Status
	status: collectionRequestStatus,

	// Assigned driver
	driverId: v.optional(v.id("users")),

	// Route tracking (for multi-stop routes)
	routeOrder: v.optional(v.number()), // Order in multi-stop route
	routeGroupId: v.optional(v.string()), // Groups multiple stops in same route
	estimatedArrival: v.optional(v.number()), // Estimated arrival timestamp
	driverLocation: v.optional(
		v.object({
			lat: v.number(),
			lng: v.number(),
			updatedAt: v.number(),
		}),
	),

	// Actual pickup details
	actualPickupAt: v.optional(v.number()),
	pickupSignatureUrl: v.optional(v.string()),

	// DENR compliance
	transportPermitId: v.optional(v.id("transportPermits")),

	createdBy: v.id("users"),
	createdAt: v.number(),
	updatedAt: v.number(),
})
	.index("by_generator", ["generatorId"])
	.index("by_treater", ["treaterId"])
	.index("by_hauler", ["haulerId"])
	.index("by_driver", ["driverId"])
	.index("by_status", ["status"])
	.index("by_treater_status", ["treaterId", "status"])
	.index("by_route_group", ["routeGroupId"])
	.index("by_generator_status", ["generatorId", "status"]);
