import { defineTable } from "convex/server";
import { v } from "convex/values";
import { bagInventoryStatus } from "./validators";

// Pre-manufactured bags with embedded QR codes
export const bagInventory = defineTable({
	// QR code embedded in physical bag
	qrCode: v.string(),

	// Ownership
	treaterId: v.id("treaters"),

	// Status lifecycle
	status: bagInventoryStatus,

	// Manufacturing info
	batchNumber: v.string(),
	manufacturedAt: v.number(),
	expiresAt: v.optional(v.number()),

	// Distribution tracking
	distributionId: v.optional(v.id("bagDistributions")),

	// Activation tracking (when bag is used for waste)
	wasteBagId: v.optional(v.id("wasteBags")),
	activatedAt: v.optional(v.number()),

	createdAt: v.number(),
	updatedAt: v.number(),
})
	.index("by_qr_code", ["qrCode"])
	.index("by_treater", ["treaterId"])
	.index("by_status", ["status"])
	.index("by_treater_status", ["treaterId", "status"])
	.index("by_distribution", ["distributionId"])
	.index("by_batch", ["batchNumber"]);
