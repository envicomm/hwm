import { defineTable } from "convex/server";
import { v } from "convex/values";

// Batch disposal certificates
export const disposalCertificates = defineTable({
	disposalBatchId: v.id("disposalBatches"),
	treaterId: v.id("treaters"),

	// Certificate details
	certificateNumber: v.string(),
	issuedAt: v.number(),
	issuedBy: v.id("users"),

	// Batch info snapshot
	batchNumber: v.string(),
	totalBagCount: v.number(),
	totalWeightKg: v.optional(v.number()),
	disposalSite: v.string(),
	disposalMethod: v.string(),
	disposalDate: v.number(),

	// PDF/document URL
	documentUrl: v.optional(v.string()),

	createdAt: v.number(),
})
	.index("by_disposal_batch", ["disposalBatchId"])
	.index("by_treater", ["treaterId"])
	.index("by_certificate_number", ["certificateNumber"]);
