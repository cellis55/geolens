
from pathlib import Path

import numpy as np
import pandas as pd

from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler


# --------------------------------------------------
# CONFIGURATION
# --------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parent.parent

INPUT_FILE = (
    PROJECT_ROOT / "data/processed/country_model_data.csv"
)

OUTPUT_DIR = PROJECT_ROOT / "data/processed"

FEATURES = [
    "gdp_per_capita_ppp",
    "life_expectancy",
    "fertility_rate",
    "urban_population_pct",
    "population_65_plus_pct",
    "internet_usage_pct",
]

TOP_N = 5
RANDOM_STATE = 42


# --------------------------------------------------
# LOAD AND TRANSFORM DATA
# --------------------------------------------------

def load_model_data():
    print("\nLoading country model data...")

    df = pd.read_csv(
        INPUT_FILE,
        dtype={"country_code": str},
    )

    if df.empty or df["country_code"].duplicated().any():
        raise ValueError(
            "Model data is empty or contains duplicate codes."
        )

    if df[FEATURES].isna().any().any():
        raise ValueError(
            "Model features contain missing values."
        )

    if (df["gdp_per_capita_ppp"] <= 0).any():
        raise ValueError("GDP per capita must be positive.")

    print(f"Loaded {len(df)} countries/economies.")

    return df


def prepare_features(df):
    print("\nPreparing model features...")

    feature_df = df[FEATURES].copy()

    # Reduce GDP skew so very wealthy economies
    # do not dominate the similarity calculations.
    feature_df["gdp_per_capita_ppp"] = np.log1p(
        feature_df["gdp_per_capita_ppp"]
    )

    scaler = StandardScaler()

    X = scaler.fit_transform(feature_df)

    if not np.isfinite(X).all():
        raise ValueError("Non-finite model features found.")

    print("GDP transformed and features standardized.")

    return X


# --------------------------------------------------
# COUNTRY SIMILARITY
# --------------------------------------------------

def calculate_similarities(df, X):
    print("\nCalculating country similarities...")

    if len(df) <= TOP_N:
        raise ValueError("Not enough countries for matching.")

    results = []

    # All-pairs Euclidean distance.
    differences = X[:, np.newaxis, :] - X[np.newaxis, :, :]

    distances = np.sqrt(
        np.sum(differences ** 2, axis=2)
    )

    # A country should never match itself.
    np.fill_diagonal(distances, np.inf)

    for i, country in df.iterrows():
        nearest_indices = np.argsort(distances[i])[:TOP_N]

        for rank, neighbor_idx in enumerate(
            nearest_indices, start=1
        ):
            neighbor = df.iloc[neighbor_idx]

            feature_differences = np.abs(
                X[i] - X[neighbor_idx]
            )

            # Which features are most and least similar?
            closest = np.argsort(feature_differences)[:2]
            farthest = np.argsort(feature_differences)[-2:][::-1]

            results.append({
                "country_code": country["country_code"],
                "country_name": country["country_name"],
                "rank": rank,
                "similar_country_code": neighbor["country_code"],
                "similar_country_name": neighbor["country_name"],
                "distance": round(
                    float(distances[i, neighbor_idx]), 4
                ),
                "closest_feature_1": FEATURES[closest[0]],
                "closest_feature_2": FEATURES[closest[1]],
                "biggest_difference_1": FEATURES[farthest[0]],
                "biggest_difference_2": FEATURES[farthest[1]],
            })

    similarity_df = pd.DataFrame(results)

    print(
        f"Generated {len(similarity_df)} country matches."
    )

    return similarity_df


# --------------------------------------------------
# K-MEANS CLUSTERING
# --------------------------------------------------

def run_clustering(df, X):
    print("\nEvaluating K-means clusters...")

    evaluations = []

    # Test several reasonable cluster counts.
    for k in range(3, 9):
        model = KMeans(
            n_clusters=k,
            random_state=RANDOM_STATE,
            n_init=20,
        )

        labels = model.fit_predict(X)

        score = silhouette_score(X, labels)

        evaluations.append({
            "k": k,
            "silhouette_score": round(float(score), 4),
        })

        print(f"  k={k}: silhouette={score:.4f}")

    evaluation_df = pd.DataFrame(evaluations)

    best_k = int(
        evaluation_df.loc[
            evaluation_df["silhouette_score"].idxmax(),
            "k",
        ]
    )

    print(f"\nSelected {best_k} clusters.")

    final_model = KMeans(
        n_clusters=best_k,
        random_state=RANDOM_STATE,
        n_init=20,
    )

    df = df.copy()

    # Add 1 so cluster numbers start at 1.
    df["cluster"] = final_model.fit_predict(X) + 1

    return df, evaluation_df


# --------------------------------------------------
# OUTPUT AND REPORTING
# --------------------------------------------------

def save_results(df, similarity_df, evaluation_df):
    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    country_output = (
        OUTPUT_DIR / "country_clusters.csv"
    )

    similarity_output = (
        OUTPUT_DIR / "country_similarities.csv"
    )

    evaluation_output = (
        OUTPUT_DIR / "cluster_evaluation.csv"
    )

    df.to_csv(country_output, index=False)

    similarity_df.to_csv(similarity_output, index=False)

    evaluation_df.to_csv(evaluation_output, index=False)

    print("\nFiles saved:")
    print(f"  {country_output}")
    print(f"  {similarity_output}")
    print(f"  {evaluation_output}")


def print_report(df, similarities):
    print("\n" + "=" * 55)
    print("GEOLENS — COUNTRY SIMILARITY RESULTS")
    print("=" * 55)

    print("\nCluster sizes:")
    print(
        df.groupby("cluster")
        .size()
        .to_string()
    )

    print("\nCluster average metrics:")

    print(
        df.groupby("cluster")[FEATURES]
        .mean()
        .round(2)
        .to_string()
    )

    for country_name in [
        "United States",
        "Japan",
        "Germany",
        "Brazil",
        "India",
    ]:
        matches = similarities[
            similarities["country_name"] == country_name
        ]

        if matches.empty:
            continue

        print(f"\nMost similar to {country_name}:")

        for _, match in matches.iterrows():
            print(
                f"  {match['rank']}. "
                f"{match['similar_country_name']} "
                f"(distance: {match['distance']:.3f})"
            )


# --------------------------------------------------
# MAIN
# --------------------------------------------------

def main():
    print("=" * 55)
    print("GEOLENS — COUNTRY SIMILARITY ENGINE")
    print("=" * 55)

    df = load_model_data()

    # Ensure sequential integer indices.
    df = df.reset_index(drop=True)

    X = prepare_features(df)

    similarities = calculate_similarities(df, X)

    clustered_df, evaluation_df = run_clustering(df, X)

    save_results(
        clustered_df,
        similarities,
        evaluation_df,
    )

    print_report(clustered_df, similarities)

    print("\nSimilarity modeling complete!")


if __name__ == "__main__":
    main()
