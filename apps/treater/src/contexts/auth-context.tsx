import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useQuery } from "convex/react";
import { api } from "@hwm/convex";
import {
  signIn as betterAuthSignIn,
  signOut as betterAuthSignOut,
  getSession,
} from "@/lib/auth";
import type { TreaterUser, AuthContextType } from "@hwm/types/auth";

type User = TreaterUser;

const AUTH_STORAGE_KEY = "hwm-treater-auth";

const AuthContext = createContext<AuthContextType<User> | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const dbUser = useQuery(
    api.users.queries.getUserByEmail,
    userEmail ? { email: userEmail } : "skip",
  );

  useEffect(() => {
    const initializeAuth = async () => {
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem(AUTH_STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);

            // If we have full user data in localStorage, use it immediately
            if (parsed.id && parsed.treaterName) {
              setUser(parsed);
              setUserEmail(parsed.email);
              setIsLoading(false);
              return;
            }

            // Otherwise just set the email to trigger the query
            setUserEmail(parsed.email);
            setIsLoading(false);
            return;
          }
        } catch {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }

        try {
          const sessionData = await getSession();
          if (sessionData?.data?.user?.email) {
            setUserEmail(sessionData.data.user.email);
            localStorage.setItem(
              AUTH_STORAGE_KEY,
              JSON.stringify({ email: sessionData.data.user.email }),
            );
          }
        } catch (error) {
          console.error("Failed to get session:", error);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    if (dbUser && userEmail) {
      const treaterName = (dbUser as any).treaterName;
      const userData: User = {
        id: dbUser._id,
        email: dbUser.email,
        name: dbUser.name,
        treaterId: dbUser.treaterId || "",
        treaterName: treaterName || "Unknown Facility",
        role: dbUser.role as "treater" | "admin",
      };
      setUser(userData);

      if (typeof window !== "undefined") {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
      }
    }
  }, [dbUser, userEmail]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await betterAuthSignIn.email({
        email,
        password,
        callbackURL: "/dashboard",
      });

      if (result.data?.user) {
        setUserEmail(result.data.user.email);

        if (typeof window !== "undefined") {
          localStorage.setItem(
            AUTH_STORAGE_KEY,
            JSON.stringify({ email: result.data.user.email }),
          );
        }

        return;
      }

      if (result.error) {
        throw new Error(result.error.message || "Invalid credentials");
      }

      throw new Error("Authentication failed");
    } catch (error) {
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Sign out from Better Auth (clears server-side session)
      await betterAuthSignOut();
    } catch (error) {
      console.error("Error signing out from Better Auth:", error);
    }

    // Clear local state
    setUser(null);
    setUserEmail(null);

    // Clear localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_STORAGE_KEY);

      // Force navigation to login and replace history entry
      // This prevents back button from returning to protected pages
      window.location.replace("/");
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading: isLoading || (!!userEmail && !user),
        login,
        logout,
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
