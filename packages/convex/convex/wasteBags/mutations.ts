import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { wasteStatus } from "../schema/validators";
import { requireGeneratorAccess } from "../lib/auth";
import { Id } from "../_generated/dataModel";

// Create a new waste bag
export const create = mutation({
  args: {
    generatorId: v.id("generators"),
    qrCode: v.string(),
    qrSource: v.union(
      v.literal("pre_manufactured"),
      v.literal("hospital_generated")
    ),
    wasteType: v.string(),
    weightKg: v.optional(v.number()),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    bagInventoryId: v.optional(v.id("bagInventory")),
    userId: v.optional(v.id("users")), // Optional for now until auth is fully integrated
  },
  handler: async (ctx, args) => {
    // Verify user has access to this generator
    // await requireGeneratorAccess(ctx, args.generatorId);

    // Get generator to fetch treaterId
    const generator = await ctx.db.get(args.generatorId);
    if (!generator) {
      throw new Error("Generator not found");
    }

    // Check if QR code already exists
    const existingBag = await ctx.db
      .query("wasteBags")
      .withIndex("by_qr_code", (q) => q.eq("qrCode", args.qrCode))
      .first();

    if (existingBag) {
      throw new Error("QR code already exists");
    }

    const now = Date.now();

    // FOR TESTING
    let createdBy = "kh77ykw4kta51f5sfq52yn0een7z5gc1" as Id<"users">;

    if (!createdBy) {
      // Find any user associated with this generator as a fallback
      const anyUser = await ctx.db
        .query("users")
        .withIndex("by_generator", (q) => q.eq("generatorId", args.generatorId))
        .first();
      if (anyUser) {
        createdBy = anyUser._id;
      }
    }

    // Create the waste bag
    const wasteBagId = await ctx.db.insert("wasteBags", {
      qrCode: args.qrCode,
      qrSource: args.qrSource,
      bagInventoryId: args.bagInventoryId,
      generatorId: args.generatorId,
      treaterId: generator.treaterId,
      wasteType: args.wasteType,
      description: args.description,
      weightKg: args.weightKg,
      imageUrl: args.imageUrl,
      status: "initialized" as const,
      createdBy: createdBy!,
      createdAt: now,
      updatedAt: now,
    });

    // Create initial status history entry if we have a user
    if (createdBy) {
      await ctx.db.insert("wasteStatusHistory", {
        wasteBagId,
        toStatus: "initialized",
        changedBy: createdBy,
        timestamp: now,
        notes: "Waste bag created",
      });
    }

    // Create a collection request for this waste bag
    const collectionRequestId = await ctx.db.insert("collectionRequests", {
      generatorId: args.generatorId,
      treaterId: generator.treaterId,
      status: "pending",
      estimatedBagCount: 1,
      notes: `Collection request for waste bag ${args.qrCode}`,
      createdBy: createdBy!,
      createdAt: now,
      updatedAt: now,
      requestedPickupDate: now,
    });

    // Patch the waste bag with the collection request ID
    await ctx.db.patch(wasteBagId, {
      collectionRequestId,
    });

    return wasteBagId;
  },
});

// Update waste bag status
export const updateStatus = mutation({
  args: {
    wasteBagId: v.id("wasteBags"),
    status: wasteStatus,
    notes: v.optional(v.string()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const wasteBag = await ctx.db.get(args.wasteBagId);
    if (!wasteBag) {
      throw new Error("Waste bag not found");
    }

    // Verify user has access to this generator
    // await requireGeneratorAccess(ctx, wasteBag.generatorId);

    const now = Date.now();
    const oldStatus = wasteBag.status;

    // Update the waste bag status
    await ctx.db.patch(args.wasteBagId, {
      status: args.status,
      updatedAt: now,
    });

    // Create status history entry if we have a userId
    if (args.userId || wasteBag.createdBy) {
      await ctx.db.insert("wasteStatusHistory", {
        wasteBagId: args.wasteBagId,
        fromStatus: oldStatus,
        toStatus: args.status,
        changedBy: args.userId || wasteBag.createdBy,
        timestamp: now,
        notes: args.notes,
      });
    }

    return args.wasteBagId;
  },
});

// Update waste bag details
export const update = mutation({
  args: {
    wasteBagId: v.id("wasteBags"),
    wasteType: v.optional(v.string()),
    weightKg: v.optional(v.number()),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const wasteBag = await ctx.db.get(args.wasteBagId);
    if (!wasteBag) {
      throw new Error("Waste bag not found");
    }

    // Verify user has access to this generator
    await requireGeneratorAccess(ctx, wasteBag.generatorId);

    const { wasteBagId, ...updates } = args;

    await ctx.db.patch(wasteBagId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return wasteBagId;
  },
});
