import { createPortal } from "react-dom";
import type { Country, MetricKey } from "../types/country";

export type TooltipData = {
  country: Country;
  x: number;
  y: number;
};

type Props = {
  tooltip: TooltipData | null;
};

const metrics: { key: MetricKey; label: string }[] = [
  { key: "gdp_per_capita_ppp", label: "GDP per capita" },
  { key: "life_expectancy", label: "Life expectancy" },
  { key: "fertility_rate", label: "Fertility rate" },
  { key: "urban_population_pct", label: "Urban population" },
  { key: "population_65_plus_pct", label: "Population age 65+" },
  { key: "internet_usage_pct", label: "Internet usage" },
];

function formatValue(
  value: number | null,
  metric: MetricKey | "population"
): string {
  if (value == null) return "N/A";

  if (metric === "population") {
    return Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(value);
  }

  if (metric === "gdp_per_capita_ppp") {
    return "$" + Math.round(value).toLocaleString("en-US");
  }

  if (
    metric === "urban_population_pct" ||
    metric === "population_65_plus_pct" ||
    metric === "internet_usage_pct"
  ) {
    return value.toFixed(1) + "%";
  }

  if (metric === "life_expectancy") {
    return value.toFixed(1) + " years";
  }

  return value.toFixed(2);
}

export default function CountryTooltip({ tooltip }: Props) {
  if (!tooltip) return null;

  const { country, x, y } = tooltip;

  const left = Math.max(
    8,
    Math.min(x + 16, window.innerWidth - 306)
  );

  const top = Math.max(
    8,
    Math.min(y + 16, window.innerHeight - 370)
  );

  return createPortal(
    <div
      className="geo-tooltip"
      style={{ left, top }}
      role="tooltip"
    >
      <div className="geo-tooltip-heading">
        <strong>{country.country_name}</strong>
        <span>{country.region}</span>
      </div>

      <div className="geo-tooltip-row">
        <span>Population</span>
        <strong>
          {formatValue(country.population, "population")}
        </strong>
      </div>

      {metrics.map(({ key, label }) => (
        <div className="geo-tooltip-row" key={key}>
          <span>{label}</span>
          <strong>{formatValue(country[key], key)}</strong>
        </div>
      ))}

      <div className="geo-tooltip-note">
        {country.model_eligible
          ? "Similarity analysis available"
          : "Similarity analysis unavailable"}
      </div>
    </div>
    ,
  document.body
  );
}
