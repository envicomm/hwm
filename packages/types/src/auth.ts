// Base user type with common fields
export interface BaseUser {
	id: string;
	name: string;
	email: string;
}

// Generator app user
export interface GeneratorUser extends BaseUser {
	generatorId: string;
	generatorName: string;
	treaterId: string;
}

// Treater app user
export interface TreaterUser extends BaseUser {
	treaterId: string;
	treaterName: string;
	role: "treater" | "admin";
}

// Trucking app user
export interface TruckingUser extends BaseUser {
	role: "hauler" | "driver";
	haulerId: string;
	haulerName: string;
}

// Union type for all app users
export type AppUser = GeneratorUser | TreaterUser | TruckingUser;

// Auth context type (generic for flexibility)
export interface AuthContextType<TUser extends BaseUser = BaseUser> {
	user: TUser | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	login: (email: string, password: string) => Promise<void> | Promise<boolean>;
	logout: () => void;
}
