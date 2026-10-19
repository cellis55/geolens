
import { useMemo } from "react";
import type { Country, MetricKey } from "../types/country";
import { formatMetric, metrics } from "../utils/formatting";

type Props = {
  countries: Country[];
  firstCode: string;
  secondCode: string;
  onFirstChange: (code: string) => void;
  onSecondChange: (code: string) => void;
  onSwap: () => void;
};

const countryColors = {
  first: "#153f48",
  second: "#3d9b87",
};

function observationYear(
  country: Country,
  metric: MetricKey | "population"
): number | null {
  const yearKey = `${metric}_year` as
    | `${MetricKey}_year`
    | "population_year";

  return country[yearKey];
}

function CountrySelect({
  label,
  value,
  countries,
  onChange,
}: {
  label: string;
  value: string;
  countries: Country[];
  onChange: (code: string) => void;
}) {
  return (
    <label className="compare-picker">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {countries.map((country) => (
          <option
            key={country.country_code}
            value={country.country_code}
          >
            {country.country_name}
          </option>
        ))}
      </select>
    </label>
  );
}

function SummaryMetric({
  country,
  metric,
  label,
}: {
  country: Country;
  metric: MetricKey | "population";
  label: string;
}) {
  return (
    <div className="compare-summary-metric">
      <span>{label}</span>
      <strong>{formatMetric(country[metric], metric)}</strong>
      <small>
        {observationYear(country, metric) ??
          "Year unavailable"}
      </small>
    </div>
  );
}

function ComparisonRow({
  first,
  second,
  metric,
  label,
}: {
  first: Country;
  second: Country;
  metric: MetricKey;
  label: string;
}) {
  const a = first[metric];
  const b = second[metric];

  const validA = a !== null && Number.isFinite(a);
  const validB = b !== null && Number.isFinite(b);

  // Relative bars within each pair, not a shared scale
  // across different types of indicators.
  const largest = Math.max(
    validA ? a : 0,
    validB ? b : 0,
    0
  );

  const aWidth =
    validA && largest > 0 ? (a / largest) * 100 : 0;

  const bWidth =
    validB && largest > 0 ? (b / largest) * 100 : 0;

  const difference =
    validA && validB ? Math.abs(a - b) : null;

  return (
    <div className="compare-indicator">
      <div className="compare-indicator-heading">
        <h3>{label}</h3>
        <span>
          {difference === null
            ? "Comparison unavailable"
            : `Absolute gap: ${formatMetric(
                difference,
                metric
              )}`}
        </span>
      </div>

      <div className="compare-bar-group">
        <div className="compare-bar-line">
          <div className="compare-bar-label">
            <span>{first.country_name}</span>
            <strong>{formatMetric(a, metric)}</strong>
          </div>

          <div className="compare-bar-track">
            <div
              className="compare-bar-fill first"
              style={{ width: `${aWidth}%` }}
            />
          </div>

          <small>
            {validA
              ? `Observation: ${observationYear(first, metric) ?? "unknown"}`
              : "Data unavailable"}
          </small>
        </div>

        <div className="compare-bar-line">
          <div className="compare-bar-label">
            <span>{second.country_name}</span>
            <strong>{formatMetric(b, metric)}</strong>
          </div>

          <div className="compare-bar-track">
            <div
              className="compare-bar-fill second"
              style={{ width: `${bWidth}%` }}
            />
          </div>

          <small>
            {validB
              ? `Observation: ${observationYear(second, metric) ?? "unknown"}`
              : "Data unavailable"}
          </small>
        </div>
      </div>
    </div>
  );
}

export default function CountryComparison({
  countries,
  firstCode,
  secondCode,
  onFirstChange,
  onSecondChange,
  onSwap,
}: Props) {
  const sortedCountries = useMemo(
    () =>
      [...countries].sort((a, b) =>
        a.country_name.localeCompare(b.country_name)
      ),
    [countries]
  );

  const countryByCode = useMemo(
    () =>
      new Map(
        countries.map((country) => [
          country.country_code,
          country,
        ])
      ),
    [countries]
  );

  const first = countryByCode.get(firstCode);
  const second = countryByCode.get(secondCode);

  if (!first || !second) {
    return (
      <div className="compare-error">
        Country comparison data is unavailable.
      </div>
    );
  }

  return (
    <section className="compare-page">
      <div className="compare-intro">
        <span className="atlas-overline">
          02 — COUNTRY COMPARISON
        </span>

        <h2>
          Two countries.
          <br />
          <em>One perspective.</em>
        </h2>

        <p>
          Compare the economic, demographic, and social
          characteristics of two countries using real
          World Bank indicators.
        </p>
      </div>

      <div className="compare-controls">
        <CountrySelect
          label="COUNTRY 01"
          countries={sortedCountries}
          value={firstCode}
          onChange={onFirstChange}
        />

        <button
          className="compare-swap"
          type="button"
          onClick={onSwap}
          aria-label="Swap countries"
          title="Swap countries"
        >
          ⇄
        </button>

        <CountrySelect
          label="COUNTRY 02"
          countries={sortedCountries}
          value={secondCode}
          onChange={onSecondChange}
        />
      </div>

      <div className="compare-country-cards">
        <article className="compare-country-card first">
          <span>01 / {first.country_code}</span>
          <h3>{first.country_name}</h3>
          <p>{first.region}</p>

          <div className="compare-summary-grid">
            <SummaryMetric
              country={first}
              metric="population"
              label="Population"
            />

            <SummaryMetric
              country={first}
              metric="gdp_per_capita_ppp"
              label="GDP per capita (PPP)"
            />
          </div>
        </article>

        <article className="compare-country-card second">
          <span>02 / {second.country_code}</span>
          <h3>{second.country_name}</h3>
          <p>{second.region}</p>

          <div className="compare-summary-grid">
            <SummaryMetric
              country={second}
              metric="population"
              label="Population"
            />

            <SummaryMetric
              country={second}
              metric="gdp_per_capita_ppp"
              label="GDP per capita (PPP)"
            />
          </div>
        </article>
      </div>

      <div className="compare-analysis">
        <div className="compare-analysis-heading">
          <span className="atlas-overline">
            SIDE-BY-SIDE INDICATORS
          </span>
          <h2>Looking beyond the numbers.</h2>
          <p>
            Each pair of bars shares its own scale.
            The longer bar represents the larger value
            for that indicator.
          </p>
        </div>

        <div className="compare-legend">
          <span>
            <i style={{ background: countryColors.first }} />
            {first.country_name}
          </span>
          <span>
            <i style={{ background: countryColors.second }} />
            {second.country_name}
          </span>
        </div>

        <div className="compare-indicators">
          {metrics.map((item) => (
            <ComparisonRow
              key={item.key}
              first={first}
              second={second}
              metric={item.key}
              label={item.label}
            />
          ))}
        </div>
      </div>

      <div className="compare-data-note">
        <strong>Reading this comparison</strong>
        <p>
          The bars are scaled separately for each indicator,
          so lengths should not be compared between different
          indicators. Years may differ between countries.
          Missing observations are not estimated or replaced.
          These descriptive differences do not imply causation.
        </p>
      </div>
    </section>
  );
}
