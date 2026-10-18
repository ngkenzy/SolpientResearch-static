import { loadMemos, upsidePct } from "@/lib/memos";
import { loadScreen } from "@/lib/screen";
import { loadCompanies } from "@/lib/research";

/* Knowledge the Ask assistant may use. Everything comes from the published memos, research files, and screen output. */

export type KnowledgeItem = {
  id: string;
  title: string;
  tags: string[];
  text: string;
  source: string;
  url: string;
};

export function buildKnowledge(): KnowledgeItem[] {
  const items: KnowledgeItem[] = [];

  for (const m of loadMemos()) {
    items.push({
      id: `memo-${m.slug}`,
      title: `${m.name} (${m.ticker}) memo`,
      tags: [m.name.toLowerCase(), m.ticker.toLowerCase(), "memo", "classification", "valuation", "thesis"],
      text: `${m.name} (${m.ticker}): ${m.classification}. Price $${m.price.toFixed(2)}, base value $${m.base_value.toFixed(2)}, bear $${m.bear_value.toFixed(2)}, bull $${m.bull_value.toFixed(2)}, upside to base ${upsidePct(m).toFixed(0)}%, base 5-year CAGR ${m.cagr_5y_base}%. Data as of ${m.data_date}. ${m.summary}`,
      source: `${m.ticker} full memo`,
      url: `/memos/${m.slug}/`,
    });
  }

  for (const c of loadCompanies()) {
    items.push({
      id: `research-${c.ticker}`,
      title: `${c.company_name} (${c.ticker}) research`,
      tags: [c.company_name.toLowerCase(), c.ticker.toLowerCase(), "research", "score", "summary"],
      text: `${c.company_name} (${c.ticker}), ${c.exchange ?? ""}, ${c.sector ?? ""}. Overall score ${c.scores?.overall_score ?? "n/a"} out of 100. Base value $${c.valuations?.base_value ?? "n/a"}. Summary: ${c.research.summary ?? ""}`,
      source: `${c.ticker} research page`,
      url: `/companies/${c.ticker.toLowerCase()}/`,
    });
  }

  const screen = loadScreen();
  for (const r of screen.rows.slice(0, 30)) {
    items.push({
      id: `screen-${r.ticker}`,
      title: `${r.name} (${r.ticker}) screen`,
      tags: [r.name.toLowerCase(), r.ticker.toLowerCase(), "screen", "rank", "checks", "flags"],
      text: `${r.name} (${r.ticker}) ranks #${r.rank} on the screen with ${r.checks} of 8 checks passed. Margin of safety ${r.margin_of_safety == null ? "n/a" : (r.margin_of_safety * 100).toFixed(0) + "%"}. Flags: ${r.flags.join("; ") || "none"}. This is a mechanical screen, not research.`,
      source: "Ranking",
      url: "/ranking/",
    });
  }

  items.push({
    id: "method",
    title: "Screen method",
    tags: ["method", "checks", "screen", "buffett", "lynch", "rank", "ranking", "how"],
    text: `${screen.method} Data source: ${screen.data_source}. Financials are excluded from the screen.`,
    source: "Ranking method",
    url: "/ranking/",
  });

  items.push({
    id: "disclaimer",
    title: "Not advice",
    tags: ["advice", "buy", "sell", "invest", "recommend"],
    text: "This site is research and screening output for education and reference only. It is not personalized investment advice and not a recommendation to buy or sell any security.",
    source: "Disclaimer",
    url: "/",
  });

  return items;
}
