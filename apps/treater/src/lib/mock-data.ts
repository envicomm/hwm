// ===== Types =====
import type { WasteStatus, WasteType, QrMode, CollectionRequestStatus } from "@hwm/types/enums";
import type { MockWasteBag } from "@hwm/types/mock";
import {
  statusLabels,
  statusColors,
  typeLabels,
  qrModeLabels,
} from "@hwm/types/labels";

export type { WasteStatus, WasteType, QrMode, CollectionRequestStatus };
export type { MockWasteBag };
export { statusLabels, statusColors, typeLabels, qrModeLabels };

// Treater-specific mock generator with computed stats
export interface TreaterMockGenerator {
  id: string;
  name: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  facilityCode: string | null;
  qrMode: QrMode;
  maxStorageCapacityKg: number;
  maxBagCount: number;
  storageAlertThreshold: number;
  location: { lat: number; lng: number } | null;
  isActive: boolean;
  createdAt: number;
  // Computed stats (would come from real queries)
  currentStorageKg: number;
  currentBagCount: number;
  pendingBags: number;
  treatedBags: number;
  lastActivityAt: number;
}

// Treater-specific mock collection request
export interface TreaterMockCollectionRequest {
  id: string;
  generatorId: string;
  status: CollectionRequestStatus;
  bagCount: number;
  requestedAt: number;
}

// ===== Helper Functions =====
function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 11)}`;
}

// ===== Mock Data Generation =====
const philippineHospitals = [
  { name: "St. Luke's Medical Center", city: "Quezon City", lat: 14.6193, lng: 121.0226 },
  { name: "Makati Medical Center", city: "Makati", lat: 14.5584, lng: 121.0144 },
  { name: "The Medical City", city: "Pasig", lat: 14.5876, lng: 121.0612 },
  { name: "Manila Doctors Hospital", city: "Manila", lat: 14.5831, lng: 120.9794 },
  { name: "Philippine General Hospital", city: "Manila", lat: 14.5797, lng: 120.9847 },
  { name: "Cardinal Santos Medical Center", city: "San Juan", lat: 14.6014, lng: 121.0368 },
  { name: "Asian Hospital and Medical Center", city: "Muntinlupa", lat: 14.4196, lng: 121.0359 },
  { name: "University of Santo Tomas Hospital", city: "Manila", lat: 14.6086, lng: 120.9897 },
];

function generateMockGenerators(): TreaterMockGenerator[] {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  return philippineHospitals.map((hospital, index) => {
    const maxStorage = 150 + Math.floor(Math.random() * 150);
    const maxBags = 30 + Math.floor(Math.random() * 40);
    const currentStorage = Math.floor(Math.random() * maxStorage);
    const currentBags = Math.floor((currentStorage / maxStorage) * maxBags);

    return {
      id: `gen_${String(index + 1).padStart(3, "0")}`,
      name: hospital.name,
      address: `${Math.floor(Math.random() * 999) + 1} Medical Drive, ${hospital.city}, Metro Manila`,
      contactEmail: `waste.dept@${hospital.name.toLowerCase().replace(/[^a-z]/g, "")}.ph`,
      contactPhone: `+63 2 ${String(Math.floor(Math.random() * 9000) + 1000)} ${String(Math.floor(Math.random() * 9000) + 1000)}`,
      facilityCode: `PH-NCR-${String(index + 1).padStart(4, "0")}`,
      qrMode: randomFromArray<QrMode>(["pre_manufactured", "hospital_generated", "both"]),
      maxStorageCapacityKg: maxStorage,
      maxBagCount: maxBags,
      storageAlertThreshold: 80,
      location: { lat: hospital.lat, lng: hospital.lng },
      isActive: index < 7, // Last one is inactive for demo
      createdAt: now - (30 - index) * dayMs,
      currentStorageKg: currentStorage,
      currentBagCount: currentBags,
      pendingBags: Math.floor(Math.random() * 10),
      treatedBags: Math.floor(Math.random() * 50) + 20,
      lastActivityAt: now - Math.floor(Math.random() * 3) * dayMs,
    };
  });
}

export const mockGenerators = generateMockGenerators();

// Generate waste bags across all generators
function generateMockWasteBags(): MockWasteBag[] {
  const bags: MockWasteBag[] = [];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const statuses: WasteStatus[] = [
    "initialized",
    "to_be_collected",
    "collected",
    "treated",
    "aggregated",
    "disposal_requested",
    "disposed",
  ];
  const wasteTypes: WasteType[] = [
    "infectious",
    "sharps",
    "pharmaceutical",
    "pathological",
    "chemical",
  ];

  for (const generator of mockGenerators) {
    const bagCount = 15 + Math.floor(Math.random() * 20);
    for (let i = 0; i < bagCount; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      bags.push({
        id: generateId("bag"),
        qrCode: `HWM-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        generatorId: generator.id,
        wasteType: randomFromArray(wasteTypes),
        status: randomFromArray(statuses),
        weightKg: Math.random() > 0.1 ? Math.round(Math.random() * 30 * 10) / 10 : null,
        createdAt: now - daysAgo * dayMs,
      });
    }
  }

  return bags.sort((a, b) => b.createdAt - a.createdAt);
}

export const mockWasteBags = generateMockWasteBags();

// Generate collection requests
function generateMockCollectionRequests(): TreaterMockCollectionRequest[] {
  const requests: TreaterMockCollectionRequest[] = [];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const statuses: CollectionRequestStatus[] = [
    "pending",
    "assigned",
    "in_progress",
    "completed",
    "cancelled",
  ];

  for (const generator of mockGenerators.filter((g) => g.isActive)) {
    const requestCount = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < requestCount; i++) {
      const daysAgo = Math.floor(Math.random() * 14);
      requests.push({
        id: generateId("req"),
        generatorId: generator.id,
        status: randomFromArray(statuses),
        bagCount: Math.floor(Math.random() * 12) + 1,
        requestedAt: now - daysAgo * dayMs,
      });
    }
  }

  return requests.sort((a, b) => b.requestedAt - a.requestedAt);
}

export const mockCollectionRequests = generateMockCollectionRequests();

// ===== Aggregation Functions =====
export function getStatusCounts(): Record<WasteStatus, number> {
  const counts: Record<WasteStatus, number> = {
    initialized: 0,
    to_be_collected: 0,
    collected: 0,
    treated: 0,
    aggregated: 0,
    disposal_requested: 0,
    disposed: 0,
  };

  for (const bag of mockWasteBags) {
    counts[bag.status]++;
  }

  return counts;
}

export function getPendingRequestCount(): number {
  return mockCollectionRequests.filter((r) => r.status === "pending").length;
}

export function getTotalTreatedThisMonth(): number {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  return mockWasteBags.filter(
    (b) => b.status === "treated" && b.createdAt >= thirtyDaysAgo
  ).length;
}

export function getTotalWasteBags(): number {
  return mockWasteBags.length;
}

export function getGeneratorsNearCapacity(): TreaterMockGenerator[] {
  return mockGenerators
    .filter((g) => {
      const utilization = (g.currentStorageKg / g.maxStorageCapacityKg) * 100;
      return utilization >= g.storageAlertThreshold && g.isActive;
    })
    .sort((a, b) => {
      const utilA = a.currentStorageKg / a.maxStorageCapacityKg;
      const utilB = b.currentStorageKg / b.maxStorageCapacityKg;
      return utilB - utilA;
    });
}

export function getStorageUtilization(generator: TreaterMockGenerator): number {
  return Math.round((generator.currentStorageKg / generator.maxStorageCapacityKg) * 100);
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

// Chart data for waste status distribution
export function getStatusChartData(): Array<{ name: string; value: number; color: string }> {
  const counts = getStatusCounts();
  const chartColors: Record<WasteStatus, string> = {
    initialized: "#94a3b8",
    to_be_collected: "#fbbf24",
    collected: "#3b82f6",
    treated: "#10b981",
    aggregated: "#a855f7",
    disposal_requested: "#f97316",
    disposed: "#22c55e",
  };

  return Object.entries(counts).map(([status, value]) => ({
    name: statusLabels[status as WasteStatus],
    value,
    color: chartColors[status as WasteStatus],
  }));
}
