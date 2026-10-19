
from pathlib import Path
from collections import Counter
import json

import pandas as pd


# --------------------------------------------------
# FILE PATHS
# --------------------------------------------------

ROOT = Path(__file__).resolve().parent.parent

GEOJSON_FILE = (
    ROOT / "frontend/public/data/world.geojson"
)

COUNTRY_FILE = (
    ROOT / "frontend/public/data/country_data.json"
)

REPORT_DIR = ROOT / "reports"

# This is the field currently used by WorldMap.tsx.
MAP_CODE_FIELD = "ISO3166-1-Alpha-3"


# --------------------------------------------------
# LOAD SOURCE DATA
# --------------------------------------------------

def load_json(path):
    if not path.exists():
        raise FileNotFoundError(
            f"Required file not found: {path}"
        )

    with open(path, "r", encoding="utf-8") as file:
        return json.load(file)


def normalize_code(value):
    if value is None:
        return None

    code = str(value).strip().upper()

    if code in {"", "-99", "N/A", "NONE", "NULL"}:
        return None

    return code


# --------------------------------------------------
# INSPECT GEOJSON
# --------------------------------------------------

def inspect_map(geojson):
    features = geojson.get("features", [])

    if not features:
        raise ValueError("No geographic features found.")

    print(f"\nGeoJSON features: {len(features)}")

    property_names = Counter()

    for feature in features:
        properties = feature.get("properties") or {}
        property_names.update(properties.keys())

    print("\nAvailable GeoJSON properties:")
    for name, count in property_names.most_common():
        print(f"  {name}: {count}")

    if MAP_CODE_FIELD not in property_names:
        raise ValueError(
            f"Missing map code field: {MAP_CODE_FIELD}"
        )

    rows = []

    for index, feature in enumerate(features):
        properties = feature.get("properties") or {}

        code = normalize_code(
            properties.get(MAP_CODE_FIELD)
        )

        # Match Kosovo's geographic feature to its
        # World Bank economy identifier.
        if code is None and properties.get("name") == "Kosovo":
            code = "XKX"

        name = (
            properties.get("name")
            or properties.get("ADMIN")
            or properties.get("NAME")
            or properties.get("name_en")
            or ""
        )

        rows.append({
            "feature_index": index,
            "map_code": code,
            "map_name": name,
            "geometry_type": (
                (feature.get("geometry") or {}).get("type")
            ),
        })

    return pd.DataFrame(rows)


# --------------------------------------------------
# AUDIT COUNTRY MATCHES
# --------------------------------------------------

def main():
    REPORT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    print("=" * 60)
    print("GEOLENS — GEOGRAPHIC MATCHING AUDIT")
    print("=" * 60)

    geojson = load_json(GEOJSON_FILE)
    website_data = load_json(COUNTRY_FILE)

    map_df = inspect_map(geojson)

    countries = website_data["countries"]

    country_df = pd.DataFrame([
        {
            "country_code": normalize_code(
                country["country_code"]
            ),
            "country_name": country["country_name"],
            "model_eligible": country["model_eligible"],
            "similarity_count": len(
                country.get("similar_countries") or []
            ),
        }
        for country in countries
    ])

    if country_df["country_code"].isna().any():
        raise ValueError(
            "Website contains missing country codes."
        )

    if country_df["country_code"].duplicated().any():
        raise ValueError(
            "Website contains duplicate country codes."
        )

    map_codes = set(
        map_df["map_code"].dropna()
    )

    website_codes = set(
        country_df["country_code"]
    )

    # All World Bank locations not matched to a map code.
    unmatched_countries = country_df[
        ~country_df["country_code"].isin(map_codes)
    ].copy()

    # All map features not matched to World Bank records.
    unmatched_map = map_df[
        ~map_df["map_code"].isin(website_codes)
    ].copy()

    # Countries that the map can successfully identify.
    matched_countries = country_df[
        country_df["country_code"].isin(map_codes)
    ].copy()

    # Check map availability of nearest neighbors.
    similarity_rows = []

    for country in countries:
        origin_code = normalize_code(
            country["country_code"]
        )

        for match in (
            country.get("similar_countries") or []
        ):
            target_code = normalize_code(
                match["country_code"]
            )

            similarity_rows.append({
                "origin_code": origin_code,
                "origin_name": country["country_name"],
                "rank": match["rank"],
                "similar_country_code": target_code,
                "similar_country_name": match["country_name"],
                "origin_on_map": origin_code in map_codes,
                "similar_on_map": target_code in map_codes,
            })

    similarity_df = pd.DataFrame(similarity_rows)

    broken_links = similarity_df[
        ~(
            similarity_df["origin_on_map"]
            & similarity_df["similar_on_map"]
        )
    ].copy()

    duplicate_codes = map_df[
        map_df["map_code"].notna()
        & map_df["map_code"].duplicated(keep=False)
    ].sort_values("map_code")

    unassigned_codes = map_df[
        map_df["map_code"].isna()
    ]

    # Save reports.
    reports = {
        "unmatched_world_bank_countries.csv":
            unmatched_countries,
        "unmatched_map_features.csv":
            unmatched_map,
        "matched_countries.csv":
            matched_countries,
        "unmatched_similarity_links.csv":
            broken_links,
        "duplicate_map_codes.csv":
            duplicate_codes,
        "unassigned_map_codes.csv":
            unassigned_codes,
    }

    for filename, dataframe in reports.items():
        dataframe.to_csv(
            REPORT_DIR / filename,
            index=False,
        )

    # Print summary.
    print("\n" + "=" * 60)
    print("AUDIT SUMMARY")
    print("=" * 60)

    print(f"Website locations: {len(country_df)}")
    print(f"GeoJSON features: {len(map_df)}")

    print(
        f"Matched website locations: "
        f"{len(matched_countries)}"
    )

    print(
        f"Unmatched website locations: "
        f"{len(unmatched_countries)}"
    )

    print(
        f"Matched coverage: "
        f"{len(matched_countries) / len(country_df):.1%}"
    )

    print(
        f"Unmatched geographic features: "
        f"{len(unmatched_map)}"
    )

    print(
        f"Unassigned map codes: "
        f"{len(unassigned_codes)}"
    )

    print(
        f"Features with repeated map codes: "
        f"{len(duplicate_codes)}"
    )

    print(
        f"Similarity links checked: "
        f"{len(similarity_df)}"
    )

    print(
        f"Similarity links lacking an origin or "
        f"destination map feature: {len(broken_links)}"
    )

    print("\nUnmatched World Bank locations:")

    if unmatched_countries.empty:
        print("  None")
    else:
        print(
            unmatched_countries[
                ["country_code", "country_name"]
            ].to_string(index=False)
        )

    print("\nUnassigned GeoJSON code examples:")

    if unassigned_codes.empty:
        print("  None")
    else:
        print(
            unassigned_codes[
                ["feature_index", "map_name"]
            ].head(15).to_string(index=False)
        )

    print("\nReports saved to:")
    print(REPORT_DIR)

    print("\nAudit complete.")


if __name__ == "__main__":
    main()
