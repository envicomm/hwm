import { defineSchema } from "convex/server";
import {
	// Organization tables
	treaters,
	generators,
	haulers,
	treaterHaulerPartners,
	// User management
	users,
	// Waste management
	wasteBags,
	wasteStatusHistory,
	// Collection management
	collectionRequests,
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

	// Waste management
	wasteBags,
	wasteStatusHistory,

	// Collection management
	collectionRequests,

	// Treatment
	treatments,

	// Disposal
	disposalBatches,

	// Certificates
	treatmentCertificates,
	disposalCertificates,
});
