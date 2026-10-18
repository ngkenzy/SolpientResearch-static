import { loadMemos, upsidePct } from "@/lib/memos";
import { loadScreen } from "@/lib/screen";
import { AskPanel } from "@/components/AskPanel";

export default function AskPage() {
  const memos = loadMemos();
  const screen = loadScreen();

  // Pack the local model may read: memo summaries plus the top of the screen ranking.
  const memoLines = memos.map((m) =>
    [
      `${m.name} (${m.ticker}) · ${m.classification} · price ${m.price} · base ${m.base_value} · bear ${m.bear_value} · bull ${m.bull_value} · base 5y CAGR ${m.cagr_5y_base}% · upside to base ${upsidePct(m).toFixed(0)}% · data as of ${m.data_date}`,
      m.summary,
    ].join("\n"),
  );
  const rankLines = screen.rows
    .slice(0, 25)
    .map(
      (r) =>
        `#${r.rank} ${r.ticker} ${r.name} · ${r.checks}/8 checks · margin of safety ${
          r.margin_of_safety == null ? "n/a" : (r.margin_of_safety * 100).toFixed(0) + "%"
        } · flags: ${r.flags.join("; ") || "none"}`,
    );
  const pack = [
    "FULL MEMOS (summaries; the full memos are on the site):",
    ...memoLines,
    "",
    `SCREEN RANKING, top 25 of ${screen.count} (${screen.method}):`,
    ...rankLines,
  ].join("\n");

  return (
    <>
      <p className="kicker">Local AI</p>
      <h1>Ask the research</h1>
      <p className="lede">
        A small AI model runs in your browser and answers from the memo summaries and screen ranking on this site. It
        cannot see anything else, and it does not send your questions anywhere.
      </p>
      <AskPanel pack={pack} />
      <h2>What the model can see</h2>
      <div className="panel">
        <pre className="ask-log" style={{ fontSize: 12, margin: 0 }}>{pack}</pre>
      </div>
    </>
  );
}
