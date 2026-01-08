import { Redirect } from "expo-router";
import { useAuth } from "../src/contexts/auth-context";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
	const { isAuthenticated, isLoading, user } = useAuth();

	if (isLoading) {
		return (
			<View className="flex-1 items-center justify-center bg-white">
				<ActivityIndicator size="large" color="#2563eb" />
			</View>
		);
	}

	if (!isAuthenticated) {
		return <Redirect href="/login" />;
	}

	if (!user?.role) {
		return <Redirect href="/role-picker" />;
	}

	return <Redirect href="/(main)" />;
}
