// Types from @hwm/types
import type {
  CollectionRequestStatus,
  DisposalBatchStatus,
  DriverStatus,
  ActivityType,
} from "@hwm/types/enums";
import type { Location } from "@hwm/types/entities";
import {
  collectionStatusColors,
  disposalStatusColors,
  driverStatusColors,
} from "@hwm/types/labels";

export type { CollectionRequestStatus, DisposalBatchStatus, DriverStatus, ActivityType };
export { collectionStatusColors, disposalStatusColors, driverStatusColors };

// Trucking-specific driver with lastUpdated field
export interface Driver {
  id: string;
  name: string;
  phone: string;
  status: DriverStatus;
  currentRouteId?: string;
  vehiclePlate: string;
  completedToday: number;
  lastUpdated: number;
}

// Trucking-specific collection request with extended fields
export interface CollectionRequest {
  id: string;
  generatorId: string;
  generatorName: string;
  treaterId: string;
  treaterName: string;
  status: CollectionRequestStatus;
  driverId?: string;
  driverName?: string;
  requestedPickupDate: number;
  estimatedBagCount: number;
  actualPickupAt?: number;
  routeOrder?: number;
  createdAt: number;
}

// Trucking-specific disposal batch
export interface DisposalBatch {
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

// Trucking-specific hauler
export interface Hauler {
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

// Mock hauler
export const mockHauler: Hauler = {
  id: "haul_001",
  name: "Metro Manila Hauling Services",
  address: "123 Industrial Blvd, Pasig City, Metro Manila",
  contactEmail: "dispatch@metromanilahaul.com",
  contactPhone: "+63 2 8888 1234",
  licenseNumber: "MMHS-2024-0892",
  location: {
    lat: 14.5764,
    lng: 121.0851,
  },
  serviceArea: {
    cities: ["makati", "taguig", "pasig", "mandaluyong", "quezon_city"],
  },
};

// Mock drivers
export const mockDrivers: Driver[] = [
  {
    id: "drv_001",
    name: "Juan Santos",
    phone: "+63 917 123 4567",
    status: "on_route",
    currentRouteId: "route_001",
    vehiclePlate: "ABC 1234",
    completedToday: 3,
    lastUpdated: Date.now() - 12 * 60 * 1000, // 12 min ago
  },
  {
    id: "drv_002",
    name: "Pedro Cruz",
    phone: "+63 918 234 5678",
    status: "on_route",
    currentRouteId: "route_002",
    vehiclePlate: "DEF 5678",
    completedToday: 2,
    lastUpdated: Date.now() - 25 * 60 * 1000, // 25 min ago
  },
  {
    id: "drv_003",
    name: "Maria Garcia",
    phone: "+63 919 345 6789",
    status: "available",
    vehiclePlate: "GHI 9012",
    completedToday: 4,
    lastUpdated: Date.now() - 45 * 60 * 1000, // 45 min ago
  },
  {
    id: "drv_004",
    name: "Jose Reyes",
    phone: "+63 920 456 7890",
    status: "returning",
    vehiclePlate: "JKL 3456",
    completedToday: 3,
    lastUpdated: Date.now() - 8 * 60 * 1000, // 8 min ago
  },
  {
    id: "drv_005",
    name: "Ana Martinez",
    phone: "+63 921 567 8901",
    status: "available",
    vehiclePlate: "MNO 7890",
    completedToday: 5,
    lastUpdated: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
  },
  {
    id: "drv_006",
    name: "Roberto Lim",
    phone: "+63 922 678 9012",
    status: "off_duty",
    vehiclePlate: "PQR 1234",
    completedToday: 0,
    lastUpdated: Date.now() - 8 * 60 * 60 * 1000, // 8 hours ago
  },
];

// Helper to generate dates
const now = Date.now();
const day = 24 * 60 * 60 * 1000;

// Mock collection requests
export const mockCollectionRequests: CollectionRequest[] = [
  {
    id: "col_001",
    generatorId: "gen_001",
    generatorName: "St. Luke's Medical Center",
    treaterId: "trt_001",
    treaterName: "Metro Manila Treatment Facility",
    status: "in_progress",
    driverId: "drv_001",
    driverName: "Juan Santos",
    requestedPickupDate: now + 2 * 60 * 60 * 1000,
    estimatedBagCount: 15,
    routeOrder: 1,
    createdAt: now - 2 * day,
  },
  {
    id: "col_002",
    generatorId: "gen_002",
    generatorName: "Philippine General Hospital",
    treaterId: "trt_001",
    treaterName: "Metro Manila Treatment Facility",
    status: "in_progress",
    driverId: "drv_001",
    driverName: "Juan Santos",
    requestedPickupDate: now + 3 * 60 * 60 * 1000,
    estimatedBagCount: 22,
    routeOrder: 2,
    createdAt: now - 2 * day,
  },
  {
    id: "col_003",
    generatorId: "gen_003",
    generatorName: "Makati Medical Center",
    treaterId: "trt_001",
    treaterName: "Metro Manila Treatment Facility",
    status: "assigned",
    driverId: "drv_002",
    driverName: "Pedro Cruz",
    requestedPickupDate: now + 4 * 60 * 60 * 1000,
    estimatedBagCount: 18,
    routeOrder: 1,
    createdAt: now - 1 * day,
  },
  {
    id: "col_004",
    generatorId: "gen_004",
    generatorName: "Medical City",
    treaterId: "trt_001",
    treaterName: "Metro Manila Treatment Facility",
    status: "pending",
    requestedPickupDate: now + 6 * 60 * 60 * 1000,
    estimatedBagCount: 12,
    createdAt: now - 12 * 60 * 60 * 1000,
  },
  {
    id: "col_005",
    generatorId: "gen_005",
    generatorName: "Cardinal Santos Medical Center",
    treaterId: "trt_001",
    treaterName: "Metro Manila Treatment Facility",
    status: "pending",
    requestedPickupDate: now + 8 * 60 * 60 * 1000,
    estimatedBagCount: 9,
    createdAt: now - 6 * 60 * 60 * 1000,
  },
  {
    id: "col_006",
    generatorId: "gen_006",
    generatorName: "Asian Hospital",
    treaterId: "trt_001",
    treaterName: "Metro Manila Treatment Facility",
    status: "completed",
    driverId: "drv_003",
    driverName: "Maria Garcia",
    requestedPickupDate: now - 4 * 60 * 60 * 1000,
    actualPickupAt: now - 3 * 60 * 60 * 1000,
    estimatedBagCount: 20,
    createdAt: now - 1 * day,
  },
  {
    id: "col_007",
    generatorId: "gen_007",
    generatorName: "UST Hospital",
    treaterId: "trt_001",
    treaterName: "Metro Manila Treatment Facility",
    status: "completed",
    driverId: "drv_004",
    driverName: "Jose Reyes",
    requestedPickupDate: now - 6 * 60 * 60 * 1000,
    actualPickupAt: now - 5 * 60 * 60 * 1000,
    estimatedBagCount: 14,
    createdAt: now - 2 * day,
  },
  {
    id: "col_008",
    generatorId: "gen_008",
    generatorName: "Chinese General Hospital",
    treaterId: "trt_001",
    treaterName: "Metro Manila Treatment Facility",
    status: "completed",
    driverId: "drv_005",
    driverName: "Ana Martinez",
    requestedPickupDate: now - 8 * 60 * 60 * 1000,
    actualPickupAt: now - 7 * 60 * 60 * 1000,
    estimatedBagCount: 11,
    createdAt: now - 2 * day,
  },
  {
    id: "col_009",
    generatorId: "gen_001",
    generatorName: "St. Luke's Medical Center",
    treaterId: "trt_001",
    treaterName: "Metro Manila Treatment Facility",
    status: "pending",
    requestedPickupDate: now + day,
    estimatedBagCount: 16,
    createdAt: now - 2 * 60 * 60 * 1000,
  },
  {
    id: "col_010",
    generatorId: "gen_002",
    generatorName: "Philippine General Hospital",
    treaterId: "trt_001",
    treaterName: "Metro Manila Treatment Facility",
    status: "cancelled",
    requestedPickupDate: now - 2 * day,
    estimatedBagCount: 8,
    createdAt: now - 3 * day,
  },
  {
    id: "col_011",
    generatorId: "gen_003",
    generatorName: "Makati Medical Center",
    treaterId: "trt_001",
    treaterName: "Metro Manila Treatment Facility",
    status: "assigned",
    driverId: "drv_002",
    driverName: "Pedro Cruz",
    requestedPickupDate: now + 5 * 60 * 60 * 1000,
    estimatedBagCount: 13,
    routeOrder: 2,
    createdAt: now - 18 * 60 * 60 * 1000,
  },
  {
    id: "col_012",
    generatorId: "gen_004",
    generatorName: "Medical City",
    treaterId: "trt_001",
    treaterName: "Metro Manila Treatment Facility",
    status: "completed",
    driverId: "drv_003",
    driverName: "Maria Garcia",
    requestedPickupDate: now - 10 * 60 * 60 * 1000,
    actualPickupAt: now - 9 * 60 * 60 * 1000,
    estimatedBagCount: 19,
    createdAt: now - 2 * day,
  },
];

// Mock disposal batches
export const mockDisposalBatches: DisposalBatch[] = [
  {
    id: "disp_001",
    treaterId: "trt_001",
    treaterName: "Metro Manila Treatment Facility",
    batchNumber: "BATCH-2024-001",
    status: "in_transit",
    totalBagCount: 150,
    totalWeightKg: 425,
    driverId: "drv_004",
    driverName: "Jose Reyes",
    pickupRequestedAt: now - 2 * 60 * 60 * 1000,
    disposalSite: "Metro Manila Sanitary Landfill",
    createdAt: now - 3 * day,
  },
  {
    id: "disp_002",
    treaterId: "trt_001",
    treaterName: "Metro Manila Treatment Facility",
    batchNumber: "BATCH-2024-002",
    status: "disposal_requested",
    totalBagCount: 180,
    totalWeightKg: 512,
    pickupRequestedAt: now - 30 * 60 * 1000,
    disposalSite: "Metro Manila Sanitary Landfill",
    createdAt: now - 2 * day,
  },
  {
    id: "disp_003",
    treaterId: "trt_001",
    treaterName: "Metro Manila Treatment Facility",
    batchNumber: "BATCH-2024-003",
    status: "sealed",
    totalBagCount: 120,
    totalWeightKg: 340,
    createdAt: now - 1 * day,
  },
  {
    id: "disp_004",
    treaterId: "trt_001",
    treaterName: "Metro Manila Treatment Facility",
    batchNumber: "BATCH-2024-004",
    status: "aggregating",
    totalBagCount: 45,
    totalWeightKg: 128,
    createdAt: now - 12 * 60 * 60 * 1000,
  },
  {
    id: "disp_005",
    treaterId: "trt_002",
    treaterName: "Cebu Treatment Center",
    batchNumber: "BATCH-2024-005",
    status: "disposed",
    totalBagCount: 200,
    totalWeightKg: 580,
    driverId: "drv_005",
    driverName: "Ana Martinez",
    pickupRequestedAt: now - 2 * day,
    disposalSite: "Cebu Sanitary Landfill",
    createdAt: now - 5 * day,
  },
  {
    id: "disp_006",
    treaterId: "trt_001",
    treaterName: "Metro Manila Treatment Facility",
    batchNumber: "BATCH-2024-006",
    status: "disposed",
    totalBagCount: 165,
    totalWeightKg: 468,
    driverId: "drv_001",
    driverName: "Juan Santos",
    pickupRequestedAt: now - 3 * day,
    disposalSite: "Metro Manila Sanitary Landfill",
    createdAt: now - 6 * day,
  },
  {
    id: "disp_007",
    treaterId: "trt_001",
    treaterName: "Metro Manila Treatment Facility",
    batchNumber: "BATCH-2024-007",
    status: "disposal_requested",
    totalBagCount: 95,
    totalWeightKg: 270,
    pickupRequestedAt: now - 1 * 60 * 60 * 1000,
    disposalSite: "Metro Manila Sanitary Landfill",
    createdAt: now - 4 * day,
  },
  {
    id: "disp_008",
    treaterId: "trt_001",
    treaterName: "Metro Manila Treatment Facility",
    batchNumber: "BATCH-2024-008",
    status: "sealed",
    totalBagCount: 88,
    totalWeightKg: 250,
    createdAt: now - 6 * 60 * 60 * 1000,
  },
];

// Helper functions
export function getCollectionsByStatus() {
  const counts: Record<CollectionRequestStatus, number> = {
    pending: 0,
    assigned: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
  };
  mockCollectionRequests.forEach((req) => {
    counts[req.status]++;
  });
  return counts;
}

export function getDisposalsByStatus() {
  const counts: Record<DisposalBatchStatus, number> = {
    aggregating: 0,
    sealed: 0,
    disposal_requested: 0,
    in_transit: 0,
    disposed: 0,
  };
  mockDisposalBatches.forEach((batch) => {
    counts[batch.status]++;
  });
  return counts;
}

export function getActiveDriverCount() {
  return mockDrivers.filter(
    (d) => d.status === "on_route" || d.status === "returning"
  ).length;
}

export function getAvailableDriverCount() {
  return mockDrivers.filter((d) => d.status === "available").length;
}

export function getTotalCompletedToday() {
  return mockDrivers.reduce((sum, d) => sum + d.completedToday, 0);
}

export function getActiveCollections() {
  return mockCollectionRequests.filter(
    (r) => r.status === "assigned" || r.status === "in_progress"
  ).length;
}

export function getPendingDisposals() {
  return mockDisposalBatches.filter(
    (b) => b.status === "disposal_requested" || b.status === "sealed"
  ).length;
}

// Weekly activity data for charts
export function getWeeklyActivityData() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map((day) => ({
    day,
    collections: Math.floor(Math.random() * 8) + 4,
    disposals: Math.floor(Math.random() * 3) + 1,
  }));
}

// Trucking-specific activity item (extends base)
interface TruckingActivityItem {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: number;
  driverName?: string;
  location?: string;
}

// Generate recent activities from mock data
export function getRecentActivities(limit = 6): TruckingActivityItem[] {
  const activities: TruckingActivityItem[] = [];
  const now = Date.now();

  // Add activities from collection requests
  mockCollectionRequests
    .filter((r) => r.status === "completed" || r.status === "in_progress")
    .slice(0, 4)
    .forEach((req, idx) => {
      if (req.status === "completed" && req.actualPickupAt) {
        activities.push({
          id: `act_col_comp_${req.id}`,
          type: "collection_completed",
          description: `Collection completed at ${req.generatorName}`,
          timestamp: req.actualPickupAt,
          driverName: req.driverName,
          location: req.generatorName,
        });
      }
      if (req.status === "in_progress") {
        activities.push({
          id: `act_col_start_${req.id}`,
          type: "collection_started",
          description: `Collection started at ${req.generatorName}`,
          timestamp: now - (idx + 1) * 30 * 60 * 1000,
          driverName: req.driverName,
          location: req.generatorName,
        });
      }
    });

  // Add activities from disposal batches
  mockDisposalBatches
    .filter((b) => b.status === "in_transit" || b.status === "disposed")
    .slice(0, 3)
    .forEach((batch) => {
      if (batch.status === "disposed") {
        activities.push({
          id: `act_disp_comp_${batch.id}`,
          type: "disposal_completed",
          description: `Batch ${batch.batchNumber} disposed at ${batch.disposalSite}`,
          timestamp: batch.pickupRequestedAt
            ? batch.pickupRequestedAt + 4 * 60 * 60 * 1000
            : now - 6 * 60 * 60 * 1000,
          driverName: batch.driverName,
        });
      }
      if (batch.status === "in_transit") {
        activities.push({
          id: `act_disp_start_${batch.id}`,
          type: "disposal_started",
          description: `Disposal transport started for ${batch.batchNumber}`,
          timestamp: batch.pickupRequestedAt || now - 2 * 60 * 60 * 1000,
          driverName: batch.driverName,
        });
      }
    });

  // Add driver status changes
  mockDrivers
    .filter((d) => d.status === "available" && d.completedToday > 0)
    .slice(0, 2)
    .forEach((driver, idx) => {
      activities.push({
        id: `act_drv_${driver.id}`,
        type: "driver_available",
        description: `${driver.name} completed route and is now available`,
        timestamp: now - (idx + 1) * 45 * 60 * 1000,
        driverName: driver.name,
      });
    });

  // Sort by timestamp descending and limit
  return activities
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}
