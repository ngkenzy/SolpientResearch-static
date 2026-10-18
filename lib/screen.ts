import fs from "node:fs";
import path from "node:path";

/* Mechanical screen output, written by stock-screener/export_ranking.py. */

export type ScreenRow = {
  rank: number;
  ticker: string;
  name: string;
  sector: string | null;
  index: string;
  price: number | null;
  checks: number;
  dcf_value: number | null;
  margin_of_safety: number | null;
  roe_min_5y: number | null;
  eps_cagr_5y: number | null;
  peg: number | null;
  debt_payback_years: number | null;
  debt_to_equity: number | null;
  flags: string[];
};

export type ScreenData = {
  method: string;
  data_source: string;
  count: number;
  rows: ScreenRow[];
};

export function loadScreen(): ScreenData {
  const file = path.join(process.cwd(), "data", "screen", "ranking.json");
  return JSON.parse(fs.readFileSync(file, "utf8")) as ScreenData;
}
