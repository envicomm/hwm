import type {
	CollectionRequestStatus,
	DisposalBatchStatus,
	DriverStatus,
	QrMode,
	WasteStatus,
	WasteType,
} from "./enums";

// Common location type
export interface Location {
	lat: number;
	lng: number;
}

// Organization types
export interface Generator {
	id: string;
	treaterId: string;
	name: string;
	address: string;
	contactEmail: string;
	contactPhone: string;
	facilityCode?: string | null;
	qrMode: QrMode;
	maxStorageCapacityKg?: number;
	maxBagCount?: number;
	storageAlertThreshold?: number;
	location?: Location | null;
	isActive: boolean;
	createdAt: number;
	updatedAt?: number;
}

export interface Treater {
	id: string;
	name: string;
	address: string;
	contactEmail: string;
	contactPhone: string;
	facilityCode?: string;
	location?: Location | null;
	isActive: boolean;
	createdAt: number;
	updatedAt?: number;
}

export interface Hauler {
	id: string;
	name: string;
	address: string;
	contactEmail: string;
	contactPhone: string;
	licenseNumber: string;
	location?: Location | null;
	serviceArea?: {
		cities: string[];
	};
	isActive?: boolean;
	createdAt?: number;
	updatedAt?: number;
}

// Driver entity
export interface Driver {
	id: string;
	name: string;
	phone: string;
	status: DriverStatus;
	currentRouteId?: string;
	vehiclePlate: string;
	completedToday: number;
}

// Waste bag entity
export interface WasteBag {
	id: string;
	qrCode: string;
	qrSource?: "pre_manufactured" | "hospital_generated";
	bagInventoryId?: string;
	generatorId: string;
	treaterId: string;
	wasteType: WasteType;
	description?: string | null;
	weightKg?: number | null;
	imageUrl?: string;
	imageAnalysis?: string;
	status: WasteStatus;
	collectionRequestId?: string;
	treatmentId?: string;
	disposalBatchId?: string;
	treatmentCertificateId?: string;
	createdBy?: string;
	createdAt: number;
	updatedAt: number;
}

// Collection request entity
export interface CollectionRequest {
	id: string;
	generatorId: string;
	generatorName?: string;
	treaterId: string;
	treaterName?: string;
	haulerId?: string;
	requestedPickupDate?: number;
	estimatedBagCount?: number;
	notes?: string;
	status: CollectionRequestStatus;
	driverId?: string;
	driverName?: string;
	routeOrder?: number;
	routeGroupId?: string;
	estimatedArrival?: number;
	driverLocation?: Location & { updatedAt: number };
	actualPickupAt?: number;
	pickupSignatureUrl?: string;
	transportPermitId?: string;
	createdBy?: string;
	createdAt: number;
	updatedAt?: number;
}

// Disposal batch entity
export interface DisposalBatch {
	id: string;
	treaterId: string;
	treaterName?: string;
	batchNumber: string;
	status: DisposalBatchStatus;
	totalBagCount: number;
	totalWeightKg: number;
	driverId?: string;
	driverName?: string;
	pickupRequestedAt?: number;
	disposalSite?: string;
	createdAt: number;
	updatedAt?: number;
}
