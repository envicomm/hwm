import { action } from "../_generated/server";
import { v } from "convex/values";

export const sendSMS = action({
  args: {
    to: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error("Twilio credentials are not configured");
    }

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: args.to,
          From: fromNumber,
          Body: args.message,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to send SMS: ${error}`);
    }

    const result = await response.json();
    return { success: true, sid: result.sid };
  },
});

export const sendSMSToUser = action({
  args: {
    userId: v.id("users"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(
      // @ts-expect-error - internal query reference
      { path: "users:get" },
      { id: args.userId }
    );

    if (!user || !user.phone) {
      throw new Error("User not found or has no phone number");
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error("Twilio credentials are not configured");
    }

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: user.phone,
          From: fromNumber,
          Body: args.message,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to send SMS: ${error}`);
    }

    const result = await response.json();
    return { success: true, sid: result.sid };
  },
});
