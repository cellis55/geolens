
import type { Country } from "../types/country";
import { readableFeature } from "../utils/formatting";

type Props = {
  country: Country;
  onSelectCountry: (code: string) => void;
};

export default function SimilarityPanel({
  country,
  onSelectCountry,
}: Props) {
  const matches = country.similar_countries;

  return (
    <article className="atlas-detail-panel">
      <div className="atlas-panel-overline">
        <span>02 / COUNTRY CONNECTIONS</span>
        <span>TOP 5</span>
      </div>

      <div className="atlas-similarity-heading">
        <h2>Closer than you think.</h2>
        <p>
          Countries with the most similar economic,
          demographic, and social profiles.
        </p>
      </div>

      {matches.length > 0 ? (
        <div className="atlas-match-list">
          {matches.map((match) => (
            <button
              type="button"
              className="atlas-match"
              key={match.country_code}
              onClick={() =>
                onSelectCountry(match.country_code)
              }
            >
              <span className="atlas-match-number">
                {String(match.rank).padStart(2, "0")}
              </span>

              <div className="atlas-match-content">
                <div className="atlas-match-header">
                  <strong>{match.country_name}</strong>

                  <span className="atlas-match-distance">
                    {match.distance.toFixed(3)}
                  </span>
                </div>

                <p>
                  Closest on{" "}
                  {match.closest_features
                    .map(readableFeature)
                    .join(" & ")}
                </p>

                <span className="atlas-match-difference">
                  Differs most on{" "}
                  {match.biggest_differences
                    .map(readableFeature)
                    .join(" & ")}
                </span>
              </div>

              <span className="atlas-match-arrow">↗</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="atlas-no-matches">
          <h3>Not enough comparable data</h3>
          <p>
            This country is included in the atlas but
            lacks enough recent data for the similarity
            model.
          </p>
        </div>
      )}

      <div className="atlas-methodology">
        <span>ABOUT THESE MATCHES</span>
        <p>
          Rankings use Euclidean distance across six
          standardized indicators, with GDP per capita
          log-transformed. Lower distances indicate
          greater similarity within this model, not a
          percentage match.
        </p>
      </div>
    </article>
  );
}
