
import type { MetricKey } from "../types/country";

export const metrics: {
  key: MetricKey;
  label: string;
  shortLabel: string;
}[] = [
  {
    key: "gdp_per_capita_ppp",
    label: "GDP per capita (PPP)",
    shortLabel: "GDP per capita",
  },
  {
    key: "life_expectancy",
    label: "Life expectancy",
    shortLabel: "Life expectancy",
  },
  {
    key: "fertility_rate",
    label: "Fertility rate",
    shortLabel: "Fertility",
  },
  {
    key: "urban_population_pct",
    label: "Urban population",
    shortLabel: "Urbanization",
  },
  {
    key: "population_65_plus_pct",
    label: "Population aged 65+",
    shortLabel: "Age 65+",
  },
  {
    key: "internet_usage_pct",
    label: "Internet usage",
    shortLabel: "Internet usage",
  },
];

export const clusterNames: Record<number, string> = {
  1: "Transitional development profiles",
  2: "Lower-income, higher-fertility profiles",
  3: "Higher-income, aging profiles",
};

export function formatMetric(
  value: number | null | undefined,
  key: MetricKey | "population"
): string {
  if (value == null || !Number.isFinite(value)) {
    return "N/A";
  }

  if (key === "population") {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(value);
  }

  if (key === "gdp_per_capita_ppp") {
    return "$" + Math.round(value).toLocaleString("en-US");
  }

  if (
    key === "urban_population_pct" ||
    key === "population_65_plus_pct" ||
    key === "internet_usage_pct"
  ) {
    return value.toFixed(1) + "%";
  }

  if (key === "life_expectancy") {
    return value.toFixed(1) + " yrs";
  }

  return value.toFixed(2);
}

export function readableFeature(feature: string): string {
  if (feature === "population") return "Population";

  return (
    metrics.find((metric) => metric.key === feature)
      ?.shortLabel ?? feature.replaceAll("_", " ")
  );
}
