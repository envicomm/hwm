import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

// Test user credentials (for documentation)
const TEST_CREDENTIALS = {
	treater: {
		email: "treater@test.hwm.app",
		password: "TestPassword123!",
		name: "Test Treater Admin",
	},
	generator: {
		email: "generator@test.hwm.app",
		password: "TestPassword123!",
		name: "Test Generator Admin",
	},
	hauler: {
		email: "hauler@test.hwm.app",
		password: "TestPassword123!",
		name: "Test Hauler Admin",
	},
};

/**
 * Seeds test organization data for development.
 * Creates treater, generator, hauler, and their relationships.
 *
 * After running this, sign up through the webapp UIs using the suggested emails.
 * In development mode, email verification is disabled so you can log in immediately.
 *
 * Run with: pnpm --filter @hwm/convex seed
 */
export const seedTestData = internalMutation({
	args: {
		forceReseed: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		// Safety check - don't run in production
		if (process.env.NODE_ENV === "production") {
			throw new Error("Cannot seed test data in production");
		}

		const now = Date.now();
		const results: Record<string, unknown> = {};

		// Check if already seeded by looking for test treater
		const existingTreater = await ctx.db
			.query("treaters")
			.filter((q) => q.eq(q.field("name"), "Test Treatment Facility"))
			.first();

		if (existingTreater && !args.forceReseed) {
			return {
				success: false,
				message:
					"Test data already exists. Use { forceReseed: true } to recreate.",
				existingTreaterId: existingTreater._id,
				suggestedCredentials: TEST_CREDENTIALS,
			};
		}

		// If force reseeding, clean up first
		if (existingTreater && args.forceReseed) {
			console.log("Force reseeding - cleaning up existing test data...");

			// Delete generators under this treater
			const generators = await ctx.db
				.query("generators")
				.withIndex("by_treater", (q) => q.eq("treaterId", existingTreater._id))
				.collect();
			for (const gen of generators) {
				// Delete org link for this generator
				const genLink = await ctx.db
					.query("organizationLinks")
					.withIndex("by_generator", (q) => q.eq("generatorId", gen._id))
					.first();
				if (genLink) await ctx.db.delete(genLink._id);

				// Delete app user for this generator
				const genUser = await ctx.db
					.query("users")
					.withIndex("by_generator", (q) => q.eq("generatorId", gen._id))
					.first();
				if (genUser) await ctx.db.delete(genUser._id);

				await ctx.db.delete(gen._id);
			}

			// Delete hauler partnerships
			const partnerships = await ctx.db
				.query("treaterHaulerPartners")
				.withIndex("by_treater", (q) => q.eq("treaterId", existingTreater._id))
				.collect();
			for (const p of partnerships) {
				await ctx.db.delete(p._id);
			}

			// Delete treater org link
			const treaterLink = await ctx.db
				.query("organizationLinks")
				.withIndex("by_treater", (q) => q.eq("treaterId", existingTreater._id))
				.first();
			if (treaterLink) await ctx.db.delete(treaterLink._id);

			// Delete treater app user
			const treaterUser = await ctx.db
				.query("users")
				.withIndex("by_treater", (q) => q.eq("treaterId", existingTreater._id))
				.first();
			if (treaterUser) await ctx.db.delete(treaterUser._id);

			// Delete the treater
			await ctx.db.delete(existingTreater._id);

			// Delete test hauler
			const testHauler = await ctx.db
				.query("haulers")
				.filter((q) => q.eq(q.field("name"), "Test Trucking Company"))
				.first();
			if (testHauler) {
				// Delete hauler org link
				const haulerLink = await ctx.db
					.query("organizationLinks")
					.withIndex("by_hauler", (q) => q.eq("haulerId", testHauler._id))
					.first();
				if (haulerLink) await ctx.db.delete(haulerLink._id);

				// Delete hauler app user
				const haulerUser = await ctx.db
					.query("users")
					.withIndex("by_hauler", (q) => q.eq("haulerId", testHauler._id))
					.first();
				if (haulerUser) await ctx.db.delete(haulerUser._id);

				await ctx.db.delete(testHauler._id);
			}

			console.log("Cleaned up existing test data");
		}

		// Step 1: Create Treater organization entity
		const treaterId = await ctx.db.insert("treaters", {
			name: "Test Treatment Facility",
			address: "123 Treatment Way, Test City, TC 12345",
			contactEmail: TEST_CREDENTIALS.treater.email,
			contactPhone: "+1-555-0100",
			licenseNumber: "TRE-TEST-001",
			isActive: true,
			createdAt: now,
			updatedAt: now,
		});
		results.treaterId = treaterId;
		console.log("Created treater:", treaterId);

		// Step 2: Create Generator (child of Treater)
		const generatorId = await ctx.db.insert("generators", {
			treaterId: treaterId,
			name: "Test Hospital",
			address: "456 Hospital Blvd, Test City, TC 12345",
			contactEmail: TEST_CREDENTIALS.generator.email,
			contactPhone: "+1-555-0200",
			facilityCode: "GEN-TEST-001",
			qrMode: "both",
			isActive: true,
			createdAt: now,
			updatedAt: now,
		});
		results.generatorId = generatorId;
		console.log("Created generator:", generatorId);

		// Step 3: Create Hauler
		const haulerId = await ctx.db.insert("haulers", {
			name: "Test Trucking Company",
			address: "789 Trucking Lane, Test City, TC 12345",
			contactEmail: TEST_CREDENTIALS.hauler.email,
			contactPhone: "+1-555-0300",
			licenseNumber: "HAU-TEST-001",
			isActive: true,
			createdAt: now,
			updatedAt: now,
		});
		results.haulerId = haulerId;
		console.log("Created hauler:", haulerId);

		// Step 4: Create Treater-Hauler Partnership
		const partnershipId = await ctx.db.insert("treaterHaulerPartners", {
			treaterId: treaterId,
			haulerId: haulerId,
			isActive: true,
			createdAt: now,
		});
		results.partnershipId = partnershipId;
		console.log("Created partnership:", partnershipId);

		// Step 5: Create application users table entries
		// These are the app-level user records (separate from Better Auth users)
		await ctx.db.insert("users", {
			name: TEST_CREDENTIALS.treater.name,
			email: TEST_CREDENTIALS.treater.email,
			role: "treater",
			treaterId: treaterId,
			isActive: true,
			createdAt: now,
			updatedAt: now,
		});

		await ctx.db.insert("users", {
			name: TEST_CREDENTIALS.generator.name,
			email: TEST_CREDENTIALS.generator.email,
			role: "generator",
			generatorId: generatorId,
			isActive: true,
			createdAt: now,
			updatedAt: now,
		});

		await ctx.db.insert("users", {
			name: TEST_CREDENTIALS.hauler.name,
			email: TEST_CREDENTIALS.hauler.email,
			role: "hauler",
			haulerId: haulerId,
			isActive: true,
			createdAt: now,
			updatedAt: now,
		});
		console.log("Created application users");

		return {
			success: true,
			message: `Test organizations seeded successfully.

NEXT STEPS:
1. Start the webapp you want to test (e.g., pnpm --filter @hwm/generator dev)
2. Go to the signup page
3. Sign up with one of these emails (use any password):
   - Treater app (3002): ${TEST_CREDENTIALS.treater.email}
   - Generator app (3001): ${TEST_CREDENTIALS.generator.email}
   - Trucking app (3003): ${TEST_CREDENTIALS.hauler.email}
4. In dev mode, email verification is skipped - you can log in immediately!`,
			suggestedCredentials: TEST_CREDENTIALS,
			...results,
		};
	},
});

/**
 * Clears test data from the database.
 *
 * Run with: pnpm --filter @hwm/convex seed:clear
 */
export const clearTestData = internalMutation({
	args: {},
	handler: async (ctx) => {
		if (process.env.NODE_ENV === "production") {
			throw new Error("Cannot clear test data in production");
		}

		let deletedCount = 0;

		// Delete test application users by email
		for (const userConfig of Object.values(TEST_CREDENTIALS)) {
			const appUser = await ctx.db
				.query("users")
				.withIndex("by_email", (q) => q.eq("email", userConfig.email))
				.first();
			if (appUser) {
				await ctx.db.delete(appUser._id);
				deletedCount++;
			}
		}

		// Delete test treater and cascade
		const testTreater = await ctx.db
			.query("treaters")
			.filter((q) => q.eq(q.field("name"), "Test Treatment Facility"))
			.first();

		if (testTreater) {
			// Delete generators under this treater
			const generators = await ctx.db
				.query("generators")
				.withIndex("by_treater", (q) => q.eq("treaterId", testTreater._id))
				.collect();
			for (const gen of generators) {
				// Delete org link for this generator
				const genLink = await ctx.db
					.query("organizationLinks")
					.withIndex("by_generator", (q) => q.eq("generatorId", gen._id))
					.first();
				if (genLink) await ctx.db.delete(genLink._id);

				await ctx.db.delete(gen._id);
				deletedCount++;
			}

			// Delete hauler partnerships
			const partnerships = await ctx.db
				.query("treaterHaulerPartners")
				.withIndex("by_treater", (q) => q.eq("treaterId", testTreater._id))
				.collect();
			for (const p of partnerships) {
				await ctx.db.delete(p._id);
				deletedCount++;
			}

			// Delete treater org link
			const treaterLink = await ctx.db
				.query("organizationLinks")
				.withIndex("by_treater", (q) => q.eq("treaterId", testTreater._id))
				.first();
			if (treaterLink) await ctx.db.delete(treaterLink._id);

			// Delete the treater
			await ctx.db.delete(testTreater._id);
			deletedCount++;
		}

		// Delete test hauler
		const testHauler = await ctx.db
			.query("haulers")
			.filter((q) => q.eq(q.field("name"), "Test Trucking Company"))
			.first();
		if (testHauler) {
			// Delete hauler org link
			const haulerLink = await ctx.db
				.query("organizationLinks")
				.withIndex("by_hauler", (q) => q.eq("haulerId", testHauler._id))
				.first();
			if (haulerLink) await ctx.db.delete(haulerLink._id);

			await ctx.db.delete(testHauler._id);
			deletedCount++;
		}

		return {
			success: true,
			message: `Cleared test data. Deleted ${deletedCount} records.`,
		};
	},
});
