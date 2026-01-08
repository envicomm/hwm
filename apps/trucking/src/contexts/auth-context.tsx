import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { TruckingUser, AuthContextType } from "@hwm/types/auth";

type User = TruckingUser;

const AuthContext = createContext<AuthContextType<User> | null>(null);

const STORAGE_KEY = "hwm_trucking_auth";

// Mock user for development
const mockUser: User = {
  id: "usr_001",
  name: "Carlos Reyes",
  email: "carlos@metromanilahaul.com",
  role: "hauler",
  haulerId: "haul_001",
  haulerName: "Metro Manila Hauling Services",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, _password: string) => {
    setIsLoading(true);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Mock authentication - accept any credentials
    const authenticatedUser = { ...mockUser, email };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authenticatedUser));
    setUser(authenticatedUser);
    setIsLoading(false);

    return true;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
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
