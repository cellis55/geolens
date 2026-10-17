
import { useEffect, useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
} from "react-simple-maps";
import "./App.css";

type SimilarCountry = {
  rank: number;
  country_code: string;
  country_name: string;
  distance: number;
  closest_features: string[];
  biggest_differences: string[];
};

type Country = {
  country_code: string;
  country_name: string;
  region: string;
  income_level: string;
  population: number | null;
  gdp_per_capita_ppp: number | null;
  life_expectancy: number | null;
  fertility_rate: number | null;
  urban_population_pct: number | null;
  population_65_plus_pct: number | null;
  internet_usage_pct: number | null;
  cluster: number | null;
  model_eligible: boolean;
  similar_countries: SimilarCountry[];
};

type GeoLensData = {
  metadata: {
    country_count: number;
    modeled_country_count: number;
  };
  countries: Country[];
};

type MetricKey =
  | "gdp_per_capita_ppp"
  | "life_expectancy"
  | "fertility_rate"
  | "urban_population_pct"
  | "population_65_plus_pct"
  | "internet_usage_pct";

const metrics: { key: MetricKey; label: string }[] = [
  { key: "gdp_per_capita_ppp", label: "GDP per capita (PPP)" },
  { key: "life_expectancy", label: "Life expectancy" },
  { key: "fertility_rate", label: "Fertility rate" },
  { key: "urban_population_pct", label: "Urban population" },
  { key: "population_65_plus_pct", label: "Population age 65+" },
  { key: "internet_usage_pct", label: "Internet usage" },
];

const clusterNames: Record<number, string> = {
  1: "Transitional profiles",
  2: "Lower-income, higher-fertility profiles",
  3: "Higher-income, aging profiles",
};

const formatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});

function formatMetric(
  value: number | null | undefined,
  key: MetricKey | "population"
) {
  if (value == null) return "N/A";

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
    return formatter.format(value) + "%";
  }

  if (key === "life_expectancy") {
    return formatter.format(value) + " years";
  }

  return formatter.format(value);
}

function App() {
  const [data, setData] = useState<GeoLensData | null>(null);
  const [error, setError] = useState("");
  const [selectedCode, setSelectedCode] = useState("USA");
  const [metric, setMetric] =
    useState<MetricKey>("life_expectancy");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/data/country_data.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Could not load country data.");
        }
        return response.json();
      })
      .then((result: GeoLensData) => setData(result))
      .catch((err: Error) => setError(err.message));
  }, []);

  const countries = useMemo(
    () => data?.countries ?? [],
    [data]
  );

  const countryByCode = useMemo(
    () => new Map(countries.map((c) => [c.country_code, c])),
    [countries]
  );

  const selectedCountry =
    countryByCode.get(selectedCode) ?? countries[0];

  const filteredCountries = useMemo(
    () =>
      countries
        .filter((country) =>
          country.country_name
            .toLowerCase()
            .includes(search.toLowerCase())
        )
        .sort((a, b) =>
          a.country_name.localeCompare(b.country_name)
        ),
    [countries, search]
  );

  const metricValues = useMemo(
    () =>
      countries
        .map((country) => country[metric])
        .filter(
          (value): value is number =>
            typeof value === "number" &&
            Number.isFinite(value)
        ),
    [countries, metric]
  );

  const minValue = Math.min(...metricValues);
  const maxValue = Math.max(...metricValues);

  function getCountryColor(country?: Country) {
    if (!country || country[metric] == null) {
      return "#e5eaf0";
    }

    let value = country[metric]!;

    // Logarithmic color scale for GDP, which is skewed.
    if (metric === "gdp_per_capita_ppp") {
      value = Math.log1p(value);
    }

    const min =
      metric === "gdp_per_capita_ppp"
        ? Math.log1p(minValue)
        : minValue;

    const max =
      metric === "gdp_per_capita_ppp"
        ? Math.log1p(maxValue)
        : maxValue;

    const normalized =
      max === min ? 0.5 : (value - min) / (max - min);

    // Five shades of blue.
    const palette = [
      "#c8e3ed",
      "#92c6d9",
      "#56a4c2",
      "#267ba4",
      "#124d79",
    ];

    const index = Math.min(
      4,
      Math.floor(normalized * 5)
    );

    return palette[index];
  }

  if (error) {
    return <div className="status-message">{error}</div>;
  }

  if (!data || !selectedCountry) {
    return <div className="status-message">Loading GeoLens...</div>;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">◎</div>
          <div>
            <h1>GeoLens</h1>
            <p>Global Data Explorer</p>
          </div>
        </div>

        <div className="sidebar-section">
          <span className="section-label">EXPLORE</span>
          <div className="nav-item active">◈ &nbsp; World Atlas</div>
        </div>

        <div className="sidebar-section">
          <span className="section-label">COUNTRY SEARCH</span>
          <input
            type="search"
            placeholder="Search countries..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <div className="country-list">
            {filteredCountries.map((country) => (
              <button
                key={country.country_code}
                className={
                  country.country_code === selectedCode
                    ? "country-option selected"
                    : "country-option"
                }
                onClick={() =>
                  setSelectedCode(country.country_code)
                }
              >
                {country.country_name}
              </button>
            ))}
          </div>
        </div>

        <div className="sidebar-footer">
          Data: World Bank Open Data
          <span>GeoLens · Portfolio Project</span>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="eyebrow">GLOBAL INTELLIGENCE</span>
            <h2>Explore the World</h2>
            <p>
              Discover patterns across economic, demographic,
              and social indicators.
            </p>
          </div>
          <div className="dataset-tag">
            {data.metadata.country_count} countries & economies
          </div>
        </header>

        <section className="map-panel panel">
          <div className="panel-heading">
            <div>
              <h3>World Overview</h3>
              <p>Click a country to explore its profile.</p>
            </div>

            <select
              value={metric}
              onChange={(event) =>
                setMetric(event.target.value as MetricKey)
              }
            >
              {metrics.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="map-container">
            <ComposableMap
              projection="geoEqualEarth"
              projectionConfig={{ scale: 155 }}
              width={900}
              height={440}
            >
              <Geographies geography="/data/world.geojson">
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const properties = geo.properties as Record<
                      string,
                      string
                    >;

                    const code =
                      properties["ISO3166-1-Alpha-3"];

                    const country = countryByCode.get(code);
                    const isSelected = code === selectedCode;

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onClick={() => {
                          if (country) {
                            setSelectedCode(code);
                          }
                        }}
                        fill={getCountryColor(country)}
                        stroke={
                          isSelected ? "#f59e0b" : "#ffffff"
                        }
                        strokeWidth={isSelected ? 1.8 : 0.45}
                        style={{
                          outline: "none",
                          cursor: country ? "pointer" : "default",
                        }}
                        className="map-country"
                      >
                        <title>
                          {country?.country_name ??
                            properties.name ??
                            "No data"}
                        </title>
                      </Geography>
                    );
                  })
                }
              </Geographies>
            </ComposableMap>
          </div>

          <div className="map-legend">
            <span>Lower</span>
            <div className="legend-colors">
              {[
                "#c8e3ed",
                "#92c6d9",
                "#56a4c2",
                "#267ba4",
                "#124d79",
              ].map((color) => (
                <span
                  key={color}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span>Higher</span>
            <span className="legend-missing">
              Gray = unavailable
            </span>
          </div>
        </section>

        <section className="details-layout">
          <div className="panel country-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">COUNTRY PROFILE</span>
                <h3>{selectedCountry.country_name}</h3>
                <p>{selectedCountry.region}</p>
              </div>
              {selectedCountry.cluster != null && (
                <span className="cluster-tag">
                  Cluster {selectedCountry.cluster}
                </span>
              )}
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <span>Population</span>
                <strong>
                  {formatMetric(
                    selectedCountry.population,
                    "population"
                  )}
                </strong>
              </div>

              {metrics.map((item) => (
                <div className="stat-card" key={item.key}>
                  <span>{item.label}</span>
                  <strong>
                    {formatMetric(
                      selectedCountry[item.key],
                      item.key
                    )}
                  </strong>
                </div>
              ))}
            </div>

            {selectedCountry.cluster != null && (
              <div className="cluster-description">
                <strong>
                  {clusterNames[selectedCountry.cluster]}
                </strong>
                <p>
                  Grouped using six standardized economic,
                  demographic, and social indicators.
                </p>
              </div>
            )}
          </div>

          <div className="panel similarity-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">MACHINE LEARNING</span>
                <h3>Most Similar Countries</h3>
                <p>Based on standardized Euclidean distance.</p>
              </div>
            </div>

            {selectedCountry.similar_countries.length > 0 ? (
              <div className="similarity-list">
                {selectedCountry.similar_countries.map(
                  (match) => (
                    <button
                      className="similarity-item"
                      key={match.country_code}
                      onClick={() =>
                        setSelectedCode(match.country_code)
                      }
                    >
                      <span className="match-rank">
                        {match.rank}
                      </span>
                      <span className="match-name">
                        {match.country_name}
                        <small>View country profile →</small>
                      </span>
                      <span className="match-distance">
                        {match.distance.toFixed(3)}
                      </span>
                    </button>
                  )
                )}
              </div>
            ) : (
              <div className="empty-message">
                Similarity rankings are unavailable for this
                location because one or more required indicators
                are missing or outdated.
              </div>
            )}

            <p className="method-note">
              Lower distance indicates greater statistical
              similarity. Distances are not percentages or
              probabilities.
            </p>
          </div>
        </section>

        <footer className="page-footer">
          GeoLens · World Bank indicators, latest available
          observations from 2020–2025 · For exploratory analysis
        </footer>
      </main>
    </div>
  );
}

export default App;
