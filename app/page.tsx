import { loadCompanies, money, pct } from "@/lib/research";
import { loadMemos } from "@/lib/memos";
import { loadScreen } from "@/lib/screen";
import fs from "node:fs";
import { Bars3D } from "@/components/Bars3D";
import path from "node:path";

/* Ranking home page. Each row opens the company's full memo, or its full research page where no memo exists. */

type Row = {
  ticker: string;
  name: string;
  score: string;
  price: number | null;
  base: number | null;
  mos35: number | null;
  href: string;
};

export default function Home() {
  const companies = loadCompanies();
  const memos = loadMemos();
  const screen = loadScreen();

  const prices = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "data", "screen", "prices.json"), "utf8"),
  ) as { as_of: string; prices: Record<string, { price: number; date: string }> };
  const priceOf = (t: string, fallback: number | null) => prices.prices[t]?.price ?? fallback;
  const picks = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "data", "screen", "picks_checks.json"), "utf8"),
  ) as { checks: Record<string, number>; screen_margin_of_safety: Record<string, number> };
  const adbe = companies.find((c) => c.ticker === "ADBE");
  const deck = companies.find((c) => c.ticker === "DECK");
  const g = memos.find((m) => m.ticker === "G");
  const hrmy = memos.find((m) => m.ticker === "HRMY");

  const rows: Row[] = [
    deck && {
      ticker: "DECK",
      name: deck.company_name,
      score: `${picks.checks.DECK} / 8 checks`,
      price: priceOf("DECK", deck.research.price_at_research ?? null),
      base: deck.valuations?.base_value ?? null,
      mos35: deck.valuations?.mos_35_price ?? null,
      href: "/companies/deck/",
    },
    adbe && {
      ticker: "ADBE",
      name: adbe.company_name,
      score: `${picks.checks.ADBE} / 8 checks`,
      price: priceOf("ADBE", adbe.research.price_at_research ?? null),
      base: adbe.valuations?.base_value ?? null,
      mos35: adbe.valuations?.mos_35_price ?? null,
      href: "/companies/adbe/",
    },
    g && {
      ticker: "G",
      name: "Genpact",
      score: `${picks.checks.G} / 8 checks`,
      price: priceOf("G", g.price),
      base: g.base_value,
      mos35: 50.86,
      href: `/memos/${g.slug}/`,
    },
    hrmy && {
      ticker: "HRMY",
      name: "Harmony Biosciences",
      score: `${picks.checks.HRMY} / 8 checks`,
      price: priceOf("HRMY", hrmy.price),
      base: hrmy.base_value,
      mos35: 77.5,
      href: `/memos/${hrmy.slug}/`,
    },
  ]
    .filter(Boolean)
    .sort(
      (a, b) =>
        (picks.checks[b!.ticker] - picks.checks[a!.ticker]) ||
        (picks.screen_margin_of_safety[b!.ticker] - picks.screen_margin_of_safety[a!.ticker]),
    ) as Row[];

  return (
    <>
      <h1>Ranking</h1>
      <Bars3D
        title="Margin of safety to base value"
        bars={rows.map((r) => ({
          ticker: r.ticker,
          value: r.price != null && r.base != null && r.base > 0 ? 1 - r.price / r.base : null,
        }))}
      />
      <p className="lede" style={{ marginBottom: 14 }}>
        Prices as of the Oct. 16, 2026 close for all four picks. Click any row to open its memo or research page.
      </p>
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th className="n">Rank</th>
              <th>Company</th>
              <th className="n">Screen checks</th>
              <th className="n">Price</th>
              <th className="n">Base value</th>
              <th className="n">Margin of safety</th>
              <th className="n">35% MoS price</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const margin = r.price != null && r.base != null && r.base > 0 ? 1 - r.price / r.base : null;
              return (
                <tr key={r.ticker} className={`rank-row checks-${picks.checks[r.ticker] >= 8 ? 8 : picks.checks[r.ticker] === 7 ? 7 : picks.checks[r.ticker] === 6 ? 6 : "low"}`}>
                  <td className="n"><a className="rank-cell" href={r.href}>{i + 1}</a></td>
                  <td>
                    <a className="rank-cell" href={r.href}>
                      <strong>{r.ticker}</strong> <span className="muted">{r.name}</span>
                    </a>
                  </td>
                  <td className="n"><a className="rank-cell n" href={r.href}>{r.score}</a></td>
                  <td className="n"><a className="rank-cell n" href={r.href}>{money(r.price)}</a></td>
                  <td className="n"><a className="rank-cell n" href={r.href}>{money(r.base)}</a></td>
                  <td className="n"><a className={`rank-cell n ${margin == null ? "" : margin >= 0 ? "pos" : "neg"}`} href={r.href}>
                    {margin == null ? "—" : pct(margin * 100)}
                  </a></td>
                  <td className="n"><a className="rank-cell n" href={r.href}>{money(r.mos35)}</a></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="note">
        Margin of safety is 1 minus price divided by base value. The 35% MoS price is the price at which the margin
        reaches 35%. Screen checks are the number of the 8 screen checks each stock passes. Rank is by checks passed,
        then by screen margin of safety.
      </p>

      <h2>What the 8 screen checks test</h2>
      <ol className="checks">
        <li><strong>Return on equity.</strong> ROE is at least 15% in every one of the last five years.</li>
        <li><strong>Profitable EPS.</strong> Diluted EPS is positive in every one of the last five years.</li>
        <li><strong>Owner earnings.</strong> Operating cash flow minus capital spending is positive in every one of the last five years.</li>
        <li><strong>Debt payback.</strong> Long-term debt is no more than four years of net income.</li>
        <li><strong>Margin of safety.</strong> The screen's DCF value is at least 25% above the price.</li>
        <li><strong>Earnings growth.</strong> Five-year EPS growth is between 10% and 30% a year.</li>
        <li><strong>PEG.</strong> The price-to-earnings ratio divided by the growth rate is 1 or less.</li>
        <li><strong>Debt to equity.</strong> Total debt is no more than equity.</li>
      </ol>
      <p className="note">
        These are mechanical tests on reported SEC figures, not an assessment of the business. A stock can pass all eight
        and still be a poor investment, and a stock can fail one for a reason that does not matter. Each check has a
        threshold that can be changed.
      </p>
    </>
  );
}
