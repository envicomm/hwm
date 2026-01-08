import { useState } from "react";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	KeyboardAvoidingView,
	Platform,
} from "react-native";
import { useAuth } from "../src/contexts/auth-context";

export default function LoginScreen() {
	const [email, setEmail] = useState("");
	const [error, setError] = useState("");
	const { login } = useAuth();

	const handleLogin = async () => {
		if (!email || !email.includes("@")) {
			setError("Please enter a valid email address");
			return;
		}

		try {
			setError("");
			await login(email.trim().toLowerCase());
		} catch (err) {
			setError("Login failed. Please try again.");
		}
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			className="flex-1 bg-white"
		>
			<View className="flex-1 justify-center px-8">
				<Text className="text-3xl font-bold text-gray-900 mb-2">
					HWM Mobile
				</Text>
				<Text className="text-base text-gray-600 mb-8">
					Hospital Waste Management
				</Text>

				<Text className="text-sm font-medium text-gray-700 mb-2">
					Email Address
				</Text>
				<TextInput
					className="border border-gray-300 rounded-lg px-4 py-3 text-base mb-4 bg-white"
					placeholder="you@example.com"
					placeholderTextColor="#9ca3af"
					value={email}
					onChangeText={setEmail}
					keyboardType="email-address"
					autoCapitalize="none"
					autoCorrect={false}
					autoComplete="email"
				/>

				{error ? (
					<Text className="text-red-500 text-sm mb-4">{error}</Text>
				) : null}

				<TouchableOpacity
					className="bg-blue-600 rounded-lg py-4 items-center active:bg-blue-700"
					onPress={handleLogin}
				>
					<Text className="text-white font-semibold text-base">Continue</Text>
				</TouchableOpacity>
			</View>
		</KeyboardAvoidingView>
	);
}
