import AsyncStorage from "@react-native-async-storage/async-storage";
import type { MockUser } from "./auth";

const AUTH_KEY = "@hwm/auth";

export const storage = {
	getUser: async (): Promise<MockUser | null> => {
		const data = await AsyncStorage.getItem(AUTH_KEY);
		return data ? JSON.parse(data) : null;
	},

	setUser: async (user: MockUser): Promise<void> => {
		await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(user));
	},

	clearUser: async (): Promise<void> => {
		await AsyncStorage.removeItem(AUTH_KEY);
	},
};
