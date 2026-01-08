import { useState } from "react";
import { View, Text, Alert } from "react-native";
import { useRouter } from "expo-router";
import { QRScanner } from "../../src/components/QRScanner";

export default function ScanScreen() {
	const router = useRouter();
	const [scannedData, setScannedData] = useState<string | null>(null);

	const handleScan = (data: string) => {
		setScannedData(data);

		Alert.alert("QR Code Scanned", `Data: ${data}`, [
			{
				text: "Scan Another",
				onPress: () => setScannedData(null),
			},
			{
				text: "Process",
				onPress: () => router.push("/(main)/form"),
			},
		]);
	};

	const handleClose = () => {
		router.back();
	};

	return (
		<View className="flex-1">
			<QRScanner onScan={handleScan} onClose={handleClose} />
		</View>
	);
}
