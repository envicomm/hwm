import { defineTable } from "convex/server";
import { v } from "convex/values";

// Haulers - Trucking companies
export const haulers = defineTable({
	name: v.string(),
	address: v.string(),
	contactEmail: v.string(),
	contactPhone: v.string(),
	licenseNumber: v.optional(v.string()),
	isActive: v.boolean(),
	// Hauler headquarters location for map centering
	location: v.optional(
		v.object({
			lat: v.number(),
			lng: v.number(),
		})
	),
	// Service area definition - city identifiers for geofence visualization
	serviceArea: v.optional(
		v.object({
			cities: v.array(v.string()),
		})
	),
	createdAt: v.number(),
	updatedAt: v.number(),
}).index("by_active", ["isActive"]);
