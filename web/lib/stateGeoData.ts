/**
 * GeoJSON data for Indian states
 * Simplified geometry for choropleth mapping
 * Maps to state names used in CPI datasets
 */

export interface StateGeoFeature {
  type: "Feature";
  properties: {
    name: string;
    id: string;
  };
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
}

export interface IndiaGeoJSON {
  type: "FeatureCollection";
  features: StateGeoFeature[];
}

/**
 * State name mappings for consistency
 * Maps various naming conventions to canonical names
 */
export const stateNameMappings: Record<string, string> = {
  // Direct mappings
  "Andhra Pradesh": "Andhra Pradesh",
  "Arunachal Pradesh": "Arunachal Pradesh",
  Assam: "Assam",
  Bihar: "Bihar",
  Chhattisgarh: "Chhattisgarh",
  Goa: "Goa",
  Gujarat: "Gujarat",
  Haryana: "Haryana",
  "Himachal Pradesh": "Himachal Pradesh",
  Jharkhand: "Jharkhand",
  Karnataka: "Karnataka",
  Kerala: "Kerala",
  Madhya Pradesh: "Madhya Pradesh",
  Maharashtra: "Maharashtra",
  Manipur: "Manipur",
  Meghalaya: "Meghalaya",
  Mizoram: "Mizoram",
  Nagaland: "Nagaland",
  Odisha: "Odisha",
  Punjab: "Punjab",
  Rajasthan: "Rajasthan",
  Sikkim: "Sikkim",
  "Tamil Nadu": "Tamil Nadu",
  Telangana: "Telangana",
  Tripura: "Tripura",
  "Uttar Pradesh": "Uttar Pradesh",
  Uttarakhand: "Uttarakhand",
  "West Bengal": "West Bengal",

  // Union Territories
  "Andaman and Nicobar Islands": "Andaman and Nicobar Islands",
  "Chandigarh": "Chandigarh",
  "Dadra and Nagar Haveli": "Dadra and Nagar Haveli",
  "Daman and Diu": "Daman and Diu",
  "Delhi": "Delhi",
  "Ladakh": "Ladakh",
  "Lakshadweep": "Lakshadweep",
  "Puducherry": "Puducherry",

  // Aliases
  "Orissa": "Odisha",
  "Odia": "Odisha",
  "Uttaranchal": "Uttarakhand",
};

/**
 * Get canonical state name
 */
export function getCanonicalStateName(input: string): string {
  return stateNameMappings[input] || input;
}

/**
 * List of all Indian states and UTs (for selectors)
 */
export const allIndianStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  // Union Territories
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

/**
 * Center coordinates for each state (for label positioning)
 * [longitude, latitude]
 */
export const stateCenters: Record<string, [number, number]> = {
  "Andhra Pradesh": [79, 16],
  "Arunachal Pradesh": [92, 28],
  Assam: [91, 26],
  Bihar: [85, 25],
  Chhattisgarh: [81, 21],
  Goa: [73.8, 15.3],
  Gujarat: [71, 22],
  Haryana: [77, 29],
  "Himachal Pradesh": [76, 32],
  Jharkhand: [84, 23],
  Karnataka: [75, 15],
  Kerala: [76, 10],
  "Madhya Pradesh": [77, 23],
  Maharashtra: [75, 19],
  Manipur: [94, 24],
  Meghalaya: [91, 25],
  Mizoram: [92, 23],
  Nagaland: [93, 26],
  Odisha: [84, 20],
  Punjab: [75, 31],
  Rajasthan: [75, 27],
  Sikkim: [88, 27],
  "Tamil Nadu": [78, 11],
  Telangana: [78, 17],
  Tripura: [91, 23],
  "Uttar Pradesh": [79, 26],
  Uttarakhand: [80, 30],
  "West Bengal": [88, 24],
  Delhi: [77, 28.7],
  Chandigarh: [76.8, 30.7],
  "Andaman and Nicobar Islands": [92, 12],
  Lakshadweep: [72.8, 10],
  Puducherry: [79.8, 12],
  Ladakh: [77.5, 33.5],
};

/**
 * Simplified GeoJSON for India states
 * Note: This is a minimal representation for demonstration
 * Production version would have actual TopoJSON/GeoJSON boundaries
 */
export const indiaGeoJSON: IndiaGeoJSON = {
  type: "FeatureCollection",
  features: allIndianStates.map((state) => ({
    type: "Feature" as const,
    properties: {
      name: state,
      id: state.toLowerCase().replace(/\s+/g, "_"),
    },
    geometry: {
      type: "Polygon" as const,
      // Placeholder coordinates - in production, use actual state boundaries
      coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]],
    },
  })),
};

/**
 * Get GeoJSON feature for a state
 */
export function getStateGeoFeature(stateName: string): StateGeoFeature | undefined {
  const canonical = getCanonicalStateName(stateName);
  return indiaGeoJSON.features.find(
    (f) => getCanonicalStateName(f.properties.name) === canonical
  );
}

/**
 * Get center coordinates for label positioning
 */
export function getStateCenter(stateName: string): [number, number] | undefined {
  const canonical = getCanonicalStateName(stateName);
  return stateCenters[canonical];
}
