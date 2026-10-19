
import type { Country } from "../types/country";

type Props = {
  countries: Country[];
  selectedCode: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  onSelectCountry: (code: string) => void;
  onExploreAll: () => void;
};

export default function Sidebar({
  countries,
  selectedCode,
  search,
  onSearchChange,
  onSelectCountry,
  onExploreAll,
}: Props) {
  const filtered = countries
    .filter((country) =>
      country.country_name
        .toLowerCase()
        .includes(search.toLowerCase())
    )
    .sort((a, b) =>
      a.country_name.localeCompare(b.country_name)
    );

  return (
    <aside className="atlas-sidebar">
      <div className="atlas-brand">
        <div className="atlas-brand-symbol">◎</div>
        <div>
          <h1>GeoLens</h1>
          <p>AN ATLAS OF HUMAN GEOGRAPHY</p>
        </div>
      </div>

      <div className="atlas-navigation">
        <span className="atlas-sidebar-label">
          THE ATLAS
        </span>

        <button
          type="button"
          className={
            selectedCode === null
              ? "atlas-nav-button active"
              : "atlas-nav-button"
          }
          onClick={onExploreAll}
        >
          <span className="atlas-nav-icon">◈</span>
          Explore the world
        </button>
      </div>

      <div className="atlas-country-section">
        <div className="atlas-section-heading">
          <span className="atlas-sidebar-label">
            COUNTRY INDEX
          </span>
          <span className="atlas-country-count">
            {countries.length}
          </span>
        </div>

        <input
          className="atlas-search"
          type="search"
          value={search}
          onChange={(event) =>
            onSearchChange(event.target.value)
          }
          placeholder="Find a country..."
          aria-label="Search countries"
        />

        <div className="atlas-country-list">
          {filtered.map((country) => (
            <button
              type="button"
              key={country.country_code}
              className={
                selectedCode === country.country_code
                  ? "atlas-country-option selected"
                  : "atlas-country-option"
              }
              onClick={() =>
                onSelectCountry(country.country_code)
              }
            >
              <span>{country.country_name}</span>

              {selectedCode === country.country_code && (
                <span className="atlas-selected-dot" />
              )}
            </button>
          ))}

          {filtered.length === 0 && (
            <p className="atlas-no-results">
              No matching countries found.
            </p>
          )}
        </div>
      </div>

      <div className="atlas-sidebar-footer">
        <span className="atlas-footer-divider" />
        <p>GEOGRAPHY THROUGH DATA</p>
        <span>
          World Bank Open Data
          <br />
          Economic · Social · Demographic
        </span>
      </div>
    </aside>
  );
}
