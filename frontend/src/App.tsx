
import { useEffect, useMemo, useState } from "react";
import WorldMap from "./components/WorldMap";

import type {
  GeoLensData,
  MetricKey,
} from "./types/country";
import "./App.css";


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
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
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

  const selectedCountry = selectedCode
    ? countryByCode.get(selectedCode) ?? null
    : null;

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

  function handleSelectCountry(code: string) {
    setSelectedCode((current) =>
    current === code ? null : code
    );
  }
  if (error) {
    return <div className="status-message">{error}</div>;
  }

  if (!data) {
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
                  handleSelectCountry(country.country_code)
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

          <WorldMap
            countries={countries}
            selectedCode={selectedCode}
            metric={metric}
            onSelectCountry={handleSelectCountry}
          />

        </section>

        
        <section className="details-layout">
          {selectedCountry ? (
            <>
              {/* COUNTRY PROFILE */}
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

              {/* SIMILAR COUNTRIES */}
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
                    {selectedCountry.similar_countries.map((match) => (
                      <button
                        type="button"
                        className="similarity-item"
                        key={match.country_code}
                        onClick={() =>
                          handleSelectCountry(match.country_code)
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
                    ))}
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
            </>
          ) : (
            /* EXPLORE ALL MODE */
            <div className="panel explore-panel">
              <span className="eyebrow">EXPLORE THE WORLD</span>

              <h3>Discover countries through data.</h3>

              <p>
                Select any country on the map or use the country
                search to explore its statistics and discover its
                five most similar countries based on economic,
                demographic, and social indicators.
              </p>

              <div className="explore-summary">
                <div>
                  <strong>{data.metadata.country_count}</strong>
                  <span>Countries & economies</span>
                </div>

                <div>
                  <strong>{data.metadata.modeled_country_count}</strong>
                  <span>Similarity profiles</span>
                </div>

                <div>
                  <strong>6</strong>
                  <span>Model indicators</span>
                </div>
              </div>
            </div>
          )}
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
