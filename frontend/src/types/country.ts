
export type MetricKey =
  | "gdp_per_capita_ppp"
  | "life_expectancy"
  | "fertility_rate"
  | "urban_population_pct"
  | "population_65_plus_pct"
  | "internet_usage_pct";

export type SimilarCountry = {
  rank: number;
  country_code: string;
  country_name: string;
  distance: number;
  closest_features: string[];
  biggest_differences: string[];
};

export type Country = {
  country_code: string;
  country_name: string;
  region: string;
  income_level: string;
  population: number | null;
  population_year: number | null;
  gdp_per_capita_ppp: number | null;
  gdp_per_capita_ppp_year: number | null;
  life_expectancy: number | null;
  life_expectancy_year: number | null;
  fertility_rate: number | null;
  fertility_rate_year: number | null;
  urban_population_pct: number | null;
  urban_population_pct_year: number | null;
  population_65_plus_pct: number | null;
  population_65_plus_pct_year: number | null;
  internet_usage_pct: number | null;
  internet_usage_pct_year: number | null;
  cluster: number | null;
  model_eligible: boolean;
  similar_countries: SimilarCountry[];
};

export type GeoLensData = {
  metadata: {
    country_count: number;
    modeled_country_count: number;
  };
  countries: Country[];
};
