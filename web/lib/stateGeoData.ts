// lib/stateGeoData.ts

export interface StateGeo {
  name: string;
  code: string;
  region: string;
  center: [number, number];
}

export const stateGeoData: StateGeo[] = [
  { name: "Andhra Pradesh", code: "AP", region: "South", center: [79.74, 15.91] },
  { name: "Arunachal Pradesh", code: "AR", region: "North East", center: [94.72, 27.1] },
  { name: "Assam", code: "AS", region: "North East", center: [92.93, 26.2] },
  { name: "Bihar", code: "BR", region: "East", center: [85.31, 25.09] },
  { name: "Chhattisgarh", code: "CG", region: "Central", center: [82.0, 21.27] },
  { name: "Goa", code: "GA", region: "West", center: [74.12, 15.29] },
  { name: "Gujarat", code: "GJ", region: "West", center: [71.19, 22.3] },
  { name: "Haryana", code: "HR", region: "North", center: [76.08, 29.06] },
  { name: "Himachal Pradesh", code: "HP", region: "North", center: [77.57, 31.1] },
  { name: "Jharkhand", code: "JH", region: "East", center: [85.27, 23.61] },
  { name: "Karnataka", code: "KA", region: "South", center: [75.71, 15.32] },
  { name: "Kerala", code: "KL", region: "South", center: [76.27, 10.85] },
  { name: "Madhya Pradesh", code: "MP", region: "Central", center: [78.65, 23.25] },
  { name: "Maharashtra", code: "MH", region: "West", center: [75.71, 19.75] },
  { name: "Manipur", code: "MN", region: "North East", center: [93.9, 24.66] },
  { name: "Meghalaya", code: "ML", region: "North East", center: [91.36, 25.46] },
  { name: "Mizoram", code: "MZ", region: "North East", center: [92.94, 23.16] },
  { name: "Nagaland", code: "NL", region: "North East", center: [94.56, 26.16] },
  { name: "Odisha", code: "OD", region: "East", center: [85.09, 20.95] },
  { name: "Punjab", code: "PB", region: "North", center: [75.34, 31.14] },
  { name: "Rajasthan", code: "RJ", region: "West", center: [74.21, 27.02] },
  { name: "Sikkim", code: "SK", region: "North East", center: [88.61, 27.53] },
  { name: "Tamil Nadu", code: "TN", region: "South", center: [78.65, 11.12] },
  { name: "Telangana", code: "TS", region: "South", center: [79.0, 17.12] },
  { name: "Tripura", code: "TR", region: "North East", center: [91.98, 23.94] },
  { name: "Uttar Pradesh", code: "UP", region: "North", center: [80.94, 27.57] },
  { name: "Uttarakhand", code: "UK", region: "North", center: [79.01, 30.07] },
  { name: "West Bengal", code: "WB", region: "East", center: [88.36, 22.57] },
  { name: "Delhi", code: "DL", region: "Union Territory", center: [77.1, 28.7] },
  { name: "Jammu and Kashmir", code: "JK", region: "North", center: [75.34, 33.77] },
  { name: "Ladakh", code: "LA", region: "North", center: [77.58, 34.15] },
  { name: "Chandigarh", code: "CH", region: "Union Territory", center: [76.78, 30.73] },
  { name: "Puducherry", code: "PY", region: "Union Territory", center: [79.83, 11.91] },
  { name: "Andaman and Nicobar Islands", code: "AN", region: "Union Territory", center: [92.74, 11.74] },
  { name: "Lakshadweep", code: "LD", region: "Union Territory", center: [72.78, 10.57] }
];

// ✅ Get region by state name (used by IndiaMap.tsx)
export function getStateRegion(stateName: string): string {
  const match = stateGeoData.find(s =>
    s.name.toLowerCase() === stateName.toLowerCase()
  );
  return match ? match.region : "Unknown";
}

// ✅ Get all states by region
export function getStatesByRegion(region: string): string[] {
  return stateGeoData.filter(s => s.region === region).map(s => s.name);
}

// ✅ Default export
export default stateGeoData;
