import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/contexts/auth-context";

export default function MainScreen() {
	const router = useRouter();
	const { user, logout } = useAuth();

	const handleLogout = async () => {
		await logout();
		router.replace("/login");
	};

	return (
		<View className="flex-1 bg-gray-50 p-6">
			<View className="bg-white rounded-xl p-4 mb-6 shadow-sm">
				<Text className="text-sm text-gray-500">Logged in as</Text>
				<Text className="text-base font-medium text-gray-900">
					{user?.email}
				</Text>
				<Text className="text-sm text-blue-600 capitalize mt-1">
					{user?.role}
				</Text>
			</View>

			<View className="gap-4">
				<TouchableOpacity
					className="bg-blue-600 rounded-xl p-6 active:bg-blue-700"
					onPress={() => router.push("/(main)/scan")}
				>
					<Text className="text-xl font-bold text-white mb-1">
						Scan QR Code
					</Text>
					<Text className="text-blue-100">Scan a waste bag QR code</Text>
				</TouchableOpacity>

				<TouchableOpacity
					className="bg-green-600 rounded-xl p-6 active:bg-green-700"
					onPress={() => router.push("/(main)/form")}
				>
					<Text className="text-xl font-bold text-white mb-1">
						Fill Out Form
					</Text>
					<Text className="text-green-100">Manual entry for waste tracking</Text>
				</TouchableOpacity>
			</View>

			<TouchableOpacity className="mt-auto py-4" onPress={handleLogout}>
				<Text className="text-center text-red-600 font-medium">Sign Out</Text>
			</TouchableOpacity>
		</View>
	);
}
