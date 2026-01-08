import type {
	Feature,
	FeatureCollection,
	Polygon,
} from "geojson";

export interface CityBoundary {
	id: string;
	name: string;
	center: { lat: number; lng: number };
	boundary: Feature<Polygon>;
}

// Metro Manila city boundaries (simplified polygons)
// Coordinates are approximate boundaries for visualization purposes
export const metroManilaCities: Record<string, CityBoundary> = {
	makati: {
		id: "makati",
		name: "Makati City",
		center: { lat: 14.5547, lng: 121.0244 },
		boundary: {
			type: "Feature",
			properties: { name: "Makati City", id: "makati" },
			geometry: {
				type: "Polygon",
				coordinates: [
					[
						[121.0013, 14.5389],
						[121.0089, 14.5285],
						[121.0234, 14.5218],
						[121.0356, 14.5295],
						[121.0445, 14.5412],
						[121.0489, 14.5567],
						[121.0456, 14.5712],
						[121.0378, 14.5823],
						[121.0256, 14.5867],
						[121.0134, 14.5789],
						[121.0045, 14.5634],
						[121.0013, 14.5389],
					],
				],
			},
		},
	},
	taguig: {
		id: "taguig",
		name: "Taguig City",
		center: { lat: 14.5176, lng: 121.0509 },
		boundary: {
			type: "Feature",
			properties: { name: "Taguig City", id: "taguig" },
			geometry: {
				type: "Polygon",
				coordinates: [
					[
						[121.0312, 14.4856],
						[121.0456, 14.4789],
						[121.0623, 14.4867],
						[121.0789, 14.5012],
						[121.0834, 14.5234],
						[121.0756, 14.5423],
						[121.0612, 14.5534],
						[121.0445, 14.5489],
						[121.0323, 14.5345],
						[121.0267, 14.5134],
						[121.0289, 14.4967],
						[121.0312, 14.4856],
					],
				],
			},
		},
	},
	pasig: {
		id: "pasig",
		name: "Pasig City",
		center: { lat: 14.5764, lng: 121.0851 },
		boundary: {
			type: "Feature",
			properties: { name: "Pasig City", id: "pasig" },
			geometry: {
				type: "Polygon",
				coordinates: [
					[
						[121.0534, 14.5456],
						[121.0689, 14.5389],
						[121.0867, 14.5467],
						[121.1012, 14.5612],
						[121.1089, 14.5823],
						[121.1045, 14.6012],
						[121.0912, 14.6156],
						[121.0734, 14.6189],
						[121.0578, 14.6089],
						[121.0467, 14.5912],
						[121.0456, 14.5689],
						[121.0489, 14.5534],
						[121.0534, 14.5456],
					],
				],
			},
		},
	},
	mandaluyong: {
		id: "mandaluyong",
		name: "Mandaluyong City",
		center: { lat: 14.5794, lng: 121.0359 },
		boundary: {
			type: "Feature",
			properties: { name: "Mandaluyong City", id: "mandaluyong" },
			geometry: {
				type: "Polygon",
				coordinates: [
					[
						[121.0156, 14.5634],
						[121.0289, 14.5567],
						[121.0423, 14.5589],
						[121.0534, 14.5689],
						[121.0578, 14.5834],
						[121.0545, 14.5967],
						[121.0423, 14.6045],
						[121.0289, 14.6012],
						[121.0178, 14.5912],
						[121.0134, 14.5767],
						[121.0156, 14.5634],
					],
				],
			},
		},
	},
	quezon_city: {
		id: "quezon_city",
		name: "Quezon City",
		center: { lat: 14.6507, lng: 121.0495 },
		boundary: {
			type: "Feature",
			properties: { name: "Quezon City", id: "quezon_city" },
			geometry: {
				type: "Polygon",
				coordinates: [
					[
						[120.9834, 14.6012],
						[121.0023, 14.5867],
						[121.0267, 14.5789],
						[121.0512, 14.5834],
						[121.0756, 14.5956],
						[121.0989, 14.6134],
						[121.1134, 14.6389],
						[121.1178, 14.6689],
						[121.1089, 14.6967],
						[121.0867, 14.7156],
						[121.0578, 14.7234],
						[121.0267, 14.7189],
						[121.0012, 14.7045],
						[120.9834, 14.6789],
						[120.9756, 14.6489],
						[120.9778, 14.6212],
						[120.9834, 14.6012],
					],
				],
			},
		},
	},
	manila: {
		id: "manila",
		name: "City of Manila",
		center: { lat: 14.5995, lng: 120.9842 },
		boundary: {
			type: "Feature",
			properties: { name: "City of Manila", id: "manila" },
			geometry: {
				type: "Polygon",
				coordinates: [
					[
						[120.9567, 14.5634],
						[120.9734, 14.5534],
						[120.9923, 14.5512],
						[121.0089, 14.5589],
						[121.0178, 14.5756],
						[121.0156, 14.5967],
						[121.0067, 14.6156],
						[120.9912, 14.6289],
						[120.9734, 14.6334],
						[120.9567, 14.6245],
						[120.9456, 14.6067],
						[120.9423, 14.5867],
						[120.9478, 14.5712],
						[120.9567, 14.5634],
					],
				],
			},
		},
	},
	san_juan: {
		id: "san_juan",
		name: "San Juan City",
		center: { lat: 14.6019, lng: 121.0355 },
		boundary: {
			type: "Feature",
			properties: { name: "San Juan City", id: "san_juan" },
			geometry: {
				type: "Polygon",
				coordinates: [
					[
						[121.0178, 14.5912],
						[121.0289, 14.5867],
						[121.0423, 14.5889],
						[121.0512, 14.5989],
						[121.0534, 14.6112],
						[121.0478, 14.6212],
						[121.0356, 14.6267],
						[121.0234, 14.6212],
						[121.0156, 14.6089],
						[121.0156, 14.5967],
						[121.0178, 14.5912],
					],
				],
			},
		},
	},
	marikina: {
		id: "marikina",
		name: "Marikina City",
		center: { lat: 14.6507, lng: 121.1029 },
		boundary: {
			type: "Feature",
			properties: { name: "Marikina City", id: "marikina" },
			geometry: {
				type: "Polygon",
				coordinates: [
					[
						[121.0789, 14.6156],
						[121.0934, 14.6089],
						[121.1112, 14.6134],
						[121.1267, 14.6289],
						[121.1334, 14.6512],
						[121.1289, 14.6756],
						[121.1156, 14.6934],
						[121.0978, 14.6989],
						[121.0812, 14.6889],
						[121.0712, 14.6689],
						[121.0723, 14.6445],
						[121.0756, 14.6267],
						[121.0789, 14.6156],
					],
				],
			},
		},
	},
	pasay: {
		id: "pasay",
		name: "Pasay City",
		center: { lat: 14.5378, lng: 120.9936 },
		boundary: {
			type: "Feature",
			properties: { name: "Pasay City", id: "pasay" },
			geometry: {
				type: "Polygon",
				coordinates: [
					[
						[120.9712, 14.5134],
						[120.9867, 14.5067],
						[121.0034, 14.5112],
						[121.0156, 14.5234],
						[121.0178, 14.5412],
						[121.0112, 14.5567],
						[120.9967, 14.5634],
						[120.9812, 14.5589],
						[120.9689, 14.5445],
						[120.9656, 14.5267],
						[120.9712, 14.5134],
					],
				],
			},
		},
	},
	paranaque: {
		id: "paranaque",
		name: "Paranaque City",
		center: { lat: 14.4793, lng: 121.0198 },
		boundary: {
			type: "Feature",
			properties: { name: "Paranaque City", id: "paranaque" },
			geometry: {
				type: "Polygon",
				coordinates: [
					[
						[120.9867, 14.4534],
						[121.0045, 14.4467],
						[121.0234, 14.4512],
						[121.0412, 14.4634],
						[121.0512, 14.4823],
						[121.0478, 14.5012],
						[121.0356, 14.5134],
						[121.0178, 14.5156],
						[121.0012, 14.5067],
						[120.9867, 14.4912],
						[120.9812, 14.4712],
						[120.9867, 14.4534],
					],
				],
			},
		},
	},
	caloocan: {
		id: "caloocan",
		name: "Caloocan City",
		center: { lat: 14.6488, lng: 120.9839 },
		boundary: {
			type: "Feature",
			properties: { name: "Caloocan City", id: "caloocan" },
			geometry: {
				type: "Polygon",
				coordinates: [
					[
						[120.9534, 14.6234],
						[120.9712, 14.6156],
						[120.9912, 14.6189],
						[121.0067, 14.6334],
						[121.0112, 14.6534],
						[121.0045, 14.6756],
						[120.9889, 14.6912],
						[120.9689, 14.6934],
						[120.9512, 14.6812],
						[120.9423, 14.6612],
						[120.9456, 14.6389],
						[120.9534, 14.6234],
					],
				],
			},
		},
	},
	valenzuela: {
		id: "valenzuela",
		name: "Valenzuela City",
		center: { lat: 14.7009, lng: 120.9833 },
		boundary: {
			type: "Feature",
			properties: { name: "Valenzuela City", id: "valenzuela" },
			geometry: {
				type: "Polygon",
				coordinates: [
					[
						[120.9534, 14.6789],
						[120.9712, 14.6712],
						[120.9912, 14.6756],
						[121.0067, 14.6889],
						[121.0112, 14.7089],
						[121.0045, 14.7289],
						[120.9889, 14.7412],
						[120.9689, 14.7434],
						[120.9512, 14.7312],
						[120.9423, 14.7112],
						[120.9456, 14.6912],
						[120.9534, 14.6789],
					],
				],
			},
		},
	},
	las_pinas: {
		id: "las_pinas",
		name: "Las Pinas City",
		center: { lat: 14.4445, lng: 120.9939 },
		boundary: {
			type: "Feature",
			properties: { name: "Las Pinas City", id: "las_pinas" },
			geometry: {
				type: "Polygon",
				coordinates: [
					[
						[120.9712, 14.4212],
						[120.9889, 14.4145],
						[121.0067, 14.4189],
						[121.0212, 14.4312],
						[121.0267, 14.4489],
						[121.0212, 14.4667],
						[121.0067, 14.4789],
						[120.9889, 14.4812],
						[120.9712, 14.4712],
						[120.9612, 14.4534],
						[120.9634, 14.4334],
						[120.9712, 14.4212],
					],
				],
			},
		},
	},
	muntinlupa: {
		id: "muntinlupa",
		name: "Muntinlupa City",
		center: { lat: 14.4081, lng: 121.0415 },
		boundary: {
			type: "Feature",
			properties: { name: "Muntinlupa City", id: "muntinlupa" },
			geometry: {
				type: "Polygon",
				coordinates: [
					[
						[121.0134, 14.3789],
						[121.0334, 14.3712],
						[121.0534, 14.3767],
						[121.0712, 14.3912],
						[121.0789, 14.4134],
						[121.0734, 14.4356],
						[121.0578, 14.4512],
						[121.0378, 14.4556],
						[121.0189, 14.4456],
						[121.0067, 14.4267],
						[121.0045, 14.4045],
						[121.0089, 14.3889],
						[121.0134, 14.3789],
					],
				],
			},
		},
	},
	malabon: {
		id: "malabon",
		name: "Malabon City",
		center: { lat: 14.6625, lng: 120.9567 },
		boundary: {
			type: "Feature",
			properties: { name: "Malabon City", id: "malabon" },
			geometry: {
				type: "Polygon",
				coordinates: [
					[
						[120.9312, 14.6489],
						[120.9467, 14.6412],
						[120.9634, 14.6445],
						[120.9767, 14.6567],
						[120.9812, 14.6734],
						[120.9756, 14.6889],
						[120.9612, 14.6978],
						[120.9445, 14.6945],
						[120.9312, 14.6823],
						[120.9256, 14.6656],
						[120.9278, 14.6534],
						[120.9312, 14.6489],
					],
				],
			},
		},
	},
	navotas: {
		id: "navotas",
		name: "Navotas City",
		center: { lat: 14.6667, lng: 120.9417 },
		boundary: {
			type: "Feature",
			properties: { name: "Navotas City", id: "navotas" },
			geometry: {
				type: "Polygon",
				coordinates: [
					[
						[120.9178, 14.6512],
						[120.9312, 14.6456],
						[120.9456, 14.6489],
						[120.9567, 14.6612],
						[120.9589, 14.6778],
						[120.9534, 14.6923],
						[120.9389, 14.6989],
						[120.9234, 14.6934],
						[120.9134, 14.6789],
						[120.9112, 14.6623],
						[120.9145, 14.6534],
						[120.9178, 14.6512],
					],
				],
			},
		},
	},
	pateros: {
		id: "pateros",
		name: "Pateros",
		center: { lat: 14.5446, lng: 121.0686 },
		boundary: {
			type: "Feature",
			properties: { name: "Pateros", id: "pateros" },
			geometry: {
				type: "Polygon",
				coordinates: [
					[
						[121.0578, 14.5367],
						[121.0689, 14.5323],
						[121.0789, 14.5378],
						[121.0845, 14.5489],
						[121.0823, 14.5612],
						[121.0734, 14.5689],
						[121.0623, 14.5678],
						[121.0545, 14.5567],
						[121.0534, 14.5445],
						[121.0578, 14.5367],
					],
				],
			},
		},
	},
};

/**
 * Get a FeatureCollection containing the boundaries for the specified cities
 */
export function getServiceAreaGeoJSON(cityIds: string[]): FeatureCollection<Polygon> {
	const features = cityIds
		.map((id) => metroManilaCities[id]?.boundary)
		.filter((boundary): boundary is Feature<Polygon> => boundary !== undefined);

	return {
		type: "FeatureCollection",
		features,
	};
}

/**
 * Calculate the center point of multiple cities
 */
export function getServiceAreaCenter(cityIds: string[]): { lat: number; lng: number } | null {
	const cities = cityIds
		.map((id) => metroManilaCities[id])
		.filter((city): city is CityBoundary => city !== undefined);

	if (cities.length === 0) return null;

	const sumLat = cities.reduce((sum, city) => sum + city.center.lat, 0);
	const sumLng = cities.reduce((sum, city) => sum + city.center.lng, 0);

	return {
		lat: sumLat / cities.length,
		lng: sumLng / cities.length,
	};
}

/**
 * Calculate bounding box for the service area
 * Returns [[minLng, minLat], [maxLng, maxLat]]
 */
export function getServiceAreaBounds(
	cityIds: string[]
): [[number, number], [number, number]] | null {
	const features = cityIds
		.map((id) => metroManilaCities[id]?.boundary)
		.filter((boundary): boundary is Feature<Polygon> => boundary !== undefined);

	if (features.length === 0) return null;

	let minLng = Number.POSITIVE_INFINITY;
	let minLat = Number.POSITIVE_INFINITY;
	let maxLng = Number.NEGATIVE_INFINITY;
	let maxLat = Number.NEGATIVE_INFINITY;

	for (const feature of features) {
		const coords = feature.geometry.coordinates[0];
		if (!coords) continue;
		for (const coord of coords) {
			const lng = coord[0];
			const lat = coord[1];
			if (lng === undefined || lat === undefined) continue;
			minLng = Math.min(minLng, lng);
			minLat = Math.min(minLat, lat);
			maxLng = Math.max(maxLng, lng);
			maxLat = Math.max(maxLat, lat);
		}
	}

	return [
		[minLng, minLat],
		[maxLng, maxLat],
	];
}
