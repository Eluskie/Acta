import { ClerkProvider, useAuth, useUser, SignIn, SignUp, UserButton } from "@clerk/clerk-react";
import { useLocation } from "wouter";
import type { ReactNode } from "react";

// Get the publishable key from environment
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  console.warn(
    "⚠️ Missing VITE_CLERK_PUBLISHABLE_KEY environment variable.\n" +
    "Authentication will not work. Add your Clerk publishable key to .env"
  );
}

/**
 * ClerkProviderWithRouting
 * 
 * Wraps the app with Clerk authentication context.
 * Integrates with wouter for navigation.
 */
export function ClerkProviderWithRouting({ children }: { children: ReactNode }) {
  const [, navigate] = useLocation();

  // If no key, render children without Clerk (for development)
  if (!CLERK_PUBLISHABLE_KEY) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider 
      publishableKey={CLERK_PUBLISHABLE_KEY}
    >
      {children}
    </ClerkProvider>
  );
}

/**
 * ProtectedRoute
 * 
 * Wraps content that requires authentication.
 * Shows sign-in page if not authenticated.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const [, navigate] = useLocation();

  // If Clerk is not configured, allow access (development mode)
  if (!CLERK_PUBLISHABLE_KEY) {
    return <>{children}</>;
  }

  // Show nothing while loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to sign-in if not authenticated
  if (!isSignedIn) {
    // Use setTimeout to avoid navigation during render
    setTimeout(() => navigate("/sign-in"), 0);
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * useCurrentUser hook
 * 
 * Returns the current authenticated user's info.
 * Returns null if not authenticated or Clerk not configured.
 */
export function useCurrentUser() {
  const { user, isLoaded } = useUser();
  
  if (!CLERK_PUBLISHABLE_KEY || !isLoaded || !user) {
    return null;
  }

  return {
    id: user.id,
    email: user.primaryEmailAddress?.emailAddress || "",
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    imageUrl: user.imageUrl,
  };
}

// Re-export Clerk components for easy access
export { useAuth, useUser, SignIn, SignUp, UserButton };
