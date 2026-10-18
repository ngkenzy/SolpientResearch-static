"use client";

import { useMemo, useState } from "react";
import type { ScreenRow } from "@/lib/screen";

type SortKey = "rank" | "ticker" | "checks" | "margin_of_safety" | "price" | "roe_min_5y" | "eps_cagr_5y";

const pctText = (v: number | null, digits = 0) =>
  v == null || !Number.isFinite(v) ? "—" : `${(v * 100).toFixed(digits)}%`;
const numText = (v: number | null, digits = 2) =>
  v == null || !Number.isFinite(v) ? "—" : v.toFixed(digits);

export function RankingTable({
  rows,
  memoLinks,
}: {
  rows: ScreenRow[];
  memoLinks: Record<string, string>;
}) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState("all");
  const [minChecks, setMinChecks] = useState(0);
  const [positiveOnly, setPositiveOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [desc, setDesc] = useState(false);
  const [limit, setLimit] = useState(50);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = rows.filter((r) => {
      if (index !== "all" && r.index !== index) return false;
      if (r.checks < minChecks) return false;
      if (positiveOnly && !(r.margin_of_safety != null && r.margin_of_safety > 0)) return false;
      if (q && !(r.ticker.toLowerCase().includes(q) || r.name.toLowerCase().includes(q))) return false;
      return true;
    });
    const value = (r: ScreenRow): number | string => {
      const v = r[sortKey];
      if (v == null) return Number.NEGATIVE_INFINITY;
      return typeof v === "string" ? v : Number(v);
    };
    const sorted = [...filtered].sort((a, b) => {
      const av = value(a);
      const bv = value(b);
      if (av < bv) return desc ? 1 : -1;
      if (av > bv) return desc ? -1 : 1;
      return a.rank - b.rank;
    });
    return sorted;
  }, [rows, query, index, minChecks, positiveOnly, sortKey, desc]);

  function sortBy(key: SortKey) {
    if (key === sortKey) setDesc(!desc);
    else {
      setSortKey(key);
      setDesc(key !== "ticker" && key !== "rank");
    }
  }

  const header = (key: SortKey, label: string, numeric = false) => (
    <th className={numeric ? "n" : undefined} aria-sort={sortKey === key ? (desc ? "descending" : "ascending") : "none"}>
      <button type="button" onClick={() => sortBy(key)}>
        {label}
        {sortKey === key ? (desc ? " ↓" : " ↑") : ""}
      </button>
    </th>
  );

  return (
    <>
      <div className="toolbar" role="search">
        <input
          className="input"
          type="search"
          placeholder="Search ticker or company"
          aria-label="Search ticker or company"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className="select" aria-label="Index" value={index} onChange={(e) => setIndex(e.target.value)}>
          <option value="all">All indexes</option>
          <option value="S&P 500">S&amp;P 500</option>
          <option value="S&P 400 / 600">S&amp;P 400 / 600</option>
        </select>
        <select
          className="select"
          aria-label="Minimum checks passed"
          value={minChecks}
          onChange={(e) => setMinChecks(Number(e.target.value))}
        >
          {[0, 3, 4, 5, 6, 7, 8].map((n) => (
            <option key={n} value={n}>
              {n === 0 ? "Any checks" : `${n}+ of 8 checks`}
            </option>
          ))}
        </select>
        <label className="muted" style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 14 }}>
          <input type="checkbox" checked={positiveOnly} onChange={(e) => setPositiveOnly(e.target.checked)} />
          Positive margin only
        </label>
      </div>
      <p className="note">
        Showing {Math.min(limit, visible.length)} of {visible.length} matching stocks.
      </p>

      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              {header("rank", "Rank", true)}
              {header("ticker", "Ticker")}
              <th>Company</th>
              {header("checks", "Checks", true)}
              {header("price", "Price", true)}
              {header("margin_of_safety", "Margin of safety", true)}
              {header("roe_min_5y", "Min ROE 5y", true)}
              {header("eps_cagr_5y", "EPS CAGR 5y", true)}
              <th className="n">PEG</th>
              <th>Flags</th>
              <th>Research</th>
            </tr>
          </thead>
          <tbody>
            {visible.slice(0, limit).map((r) => (
              <tr key={r.ticker}>
                <td className="n">{r.rank}</td>
                <td><strong>{r.ticker}</strong></td>
                <td>
                  {r.name}
                  <div className="muted" style={{ fontSize: 12 }}>{r.index}</div>
                </td>
                <td className="n">{r.checks}/8</td>
                <td className="n">{r.price == null ? "—" : `$${r.price.toFixed(2)}`}</td>
                <td className={`n ${r.margin_of_safety == null ? "" : r.margin_of_safety >= 0 ? "pos" : "neg"}`}>
                  {pctText(r.margin_of_safety)}
                </td>
                <td className="n">{pctText(r.roe_min_5y)}</td>
                <td className="n">{pctText(r.eps_cagr_5y)}</td>
                <td className="n">{numText(r.peg)}</td>
                <td style={{ minWidth: 180 }}>
                  {r.flags.slice(0, 2).map((f) => (
                    <span className="flag" key={f}>{f}</span>
                  ))}
                  {r.flags.length > 2 && <span className="flag">+{r.flags.length - 2}</span>}
                </td>
                <td>
                  {memoLinks[r.ticker] ? (
                    <a href={memoLinks[r.ticker]}>Full memo</a>
                  ) : (
                    <span className="muted">Screen only</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {visible.length > limit && (
        <p style={{ marginTop: 12 }}>
          <button type="button" className="btn ghost" onClick={() => setLimit(limit + 100)}>
            Show 100 more
          </button>
        </p>
      )}
    </>
  );
}
