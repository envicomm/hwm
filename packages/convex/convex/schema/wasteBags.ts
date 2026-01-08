import { defineTable } from "convex/server";
import { v } from "convex/values";
import { wasteStatus } from "./validators";

// Individual waste bags/items
export const wasteBags = defineTable({
	// QR code identifier (unique, scannable)
	qrCode: v.string(),

	// QR source tracking
	qrSource: v.union(v.literal("pre_manufactured"), v.literal("hospital_generated")),
	bagInventoryId: v.optional(v.id("bagInventory")), // Set if pre-manufactured

	// Origin
	generatorId: v.id("generators"),
	treaterId: v.id("treaters"), // Denormalized for efficient queries

	// Waste details
	wasteType: v.string(), // e.g., "infectious", "sharps", "pharmaceutical"
	description: v.optional(v.string()),
	weightKg: v.optional(v.number()),

	// Vision model support
	imageUrl: v.optional(v.string()),
	imageAnalysis: v.optional(v.string()),

	// Current status
	status: wasteStatus,

	// References to related entities (set as waste progresses)
	collectionRequestId: v.optional(v.id("collectionRequests")),
	treatmentId: v.optional(v.id("treatments")),
	disposalBatchId: v.optional(v.id("disposalBatches")),

	// Certificate reference
	treatmentCertificateId: v.optional(v.id("treatmentCertificates")),

	// Metadata
	createdBy: v.id("users"),
	createdAt: v.number(),
	updatedAt: v.number(),
})
	.index("by_qr_code", ["qrCode"])
	.index("by_generator", ["generatorId"])
	.index("by_treater", ["treaterId"])
	.index("by_status", ["status"])
	.index("by_treater_status", ["treaterId", "status"])
	.index("by_generator_status", ["generatorId", "status"])
	.index("by_collection_request", ["collectionRequestId"])
	.index("by_disposal_batch", ["disposalBatchId"])
	.index("by_bag_inventory", ["bagInventoryId"]);
