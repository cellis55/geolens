
from pathlib import Path

import numpy as np
import pandas as pd


# --------------------------------------------------
# CONFIGURATION
# --------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parent.parent

INPUT_FILE = PROJECT_ROOT / "data/raw/world_bank_raw.csv"

OUTPUT_DIR = PROJECT_ROOT / "data/processed"

MODEL_FEATURES = [
    "gdp_per_capita_ppp",
    "life_expectancy",
    "fertility_rate",
    "urban_population_pct",
    "population_65_plus_pct",
    "internet_usage_pct",
]

# All model indicators must be from 2022 or later.
MIN_MODEL_YEAR = 2022


# --------------------------------------------------
# CLEAN DATA
# --------------------------------------------------

def clean_countries(df):
    print("\nCleaning country data...")

    df = df.copy()

    # Remove accidental duplicate country codes.
    duplicates = df["country_code"].duplicated().sum()

    if duplicates:
        raise ValueError(
            f"Found {duplicates} duplicate country codes."
        )

    # Clean country names.
    df["country_name"] = (
        df["country_name"].astype(str).str.strip()
    )

    # Convert numerical indicators.
    numeric_columns = MODEL_FEATURES + ["population"]

    for column in numeric_columns:
        df[column] = pd.to_numeric(
            df[column],
            errors="coerce",
        )

    # Convert observation years.
    for column in numeric_columns:
        year_column = f"{column}_year"

        df[year_column] = pd.to_numeric(
            df[year_column],
            errors="coerce",
        )

    # Remove invalid negative values.
    nonnegative_columns = [
        "gdp_per_capita_ppp",
        "fertility_rate",
        "urban_population_pct",
        "population_65_plus_pct",
        "internet_usage_pct",
        "population",
    ]

    for column in nonnegative_columns:
        df.loc[df[column] < 0, column] = np.nan

    # Values expected to be percentages.
    percentage_columns = [
        "urban_population_pct",
        "population_65_plus_pct",
        "internet_usage_pct",
    ]

    for column in percentage_columns:
        invalid = ~df[column].between(0, 100)
        df.loc[invalid, column] = np.nan

    # Basic plausibility checks.
    df.loc[
        ~df["life_expectancy"].between(0, 120),
        "life_expectancy",
    ] = np.nan

    # GDP must be positive for later log transformation.
    df.loc[
        df["gdp_per_capita_ppp"] <= 0,
        "gdp_per_capita_ppp",
    ] = np.nan

    # Population must be positive.
    df.loc[
        df["population"] <= 0,
        "population",
    ] = np.nan

    return df


# --------------------------------------------------
# SELECT MODEL-ELIGIBLE COUNTRIES
# --------------------------------------------------

def prepare_model_data(df):
    print("\nPreparing model dataset...")

    model_df = df.copy()

    # Require complete model features.
    has_complete_data = (
        model_df[MODEL_FEATURES]
        .notna()
        .all(axis=1)
    )

    # Require recent observations for every feature.
    feature_years = [
        f"{column}_year"
        for column in MODEL_FEATURES
    ]

    has_recent_data = (
        model_df[feature_years]
        .ge(MIN_MODEL_YEAR)
        .all(axis=1)
    )

    model_df["model_eligible"] = (
        has_complete_data & has_recent_data
    )

    eligible = model_df[
        model_df["model_eligible"]
    ].copy()

    excluded = model_df[
        ~model_df["model_eligible"]
    ].copy()

    print(f"Model-eligible: {len(eligible)}")
    print(f"Excluded from model: {len(excluded)}")

    return model_df, eligible, excluded


# --------------------------------------------------
# REPORT
# --------------------------------------------------

def print_report(atlas_df, model_df, excluded_df):
    print("\n" + "=" * 55)
    print("GEOLENS DATA QUALITY REPORT")
    print("=" * 55)

    print(f"\nAtlas locations: {len(atlas_df)}")
    print(f"Model locations: {len(model_df)}")
    print(f"Excluded locations: {len(excluded_df)}")

    print("\nFeature coverage:")

    for column in MODEL_FEATURES:
        available = atlas_df[column].notna().sum()
        percentage = 100 * available / len(atlas_df)

        print(
            f"  {column}: "
            f"{available}/{len(atlas_df)} "
            f"({percentage:.1f}%)"
        )

    print("\nModel statistics:")

    print(
        model_df[MODEL_FEATURES]
        .describe()
        .round(2)
        .to_string()
    )

    print("\nExcluded locations:")

    print(
        excluded_df[
            ["country_name", "region"]
        ].to_string(index=False)
    )


# --------------------------------------------------
# MAIN
# --------------------------------------------------

def main():
    print("=" * 55)
    print("GEOLENS — DATA CLEANING")
    print("=" * 55)

    if not INPUT_FILE.exists():
        raise FileNotFoundError(
            "Raw data not found. Run fetch_data.py first."
        )

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    raw_df = pd.read_csv(
        INPUT_FILE,
        dtype={"country_code": str},
    )

    atlas_df = clean_countries(raw_df)

    atlas_df, model_df, excluded_df = (
        prepare_model_data(atlas_df)
    )

    atlas_output = (
        OUTPUT_DIR / "country_metrics.csv"
    )

    model_output = (
        OUTPUT_DIR / "country_model_data.csv"
    )

    excluded_output = (
        OUTPUT_DIR / "excluded_countries.csv"
    )

    atlas_df.to_csv(atlas_output, index=False)
    model_df.to_csv(model_output, index=False)
    excluded_df.to_csv(excluded_output, index=False)

    print_report(
        atlas_df,
        model_df,
        excluded_df,
    )

    print("\nFiles saved:")
    print(f"  {atlas_output}")
    print(f"  {model_output}")
    print(f"  {excluded_output}")

    print("\nCleaning complete!")


if __name__ == "__main__":
    main()
