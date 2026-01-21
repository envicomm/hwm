import { defineSchema } from "convex/server";
import {
	// Organization tables
	treaters,
	generators,
	haulers,
	treaterHaulerPartners,
	// User management
	users,
	// Organization bridge
	organizationLinks,
	// Bag inventory
	bagInventory,
	bagDistributions,
	// Waste management
	wasteBags,
	wasteStatusHistory,
	// Collection management
	collectionRequests,
	transportPermits,
	// Treatment
	treatments,
	// Disposal
	disposalBatches,
	// Certificates
	treatmentCertificates,
	disposalCertificates,
} from "./schema/index";

export default defineSchema({
	// Organization tables
	treaters,
	generators,
	haulers,
	treaterHaulerPartners,

	// User management
	users,

	// Organization bridge (Better Auth <-> Domain entities)
	organizationLinks,

	// Bag inventory
	bagInventory,
	bagDistributions,

	// Waste management
	wasteBags,
	wasteStatusHistory,

	// Collection management
	collectionRequests,
	transportPermits,

	// Treatment
	treatments,

	// Disposal
	disposalBatches,

	// Certificates
	treatmentCertificates,
	disposalCertificates,
});
