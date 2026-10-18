import { loadCompanies, money } from "@/lib/research";
import { loadMemos } from "@/lib/memos";
import { loadScreen } from "@/lib/screen";

/* Ranking home page. Each row opens the company's full memo, or its full research page where no memo exists. */

export default function Home() {
  const companies = loadCompanies();
  const memos = loadMemos();
  const screen = loadScreen();

  const adbe = companies.find((c) => c.ticker === "ADBE");
  const deck = companies.find((c) => c.ticker === "DECK");
  const g = memos.find((m) => m.ticker === "G");
  const hrmy = memos.find((m) => m.ticker === "HRMY");
  const gChecks = screen.rows.find((r) => r.ticker === "G")?.checks;
  const hrmyChecks = screen.rows.find((r) => r.ticker === "HRMY")?.checks;

  const rows = [
    deck && {
      ticker: "DECK",
      name: deck.company_name,
      score: `${deck.scores?.overall_score ?? "—"}`,
      scale: "/ 100",
      href: "/companies/deck/",
    },
    adbe && {
      ticker: "ADBE",
      name: adbe.company_name,
      score: `${adbe.scores?.overall_score ?? "—"}`,
      scale: "/ 100",
      href: "/companies/adbe/",
    },
    g && {
      ticker: "G",
      name: "Genpact",
      score: `${gChecks ?? "—"}`,
      scale: "/ 8",
      href: `/memos/${g.slug}/`,
    },
    hrmy && {
      ticker: "HRMY",
      name: "Harmony Biosciences",
      score: `${hrmyChecks ?? "—"}`,
      scale: "/ 8",
      href: `/memos/${hrmy.slug}/`,
    },
  ].filter(Boolean) as { ticker: string; name: string; score: string; scale: string; href: string }[];

  return (
    <>
      <h1>Ranking</h1>
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th className="n">Rank</th>
              <th>Company</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.ticker}>
                <td className="n">{i + 1}</td>
                <td>
                  <a href={r.href} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                    <strong>{r.ticker}</strong> <span className="muted">{r.name}</span>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
