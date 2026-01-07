import { defineTable } from "convex/server";
import { v } from "convex/values";

// Individual treatment certificates (per waste bag)
export const treatmentCertificates = defineTable({
	wasteBagId: v.id("wasteBags"),
	treatmentId: v.id("treatments"),
	treaterId: v.id("treaters"),
	generatorId: v.id("generators"),

	// Certificate details
	certificateNumber: v.string(),
	issuedAt: v.number(),
	issuedBy: v.id("users"),

	// Waste info snapshot (for certificate permanence)
	wasteType: v.string(),
	weightKg: v.optional(v.number()),
	treatmentMethod: v.string(),
	treatmentDate: v.number(),

	// PDF/document URL
	documentUrl: v.optional(v.string()),

	createdAt: v.number(),
})
	.index("by_waste_bag", ["wasteBagId"])
	.index("by_treatment", ["treatmentId"])
	.index("by_treater", ["treaterId"])
	.index("by_generator", ["generatorId"])
	.index("by_certificate_number", ["certificateNumber"]);
