import { v } from "convex/values";

// Waste status literals - the lifecycle of a waste bag
export const wasteStatus = v.union(
	v.literal("initialized"),
	v.literal("to_be_collected"),
	v.literal("collected"),
	v.literal("treated"),
	v.literal("aggregated"),
	v.literal("disposal_requested"),
	v.literal("disposed")
);

// User roles across the platform
export const userRole = v.union(
	v.literal("generator"),
	v.literal("treater"),
	v.literal("hauler"),
	v.literal("driver"),
	v.literal("admin")
);

// Collection request status
export const collectionRequestStatus = v.union(
	v.literal("pending"),
	v.literal("assigned"),
	v.literal("in_progress"),
	v.literal("completed"),
	v.literal("cancelled")
);

// Disposal batch status
export const disposalBatchStatus = v.union(
	v.literal("aggregating"),
	v.literal("sealed"),
	v.literal("disposal_requested"),
	v.literal("in_transit"),
	v.literal("disposed")
);

// Bag inventory status (pre-manufactured bags)
export const bagInventoryStatus = v.union(
	v.literal("manufactured"),
	v.literal("distributed"),
	v.literal("activated"),
	v.literal("damaged"),
	v.literal("expired")
);

// Bag distribution status
export const bagDistributionStatus = v.union(
	v.literal("pending"),
	v.literal("shipped"),
	v.literal("received"),
	v.literal("partial")
);

// QR code generation mode
export const qrMode = v.union(
	v.literal("pre_manufactured"),
	v.literal("hospital_generated"),
	v.literal("both")
);
