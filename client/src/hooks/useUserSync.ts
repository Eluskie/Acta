import { useUser } from "@clerk/clerk-react";
import { useEffect, useRef } from "react";

/**
 * useUserSync Hook
 *
 * Automatically syncs the authenticated Clerk user to our database
 * on first load or when the user signs in.
 *
 * This ensures the user exists in our PostgreSQL database before
 * they try to create meetings (which require a foreign key to users table).
 */
export function useUserSync() {
  const { user, isLoaded } = useUser();
  const syncedRef = useRef(false);

  useEffect(() => {
    console.log("[useUserSync] Hook running - isLoaded:", isLoaded, "user:", !!user, "synced:", syncedRef.current);

    // Only sync once per session and when user is loaded
    if (!isLoaded || !user || syncedRef.current) {
      return;
    }

    console.log("[useUserSync] Starting user sync for:", user.id);

    const syncUser = async () => {
      try {
        const response = await fetch("/api/auth/sync-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: user.primaryEmailAddress?.emailAddress || "",
            firstName: user.firstName || null,
            lastName: user.lastName || null,
            imageUrl: user.imageUrl || null,
          }),
        });

        if (response.ok) {
          console.log("✅ User synced to database");
          syncedRef.current = true;
        } else {
          console.error("❌ Failed to sync user:", await response.text());
        }
      } catch (error) {
        console.error("❌ Error syncing user:", error);
      }
    };

    syncUser();
  }, [user, isLoaded]);
}
