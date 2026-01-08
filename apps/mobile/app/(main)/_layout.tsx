import { Stack } from "expo-router";
import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../../src/contexts/auth-context";

export default function MainLayout() {
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

	return (
		<Stack
			screenOptions={{
				headerShown: true,
				headerStyle: { backgroundColor: "#ffffff" },
				headerTintColor: "#111827",
			}}
		>
			<Stack.Screen
				name="index"
				options={{ title: "Dashboard", headerBackVisible: false }}
			/>
			<Stack.Screen name="scan" options={{ title: "Scan QR Code" }} />
			<Stack.Screen name="form" options={{ title: "Entry Form" }} />
		</Stack>
	);
}
