
from pathlib import Path
import time

import pandas as pd
import requests


# --------------------------------------------------
# CONFIGURATION
# --------------------------------------------------

BASE_URL = "https://api.worldbank.org/v2"

START_YEAR = 2020
END_YEAR = 2025

PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = PROJECT_ROOT / "data" / "raw"

INDICATORS = {
    "NY.GDP.PCAP.PP.CD": "gdp_per_capita_ppp",
    "SP.DYN.LE00.IN": "life_expectancy",
    "SP.DYN.TFRT.IN": "fertility_rate",
    "SP.URB.TOTL.IN.ZS": "urban_population_pct",
    "SP.POP.65UP.TO.ZS": "population_65_plus_pct",
    "IT.NET.USER.ZS": "internet_usage_pct",
    "SP.POP.TOTL": "population",
}


# --------------------------------------------------
# API HELPER
# --------------------------------------------------

def fetch_api(url, params=None):
    """Retrieve all pages of a World Bank API response."""

    params = dict(params or {})
    params.update({
        "format": "json",
        "per_page": 2000,
    })

    all_records = []
    page = 1

    while True:
        params["page"] = page

        response = requests.get(
            url,
            params=params,
            timeout=45,
        )
        response.raise_for_status()

        result = response.json()

        if not isinstance(result, list) or len(result) < 2:
            raise ValueError(
                f"Unexpected API response: {result}"
            )

        metadata, records = result
        all_records.extend(records or [])

        total_pages = int(metadata.get("pages", 1))

        if page >= total_pages:
            break

        page += 1

    return all_records


# --------------------------------------------------
# COUNTRY METADATA
# --------------------------------------------------

def fetch_countries():
    print("\nFetching country metadata...")

    url = f"{BASE_URL}/country"

    records = fetch_api(url)

    countries = []

    for record in records:
        region = record.get("region", {})

        # Exclude World Bank regional/income aggregates.
        if region.get("id") == "NA":
            continue

        countries.append({
            "country_code": record["id"],
            "country_name": record["name"],
            "region": region.get("value"),
            "income_level": record.get(
                "incomeLevel", {}
            ).get("value"),
            "capital_city": record.get("capitalCity"),
            "latitude": record.get("latitude"),
            "longitude": record.get("longitude"),
        })

    df = pd.DataFrame(countries)

    if df.empty:
        raise ValueError("No countries were returned.")

    print(f"Found {len(df)} countries/economies.")

    return df


# --------------------------------------------------
# INDICATOR DATA
# --------------------------------------------------

def fetch_indicator(code, column_name):
    print(f"Fetching {column_name}...")

    url = (
        f"{BASE_URL}/country/all/indicator/{code}"
    )

    records = fetch_api(
        url,
        params={
            "date": f"{START_YEAR}:{END_YEAR}",
        },
    )

    observations = []

    for record in records:
        value = record.get("value")

        if value is None:
            continue

        observations.append({
            "country_code": record["countryiso3code"],
            "year": int(record["date"]),
            column_name: value,
        })

    df = pd.DataFrame(
        observations,
        columns=["country_code", "year", column_name],
    )

    # Keep the most recent non-null observation.
    df = (
        df.sort_values("year", ascending=False)
        .drop_duplicates("country_code")
        .reset_index(drop=True)
    )

    df = df.rename(
        columns={"year": f"{column_name}_year"}
    )

    print(f"  Found data for {len(df)} locations.")

    return df


# --------------------------------------------------
# MAIN PIPELINE
# --------------------------------------------------

def main():
    print("=" * 50)
    print("GEOLENS — WORLD BANK DATA COLLECTION")
    print("=" * 50)

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    countries = fetch_countries()

    data = countries.copy()

    for code, column_name in INDICATORS.items():
        indicator_df = fetch_indicator(
            code, column_name
        )

        data = data.merge(
            indicator_df,
            on="country_code",
            how="left",
            validate="one_to_one",
        )

        time.sleep(0.3)

    # Convert coordinates to numbers.
    for col in ["latitude", "longitude"]:
        data[col] = pd.to_numeric(
            data[col],
            errors="coerce",
        )

    # Confirm one row per location.
    assert data["country_code"].is_unique

    output_file = OUTPUT_DIR / "world_bank_raw.csv"

    data.to_csv(output_file, index=False)

    print("\n" + "=" * 50)
    print("DATA COLLECTION COMPLETE")
    print("=" * 50)

    print(f"Countries/economies: {len(data)}")
    print(f"Columns: {len(data.columns)}")
    print(f"Saved to: {output_file}")

    print("\nMissing values per indicator:")

    for column_name in INDICATORS.values():
        missing = data[column_name].isna().sum()
        print(f"  {column_name}: {missing}")

    print("\nSample countries:")

    print(
        data[
            [
                "country_name",
                "region",
                "gdp_per_capita_ppp",
                "life_expectancy",
                "population",
            ]
        ].head(10).to_string(index=False)
    )


if __name__ == "__main__":
    main()
