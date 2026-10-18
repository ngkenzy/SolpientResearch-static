import { notFound } from "next/navigation";
import {
  billions,
  findCompany,
  loadCompanies,
  money,
  num,
  pct,
  upside,
} from "@/lib/research";

export const dynamicParams = false;

export function generateStaticParams() {
  return loadCompanies().map((c) => ({ ticker: c.ticker.toLowerCase() }));
}

type PageProps = { params: Promise<{ ticker: string }> };

const METRIC_LABELS: [string, string, "pct" | "num" | "money" | "billions"][] = [
  ["revenue_growth_1y", "Revenue growth (1y)", "pct"],
  ["revenue_cagr_5y", "Revenue CAGR (5y)", "pct"],
  ["gross_margin", "Gross margin", "pct"],
  ["operating_margin", "Operating margin", "pct"],
  ["net_margin", "Net margin", "pct"],
  ["free_cash_flow", "Free cash flow", "billions"],
  ["fcf_yield", "FCF yield", "pct"],
  ["eps", "EPS (diluted)", "money"],
  ["eps_cagr_5y", "EPS CAGR (5y)", "pct"],
  ["pe", "P/E", "num"],
  ["forward_pe", "Forward P/E", "num"],
  ["debt_to_equity", "Debt to equity", "num"],
  ["current_ratio", "Current ratio", "num"],
];

function formatMetric(value: unknown, kind: "pct" | "num" | "money" | "billions"): string {
  if (typeof value !== "number") return "—";
  if (kind === "pct") return pct(value);
  if (kind === "money") return money(value);
  if (kind === "billions") return billions(value);
  return num(value);
}

/** Business-assessment fields are free text in the source JSON. Show only strings and string lists. */
function textValue(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value;
  if (Array.isArray(value) && value.every((v) => typeof v === "string") && value.length) {
    return value.join("; ");
  }
  return null;
}

const BIZ_LABELS: [string, string][] = [
  ["business_quality_rating", "Business quality"],
  ["moat_rating", "Moat"],
  ["pricing_power", "Pricing power"],
  ["revenue_model", "Revenue model"],
  ["recurring_revenue_pct", "Recurring revenue"],
  ["growth_runway", "Growth runway"],
  ["cyclicality", "Cyclicality"],
  ["capital_intensity", "Capital intensity"],
  ["ai_opportunity", "AI opportunity"],
  ["ai_threat", "AI threat"],
  ["management_quality", "Management"],
  ["capital_allocation_assessment", "Capital allocation"],
  ["bull_thesis", "Bull case"],
  ["bear_thesis", "Bear case"],
  ["biggest_unknown", "Biggest unknown"],
];

function Paragraphs({ text }: { text: string }) {
  // Blocks separated by blank lines. ALL-CAPS lines become sub-headings.
  const blocks = text
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  return (
    <div className="report">
      {blocks.map((block, i) => {
        const isHeading = /^[A-Z0-9 &/\-—:()']{4,}$/.test(block) && !block.includes("\n");
        return isHeading ? (
          <h4 key={i}>{block}</h4>
        ) : (
          <p key={i}>{block}</p>
        );
      })}
    </div>
  );
}

export default async function CompanyPage({ params }: PageProps) {
  const { ticker } = await params;
  const company = findCompany(ticker);
  if (!company) notFound();

  const v = company.valuations ?? {};
  const s = company.scores ?? {};
  const m = company.financial_metrics ?? {};
  const biz = company.business_assessment ?? {};
  const up = upside(company);
  const price = company.ranking?.price ?? company.research.price_at_research ?? null;

  return (
    <>
      <p className="muted" style={{ margin: 0 }}>
        <a href="/">← All research</a>
      </p>
      <h1>
        {company.company_name} <span className="muted">({company.ticker})</span>
      </h1>
      <p className="lede">
        {[company.exchange, company.sector, company.industry].filter(Boolean).join(" · ")}
      </p>
      {company.description && <p>{company.description}</p>}

      <div className="panel" style={{ marginTop: 16 }}>
        <dl className="kv" style={{ margin: 0 }}>
          <div>
            <dt>Price at research</dt>
            <dd>{money(price)}</dd>
          </div>
          <div>
            <dt>Base value</dt>
            <dd>{money(v.base_value ?? company.ranking?.base_fair_value)}</dd>
          </div>
          <div>
            <dt>Upside to base</dt>
            <dd className={up == null ? "" : up >= 0 ? "pos" : "neg"}>{pct(up)}</dd>
          </div>
          <div>
            <dt>Market cap</dt>
            <dd>{billions(company.research.market_cap)}</dd>
          </div>
          <div>
            <dt>Rank</dt>
            <dd>{company.ranking?.rank ?? "—"}</dd>
          </div>
          <div>
            <dt>Snapshot date</dt>
            <dd>{company.snapshot_date}</dd>
          </div>
          <div>
            <dt>Source period</dt>
            <dd>{company.research.source_period ?? "—"}</dd>
          </div>
          <div>
            <dt>Saved versions</dt>
            <dd>{company.version_count}</dd>
          </div>
        </dl>
      </div>

      {company.research.summary && (
        <>
          <h2>Summary</h2>
          <p>{company.research.summary}</p>
        </>
      )}

      <h2>Scores</h2>
      <div className="grid">
        {[
          ["Overall", s.overall_score],
          ["Quality", s.quality_score],
          ["Growth", s.growth_score],
          ["Valuation", s.valuation_score],
          ["Financial strength", s.financial_strength_score],
          ["Moat", s.moat_score],
          ["Thesis integrity", s.thesis_integrity_score],
        ].map(([label, value]) => (
          <div className="panel" key={String(label)}>
            <div className="muted" style={{ fontSize: 13 }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{value ?? "—"}</div>
          </div>
        ))}
      </div>

      <h2>Valuation</h2>
      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>Method</th>
              <th className="num">Value per share</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["DCF", v.dcf_value],
              ["Owner earnings", v.owner_earnings_value],
              ["Earnings multiple", v.earnings_multiple_value],
              ["Historical multiple", v.historical_multiple_value],
              ["Peer", v.peer_value],
              ["Bear case", v.bear_value],
              ["Base case", v.base_value],
              ["Bull case", v.bull_value],
              ["Price for 25% margin of safety", v.mos_25_price],
              ["Price for 35% margin of safety", v.mos_35_price],
              ["Price for 50% margin of safety", v.mos_50_price],
            ].map(([label, value]) => (
              <tr key={String(label)}>
                <td>{label}</td>
                <td className="num">{money(value as number | null | undefined)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>
          Discount rate {pct(v.discount_rate ?? null)} · terminal growth{" "}
          {pct(v.terminal_growth ?? null)}
        </p>
      </div>

      <h2>Financial metrics</h2>
      <div className="panel">
        <table>
          <tbody>
            {METRIC_LABELS.map(([key, label, kind]) => (
              <tr key={key}>
                <td>{label}</td>
                <td className="num">{formatMetric(m[key], kind)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(company.expected_return_scenarios?.length ?? 0) > 0 && (
        <>
          <h2>Expected return scenarios</h2>
          <div className="panel">
            <table>
              <thead>
                <tr>
                  <th>Scenario</th>
                  <th className="num">Horizon</th>
                  <th className="num">Expected CAGR</th>
                  <th className="num">Terminal value / share</th>
                </tr>
              </thead>
              <tbody>
                {company.expected_return_scenarios!.map((r) => (
                  <tr key={r.scenario}>
                    <td style={{ textTransform: "capitalize" }}>{r.scenario}</td>
                    <td className="num">{r.horizon_years ? `${r.horizon_years}y` : "—"}</td>
                    <td className="num">{pct(r.expected_cagr ?? null)}</td>
                    <td className="num">{money(r.estimated_terminal_value_per_share ?? null)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {(company.thesis_variables?.length ?? 0) > 0 && (
        <>
          <h2>Thesis variables</h2>
          <div className="grid">
            {company.thesis_variables!.map((t) => (
              <div className="panel" key={t.variable_name}>
                <h3 style={{ marginTop: 0 }}>{t.variable_name}</h3>
                {t.status && <span className="badge">{t.status}</span>}
                {t.expectation && <p style={{ margin: "8px 0" }}>{t.expectation}</p>}
                {t.observed_value && (
                  <p className="muted" style={{ margin: "8px 0", fontSize: 14 }}>
                    Observed: {t.observed_value}
                  </p>
                )}
                {t.breaker_condition && (
                  <p className="muted" style={{ margin: "8px 0", fontSize: 14 }}>
                    Breaker: {t.breaker_condition}
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {(company.risk_register?.length ?? 0) > 0 && (
        <>
          <h2>Risks</h2>
          <div className="grid">
            {company.risk_register!.map((r) => (
              <div className="panel" key={r.risk_key}>
                <h3 style={{ marginTop: 0 }}>{r.title}</h3>
                {r.severity && <span className="badge">Severity: {r.severity}</span>}
                {r.probability && <span className="badge">Probability: {r.probability}</span>}
                {r.description && <p style={{ margin: "8px 0 0" }}>{r.description}</p>}
              </div>
            ))}
          </div>
        </>
      )}

      {BIZ_LABELS.some(([key]) => textValue(biz[key])) && (
        <>
          <h2>Business assessment</h2>
          <div className="panel">
            <dl className="kv" style={{ margin: 0 }}>
              {BIZ_LABELS.map(([key, label]) => {
                const text = textValue(biz[key]);
                return text ? (
                  <div key={key} style={{ gridColumn: text.length > 60 ? "1 / -1" : undefined }}>
                    <dt>{label}</dt>
                    <dd style={{ fontWeight: 400 }}>{text}</dd>
                  </div>
                ) : null;
              })}
            </dl>
          </div>
        </>
      )}

      {company.research.full_report && (
        <>
          <h2>Full report</h2>
          <div className="panel">
            <Paragraphs text={company.research.full_report} />
          </div>
        </>
      )}

      {(company.sources?.length ?? 0) > 0 && (
        <>
          <h2>Sources</h2>
          <ul className="muted" style={{ paddingLeft: 18 }}>
            {company.sources!.map((src, i) => (
              <li key={`${src.title}-${i}`} style={{ marginBottom: 6 }}>
                {src.url ? (
                  <a href={src.url} target="_blank" rel="noopener noreferrer">
                    {src.title ?? src.url}
                  </a>
                ) : (
                  src.title
                )}
                {src.filing_date && ` · ${src.filing_date}`}
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
