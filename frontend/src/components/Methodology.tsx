
import type { GeoLensData } from "../types/country";

type Props = {
  metadata: GeoLensData["metadata"];
};

const indicators = [
  {
    name: "GDP per capita (PPP)",
    code: "NY.GDP.PCAP.PP.CD",
    group: "Economic",
    description: "Economic output per person adjusted for purchasing power.",
  },
  {
    name: "Life expectancy",
    code: "SP.DYN.LE00.IN",
    group: "Health",
    description: "Life expectancy at birth, measured in years.",
  },
  {
    name: "Fertility rate",
    code: "SP.DYN.TFRT.IN",
    group: "Demographic",
    description: "Average births per woman.",
  },
  {
    name: "Urban population",
    code: "SP.URB.TOTL.IN.ZS",
    group: "Geographic",
    description: "Percentage of the population living in urban areas.",
  },
  {
    name: "Population aged 65+",
    code: "SP.POP.65UP.TO.ZS",
    group: "Demographic",
    description: "Percentage of the population aged 65 or older.",
  },
  {
    name: "Internet usage",
    code: "IT.NET.USER.ZS",
    group: "Digital",
    description: "Percentage of individuals using the internet.",
  },
];

const sensitivity = [
  { name: "Urban population", overlap: 55.5 },
  { name: "Population aged 65+", overlap: 72.8 },
  { name: "Life expectancy", overlap: 72.9 },
  { name: "Fertility rate", overlap: 76.4 },
  { name: "GDP per capita", overlap: 79.1 },
  { name: "Internet usage", overlap: 81.9 },
];

const clusters = [
  {
    number: "01",
    count: 71,
    name: "Transitional development profiles",
    gdp: "$20,685",
    life: "72.9 years",
    fertility: "2.26",
  },
  {
    number: "02",
    count: 42,
    name: "Lower-income, higher-fertility profiles",
    gdp: "$4,478",
    life: "64.2 years",
    fertility: "4.16",
  },
  {
    number: "03",
    count: 68,
    name: "Higher-income, aging profiles",
    gdp: "$63,399",
    life: "80.4 years",
    fertility: "1.37",
  },
];

export default function Methodology({ metadata }: Props) {
  return (
    <section className="method-page">
      <header className="method-intro">
        <span className="atlas-overline">
          03 — BEHIND THE ATLAS
        </span>

        <h2>
          Understanding
          <br />
          <em>the data.</em>
        </h2>

        <p>
          GeoLens brings together international development
          statistics, geographic visualization, and unsupervised
          machine learning to explore similarities between
          countries and economies.
        </p>
      </header>

      <div className="method-summary">
        <div>
          <strong>{metadata.country_count}</strong>
          <span>Atlas locations</span>
        </div>
        <div>
          <strong>{metadata.modeled_country_count}</strong>
          <span>Model-eligible locations</span>
        </div>
        <div>
          <strong>905</strong>
          <span>Similarity relationships</span>
        </div>
        <div>
          <strong>06</strong>
          <span>Similarity indicators</span>
        </div>
      </div>

      {/* DATA SOURCES */}
      <section className="method-section">
        <div className="method-section-label">
          <span>01</span>
          <span>DATA SOURCES</span>
        </div>

        <div className="method-section-content">
          <h3>Built on global development data.</h3>

          <p>
            Country-level statistics are collected from the
            World Bank's World Development Indicators through
            its public API. The source provides economic,
            demographic, health, and connectivity indicators
            across countries and economies.
          </p>

          <p>
            Our data collection covers 2020–2025 and retains
            the latest available non-missing observation for
            each indicator and location. Not every indicator
            is reported in the same year, so GeoLens preserves
            the individual observation years.
          </p>

          <div className="method-source-links">
            <a
              href="https://data.worldbank.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              World Bank Open Data ↗
            </a>
            <a
              href="https://datahelpdesk.worldbank.org/knowledgebase/articles/889392"
              target="_blank"
              rel="noopener noreferrer"
            >
              World Bank API Documentation ↗
            </a>
          </div>

          <h4>Indicators used in the similarity model</h4>

          <div className="method-indicator-table">
            {indicators.map((indicator) => (
              <div
                className="method-indicator-row"
                key={indicator.code}
              >
                <div>
                  <strong>{indicator.name}</strong>
                  <span>{indicator.description}</span>
                </div>

                <div className="method-indicator-meta">
                  <span>{indicator.group}</span>
                  <code>{indicator.code}</code>
                </div>
              </div>
            ))}
          </div>

          <p className="method-small-note">
            Total population is included in country profiles
            and comparisons, but excluded from the six-feature
            similarity calculation.
          </p>
        </div>
      </section>

      {/* DATA PROCESSING */}
      <section className="method-section">
        <div className="method-section-label">
          <span>02</span>
          <span>DATA PREPARATION</span>
        </div>

        <div className="method-section-content">
          <h3>From raw indicators to comparable profiles.</h3>

          <p>
            The Python processing pipeline merges indicators
            using World Bank country codes, filters regional
            aggregates, validates numerical values, and
            preserves missing observations.
          </p>

          <div className="method-steps">
            <div>
              <span>01</span>
              <strong>Collect</strong>
              <p>
                Download indicators and country metadata from
                the World Bank API.
              </p>
            </div>
            <div>
              <span>02</span>
              <strong>Clean</strong>
              <p>
                Validate data types, handle missing values,
                and identify eligible countries.
              </p>
            </div>
            <div>
              <span>03</span>
              <strong>Transform</strong>
              <p>
                Log-transform GDP per capita and standardize
                the six modeling indicators.
              </p>
            </div>
            <div>
              <span>04</span>
              <strong>Model</strong>
              <p>
                Calculate nearest-neighbor distances and
                assign K-means clusters.
              </p>
            </div>
          </div>

          <div className="method-highlight">
            <strong>Why 181 instead of 217?</strong>
            <p>
              The atlas preserves all 217 World Bank locations.
              Similarity analysis requires complete observations
              for all six model indicators, each from 2022 or
              later. Locations failing either requirement
              remain accessible in the atlas and comparison
              view but are excluded from modeling.
            </p>
          </div>
        </div>
      </section>

      {/* SIMILARITY */}
      <section className="method-section">
        <div className="method-section-label">
          <span>03</span>
          <span>COUNTRY SIMILARITY</span>
        </div>

        <div className="method-section-content">
          <h3>How do we measure similarity?</h3>

          <p>
            GeoLens uses Euclidean distance across six
            standardized indicators. Each country is
            represented as a point in a six-dimensional
            feature space. Countries with smaller distances
            have more similar measured profiles.
          </p>

          <div className="method-equation">
            <span>EUCLIDEAN DISTANCE</span>
            <strong>
              d(A, B) = √ Σ (Aᵢ − Bᵢ)²
            </strong>
            <small>
              Calculated using standardized feature values.
            </small>
          </div>

          <p>
            GDP per capita is log-transformed before
            standardization to reduce the influence of
            extremely high values. StandardScaler then
            centers each feature and scales it to unit
            variance. All six transformed indicators receive
            equal weight in the distance calculation.
          </p>

          <p>
            Every eligible location receives its five nearest
            neighbors, excluding itself. GeoLens reports
            the raw model distance rather than an artificial
            similarity percentage.
          </p>
        </div>
      </section>

      {/* CLUSTERING */}
      <section className="method-section">
        <div className="method-section-label">
          <span>04</span>
          <span>COUNTRY CLUSTERING</span>
        </div>

        <div className="method-section-content">
          <h3>Finding broader geographic patterns.</h3>

          <p>
            Alongside nearest-neighbor matching, GeoLens uses
            K-means clustering to group countries with similar
            overall statistical profiles.
          </p>

          <p>
            Cluster counts from 3 through 8 were evaluated
            using the silhouette score. The highest score
            among those candidates was obtained with three
            clusters (0.3785). The groupings are descriptive
            patterns rather than official development
            classifications.
          </p>

          <div className="method-cluster-grid">
            {clusters.map((cluster) => (
              <div
                className="method-cluster-card"
                key={cluster.number}
              >
                <span className="method-cluster-id">
                  CLUSTER {cluster.number}
                </span>

                <strong>{cluster.name}</strong>

                <span className="method-cluster-count">
                  {cluster.count} locations
                </span>

                <div>
                  <span>Average GDP per capita</span>
                  <b>{cluster.gdp}</b>
                </div>
                <div>
                  <span>Average life expectancy</span>
                  <b>{cluster.life}</b>
                </div>
                <div>
                  <span>Average fertility rate</span>
                  <b>{cluster.fertility}</b>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VALIDATION */}
      <section className="method-section">
        <div className="method-section-label">
          <span>05</span>
          <span>MODEL VALIDATION</span>
        </div>

        <div className="method-section-content">
          <h3>Testing the results.</h3>

          <p>
            We independently recalculated all nearest-neighbor
            rankings, reproduced the clustering process, and
            tested the sensitivity of the rankings to removing
            individual features.
          </p>

          <div className="method-validation-stats">
            <div>
              <strong>0</strong>
              <span>Similarity validation issues</span>
            </div>
            <div>
              <strong>1.000</strong>
              <span>Adjusted Rand Index</span>
            </div>
            <div>
              <strong>0.3785</strong>
              <span>Selected silhouette score</span>
            </div>
          </div>

          <h4>Feature sensitivity analysis</h4>

          <p>
            Each indicator was removed individually and the
            top-five nearest neighbors were recalculated.
            The percentages below show how many original
            neighbors remained, on average.
          </p>

          <div className="method-sensitivity">
            {sensitivity.map((feature) => (
              <div
                className="method-sensitivity-row"
                key={feature.name}
              >
                <div>
                  <span>{feature.name}</span>
                  <strong>{feature.overlap.toFixed(1)}%</strong>
                </div>

                <div className="method-sensitivity-track">
                  <div
                    style={{
                      width: `${feature.overlap}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="method-small-note">
            Urbanization produced the largest change in
            neighbor rankings when removed, retaining just
            55.5% of original top-five matches. Lower
            retention indicates greater sensitivity to
            removing the feature, not greater causal
            importance.
          </p>
        </div>
      </section>

      {/* GEOGRAPHY AND LIMITATIONS */}
      <section className="method-section">
        <div className="method-section-label">
          <span>06</span>
          <span>INTERPRETATION & LIMITATIONS</span>
        </div>

        <div className="method-section-content">
          <h3>What the atlas can and can't tell us.</h3>

          <div className="method-limitations">
            <div>
              <strong>Statistical, not cultural similarity</strong>
              <p>
                Matching countries have similar values across
                six indicators. This does not imply similarity
                in culture, history, politics, or institutions.
              </p>
            </div>
            <div>
              <strong>Different observation years</strong>
              <p>
                Indicators use the latest available observations
                within 2020–2025. Comparisons may involve
                measurements from different years.
              </p>
            </div>
            <div>
              <strong>Incomplete country coverage</strong>
              <p>
                Not all atlas locations meet modeling
                requirements. Missing values are not silently
                filled or treated as zero.
              </p>
            </div>
            <div>
              <strong>Feature selection matters</strong>
              <p>
                Rankings depend on the chosen indicators,
                scaling method, and equal weighting. Other
                choices could lead to different results.
              </p>
            </div>
            <div>
              <strong>Clusters are descriptive</strong>
              <p>
                K-means groups countries based on their data,
                but the clusters overlap and should not be
                treated as definitive categories.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ATTRIBUTION */}
      <footer className="method-attribution">
        <span className="atlas-overline">
          DATA & MAP ATTRIBUTION
        </span>

        <p>
          Country indicators: World Bank Open Data / World
          Development Indicators. Geographic boundaries:
          Natural Earth, distributed through the Geo Countries
          dataset. Boundaries are used for visualization and
          do not imply a position on territorial sovereignty.
        </p>

        <div className="method-source-links">
          <a
            href="https://data.worldbank.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            World Bank ↗
          </a>
          <a
            href="https://www.naturalearthdata.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Natural Earth ↗
          </a>
          <a
            href="https://github.com/datasets/geo-countries"
            target="_blank"
            rel="noopener noreferrer"
          >
            Geo Countries ↗
          </a>
        </div>
      </footer>
    </section>
  );
}
