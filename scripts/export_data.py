
from pathlib import Path
import json

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parent.parent

DATA_DIR = PROJECT_ROOT / "data" / "processed"
OUTPUT_DIR = PROJECT_ROOT / "frontend" / "public" / "data"

METRICS_FILE = DATA_DIR / "country_metrics.csv"
CLUSTERS_FILE = DATA_DIR / "country_clusters.csv"
SIMILARITIES_FILE = DATA_DIR / "country_similarities.csv"

OUTPUT_FILE = OUTPUT_DIR / "country_data.json"


def main():
    print("=" * 50)
    print("GEOLENS — EXPORT WEBSITE DATA")
    print("=" * 50)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Load our three processed datasets.
    metrics = pd.read_csv(
        METRICS_FILE,
        dtype={"country_code": str},
    )

    clusters = pd.read_csv(
        CLUSTERS_FILE,
        dtype={"country_code": str},
    )

    similarities = pd.read_csv(
        SIMILARITIES_FILE,
        dtype={
            "country_code": str,
            "similar_country_code": str,
        },
    )

    # Validate unique country identifiers.
    if metrics["country_code"].duplicated().any():
        raise ValueError("Duplicate countries in metrics.")

    if clusters["country_code"].duplicated().any():
        raise ValueError("Duplicate countries in clusters.")

    # Add cluster assignments to the full atlas.
    metrics = metrics.merge(
        clusters[["country_code", "cluster"]],
        on="country_code",
        how="left",
        validate="one_to_one",
    )

    # Add a list of similar countries to each profile.
    similarities = similarities.sort_values(
        ["country_code", "rank"]
    )

    # Pandas JSON serialization converts missing
    # values to null, which JavaScript can handle.
    countries = json.loads(
        metrics.to_json(orient="records")
    )

    matches = json.loads(
        similarities.to_json(orient="records")
    )

    matches_by_country = {}

    for match in matches:
        code = match["country_code"]

        matches_by_country.setdefault(
            code, []
        ).append({
            "rank": match["rank"],
            "country_code": match["similar_country_code"],
            "country_name": match["similar_country_name"],
            "distance": match["distance"],
            "closest_features": [
                match["closest_feature_1"],
                match["closest_feature_2"],
            ],
            "biggest_differences": [
                match["biggest_difference_1"],
                match["biggest_difference_2"],
            ],
        })

    # Attach similarity results to country profiles.
    for country in countries:
        code = country["country_code"]

        country["similar_countries"] = (
            matches_by_country.get(code, [])
        )

        country["model_eligible"] = bool(
            country["model_eligible"]
        )

        if country["cluster"] is not None:
            country["cluster"] = int(
                country["cluster"]
            )

    # Validate our exported data.
    assert len(countries) == len(metrics)

    assert sum(
        len(c["similar_countries"])
        for c in countries
    ) == len(matches)

    # Export one complete JSON file.
    output = {
        "metadata": {
            "project": "GeoLens",
            "source": "World Bank Open Data",
            "model": "Standardized Euclidean Distance + K-means",
            "country_count": len(countries),
            "modeled_country_count": len(clusters),
            "indicator_window": "2020-2025",
        },
        "countries": countries,
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(
            output,
            f,
            indent=2,
            ensure_ascii=False,
            allow_nan=False,
        )

    print("\nExport complete!")
    print(f"Countries: {len(countries)}")
    print(f"Modeled countries: {len(clusters)}")
    print(f"Similarity matches: {len(matches)}")
    print(f"Saved to: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
