import fs from "node:fs";
import path from "node:path";

/* Shapes mirror data/research/<TICKER>/<DATE>[-standard-v1].json. Only the
   fields the static pages read are typed; everything else is ignored. */

export type Scores = {
  quality_score?: number;
  growth_score?: number;
  valuation_score?: number;
  financial_strength_score?: number;
  moat_score?: number;
  thesis_integrity_score?: number;
  overall_score?: number;
};

export type Valuations = {
  dcf_value?: number | null;
  owner_earnings_value?: number | null;
  earnings_multiple_value?: number | null;
  historical_multiple_value?: number | null;
  peer_value?: number | null;
  bear_value?: number | null;
  base_value?: number | null;
  bull_value?: number | null;
  mos_25_price?: number | null;
  mos_35_price?: number | null;
  mos_50_price?: number | null;
  discount_rate?: number | null;
  terminal_growth?: number | null;
};

export type ThesisVariable = {
  variable_name: string;
  expectation?: string;
  observed_value?: string;
  status?: string;
  evidence?: string;
  breaker_condition?: string;
  review_frequency?: string;
};

export type Risk = {
  risk_key: string;
  title: string;
  description?: string;
  probability?: string;
  severity?: string;
};

export type Scenario = {
  scenario: string;
  horizon_years?: number;
  expected_cagr?: number | null;
  estimated_terminal_value_per_share?: number | null;
  exit_multiple?: number | null;
};

export type Source = {
  source_type?: string;
  title?: string;
  url?: string;
  filing_date?: string;
};

export type Company = {
  ticker: string;
  company_name: string;
  exchange?: string;
  sector?: string;
  industry?: string;
  description?: string;
  research: {
    researched_at?: string;
    price_at_research?: number | null;
    market_cap?: number | null;
    source_period?: string;
    summary?: string;
    full_report?: string;
    standard_version?: string;
  };
  financial_metrics?: Record<string, number | string | null>;
  scores?: Scores;
  valuations?: Valuations;
  thesis_variables?: ThesisVariable[];
  sources?: Source[];
  ranking?: { rank?: number; overall_score?: number; price?: number; base_fair_value?: number };
  business_assessment?: Record<string, unknown>;
  risk_register?: Risk[];
  expected_return_scenarios?: Scenario[];
  /** Date of the file this snapshot came from (YYYY-MM-DD). */
  snapshot_date: string;
  /** How many research files exist for this ticker. */
  version_count: number;
};

const RESEARCH_DIR = path.join(process.cwd(), "data", "research");

/** Latest snapshot per ticker. Standard-v1 files win over plain files on the same date. */
export function loadCompanies(): Company[] {
  if (!fs.existsSync(RESEARCH_DIR)) return [];

  const companies: Company[] = [];
  for (const dir of fs.readdirSync(RESEARCH_DIR)) {
    const tickerDir = path.join(RESEARCH_DIR, dir);
    if (!fs.statSync(tickerDir).isDirectory()) continue;

    const files = fs
      .readdirSync(tickerDir)
      .filter((f) => f.endsWith(".json"))
      .sort();
    if (files.length === 0) continue;

    const latest = files
      .map((f) => ({
        file: f,
        date: f.slice(0, 10),
        rank: f.includes("standard-v1") ? 1 : 0,
      }))
      .sort((a, b) => (a.date + a.rank).localeCompare(b.date + b.rank))
      .at(-1)!;

    const raw = JSON.parse(fs.readFileSync(path.join(tickerDir, latest.file), "utf8")) as Omit<
      Company,
      "snapshot_date" | "version_count"
    >;
    companies.push({
      ...raw,
      snapshot_date: latest.date,
      version_count: files.length,
    });
  }

  return companies.sort((a, b) => (a.ranking?.rank ?? 999) - (b.ranking?.rank ?? 999));
}

export function findCompany(ticker: string): Company | undefined {
  return loadCompanies().find((c) => c.ticker.toLowerCase() === ticker.toLowerCase());
}

/* Formatting helpers. Return "—" for missing values so pages never show "null". */

export function money(value: number | null | undefined, digits = 2): string {
  return value == null || !Number.isFinite(value) ? "—" : `$${value.toFixed(digits)}`;
}

export function billions(value: number | null | undefined): string {
  return value == null || !Number.isFinite(value) ? "—" : `$${(value / 1e9).toFixed(1)}B`;
}

export function pct(value: number | null | undefined, digits = 1): string {
  return value == null || !Number.isFinite(value) ? "—" : `${value.toFixed(digits)}%`;
}

export function num(value: number | string | null | undefined, digits = 1): string {
  if (value == null || value === "") return "—";
  if (typeof value === "string") return value;
  return Number.isFinite(value) ? value.toFixed(digits) : "—";
}

/** Upside from the current price to the base fair value, as a percent. */
export function upside(company: Company): number | null {
  const price = company.ranking?.price ?? company.research.price_at_research ?? null;
  const base = company.ranking?.base_fair_value ?? company.valuations?.base_value ?? null;
  if (price == null || base == null || price <= 0) return null;
  return (base / price - 1) * 100;
}
