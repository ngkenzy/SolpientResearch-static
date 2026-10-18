import { billions, loadCompanies, pct, upside } from "@/lib/research";

export default function Home() {
  const companies = loadCompanies();

  return (
    <>
      <h1>Research</h1>
      <p className="lede">
        Point-in-time fundamental research. Each company shows the latest snapshot, with its
        thesis, valuation range, risks, and sources as of that date.
      </p>

      <div className="grid">
        {companies.map((c) => {
          const up = upside(c);
          return (
            <a className="card" href={`/companies/${c.ticker.toLowerCase()}/`} key={c.ticker}>
              <div className="ticker">
                {c.ticker} · {c.exchange ?? ""}
              </div>
              <div className="name">{c.company_name}</div>
              <div className="row">
                <span className="muted">Rank</span>
                <span>{c.ranking?.rank ?? "—"}</span>
              </div>
              <div className="row">
                <span className="muted">Overall score</span>
                <span>{c.scores?.overall_score ?? "—"}</span>
              </div>
              <div className="row">
                <span className="muted">Market cap</span>
                <span>{billions(c.research.market_cap)}</span>
              </div>
              <div className="row">
                <span className="muted">Upside to base value</span>
                <span className={up == null ? "" : up >= 0 ? "pos" : "neg"}>
                  {up == null ? "—" : pct(up)}
                </span>
              </div>
              <div className="row">
                <span className="muted">As of</span>
                <span>{c.snapshot_date}</span>
              </div>
            </a>
          );
        })}
      </div>

      {companies.length === 0 && <p className="muted">No research published yet.</p>}
    </>
  );
}
