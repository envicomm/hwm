import { defineTable } from "convex/server";
import { v } from "convex/values";

// Permit to Transport (PTT) - issued per collection request
export const transportPermits = defineTable({
	collectionRequestId: v.id("collectionRequests"),
	generatorId: v.id("generators"),
	treaterId: v.id("treaters"),
	haulerId: v.optional(v.id("haulers")),

	// Permit details
	permitNumber: v.string(),
	issuedAt: v.number(),
	issuedBy: v.id("users"),

	// Waste snapshot at time of transport
	estimatedBagCount: v.number(),
	wasteTypes: v.array(v.string()),

	// PDF/document URL
	documentUrl: v.optional(v.string()),

	createdAt: v.number(),
})
	.index("by_collection_request", ["collectionRequestId"])
	.index("by_generator", ["generatorId"])
	.index("by_treater", ["treaterId"])
	.index("by_permit_number", ["permitNumber"]);
