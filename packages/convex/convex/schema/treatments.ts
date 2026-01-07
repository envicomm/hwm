import { defineTable } from "convex/server";
import { v } from "convex/values";

// Treatment records (batch processing at treater facility)
export const treatments = defineTable({
	treaterId: v.id("treaters"),

	// Treatment details
	treatmentMethod: v.string(), // e.g., "autoclave", "incineration"
	treatmentDate: v.number(),
	operatorId: v.id("users"),

	// Equipment/batch info
	equipmentId: v.optional(v.string()),
	batchNumber: v.optional(v.string()),

	// Validation
	temperatureReached: v.optional(v.number()),
	durationMinutes: v.optional(v.number()),
	validationPassed: v.boolean(),

	notes: v.optional(v.string()),

	createdAt: v.number(),
	updatedAt: v.number(),
})
	.index("by_treater", ["treaterId"])
	.index("by_treatment_date", ["treatmentDate"])
	.index("by_treater_date", ["treaterId", "treatmentDate"]);
