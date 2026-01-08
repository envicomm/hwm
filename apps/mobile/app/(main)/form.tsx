import { useState } from "react";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	ScrollView,
	KeyboardAvoidingView,
	Platform,
	Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/contexts/auth-context";

export default function FormScreen() {
	const router = useRouter();
	const { user } = useAuth();
	const [bagId, setBagId] = useState("");
	const [weight, setWeight] = useState("");
	const [notes, setNotes] = useState("");

	const handleSubmit = () => {
		if (!bagId.trim()) {
			Alert.alert("Error", "Please enter a Bag ID");
			return;
		}

		Alert.alert(
			"Form Submitted",
			`Bag ID: ${bagId}\nWeight: ${weight || "Not specified"}\nNotes: ${notes || "None"}`,
			[
				{
					text: "OK",
					onPress: () => router.back(),
				},
			],
		);
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			className="flex-1 bg-gray-50"
		>
			<ScrollView className="flex-1 p-6">
				<View className="bg-white rounded-xl p-4 mb-6 shadow-sm">
					<Text className="text-sm text-gray-500">Role</Text>
					<Text className="text-base font-medium text-gray-900 capitalize">
						{user?.role}
					</Text>
				</View>

				<View className="gap-4">
					<View>
						<Text className="text-sm font-medium text-gray-700 mb-2">
							Bag ID *
						</Text>
						<TextInput
							className="border border-gray-300 rounded-lg px-4 py-3 text-base bg-white"
							placeholder="Enter bag ID or scan QR"
							placeholderTextColor="#9ca3af"
							value={bagId}
							onChangeText={setBagId}
							autoCapitalize="characters"
						/>
					</View>

					<View>
						<Text className="text-sm font-medium text-gray-700 mb-2">
							Weight (kg)
						</Text>
						<TextInput
							className="border border-gray-300 rounded-lg px-4 py-3 text-base bg-white"
							placeholder="Enter weight"
							placeholderTextColor="#9ca3af"
							value={weight}
							onChangeText={setWeight}
							keyboardType="decimal-pad"
						/>
					</View>

					<View>
						<Text className="text-sm font-medium text-gray-700 mb-2">Notes</Text>
						<TextInput
							className="border border-gray-300 rounded-lg px-4 py-3 text-base bg-white min-h-24"
							placeholder="Additional notes..."
							placeholderTextColor="#9ca3af"
							value={notes}
							onChangeText={setNotes}
							multiline
							textAlignVertical="top"
						/>
					</View>
				</View>

				<TouchableOpacity
					className="bg-blue-600 rounded-lg py-4 items-center mt-6 active:bg-blue-700"
					onPress={handleSubmit}
				>
					<Text className="text-white font-semibold text-base">
						Submit Entry
					</Text>
				</TouchableOpacity>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}
