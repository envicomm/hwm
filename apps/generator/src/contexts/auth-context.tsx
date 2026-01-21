import { createContext, useContext, type ReactNode } from "react";
import { useConvexAuth } from "convex/react";
import { authClient } from "@/lib/auth";

/**
 * Auth user from Better Auth session
 * This is the base user from authentication.
 * Domain-specific user info (generatorId, role, etc.) will be added
 * when organization bridge is implemented for generators.
 */
interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
  image?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: typeof authClient.signIn;
  signUp: typeof authClient.signUp;
  signOut: typeof authClient.signOut;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Use Convex's auth state - this is the source of truth
  // IMPORTANT: Use useConvexAuth, NOT authClient.useSession()
  // Better Auth reflects authenticated state before Convex validates the token,
  // which causes race conditions.
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();

  // Get session data from Better Auth for user details
  // This is safe because we're gating display on useConvexAuth's isAuthenticated
  const session = authClient.useSession();

  const isLoading = authLoading;

  // Build user object from Better Auth session data
  // Only return user when Convex confirms authentication
  const user: AuthUser | null =
    isAuthenticated && session.data?.user
      ? {
          id: session.data.user.id,
          email: session.data.user.email,
          name: session.data.user.name ?? null,
          emailVerified: session.data.user.emailVerified,
          image: session.data.user.image ?? null,
        }
      : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        signIn: authClient.signIn,
        signUp: authClient.signUp,
        signOut: authClient.signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
