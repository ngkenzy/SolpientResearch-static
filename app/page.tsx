import { loadMemos, upsidePct } from "@/lib/memos";
import { loadScreen } from "@/lib/screen";
import { pct } from "@/lib/research";

export default function Home() {
  const memos = loadMemos();
  const screen = loadScreen();
  const top = screen.rows.slice(0, 10);
  const memoTickers = new Set(memos.map((m) => m.ticker));

  return (
    <>
      <p className="kicker">Research overview</p>
      <h1>Ranking and full memos</h1>
      <p className="lede">
        Every screened stock is ranked by how many quality, growth, debt, and value checks it passes. Full
        memos go deeper on the names that look most interesting.
      </p>

      <div className="stats">
        <div className="stat"><div className="k">Stocks ranked</div><div className="v">{screen.count}</div></div>
        <div className="stat"><div className="k">Full memos</div><div className="v">{memos.length}</div></div>
        <div className="stat"><div className="k">Checks per stock</div><div className="v">8</div></div>
        <div className="stat"><div className="k">Price data</div><div className="v" style={{ fontSize: 15 }}>Oct. 16, 2026</div></div>
      </div>

      <h2>Full memos</h2>
      <div className="grid">
        {memos.map((m) => {
          const up = upsidePct(m);
          const tone = m.classification.startsWith("Attractive") ? "good" : "warn";
          return (
            <a className="card" href={`/memos/${m.slug}/`} key={m.slug}>
              <div className="ticker">{m.ticker}</div>
              <div className="name">{m.name}</div>
              <span className={`badge ${tone}`} style={{ alignSelf: "flex-start" }}>{m.classification}</span>
              <div className="row"><span className="muted">Price</span><span>${m.price.toFixed(2)}</span></div>
              <div className="row"><span className="muted">Base value</span><span>${m.base_value.toFixed(2)}</span></div>
              <div className="row"><span className="muted">Upside to base</span><span className={up >= 0 ? "pos" : "neg"}>{pct(up)}</span></div>
              <div className="row"><span className="muted">Data as of</span><span>{m.data_date}</span></div>
            </a>
          );
        })}
      </div>

      <h2>Top ten by screen</h2>
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th className="n">Rank</th>
              <th>Ticker</th>
              <th>Company</th>
              <th className="n">Checks</th>
              <th className="n">Price</th>
              <th className="n">Margin of safety</th>
              <th>Research</th>
            </tr>
          </thead>
          <tbody>
            {top.map((r) => (
              <tr key={r.ticker}>
                <td className="n">{r.rank}</td>
                <td><strong>{r.ticker}</strong></td>
                <td>{r.name}</td>
                <td className="n">{r.checks}/8</td>
                <td className="n">{r.price == null ? "—" : `$${r.price.toFixed(2)}`}</td>
                <td className={`n ${r.margin_of_safety == null ? "" : r.margin_of_safety >= 0 ? "pos" : "neg"}`}>
                  {r.margin_of_safety == null ? "—" : pct(r.margin_of_safety * 100, 0)}
                </td>
                <td>
                  {memoTickers.has(r.ticker) ? (
                    <a href={`/memos/${memos.find((m) => m.ticker === r.ticker)!.slug}/`}>Full memo</a>
                  ) : (
                    <span className="muted">Screen only</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="note">
        Showing 10 of {screen.count}. <a href="/ranking/">See the full ranking, search, and filters →</a>
      </p>
    </>
  );
}
