export type WasteStatus =
  | "initialized"
  | "to_be_collected"
  | "collected"
  | "treated"
  | "aggregated"
  | "disposal_requested"
  | "disposed";

export type WasteType =
  | "infectious"
  | "sharps"
  | "pharmaceutical"
  | "pathological"
  | "chemical";

export interface MockWasteBag {
  id: string;
  qrCode: string;
  wasteType: WasteType;
  status: WasteStatus;
  weightKg: number | null;
  description: string | null;
  createdAt: number;
  updatedAt: number;
}

const wasteTypes: WasteType[] = [
  "infectious",
  "sharps",
  "pharmaceutical",
  "pathological",
  "chemical",
];

const statuses: WasteStatus[] = [
  "initialized",
  "to_be_collected",
  "collected",
  "treated",
  "aggregated",
  "disposal_requested",
  "disposed",
];

const descriptions: Record<WasteType, string[]> = {
  infectious: [
    "Contaminated bandages and dressings",
    "Used culture dishes",
    "Blood-soaked materials",
    "Isolation ward waste",
  ],
  sharps: [
    "Used needles and syringes",
    "Scalpel blades",
    "Broken glass vials",
    "Lancets and razors",
  ],
  pharmaceutical: [
    "Expired medications",
    "Unused chemotherapy drugs",
    "Controlled substances",
    "Vaccine remnants",
  ],
  pathological: [
    "Tissue samples",
    "Organ specimens",
    "Body fluids",
    "Anatomical waste",
  ],
  chemical: [
    "Laboratory reagents",
    "Disinfectant residues",
    "Photographic chemicals",
    "Solvent waste",
  ],
};

function generateQRCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "HWM-";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function generateMockWasteBags(count: number): MockWasteBag[] {
  const bags: MockWasteBag[] = [];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  for (let i = 0; i < count; i++) {
    const wasteType = randomFromArray(wasteTypes);
    const status = randomFromArray(statuses);
    const daysAgo = Math.floor(Math.random() * 30);
    const createdAt = now - daysAgo * dayMs - Math.random() * dayMs;

    bags.push({
      id: `bag_${Math.random().toString(36).substring(2, 11)}`,
      qrCode: generateQRCode(),
      wasteType,
      status,
      weightKg: Math.random() > 0.1 ? Math.round(Math.random() * 50 * 10) / 10 : null,
      description: Math.random() > 0.3 ? randomFromArray(descriptions[wasteType]) : null,
      createdAt,
      updatedAt: createdAt + Math.random() * (now - createdAt),
    });
  }

  return bags.sort((a, b) => b.createdAt - a.createdAt);
}

export const mockWasteBags = generateMockWasteBags(25);

export function getStatusCounts(bags: MockWasteBag[]): Record<WasteStatus, number> {
  const counts: Record<WasteStatus, number> = {
    initialized: 0,
    to_be_collected: 0,
    collected: 0,
    treated: 0,
    aggregated: 0,
    disposal_requested: 0,
    disposed: 0,
  };

  for (const bag of bags) {
    counts[bag.status]++;
  }

  return counts;
}

export function getTypeCounts(bags: MockWasteBag[]): Record<WasteType, number> {
  const counts: Record<WasteType, number> = {
    infectious: 0,
    sharps: 0,
    pharmaceutical: 0,
    pathological: 0,
    chemical: 0,
  };

  for (const bag of bags) {
    counts[bag.wasteType]++;
  }

  return counts;
}

export function getRecentActivityCount(bags: MockWasteBag[], days: number = 7): number {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return bags.filter((bag) => bag.createdAt >= cutoff).length;
}

export const statusLabels: Record<WasteStatus, string> = {
  initialized: "Initialized",
  to_be_collected: "To Be Collected",
  collected: "Collected",
  treated: "Treated",
  aggregated: "Aggregated",
  disposal_requested: "Disposal Requested",
  disposed: "Disposed",
};

export const typeLabels: Record<WasteType, string> = {
  infectious: "Infectious",
  sharps: "Sharps",
  pharmaceutical: "Pharmaceutical",
  pathological: "Pathological",
  chemical: "Chemical",
};

// Collection request mock data
export type CollectionRequestStatus =
  | "pending"
  | "assigned"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface MockCollectionRequest {
  id: string;
  status: CollectionRequestStatus;
  bagCount: number;
  requestedAt: number;
  scheduledDate: number | null;
  completedAt: number | null;
}

function generateMockCollectionRequests(count: number): MockCollectionRequest[] {
  const requests: MockCollectionRequest[] = [];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const requestStatuses: CollectionRequestStatus[] = [
    "pending",
    "assigned",
    "in_progress",
    "completed",
    "cancelled",
  ];

  for (let i = 0; i < count; i++) {
    const status = randomFromArray(requestStatuses);
    const daysAgo = Math.floor(Math.random() * 30);
    const requestedAt = now - daysAgo * dayMs - Math.random() * dayMs;

    requests.push({
      id: `req_${Math.random().toString(36).substring(2, 11)}`,
      status,
      bagCount: Math.floor(Math.random() * 15) + 1,
      requestedAt,
      scheduledDate:
        status !== "pending" && status !== "cancelled"
          ? requestedAt + Math.floor(Math.random() * 3) * dayMs
          : null,
      completedAt:
        status === "completed"
          ? requestedAt + Math.floor(Math.random() * 5 + 1) * dayMs
          : null,
    });
  }

  return requests.sort((a, b) => b.requestedAt - a.requestedAt);
}

export const mockCollectionRequests = generateMockCollectionRequests(12);

export function getCollectionRequestStatusCounts(
  requests: MockCollectionRequest[]
): Record<CollectionRequestStatus, number> {
  const counts: Record<CollectionRequestStatus, number> = {
    pending: 0,
    assigned: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
  };

  for (const request of requests) {
    counts[request.status]++;
  }

  return counts;
}

// Time-series data helpers
export interface DailyWasteData {
  date: string;
  count: number;
  weight: number;
}

export function getDailyWasteData(
  bags: MockWasteBag[],
  days: number = 14
): DailyWasteData[] {
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const result: DailyWasteData[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * dayMs);
    const dateStr = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const dayEnd = dayStart + dayMs;

    const dayBags = bags.filter(
      (bag) => bag.createdAt >= dayStart && bag.createdAt < dayEnd
    );
    const totalWeight = dayBags.reduce(
      (sum, bag) => sum + (bag.weightKg || 0),
      0
    );

    result.push({
      date: dateStr,
      count: dayBags.length,
      weight: Math.round(totalWeight * 10) / 10,
    });
  }

  return result;
}

// Activity feed data
export interface ActivityItem {
  id: string;
  type: "bag_created" | "bag_collected" | "bag_treated" | "bag_disposed" | "request_created";
  description: string;
  timestamp: number;
  wasteType?: WasteType;
  status?: WasteStatus;
}

export function getRecentActivity(
  bags: MockWasteBag[],
  requests: MockCollectionRequest[],
  limit: number = 8
): ActivityItem[] {
  const activities: ActivityItem[] = [];

  // Add bag creation activities
  for (const bag of bags) {
    activities.push({
      id: `activity_${bag.id}`,
      type: "bag_created",
      description: `New ${typeLabels[bag.wasteType].toLowerCase()} waste bag tagged`,
      timestamp: bag.createdAt,
      wasteType: bag.wasteType,
      status: bag.status,
    });

    // Add status-based activities
    if (bag.status === "collected" || bag.status === "treated" || bag.status === "disposed") {
      const statusTime = bag.updatedAt;
      activities.push({
        id: `activity_status_${bag.id}`,
        type:
          bag.status === "collected"
            ? "bag_collected"
            : bag.status === "treated"
              ? "bag_treated"
              : "bag_disposed",
        description: `Waste bag ${statusLabels[bag.status].toLowerCase()}`,
        timestamp: statusTime,
        wasteType: bag.wasteType,
        status: bag.status,
      });
    }
  }

  // Add collection request activities
  for (const request of requests) {
    activities.push({
      id: `activity_${request.id}`,
      type: "request_created",
      description: `Collection request for ${request.bagCount} bag${request.bagCount > 1 ? "s" : ""}`,
      timestamp: request.requestedAt,
    });
  }

  return activities
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

export const collectionRequestStatusLabels: Record<CollectionRequestStatus, string> = {
  pending: "Pending",
  assigned: "Assigned",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

// ===== NEW: Generator Storage Capacity =====
export interface MockGenerator {
  id: string;
  name: string;
  address: string;
  maxStorageCapacityKg: number;
  maxBagCount: number;
  storageAlertThreshold: number;
  location: { lat: number; lng: number };
  qrMode: "pre_manufactured" | "hospital_generated" | "both";
}

// Metro Manila coordinates - centered around Makati
export const mockGenerator: MockGenerator = {
  id: "gen_hospital_001",
  name: "St. Luke's Medical Center",
  address: "E Rodriguez Sr. Ave, Quezon City",
  maxStorageCapacityKg: 200,
  maxBagCount: 50,
  storageAlertThreshold: 80,
  location: { lat: 14.6193, lng: 121.0226 }, // Makati area
  qrMode: "both",
};

// Calculate current storage based on mock bags (only pending bags count toward storage)
export function getStorageStats(bags: MockWasteBag[]): {
  currentKg: number;
  currentBags: number;
} {
  const pendingBags = bags.filter(
    (bag) => bag.status === "initialized" || bag.status === "to_be_collected"
  );
  const currentKg = pendingBags.reduce((sum, bag) => sum + (bag.weightKg || 0), 0);
  return {
    currentKg: Math.round(currentKg * 10) / 10,
    currentBags: pendingBags.length,
  };
}

// ===== NEW: Bag Inventory =====
export interface MockBagDistribution {
  id: string;
  quantity: number;
  shippedAt: number;
  receivedAt?: number;
  status: "pending" | "shipped" | "received" | "partial";
}

export interface MockBagInventory {
  availableBags: number;
  recentDistributions: MockBagDistribution[];
}

function generateMockBagDistributions(): MockBagDistribution[] {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  return [
    {
      id: "dist_001",
      quantity: 50,
      shippedAt: now - 3 * dayMs,
      receivedAt: now - 2 * dayMs,
      status: "received",
    },
    {
      id: "dist_002",
      quantity: 30,
      shippedAt: now - 10 * dayMs,
      receivedAt: now - 8 * dayMs,
      status: "received",
    },
    {
      id: "dist_003",
      quantity: 25,
      shippedAt: now - 20 * dayMs,
      receivedAt: now - 18 * dayMs,
      status: "received",
    },
  ];
}

export const mockBagInventory: MockBagInventory = {
  availableBags: 35, // Can adjust this to test low stock states
  recentDistributions: generateMockBagDistributions(),
};

// ===== NEW: Collection Route =====
export interface MockRouteStop {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  order: number;
  isCurrentGenerator?: boolean;
}

export interface MockCollectionRoute {
  routeGroupId: string;
  stops: MockRouteStop[];
  driverLocation: { lat: number; lng: number } | null;
  estimatedArrival: Date | null;
  currentStopIndex: number;
  hasActiveCollection: boolean;
}

// Generate a realistic route with multiple hospital stops in Metro Manila
export const mockCollectionRoute: MockCollectionRoute = {
  routeGroupId: "route_001",
  stops: [
    {
      id: "stop_001",
      name: "Manila Doctors Hospital",
      location: { lat: 14.5831, lng: 120.9794 },
      order: 0,
    },
    {
      id: "stop_002",
      name: "Makati Medical Center",
      location: { lat: 14.5584, lng: 121.0144 },
      order: 1,
    },
    {
      id: mockGenerator.id,
      name: mockGenerator.name,
      location: mockGenerator.location,
      order: 2,
      isCurrentGenerator: true,
    },
    {
      id: "stop_003",
      name: "The Medical City",
      location: { lat: 14.5876, lng: 121.0612 },
      order: 3,
    },
  ],
  // Driver is between stop 1 and 2
  driverLocation: { lat: 14.5720, lng: 120.9950 },
  estimatedArrival: new Date(Date.now() + 45 * 60 * 1000), // 45 minutes from now
  currentStopIndex: 1, // Currently at or heading to stop index 1
  hasActiveCollection: true,
};

// Alternative: No active collection state for testing
export const mockNoActiveCollection: MockCollectionRoute = {
  routeGroupId: "",
  stops: [],
  driverLocation: null,
  estimatedArrival: null,
  currentStopIndex: 0,
  hasActiveCollection: false,
};

// ===== Derived Metrics for Dashboard Insights =====

/**
 * Calculate storage runway - days until storage is full based on generation rate
 */
export function getStorageRunway(
  bags: MockWasteBag[],
  maxKg: number,
  currentKg: number
): { days: number | null; dailyRate: number } {
  const dayMs = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const sevenDaysAgo = now - 7 * dayMs;

  // Get bags created in last 7 days and sum their weight
  const recentBags = bags.filter((bag) => bag.createdAt >= sevenDaysAgo);
  const recentWeight = recentBags.reduce((sum, bag) => sum + (bag.weightKg || 0), 0);
  const dailyRate = recentWeight / 7;

  if (dailyRate <= 0) {
    return { days: null, dailyRate: 0 }; // No generation = infinite runway
  }

  const remainingCapacity = maxKg - currentKg;
  const daysUntilFull = Math.floor(remainingCapacity / dailyRate);

  return {
    days: Math.max(0, daysUntilFull),
    dailyRate: Math.round(dailyRate * 10) / 10,
  };
}

/**
 * Calculate average pickup time - hours from bag creation to collection
 */
export function getAvgPickupTime(bags: MockWasteBag[]): {
  avgHours: number | null;
  sampleSize: number;
} {
  // Get bags that have been collected (status >= collected)
  const collectedStatuses: WasteStatus[] = [
    "collected",
    "treated",
    "aggregated",
    "disposal_requested",
    "disposed",
  ];

  const collectedBags = bags.filter((bag) => collectedStatuses.includes(bag.status));

  if (collectedBags.length === 0) {
    return { avgHours: null, sampleSize: 0 };
  }

  // Calculate time from creation to update (approximation for collection time)
  const totalHours = collectedBags.reduce((sum, bag) => {
    const hoursToCollection = (bag.updatedAt - bag.createdAt) / (1000 * 60 * 60);
    return sum + hoursToCollection;
  }, 0);

  const avgHours = totalHours / collectedBags.length;

  return {
    avgHours: Math.round(avgHours * 10) / 10,
    sampleSize: collectedBags.length,
  };
}

/**
 * Get daily waste type breakdown for the past N days
 */
export interface DailyWasteTypeData {
  date: string;
  dayIndex: number;
  infectious: number;
  sharps: number;
  pharmaceutical: number;
  pathological: number;
  chemical: number;
}

export function getWeeklyWasteTypeData(
  bags: MockWasteBag[],
  days: number = 7
): DailyWasteTypeData[] {
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const result: DailyWasteTypeData[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * dayMs);
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const dayEnd = dayStart + dayMs;

    const dayBags = bags.filter(
      (bag) => bag.createdAt >= dayStart && bag.createdAt < dayEnd
    );

    const typeCount: Record<WasteType, number> = {
      infectious: 0,
      sharps: 0,
      pharmaceutical: 0,
      pathological: 0,
      chemical: 0,
    };

    for (const bag of dayBags) {
      typeCount[bag.wasteType]++;
    }

    result.push({
      date: date.toLocaleDateString("en-US", { weekday: "short" }),
      dayIndex: days - 1 - i,
      ...typeCount,
    });
  }

  return result;
}
