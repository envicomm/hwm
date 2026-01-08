import { View, Text, TouchableOpacity } from "react-native";
import { useAuth } from "../src/contexts/auth-context";
import type { UserRole } from "../src/lib/auth";

const ROLES: { value: UserRole; label: string; description: string }[] = [
	{
		value: "driver",
		label: "Driver",
		description: "Collect and transport waste",
	},
	{
		value: "generator",
		label: "Generator",
		description: "Hospital waste management",
	},
	{
		value: "treater",
		label: "Treater",
		description: "Treatment facility operations",
	},
];

export default function RolePickerScreen() {
	const { user, selectRole } = useAuth();

	const handleRoleSelect = async (role: UserRole) => {
		await selectRole(role);
	};

	return (
		<View className="flex-1 bg-white px-6 pt-16">
			<Text className="text-2xl font-bold text-gray-900 mb-2">
				Select Your Role
			</Text>
			<Text className="text-base text-gray-600 mb-8">
				Logged in as {user?.email}
			</Text>

			<View className="gap-4">
				{ROLES.map((role) => (
					<TouchableOpacity
						key={role.value}
						className="border border-gray-200 rounded-xl p-5 active:bg-gray-50"
						onPress={() => handleRoleSelect(role.value)}
					>
						<Text className="text-lg font-semibold text-gray-900">
							{role.label}
						</Text>
						<Text className="text-sm text-gray-600 mt-1">
							{role.description}
						</Text>
					</TouchableOpacity>
				))}
			</View>
		</View>
	);
}
