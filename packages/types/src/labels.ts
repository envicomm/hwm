import type {
	CollectionRequestStatus,
	DisposalBatchStatus,
	DriverStatus,
	QrMode,
	WasteStatus,
	WasteType,
} from "./enums";

// Status labels for waste bags
export const statusLabels: Record<WasteStatus, string> = {
	initialized: "Initialized",
	to_be_collected: "To Be Collected",
	collected: "Collected",
	treated: "Treated",
	aggregated: "Aggregated",
	disposal_requested: "Disposal Requested",
	disposed: "Disposed",
};

// Waste type labels
export const typeLabels: Record<WasteType, string> = {
	infectious: "Infectious",
	sharps: "Sharps",
	pharmaceutical: "Pharmaceutical",
	pathological: "Pathological",
	chemical: "Chemical",
};

// Collection request status labels
export const collectionRequestStatusLabels: Record<CollectionRequestStatus, string> = {
	pending: "Pending",
	assigned: "Assigned",
	in_progress: "In Progress",
	completed: "Completed",
	cancelled: "Cancelled",
};

// Disposal batch status labels
export const disposalBatchStatusLabels: Record<DisposalBatchStatus, string> = {
	aggregating: "Aggregating",
	sealed: "Sealed",
	disposal_requested: "Disposal Requested",
	in_transit: "In Transit",
	disposed: "Disposed",
};

// Driver status labels
export const driverStatusLabels: Record<DriverStatus, string> = {
	available: "Available",
	on_route: "On Route",
	returning: "Returning",
	off_duty: "Off Duty",
};

// QR mode labels
export const qrModeLabels: Record<QrMode, string> = {
	pre_manufactured: "Pre-manufactured",
	hospital_generated: "Hospital Generated",
	both: "Both",
};

// Status colors (Tailwind classes for badges)
export const statusColors: Record<WasteStatus, string> = {
	initialized: "bg-slate-100 text-slate-700",
	to_be_collected: "bg-amber-100 text-amber-700",
	collected: "bg-blue-100 text-blue-700",
	treated: "bg-emerald-100 text-emerald-700",
	aggregated: "bg-purple-100 text-purple-700",
	disposal_requested: "bg-orange-100 text-orange-700",
	disposed: "bg-green-100 text-green-700",
};

// Collection status colors (hex for charts)
export const collectionStatusColors: Record<CollectionRequestStatus, string> = {
	pending: "#f59e0b",
	assigned: "#3b82f6",
	in_progress: "#8b5cf6",
	completed: "#10b981",
	cancelled: "#6b7280",
};

// Disposal status colors (hex for charts)
export const disposalStatusColors: Record<DisposalBatchStatus, string> = {
	aggregating: "#f59e0b",
	sealed: "#3b82f6",
	disposal_requested: "#8b5cf6",
	in_transit: "#ec4899",
	disposed: "#10b981",
};

// Driver status colors (hex for charts)
export const driverStatusColors: Record<DriverStatus, string> = {
	available: "#10b981",
	on_route: "#3b82f6",
	returning: "#f59e0b",
	off_duty: "#6b7280",
};

// Waste status colors (hex for charts)
export const wasteStatusChartColors: Record<WasteStatus, string> = {
	initialized: "#94a3b8",
	to_be_collected: "#fbbf24",
	collected: "#3b82f6",
	treated: "#10b981",
	aggregated: "#a855f7",
	disposal_requested: "#f97316",
	disposed: "#22c55e",
};
