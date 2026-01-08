import type {
	ActivityType,
	CollectionRequestStatus,
	DisposalBatchStatus,
	DriverStatus,
	QrMode,
	WasteStatus,
	WasteType,
} from "./enums";
import type { Location } from "./entities";

// Mock waste bag (simplified for mock data generation)
export interface MockWasteBag {
	id: string;
	qrCode: string;
	generatorId?: string;
	wasteType: WasteType;
	status: WasteStatus;
	weightKg: number | null;
	description?: string | null;
	createdAt: number;
	updatedAt?: number;
}

// Mock generator with computed stats
export interface MockGenerator {
	id: string;
	name: string;
	address: string;
	contactEmail?: string;
	contactPhone?: string;
	facilityCode?: string | null;
	qrMode: QrMode;
	maxStorageCapacityKg: number;
	maxBagCount: number;
	storageAlertThreshold: number;
	location: Location | null;
	isActive?: boolean;
	createdAt?: number;
	// Computed stats (for mock data)
	currentStorageKg?: number;
	currentBagCount?: number;
	pendingBags?: number;
	treatedBags?: number;
	lastActivityAt?: number;
}

// Mock collection request
export interface MockCollectionRequest {
	id: string;
	generatorId?: string;
	generatorName?: string;
	treaterId?: string;
	treaterName?: string;
	status: CollectionRequestStatus;
	bagCount?: number;
	estimatedBagCount?: number;
	requestedAt?: number;
	requestedPickupDate?: number;
	scheduledDate?: number | null;
	completedAt?: number | null;
	actualPickupAt?: number;
	driverId?: string;
	driverName?: string;
	routeOrder?: number;
	createdAt?: number;
}

// Mock bag distribution
export interface MockBagDistribution {
	id: string;
	quantity: number;
	shippedAt: number;
	receivedAt?: number;
	status: "pending" | "shipped" | "received" | "partial";
}

// Mock bag inventory
export interface MockBagInventory {
	availableBags: number;
	recentDistributions: MockBagDistribution[];
}

// Mock route stop
export interface MockRouteStop {
	id: string;
	name: string;
	location: Location;
	order: number;
	isCurrentGenerator?: boolean;
}

// Mock collection route
export interface MockCollectionRoute {
	routeGroupId: string;
	stops: MockRouteStop[];
	driverLocation: Location | null;
	estimatedArrival: Date | null;
	currentStopIndex: number;
	hasActiveCollection: boolean;
}

// Mock disposal batch
export interface MockDisposalBatch {
	id: string;
	treaterId: string;
	treaterName: string;
	batchNumber: string;
	status: DisposalBatchStatus;
	totalBagCount: number;
	totalWeightKg: number;
	driverId?: string;
	driverName?: string;
	pickupRequestedAt?: number;
	disposalSite?: string;
	createdAt: number;
}

// Mock driver
export interface MockDriver {
	id: string;
	name: string;
	phone: string;
	status: DriverStatus;
	currentRouteId?: string;
	vehiclePlate: string;
	completedToday: number;
}

// Mock hauler
export interface MockHauler {
	id: string;
	name: string;
	address: string;
	contactEmail: string;
	contactPhone: string;
	licenseNumber: string;
	location?: Location;
	serviceArea?: {
		cities: string[];
	};
}

// Daily waste data for charts
export interface DailyWasteData {
	date: string;
	count: number;
	weight: number;
}

// Daily waste type data for charts
export interface DailyWasteTypeData {
	date: string;
	dayIndex: number;
	infectious: number;
	sharps: number;
	pharmaceutical: number;
	pathological: number;
	chemical: number;
}

// Activity item for feeds/timelines
export interface ActivityItem {
	id: string;
	type: ActivityType;
	description: string;
	timestamp: number;
	wasteType?: WasteType;
	status?: WasteStatus;
	weightKg?: number | null;
	location?: string;
	driverName?: string;
	bagId?: string;
	updatedBy?: {
		name: string;
		role: "nurse" | "staff" | "driver" | "treater" | "system";
	};
}

// Weekly activity data for charts
export interface WeeklyActivityData {
	day: string;
	collections: number;
	disposals: number;
}
