/**
 * Historical annotations for inflation timeline
 * Key events that shaped India's inflation dynamics
 */

export interface TimelineAnnotation {
  year: number;
  month?: number;
  label: string;
  description?: string;
  color: string;
  impact?: "high" | "medium" | "low";
}

export const inflationAnnotations: TimelineAnnotation[] = [
  {
    year: 1958,
    label: "CPI Series Begins",
    description: "Ministry of Statistics & Programme Implementation begins CPI tracking",
    color: "#94A3B8",
    impact: "high",
  },
  {
    year: 1991,
    month: 6,
    label: "Economic Reforms",
    description: "India begins liberalization: market decontrol, reduced tariffs, exchange rate adjustments",
    color: "#1D4ED8",
    impact: "high",
  },
  {
    year: 1997,
    label: "Asian Financial Crisis",
    description: "Regional financial crisis affects global commodity prices and India's exports",
    color: "#DC2626",
    impact: "medium",
  },
  {
    year: 2008,
    label: "Global Financial Crisis",
    description: "Lehman collapse triggers worldwide recession and commodity price surge",
    color: "#7C3AED",
    impact: "high",
  },
  {
    year: 2010,
    label: "Food & Fuel Inflation",
    description: "Peak inflation period driven by agricultural and energy price shocks",
    color: "#F97316",
    impact: "high",
  },
  {
    year: 2015,
    month: 6,
    label: "CPI Base Year Change",
    description: "Base year shifted from 2004-05 to 2011-12 for better relevance",
    color: "#06B6D4",
    impact: "high",
  },
  {
    year: 2016,
    month: 2,
    label: "Inflation Targeting Framework",
    description: "RBI adopts flexible inflation targeting: 4% ± 2% target",
    color: "#8B5CF6",
    impact: "high",
  },
  {
    year: 2016,
    month: 11,
    label: "Demonetization",
    description: "₹500 & ₹1000 notes withdrawn; impacts economic activity & inflation",
    color: "#EF4444",
    impact: "medium",
  },
  {
    year: 2017,
    month: 7,
    label: "GST Implementation",
    description: "Goods & Services Tax replaces multiple indirect taxes; inflation impact mixed",
    color: "#10B981",
    impact: "medium",
  },
  {
    year: 2020,
    month: 3,
    label: "COVID-19 Lockdowns",
    description: "Global pandemic causes supply disruptions and demand shocks",
    color: "#DC2626",
    impact: "high",
  },
  {
    year: 2021,
    label: "Post-COVID Inflation Surge",
    description: "Global supply chain disruptions and demand rebound drive inflation higher",
    color: "#EF4444",
    impact: "high",
  },
  {
    year: 2022,
    label: "Geopolitical Tensions",
    description: "Russia-Ukraine conflict impacts crude oil and commodity prices globally",
    color: "#7C3AED",
    impact: "high",
  },
  {
    year: 2023,
    month: 9,
    label: "Peak Inflation Moderation",
    description: "Inflation begins moderating toward RBI's target band",
    color: "#06B6D4",
    impact: "medium",
  },
];

/**
 * Get annotations for a specific year
 */
export function getAnnotationsForYear(year: number): TimelineAnnotation[] {
  return inflationAnnotations.filter((ann) => ann.year === year);
}

/**
 * Get annotations for a date range
 */
export function getAnnotationsForRange(fromYear: number, toYear: number): TimelineAnnotation[] {
  return inflationAnnotations.filter((ann) => ann.year >= fromYear && ann.year <= toYear);
}

/**
 * Get color for an impact level
 */
export function getImpactColor(impact?: string): string {
  switch (impact) {
    case "high":
      return "#DC2626";
    case "medium":
      return "#F97316";
    case "low":
      return "#94A3B8";
    default:
      return "#64748B";
  }
}
