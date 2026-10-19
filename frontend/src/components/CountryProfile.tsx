
import type { Country, MetricKey } from "../types/country";
import {
  clusterNames,
  formatMetric,
  metrics,
} from "../utils/formatting";

type Props = {
  country: Country;
};

function MetricDisplay({
  label,
  value,
  year,
  metric,
}: {
  label: string;
  value: number | null;
  year: number | null;
  metric: MetricKey | "population";
}) {
  return (
    <div className="atlas-metric">
      <span className="atlas-metric-label">{label}</span>

      <strong className="atlas-metric-value">
        {formatMetric(value, metric)}
      </strong>

      <span className="atlas-metric-year">
        {year ? `Data year: ${year}` : "Year unavailable"}
      </span>
    </div>
  );
}

export default function CountryProfile({
  country,
}: Props) {
  return (
    <article className="atlas-detail-panel">
      <div className="atlas-panel-overline">
        <span>01 / COUNTRY PROFILE</span>
        <span>{country.country_code}</span>
      </div>

      <div className="atlas-country-heading">
        <h2>{country.country_name}</h2>
        <p>{country.region}</p>
      </div>

      <div className="atlas-primary-metrics">
        <MetricDisplay
          label="Population"
          value={country.population}
          year={country.population_year}
          metric="population"
        />

        <MetricDisplay
          label="GDP per capita · PPP"
          value={country.gdp_per_capita_ppp}
          year={country.gdp_per_capita_ppp_year}
          metric="gdp_per_capita_ppp"
        />
      </div>

      <div className="atlas-secondary-metrics">
        {metrics
          .filter(
            (metric) =>
              metric.key !== "gdp_per_capita_ppp"
          )
          .map(({ key, shortLabel }) => {
            const yearKey =
              `${key}_year` as `${MetricKey}_year`;

            return (
              <MetricDisplay
                key={key}
                label={shortLabel}
                value={country[key]}
                year={country[yearKey]}
                metric={key}
              />
            );
          })}
      </div>

      {country.cluster != null && (
        <div className="atlas-cluster-strip">
          <span className="atlas-cluster-number">
            {String(country.cluster).padStart(2, "0")}
          </span>

          <div>
            <span className="atlas-cluster-label">
              DEVELOPMENT PROFILE
            </span>

            <strong>
              {clusterNames[country.cluster] ??
                `Cluster ${country.cluster}`}
            </strong>

            <p>
              Identified through K-means clustering of
              six standardized indicators.
            </p>
          </div>
        </div>
      )}
    </article>
  );
}
