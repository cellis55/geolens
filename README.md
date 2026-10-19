# GeoLens
### An Interactive Atlas of Human Geography

**GeoLens** is an interactive world atlas that combines global development indicators, geographic visualization, and unsupervised machine learning to explore how countries compare and connect.

Built with **Python, scikit-learn, React, TypeScript, and Vite**, GeoLens transforms World Bank data into an explorable geographic experience.

[**Explore the Live Atlas**](https://github.com/cellis55/geolens) · [**View Source Code**](https://github.com/cellis55/geolens)

*The live atlas link will be updated after deployment.*

---

## Project Overview

GeoLens was built to answer a question: **Which countries are most similar based on measurable economic, demographic, and social characteristics?**

Rather than relying solely on geographic proximity or conventional regional groupings, GeoLens uses six standardized development indicators to identify statistically similar countries.

The application combines data engineering, machine learning, and interactive visualization into a single end-to-end analytical project.

### Key Features

- **Interactive World Atlas:** Explore a choropleth map with selectable indicators, zooming, tooltips, and country profiles.
- **Country Similarity:** Discover each eligible country's five nearest neighbors using standardized Euclidean distance.
- **Country Comparison:** Compare two countries side by side using development indicators and observation years.
- **K-Means Clustering:** Explore three data-driven country groupings.
- **Data & Methodology:** Review indicator definitions, modeling decisions, validation results, and limitations.

---

## Project at a Glance

| Metric | Result |
|---|---:|
| Countries and economies in atlas | 217 |
| Countries eligible for similarity modeling | 181 |
| Verified nearest-neighbor relationships | 905 |
| Similarity features | 6 |
| K-means clusters | 3 |
| Map-matched atlas locations | 216 / 217 |
| Nearest-neighbor validation issues | 0 |
| Clustering reproducibility (Adjusted Rand Index) | 1.0000 |

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Data collection | Python, Requests, World Bank API |
| Data processing | Pandas, NumPy |
| Machine learning | scikit-learn, K-Means, StandardScaler |
| Geographic visualization | React Simple Maps, GeoJSON, D3 Geo |
| Frontend | React, TypeScript, Vite, CSS |
| Model validation | scikit-learn metrics, independent distance checks |
| Hosting | Vercel |

---

## Data Sources & Features

GeoLens retrieves indicators from the World Bank's World Development Indicators dataset.

The similarity model uses:

| Indicator | World Bank Series |
|---|---|
| GDP per capita, PPP | `NY.GDP.PCAP.PP.CD` |
| Life expectancy at birth | `SP.DYN.LE00.IN` |
| Fertility rate | `SP.DYN.TFRT.IN` |
| Urban population (%) | `SP.URB.TOTL.IN.ZS` |
| Population aged 65+ (%) | `SP.POP.65UP.TO.ZS` |
| Internet usage (%) | `IT.NET.USER.ZS` |

Total population is also available in the atlas and comparison interface but is excluded from similarity modeling.

GeoLens uses the latest available observations from 2020–2025. To qualify for the similarity model, a country must have complete observations for all six indicators, each dated 2022 or later.

Data sources:

- [World Bank Open Data](https://data.worldbank.org/)
- [World Bank API](https://datahelpdesk.worldbank.org/knowledgebase/articles/889392)
- [Natural Earth](https://www.naturalearthdata.com/)
- [Geo Countries](https://github.com/datasets/geo-countries)

---

## Machine Learning Methodology

### 1. Data Preparation

The Python pipeline retrieves data, combines indicators by country code, checks for invalid or missing values, and preserves observation years.

Locations that do not satisfy the modeling requirements remain available in the interactive atlas and country comparison view.

### 2. Feature Engineering

GDP per capita is transformed using `log1p()` to reduce skew caused by very high values.

All six features are then standardized using `StandardScaler`, allowing indicators measured in different units to contribute comparably to distance calculations.

### 3. Country Similarity

Each eligible country is represented in a six-dimensional feature space.

GeoLens calculates pairwise Euclidean distances and retrieves the five closest countries for each eligible location, excluding self-matches.

Smaller distances indicate greater similarity across the selected indicators.

### 4. Clustering

K-means clustering is applied to the standardized data.

Candidate values from `k=3` through `k=8` were evaluated using silhouette scores. The best-performing candidate was **k=3**, with a silhouette score of **0.3785**.

The resulting cluster profiles are:

| Cluster | Countries | General Profile |
|---|---:|---|
| 1 | 71 | Transitional and middle-development |
| 2 | 42 | Lower-income, higher-fertility |
| 3 | 68 | Higher-income, aging populations |

These clusters describe statistical patterns, not official classifications or measures of national worth.

---

## Model Validation

GeoLens includes independent validation scripts to examine correctness, reproducibility, and sensitivity.

**Nearest-neighbor accuracy:** All 905 saved similarity relationships were checked against recalculated Euclidean distances, producing zero validation issues.

**Clustering reproducibility:** The K-means results were reproduced with an Adjusted Rand Index of 1.0000, indicating identical group membership.

**Geographic matching:** After resolving Kosovo's country-code mismatch, 216 of 217 World Bank locations matched a geographic feature. The Channel Islands remain available through non-map exploration tools.

### Feature Sensitivity Analysis

A leave-one-feature-out experiment measured the percentage of original top-five neighbors retained after each indicator was removed.

| Removed Indicator | Average Top-5 Overlap |
|---|---:|
| Urban population | 55.5% |
| Population aged 65+ | 72.8% |
| Life expectancy | 72.9% |
| Fertility rate | 76.4% |
| GDP per capita | 79.1% |
| Internet usage | 81.9% |

**Urbanization had the largest observed influence on nearest-neighbor rankings:** removing it retained only 55.5% of original matches, on average.

This measures sensitivity within the chosen model, not causal importance in real-world development.

---

## Project Structure

```text
geolens/
├── data/
│   ├── raw/
│   └── processed/
├── scripts/
│   ├── fetch_data.py
│   ├── clean_data.py
│   ├── country_similarity.py
│   ├── export_data.py
│   ├── audit_geography.py
│   └── validate_model.py
├── reports/
├── frontend/
│   ├── public/
│   │   └── data/
│   │       ├── country_data.json
│   │       └── world.geojson
│   ├── src/
│   │   ├── components/
│   │   │   ├── WorldMap.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── CountryProfile.tsx
│   │   │   ├── SimilarityPanel.tsx
│   │   │   ├── CountryComparison.tsx
│   │   │   └── Methodology.tsx
│   │   └── App.tsx
│   └── package.json
├── requirements.txt
└── README.md
```

---

## Running GeoLens Locally

### Prerequisites

- Python and pip
- Node.js and npm
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/cellis55/geolens.git
cd geolens
```

### 2. Install Python Dependencies

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Run the Data Pipeline (Optional)

The frontend includes pre-generated data, so this step is only necessary if refreshing or rebuilding the datasets.

```bash
python scripts/fetch_data.py
python scripts/clean_data.py
python scripts/country_similarity.py
python scripts/export_data.py
```

### 4. Run the Application

```bash
cd frontend
npm install
npm run dev
```

Open the local URL provided by Vite, usually `http://localhost:5173`.

### 5. Build for Production

```bash
npm run build
npm run preview
```

### 6. Run Validation Scripts

From the repository root, with the Python environment active:

```bash
python scripts/audit_geography.py
python scripts/validate_model.py
```

These scripts generate validation reports inside `reports/`.

---

## Limitations

- Similarity is based on six chosen indicators, not every aspect of a country's economy, society, history, or culture.
- Data observation years can differ across countries and indicators.
- Some economies lack sufficiently complete and recent data for similarity modeling.
- Euclidean distance depends on feature selection, transformations, and scaling.
- K-means clusters are descriptive and do not imply rigid developmental categories.
- Geographic boundaries are intended for visualization and do not express positions on territorial sovereignty.

---

## Future Improvements

- Historical indicator trends and time-series comparisons
- Adjustable indicator weights for custom similarity analysis
- Expanded geographic and socioeconomic features
- Automated refreshes of World Bank data
- Alternative clustering and similarity methods

---

## Author

Developed by [Charlie Ellis](https://github.com/cellis55) as an end-to-end data science and visualization portfolio project.

**Data:** World Bank Open Data  
**Boundaries:** Natural Earth / Geo Countries