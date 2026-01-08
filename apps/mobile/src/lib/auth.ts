export type UserRole = "driver" | "generator" | "treater";

export interface MockUser {
	email: string;
	role: UserRole | null;
	loginTimestamp: number;
}

export interface AuthContextType {
	user: MockUser | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	login: (email: string) => Promise<void>;
	selectRole: (role: UserRole) => Promise<void>;
	logout: () => Promise<void>;
}
