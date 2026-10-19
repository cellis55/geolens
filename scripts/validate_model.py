
from pathlib import Path

import numpy as np
import pandas as pd

from sklearn.cluster import KMeans
from sklearn.metrics import (
    adjusted_rand_score,
    pairwise_distances,
    silhouette_score,
)
from sklearn.preprocessing import StandardScaler


# --------------------------------------------------
# CONFIGURATION
# --------------------------------------------------

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data" / "processed"
REPORT_DIR = ROOT / "reports"

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
K_VALUES = range(3, 9)

MODEL_FILE = DATA_DIR / "country_model_data.csv"
SIMILARITY_FILE = DATA_DIR / "country_similarities.csv"
CLUSTER_FILE = DATA_DIR / "country_clusters.csv"
EVALUATION_FILE = DATA_DIR / "cluster_evaluation.csv"


# --------------------------------------------------
# LOAD AND VALIDATE INPUTS
# --------------------------------------------------

def load_data():
    print("\nLoading model outputs...")

    countries = pd.read_csv(
        MODEL_FILE, dtype={"country_code": str}
    )
    matches = pd.read_csv(
        SIMILARITY_FILE,
        dtype={
            "country_code": str,
            "similar_country_code": str,
        },
    )
    clusters = pd.read_csv(
        CLUSTER_FILE, dtype={"country_code": str}
    )
    evaluation = pd.read_csv(EVALUATION_FILE)

    if countries.empty:
        raise ValueError("Model dataset is empty.")

    if countries["country_code"].duplicated().any():
        raise ValueError("Duplicate country codes.")

    if countries[FEATURES].isna().any().any():
        raise ValueError("Model features contain missing data.")

    if (countries["gdp_per_capita_ppp"] <= 0).any():
        raise ValueError("GDP per capita must be positive.")

    expected_codes = set(countries["country_code"])

    if set(clusters["country_code"]) != expected_codes:
        raise ValueError("Cluster country coverage mismatch.")

    if set(matches["country_code"]) != expected_codes:
        raise ValueError("Similarity country coverage mismatch.")

    if clusters["country_code"].duplicated().any():
        raise ValueError("Duplicate cluster country codes.")

    if len(matches) != len(countries) * TOP_N:
        raise ValueError("Incorrect similarity record count.")

    print(f"Countries: {len(countries)}")
    print(f"Similarity records: {len(matches)}")
    print(f"Clusters: {clusters['cluster'].nunique()}")

    return countries, matches, clusters, evaluation


# --------------------------------------------------
# REBUILD ORIGINAL FEATURE SPACE
# --------------------------------------------------

def prepare_features(countries, features=FEATURES):
    feature_data = countries[list(features)].copy()

    if "gdp_per_capita_ppp" in features:
        feature_data["gdp_per_capita_ppp"] = np.log1p(
            feature_data["gdp_per_capita_ppp"]
        )

    scaler = StandardScaler()
    X = scaler.fit_transform(feature_data)

    if not np.isfinite(X).all():
        raise ValueError("Invalid standardized features.")

    return X


# --------------------------------------------------
# VALIDATE NEAREST NEIGHBORS
# --------------------------------------------------

def validate_similarities(countries, matches, X):
    print("\n" + "=" * 55)
    print("1. SIMILARITY ACCURACY")
    print("=" * 55)

    distances = pairwise_distances(X, metric="euclidean")
    np.fill_diagonal(distances, np.inf)

    codes = countries["country_code"].tolist()

    expected_neighbors = {}

    for i, code in enumerate(codes):
        neighbor_indices = np.argsort(
            distances[i]
        )[:TOP_N]

        expected_neighbors[code] = [
            codes[j] for j in neighbor_indices
        ]

    problems = []

    for code in codes:
        actual = matches[
            matches["country_code"] == code
        ].sort_values("rank")

        actual_codes = actual[
            "similar_country_code"
        ].tolist()

        expected = expected_neighbors[code]

        if actual_codes != expected:
            problems.append({
                "country_code": code,
                "problem": "Nearest-neighbor ranking mismatch",
            })

        if actual["rank"].tolist() != list(
            range(1, TOP_N + 1)
        ):
            problems.append({
                "country_code": code,
                "problem": "Invalid ranking sequence",
            })

        if len(set(actual_codes)) != TOP_N:
            problems.append({
                "country_code": code,
                "problem": "Duplicate neighbors",
            })

        if code in actual_codes:
            problems.append({
                "country_code": code,
                "problem": "Country matched itself",
            })

        i = codes.index(code)

        for _, match in actual.iterrows():
            neighbor_code = match["similar_country_code"]

            if neighbor_code not in codes:
                problems.append({
                    "country_code": code,
                    "problem": "Unknown neighbor code",
                })
                continue

            j = codes.index(neighbor_code)

            if not np.isclose(
                float(match["distance"]),
                distances[i, j],
                atol=0.00011,
                rtol=0,
            ):
                problems.append({
                    "country_code": code,
                    "problem": "Saved distance mismatch",
                })

    problem_df = pd.DataFrame(
        problems, columns=["country_code", "problem"]
    )

    print(f"Countries checked: {len(codes)}")
    print(f"Neighbor relationships: {len(matches)}")
    print(f"Validation issues: {len(problem_df)}")

    return problem_df, expected_neighbors


# --------------------------------------------------
# VALIDATE K-MEANS CLUSTERING
# --------------------------------------------------

def validate_clusters(countries, clusters, evaluation, X):
    print("\n" + "=" * 55)
    print("2. K-MEANS REPRODUCIBILITY")
    print("=" * 55)

    scores = []

    for k in K_VALUES:
        model = KMeans(
            n_clusters=k,
            random_state=RANDOM_STATE,
            n_init=20,
        )

        labels = model.fit_predict(X)
        score = silhouette_score(X, labels)

        scores.append({
            "k": k,
            "silhouette_score": score,
        })

    score_df = pd.DataFrame(scores)

    best_row = score_df.loc[
        score_df["silhouette_score"].idxmax()
    ]
    best_k = int(best_row["k"])

    print("\nRecalculated silhouette scores:")
    print(score_df.round(4).to_string(index=False))
    print(f"\nBest cluster count: {best_k}")

    final_model = KMeans(
        n_clusters=best_k,
        random_state=RANDOM_STATE,
        n_init=20,
    )

    new_labels = final_model.fit_predict(X)

    saved_labels = (
        countries[["country_code"]]
        .merge(
            clusters[["country_code", "cluster"]],
            on="country_code",
            validate="one_to_one",
        )["cluster"]
        .to_numpy()
    )

    ari = adjusted_rand_score(
        saved_labels,
        new_labels,
    )

    print(f"Adjusted Rand Index: {ari:.4f}")

    if np.isclose(ari, 1.0):
        print("Cluster groupings reproduced successfully.")
    else:
        print("WARNING: Cluster groupings differ.")

    saved_scores = evaluation.set_index("k")[
        "silhouette_score"
    ]

    score_mismatches = []

    for _, row in score_df.iterrows():
        k = int(row["k"])

        if k not in saved_scores.index or not np.isclose(
            row["silhouette_score"],
            saved_scores.loc[k],
            atol=0.00011,
            rtol=0,
        ):
            score_mismatches.append(k)

    print(f"Saved silhouette discrepancies: {score_mismatches}")

    return score_df, ari, score_mismatches, best_k


# --------------------------------------------------
# VALIDATE CLUSTER INTERPRETATION
# --------------------------------------------------

def inspect_cluster_profiles(clusters):
    print("\n" + "=" * 55)
    print("3. CLUSTER INTERPRETATION")
    print("=" * 55)

    profiles = (
        clusters.groupby("cluster")[FEATURES]
        .mean()
        .round(2)
    )

    profiles.insert(
        0,
        "country_count",
        clusters.groupby("cluster").size(),
    )

    print("\nCluster averages:")
    print(profiles.to_string())

    print(
        "\nCheck the descriptive cluster names against "
        "these actual averages."
    )

    return profiles.reset_index()


# --------------------------------------------------
# LEAVE-ONE-FEATURE-OUT SENSITIVITY
# --------------------------------------------------

def feature_sensitivity(countries, baseline_neighbors):
    print("\n" + "=" * 55)
    print("4. FEATURE SENSITIVITY")
    print("=" * 55)

    codes = countries["country_code"].tolist()
    results = []
    detailed = []

    for removed_feature in FEATURES:
        remaining = [
            f for f in FEATURES
            if f != removed_feature
        ]

        X_reduced = prepare_features(
            countries, remaining
        )

        distances = pairwise_distances(
            X_reduced,
            metric="euclidean",
        )
        np.fill_diagonal(distances, np.inf)

        overlaps = []

        for i, code in enumerate(codes):
            nearest = np.argsort(
                distances[i]
            )[:TOP_N]

            reduced_neighbors = {
                codes[j] for j in nearest
            }

            baseline = set(
                baseline_neighbors[code]
            )

            overlap = len(
                baseline & reduced_neighbors
            ) / TOP_N

            overlaps.append(overlap)

            detailed.append({
                "removed_feature": removed_feature,
                "country_code": code,
                "top5_overlap": overlap,
            })

        mean_overlap = float(np.mean(overlaps))

        results.append({
            "removed_feature": removed_feature,
            "average_top5_overlap": mean_overlap,
            "average_neighbors_retained": (
                mean_overlap * TOP_N
            ),
        })

    sensitivity_df = pd.DataFrame(
        results
    ).sort_values("average_top5_overlap")

    detailed_df = pd.DataFrame(detailed)

    print("\nLeave-one-feature-out results:")
    print(
        sensitivity_df.round(3).to_string(index=False)
    )

    print(
        "\nLower overlap indicates greater sensitivity "
        "to removing that feature."
    )

    return sensitivity_df, detailed_df


# --------------------------------------------------
# MAIN
# --------------------------------------------------

def main():
    REPORT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    print("=" * 55)
    print("GEOLENS — MACHINE LEARNING VALIDATION")
    print("=" * 55)

    countries, matches, clusters, evaluation = load_data()

    # Preserve the original row order from the model.
    countries = countries.reset_index(drop=True)

    X = prepare_features(countries)

    problems, baseline_neighbors = validate_similarities(
        countries, matches, X
    )

    scores, ari, score_mismatches, best_k = (
        validate_clusters(
            countries, clusters, evaluation, X
        )
    )

    profiles = inspect_cluster_profiles(clusters)

    sensitivity, detailed = feature_sensitivity(
        countries, baseline_neighbors
    )

    # Save validation reports.
    problems.to_csv(
        REPORT_DIR / "ml_similarity_issues.csv",
        index=False,
    )

    scores.to_csv(
        REPORT_DIR / "ml_cluster_scores.csv",
        index=False,
    )

    profiles.to_csv(
        REPORT_DIR / "ml_cluster_profiles.csv",
        index=False,
    )

    sensitivity.to_csv(
        REPORT_DIR / "ml_feature_sensitivity.csv",
        index=False,
    )

    detailed.to_csv(
        REPORT_DIR / "ml_country_sensitivity.csv",
        index=False,
    )

    print("\n" + "=" * 55)
    print("FINAL VALIDATION SUMMARY")
    print("=" * 55)

    passed = (
        problems.empty
        and np.isclose(ari, 1.0)
        and not score_mismatches
        and best_k == clusters["cluster"].nunique()
    )

    print(f"Similarity problems: {len(problems)}")
    print(f"Cluster agreement (ARI): {ari:.4f}")
    print(f"Selected clusters: {best_k}")
    print(f"Silhouette discrepancies: {len(score_mismatches)}")

    print(
        "\nVALIDATION RESULT: "
        + ("PASS" if passed else "REVIEW REQUIRED")
    )

    print(f"\nReports saved in: {REPORT_DIR}")


if __name__ == "__main__":
    main()
