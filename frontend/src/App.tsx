
import { useEffect, useMemo, useState } from "react";

import Sidebar from "./components/Sidebar";
import WorldMap from "./components/WorldMap";
import CountryProfile from "./components/CountryProfile";
import SimilarityPanel from "./components/SimilarityPanel";
import CountryComparison from "./components/CountryComparison";

import type {
  GeoLensData,
  MetricKey,
} from "./types/country";

import { metrics } from "./utils/formatting";

import "./App.css";

type View = "atlas" | "compare";

export default function App() {
  const [data, setData] = useState<GeoLensData | null>(null);
  const [error, setError] = useState("");

  const [view, setView] = useState<View>("atlas");

  const [selectedCode, setSelectedCode] =
    useState<string | null>(null);

  const [metric, setMetric] =
    useState<MetricKey>("life_expectancy");

  const [search, setSearch] = useState("");

  // Comparison selections
  const [firstCode, setFirstCode] = useState("USA");
  const [secondCode, setSecondCode] = useState("JPN");

  useEffect(() => {
    fetch("/data/country_data.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            "Could not load the GeoLens dataset."
          );
        }

        return response.json();
      })
      .then((result: GeoLensData) => {
        setData(result);
      })
      .catch((err: Error) => {
        setError(err.message);
      });
  }, []);

  const countries = useMemo(
    () => data?.countries ?? [],
    [data]
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

  const selectedCountry = selectedCode
    ? countryByCode.get(selectedCode) ?? null
    : null;

  function handleSelectCountry(code: string) {
    setView("atlas");

    setSelectedCode((current) =>
      current === code ? null : code
    );
  }

  function handleExploreAll() {
    setView("atlas");
    setSelectedCode(null);
  }

  function handleFirstChange(code: string) {
    // Prevent comparing a country against itself.
    if (code === secondCode) {
      setSecondCode(firstCode);
    }

    setFirstCode(code);
  }

  function handleSecondChange(code: string) {
    if (code === firstCode) {
      setFirstCode(secondCode);
    }

    setSecondCode(code);
  }

  function handleSwap() {
    setFirstCode(secondCode);
    setSecondCode(firstCode);
  }

  if (error) {
    return (
      <div className="atlas-status">
        <h2>Unable to load GeoLens</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="atlas-status">
        Loading the atlas...
      </div>
    );
  }

  return (
    <div className="atlas-app">
      <Sidebar
        countries={countries}
        selectedCode={view === "atlas" ? selectedCode : null}
        search={search}
        onSearchChange={setSearch}
        onSelectCountry={handleSelectCountry}
        onExploreAll={handleExploreAll}
      />

      <main className="atlas-main">
        <header className="atlas-page-header">
          <div>
            <span className="atlas-overline">
              A DATA-DRIVEN WORLD ATLAS
            </span>

            <h1>
              The world,
              <br />
              <em>beyond borders.</em>
            </h1>

            <p>
              Explore the patterns that connect countries
              through economics, demographics, and human
              development.
            </p>
          </div>

          <div className="atlas-header-meta">
            <span className="atlas-header-meta-label">
              THE WORLD AT A GLANCE
            </span>

            <strong>{data.metadata.country_count}</strong>
            <span>Countries & economies</span>
          </div>
        </header>

        {/* Navigation between the two primary experiences */}
        <nav className="atlas-view-navigation" aria-label="GeoLens views">
          <button
            type="button"
            className={
              view === "atlas"
                ? "atlas-view-tab active"
                : "atlas-view-tab"
            }
            onClick={() => setView("atlas")}
            aria-current={view === "atlas" ? "page" : undefined}
          >
            <span>01</span>
            World Atlas
          </button>

          <button
            type="button"
            className={
              view === "compare"
                ? "atlas-view-tab active"
                : "atlas-view-tab"
            }
            onClick={() => setView("compare")}
            aria-current={view === "compare" ? "page" : undefined}
          >
            <span>02</span>
            Compare Countries
          </button>
        </nav>

        {view === "atlas" ? (
          <>
            <section className="atlas-map-section">
              <div className="atlas-map-heading">
                <div>
                  <span className="atlas-overline">
                    01 — THE WORLD
                  </span>

                  <h2>
                    {selectedCountry
                      ? `Exploring ${selectedCountry.country_name}`
                      : "Explore the atlas"}
                  </h2>

                  <p>
                    {selectedCountry
                      ? "The selected country and its five closest matches are highlighted."
                      : "Choose an indicator or select a country to discover its connections."}
                  </p>
                </div>

                <div className="atlas-map-actions">
                  {selectedCountry && (
                    <button
                      type="button"
                      className="atlas-clear-button"
                      onClick={handleExploreAll}
                    >
                      ← Explore all
                    </button>
                  )}

                  <select
                    aria-label="Choose map indicator"
                    value={metric}
                    onChange={(event) =>
                      setMetric(
                        event.target.value as MetricKey
                      )
                    }
                  >
                    {metrics.map((item) => (
                      <option
                        key={item.key}
                        value={item.key}
                      >
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <WorldMap
                countries={countries}
                selectedCode={selectedCode}
                metric={metric}
                onSelectCountry={handleSelectCountry}
              />
            </section>

            <section className="atlas-details">
              {selectedCountry ? (
                <>
                  <CountryProfile country={selectedCountry} />

                  <SimilarityPanel
                    country={selectedCountry}
                    onSelectCountry={handleSelectCountry}
                  />
                </>
              ) : (
                <div className="atlas-welcome">
                  <div>
                    <span className="atlas-overline">
                      DISCOVER THE CONNECTIONS
                    </span>

                    <h2>
                      Every country
                      <br />
                      tells a story.
                    </h2>

                    <p>
                      Select a country to explore its human
                      geography profile and discover unexpected
                      similarities.
                    </p>
                  </div>

                  <div className="atlas-welcome-numbers">
                    <div>
                      <strong>
                        {data.metadata.country_count}
                      </strong>
                      <span>Atlas locations</span>
                    </div>

                    <div>
                      <strong>
                        {data.metadata.modeled_country_count}
                      </strong>
                      <span>Similarity profiles</span>
                    </div>

                    <div>
                      <strong>06</strong>
                      <span>Model indicators</span>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </>
        ) : (
          <CountryComparison
            countries={countries}
            firstCode={firstCode}
            secondCode={secondCode}
            onFirstChange={handleFirstChange}
            onSecondChange={handleSecondChange}
            onSwap={handleSwap}
          />
        )}

        <footer className="atlas-page-footer">
          <span>GEOLENS © 2026</span>
          <span>
            Data: World Bank Open Data · Observations
            from 2020–2025
          </span>
          <span>Built for geographic exploration</span>
        </footer>
      </main>
    </div>
  );
}
