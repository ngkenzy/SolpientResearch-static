import { loadCompanies, money } from "@/lib/research";
import { loadMemos } from "@/lib/memos";
import { loadScreen } from "@/lib/screen";

/* Top picks, ranked. Research-backed names are ranked by their published overall score; screen-only names
   are placed after them by checks passed. Each row links to its full memo or full research page. */

export default function RankingPage() {
  const companies = loadCompanies();
  const memos = loadMemos();
  const screen = loadScreen();

  const adbe = companies.find((c) => c.ticker === "ADBE");
  const deck = companies.find((c) => c.ticker === "DECK");
  const g = memos.find((m) => m.ticker === "G" || m.ticker === "GENPACT");
  const hrmy = memos.find((m) => m.ticker === "HRMY");
  const gScreen = screen.rows.find((r) => r.ticker === "G");
  const hrmyScreen = screen.rows.find((r) => r.ticker === "HRMY");

  type Pick = {
    ticker: string;
    name: string;
    basis: string;
    score: string;
    price: number | null;
    fair: number | null;
    href: string;
    link: string;
  };

  const picks: Pick[] = [
    deck && {
      ticker: "DECK",
      name: deck.company_name,
      basis: "Published research score",
      score: `${deck.scores?.overall_score ?? "—"} / 100`,
      price: deck.research.price_at_research ?? null,
      fair: deck.valuations?.base_value ?? null,
      href: "/companies/deck/",
      link: "Full research",
    },
    adbe && {
      ticker: "ADBE",
      name: adbe.company_name,
      basis: "Published research score",
      score: `${adbe.scores?.overall_score ?? "—"} / 100`,
      price: adbe.research.price_at_research ?? null,
      fair: adbe.valuations?.base_value ?? null,
      href: "/companies/adbe/",
      link: "Full research",
    },
    g && {
      ticker: "G",
      name: "Genpact",
      basis: "Screen checks passed",
      score: `${gScreen?.checks ?? "—"} / 8`,
      price: g.price,
      fair: g.base_value,
      href: `/memos/${g.slug}/`,
      link: "Full memo",
    },
    hrmy && {
      ticker: "HRMY",
      name: "Harmony Biosciences",
      basis: "Screen checks passed",
      score: `${hrmyScreen?.checks ?? "—"} / 8`,
      price: hrmy.price,
      fair: hrmy.base_value,
      href: `/memos/${hrmy.slug}/`,
      link: "Full memo",
    },
  ].filter(Boolean) as Pick[];

  return (
    <>
      <p className="kicker">Ranking</p>
      <h1>Top picks</h1>
      <p className="lede">
        Ranked by published research score where a full research page exists, then by screen checks passed. Click a
        row to open its full memo or research page.
      </p>

      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th className="n">Rank</th>
              <th>Company</th>
              <th>Basis</th>
              <th className="n">Score</th>
              <th className="n">Price</th>
              <th className="n">Base value</th>
              <th>Research</th>
            </tr>
          </thead>
          <tbody>
            {picks.map((p, i) => (
              <tr key={p.ticker}>
                <td className="n">{i + 1}</td>
                <td>
                  <a href={p.href} style={{ textDecoration: "none", color: "inherit" }}>
                    <strong>{p.ticker}</strong> <span className="muted">{p.name}</span>
                  </a>
                </td>
                <td>{p.basis}</td>
                <td className="n">{p.score}</td>
                <td className="n">{money(p.price)}</td>
                <td className="n">{money(p.fair)}</td>
                <td>
                  <a href={p.href}>{p.link} →</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="note">
        Scores use different scales: the published research score is out of 100, and the screen score counts passed
        checks out of 8. Base values are the published base case for each name. Full memos and research pages contain
        the assumptions and the risks. Not personalized advice.
      </p>
    </>
  );
}
