import { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
	CameraView,
	useCameraPermissions,
	type BarcodeScanningResult,
} from "expo-camera";

interface QRScannerProps {
	onScan: (data: string) => void;
	onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
	const [permission, requestPermission] = useCameraPermissions();
	const [scanned, setScanned] = useState(false);

	const handleBarCodeScanned = useCallback(
		(result: BarcodeScanningResult) => {
			if (scanned) return;
			setScanned(true);
			onScan(result.data);
		},
		[scanned, onScan],
	);

	const handleRescan = () => {
		setScanned(false);
	};

	if (!permission) {
		return (
			<View className="flex-1 items-center justify-center bg-black">
				<Text className="text-white">Loading camera...</Text>
			</View>
		);
	}

	if (!permission.granted) {
		return (
			<View className="flex-1 items-center justify-center p-6 bg-white">
				<Text className="text-lg text-center mb-4 text-gray-900">
					Camera permission is required to scan QR codes
				</Text>
				<TouchableOpacity
					className="bg-blue-600 px-6 py-3 rounded-lg"
					onPress={requestPermission}
				>
					<Text className="text-white font-semibold">Grant Permission</Text>
				</TouchableOpacity>
				<TouchableOpacity className="mt-4 py-2" onPress={onClose}>
					<Text className="text-gray-600">Cancel</Text>
				</TouchableOpacity>
			</View>
		);
	}

	return (
		<View className="flex-1 bg-black">
			<CameraView
				style={StyleSheet.absoluteFillObject}
				facing="back"
				barcodeScannerSettings={{
					barcodeTypes: ["qr"],
				}}
				onBarcodeScanned={handleBarCodeScanned}
			/>

			{/* Overlay with scanning guide */}
			<View className="flex-1 items-center justify-center">
				<View className="w-64 h-64 border-2 border-white rounded-lg" />
				<Text className="text-white text-center mt-4">
					Position QR code within the frame
				</Text>
			</View>

			{/* Close button */}
			<TouchableOpacity
				className="absolute top-12 right-4 bg-black/50 px-4 py-2 rounded-full"
				onPress={onClose}
			>
				<Text className="text-white">Close</Text>
			</TouchableOpacity>

			{/* Rescan button when scanned */}
			{scanned && (
				<TouchableOpacity
					className="absolute bottom-12 self-center bg-blue-600 px-6 py-3 rounded-lg"
					onPress={handleRescan}
				>
					<Text className="text-white font-semibold">Scan Again</Text>
				</TouchableOpacity>
			)}
		</View>
	);
}
