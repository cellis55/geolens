
import { useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";

import type { Country, MetricKey } from "../types/country";
import CountryTooltip, {
  type TooltipData,
} from "./CountryTooltip";
import MapControls from "./MapControls";

type Props = {
  countries: Country[];
  selectedCode: string | null;
  metric: MetricKey;
  onSelectCountry: (code: string) => void;
};

type MapPosition = {
  coordinates: [number, number];
  zoom: number;
};

const palette = [
  "#d5e8dc",
  "#a7d0bb",
  "#72b69e",
  "#388e87",
  "#175968",
];

export default function WorldMap({
  countries,
  selectedCode,
  metric,
  onSelectCountry,
}: Props) {
  const [position, setPosition] = useState<MapPosition>({
    coordinates: [0, 0],
    zoom: 1,
  });

  const [tooltip, setTooltip] = useState<TooltipData | null>(
    null
  );

  const countryByCode = useMemo(
    () => new Map(countries.map((c) => [c.country_code, c])),
    [countries]
  );

  const selectedCountry = selectedCode
    ? countryByCode.get(selectedCode)
    : undefined;

  const similarCodes = useMemo(
    () =>
      new Set(
        selectedCountry?.similar_countries.map(
          (match) => match.country_code
        ) ?? []
      ),
    [selectedCountry]
  );

  const [minValue, maxValue] = useMemo(() => {
    const values = countries
      .map((country) => country[metric])
      .filter(
        (value): value is number =>
          typeof value === "number" && Number.isFinite(value)
      )
      .map((value) =>
        metric === "gdp_per_capita_ppp"
          ? Math.log1p(value)
          : value
      );

    return [Math.min(...values), Math.max(...values)];
  }, [countries, metric]);

  function metricColor(country?: Country) {
    if (!country || country[metric] == null) {
      return "#e8ece7";
    }

    const rawValue = country[metric];

    const value =
      metric === "gdp_per_capita_ppp"
        ? Math.log1p(rawValue)
        : rawValue;

    const normalized =
      maxValue === minValue
        ? 0.5
        : (value - minValue) / (maxValue - minValue);

    const index = Math.min(
      palette.length - 1,
      Math.max(0, Math.floor(normalized * palette.length))
    );

    return palette[index];
  }

  function zoomIn() {
    setPosition((prev) => ({
      ...prev,
      zoom: Math.min(prev.zoom * 1.5, 8),
    }));
  }

  function zoomOut() {
    setPosition((prev) => ({
      ...prev,
      zoom: Math.max(prev.zoom / 1.5, 1),
    }));
  }

  function resetMap() {
    setPosition({
      coordinates: [0, 0],
      zoom: 1,
    });
    setTooltip(null);
  }

  return (
    <div className="geo-map-shell">
      <MapControls
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={resetMap}
      />

      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{ scale: 155 }}
        width={900}
        height={440}
      >
        <ZoomableGroup
          center={position.coordinates}
          zoom={position.zoom}
          minZoom={1}
          maxZoom={8}
          onMoveEnd={(newPosition) => {
            setPosition({
              coordinates: (newPosition.coordinates ?? [0, 0]) as [
                number,
                number,
            ],
            zoom: newPosition.zoom ?? 1,
            });
            setTooltip(null);
          }}
        >
          <Geographies geography="/data/world.geojson">
            {({ geographies }) =>
              geographies.map((geo) => {
                const properties = geo.properties as Record<
                  string,
                  string
                >;

                // World Bank and GeoJSON country identifiers
                // are not always identical.
                const rawCode = properties["ISO3166-1-Alpha-3"];

                const code =
                  rawCode === "-99" && properties.name === "Kosovo"
                    ? "XKX"
                    : rawCode;
                const country = countryByCode.get(code);

                const isSelected =
                  selectedCode !== null && code === selectedCode;

                const isSimilar = similarCodes.has(code);

                // Default: Explore All mode with choropleth colors
                let fill = metricColor(country);

                // When a country is selected, gray out everything else
                if (selectedCode !== null) {
                  fill = "#d9dfd8";

                  if (isSimilar) {
                    fill = "#e89561";
                  }

                  if (isSelected) {
                    fill = "#edc35e";
                  }
                }

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    className="geo-map-country"
                    fill={fill}
                    stroke={
                      isSelected
                        ? "#7a5a12"
                        : isSimilar
                        ? "#8a4f2f"
                        : "#f6f4ee"
                    }
                    strokeWidth={
                      isSelected ? 1.6 : isSimilar ? 1.0 : 0.45
                    }
                    onClick={() => {
                      if (!country) return;
                      onSelectCountry(code);
                      setTooltip(null);
                    }}
                    onMouseEnter={(event) => {
                      if (!country) return;
                      setTooltip({
                        country,
                        x: event.clientX,
                        y: event.clientY,
                      });
                    }}
                    onMouseMove={(event) => {
                      if (!country) return;
                      setTooltip({
                        country,
                        x: event.clientX,
                        y: event.clientY,
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    style={{
                      outline: "none",
                      cursor: country ? "pointer" : "default",
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      <div className="geo-map-key">
        <div className="geo-map-key-scale">
          <span>Lower</span>
          {palette.map((color) => (
            <span
              className="geo-key-swatch"
              style={{ backgroundColor: color }}
              key={color}
            />
          ))}
          <span>Higher</span>
        </div>

        <div className="geo-map-key-selection">
          <span>
            <i style={{ background: "#edc35e" }} />
            Selected country
          </span>
          <span>
            <i style={{ background: "#e89561" }} />
            5 closest matches
          </span>
        </div>
      </div>

      <CountryTooltip tooltip={tooltip} />
    </div>
  );
}
