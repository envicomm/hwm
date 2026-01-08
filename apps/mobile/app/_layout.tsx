import "../src/global.css";
import { Stack } from "expo-router";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { AuthProvider } from "../src/contexts/auth-context";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
	unsavedChangesWarning: false,
});

export default function RootLayout() {
	return (
		<ConvexProvider client={convex}>
			<AuthProvider>
				<Stack
					screenOptions={{
						headerShown: false,
					}}
				>
					<Stack.Screen name="index" />
					<Stack.Screen name="login" />
					<Stack.Screen name="role-picker" />
					<Stack.Screen name="(main)" />
				</Stack>
			</AuthProvider>
		</ConvexProvider>
	);
}
