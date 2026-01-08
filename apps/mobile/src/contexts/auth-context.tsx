import {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
	type ReactNode,
} from "react";
import type { AuthContextType, MockUser, UserRole } from "../lib/auth";
import { storage } from "../lib/storage";

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<MockUser | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		storage.getUser().then((savedUser) => {
			setUser(savedUser);
			setIsLoading(false);
		});
	}, []);

	const login = useCallback(async (email: string) => {
		const newUser: MockUser = {
			email,
			role: null,
			loginTimestamp: Date.now(),
		};
		await storage.setUser(newUser);
		setUser(newUser);
	}, []);

	const selectRole = useCallback(
		async (role: UserRole) => {
			if (!user) throw new Error("No user logged in");
			const updatedUser = { ...user, role };
			await storage.setUser(updatedUser);
			setUser(updatedUser);
		},
		[user],
	);

	const logout = useCallback(async () => {
		await storage.clearUser();
		setUser(null);
	}, []);

	return (
		<AuthContext.Provider
			value={{
				user,
				isAuthenticated: !!user,
				isLoading,
				login,
				selectRole,
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
