// Waste status literals - the lifecycle of a waste bag
export type WasteStatus =
	| "initialized"
	| "to_be_collected"
	| "collected"
	| "treated"
	| "aggregated"
	| "disposal_requested"
	| "disposed";

export const WASTE_STATUSES = [
	"initialized",
	"to_be_collected",
	"collected",
	"treated",
	"aggregated",
	"disposal_requested",
	"disposed",
] as const;

// Waste type categories
export type WasteType =
	| "infectious"
	| "sharps"
	| "pharmaceutical"
	| "pathological"
	| "chemical";

export const WASTE_TYPES = [
	"infectious",
	"sharps",
	"pharmaceutical",
	"pathological",
	"chemical",
] as const;

// User roles across the platform
export type UserRole = "generator" | "treater" | "hauler" | "driver" | "admin";

export const USER_ROLES = [
	"generator",
	"treater",
	"hauler",
	"driver",
	"admin",
] as const;

// Collection request status
export type CollectionRequestStatus =
	| "pending"
	| "assigned"
	| "in_progress"
	| "completed"
	| "cancelled";

export const COLLECTION_REQUEST_STATUSES = [
	"pending",
	"assigned",
	"in_progress",
	"completed",
	"cancelled",
] as const;

// Disposal batch status
export type DisposalBatchStatus =
	| "aggregating"
	| "sealed"
	| "disposal_requested"
	| "in_transit"
	| "disposed";

export const DISPOSAL_BATCH_STATUSES = [
	"aggregating",
	"sealed",
	"disposal_requested",
	"in_transit",
	"disposed",
] as const;

// Bag inventory status (pre-manufactured bags)
export type BagInventoryStatus =
	| "manufactured"
	| "distributed"
	| "activated"
	| "damaged"
	| "expired";

export const BAG_INVENTORY_STATUSES = [
	"manufactured",
	"distributed",
	"activated",
	"damaged",
	"expired",
] as const;

// Bag distribution status
export type BagDistributionStatus = "pending" | "shipped" | "received" | "partial";

export const BAG_DISTRIBUTION_STATUSES = [
	"pending",
	"shipped",
	"received",
	"partial",
] as const;

// QR code generation mode
export type QrMode = "pre_manufactured" | "hospital_generated" | "both";

export const QR_MODES = [
	"pre_manufactured",
	"hospital_generated",
	"both",
] as const;

// Driver status
export type DriverStatus = "available" | "on_route" | "returning" | "off_duty";

export const DRIVER_STATUSES = [
	"available",
	"on_route",
	"returning",
	"off_duty",
] as const;

// Activity types for timelines
export type ActivityType =
	| "bag_created"
	| "bag_collected"
	| "bag_treated"
	| "bag_disposed"
	| "request_created"
	| "collection_assigned"
	| "collection_started"
	| "collection_completed"
	| "disposal_started"
	| "disposal_completed"
	| "driver_available";

export const ACTIVITY_TYPES = [
	"bag_created",
	"bag_collected",
	"bag_treated",
	"bag_disposed",
	"request_created",
	"collection_assigned",
	"collection_started",
	"collection_completed",
	"disposal_started",
	"disposal_completed",
	"driver_available",
] as const;
