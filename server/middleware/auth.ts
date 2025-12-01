import { clerkMiddleware, getAuth, requireAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Clerk Authentication Middleware
 * 
 * This sets up Clerk authentication for Express routes.
 * It adds the auth object to the request, allowing you to:
 * - Check if user is authenticated: req.auth?.userId
 * - Get user details from Clerk
 * 
 * Clerk automatically reads CLERK_SECRET_KEY from environment variables.
 */

// Debug: Log what env vars we're seeing
console.log("🔍 Clerk env check:");
console.log("  CLERK_PUBLISHABLE_KEY:", process.env.CLERK_PUBLISHABLE_KEY ? "SET ✓" : "MISSING ✗");
console.log("  CLERK_SECRET_KEY:", process.env.CLERK_SECRET_KEY ? "SET ✓" : "MISSING ✗");

// Verify Clerk secret key is set
if (!process.env.CLERK_SECRET_KEY) {
  console.warn(
    "⚠️ Missing CLERK_SECRET_KEY environment variable.\n" +
    "Authentication will not work. Add your Clerk secret key to .env"
  );
}

if (!process.env.CLERK_PUBLISHABLE_KEY) {
  console.warn(
    "⚠️ Missing CLERK_PUBLISHABLE_KEY environment variable.\n" +
    "Backend authentication will not work. Add your Clerk publishable key to .env"
  );
}

// Export the base Clerk middleware
// clerkMiddleware() automatically uses CLERK_SECRET_KEY from env
export { clerkMiddleware, requireAuth };

// Type augmentation for Express Request
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string | null;
        sessionId: string | null;
        getToken: () => Promise<string | null>;
      };
    }
  }
}

/**
 * Get the authenticated user ID from the request
 * Returns null if not authenticated
 */
export function getUserId(req: Request): string | null {
  const auth = getAuth(req);
  return auth?.userId || null;
}

/**
 * Middleware that requires authentication
 * Returns 401 if not authenticated
 */
export function requireAuthentication(req: Request, res: Response, next: NextFunction) {
  const userId = getUserId(req);
  
  if (!userId) {
    return res.status(401).json({ 
      error: "No autorizado",
      message: "Debes iniciar sesión para acceder a este recurso"
    });
  }
  
  next();
}

/**
 * Sync user from Clerk to our database
 * Called when user signs in or updates their profile
 */
export async function syncUserToDatabase(clerkUser: {
  id: string;
  emailAddresses: Array<{ emailAddress: string }>;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
}) {
  const email = clerkUser.emailAddresses[0]?.emailAddress || '';
  
  // Upsert user - create if doesn't exist, update if does
  await db
    .insert(users)
    .values({
      id: clerkUser.id,
      email,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      imageUrl: clerkUser.imageUrl,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
        updatedAt: new Date(),
      },
    });
}

/**
 * Get user from database by Clerk ID
 */
export async function getUserFromDb(clerkUserId: string) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, clerkUserId))
    .limit(1);
  
  return result[0] || null;
}

