import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";

/* Full memos: metadata in content/memos/index.json, body in content/memos/<slug>.md. */

export type MemoMeta = {
  slug: string;
  ticker: string;
  name: string;
  classification: string;
  price: number;
  base_value: number;
  bear_value: number;
  bull_value: number;
  cagr_5y_base: number;
  data_date: string;
  summary: string;
};

const MEMO_DIR = path.join(process.cwd(), "content", "memos");

export function loadMemos(): MemoMeta[] {
  const index = JSON.parse(fs.readFileSync(path.join(MEMO_DIR, "index.json"), "utf8")) as MemoMeta[];
  return index;
}

export function findMemo(slug: string): MemoMeta | undefined {
  return loadMemos().find((m) => m.slug === slug);
}

/** Markdown body rendered to HTML at build time. Content is local and trusted. */
export function memoHtml(slug: string): string {
  const md = fs.readFileSync(path.join(MEMO_DIR, `${slug}.md`), "utf8");
  return marked.parse(md, { async: false }) as string;
}

export function upsidePct(m: MemoMeta): number {
  return (m.base_value / m.price - 1) * 100;
}
