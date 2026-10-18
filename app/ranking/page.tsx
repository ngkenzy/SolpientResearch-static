import { loadMemos } from "@/lib/memos";
import { loadScreen } from "@/lib/screen";
import { RankingTable } from "@/components/RankingTable";

export default function RankingPage() {
  const screen = loadScreen();
  const memos = loadMemos();
  const memoLinks = Object.fromEntries(memos.map((m) => [m.ticker, `/memos/${m.slug}/`]));

  return (
    <>
      <p className="kicker">Ranking</p>
      <h1>All screened stocks</h1>
      <p className="lede">
        {screen.count} stocks pass the Buffett-style or Lynch-style screen. They come from the S&amp;P 500, S&amp;P 400, and S&amp;P 600, with financials excluded. Each
        stock is scored on 8 checks: ROE, positive EPS, owner earnings, debt payback, margin of safety, EPS growth,
        PEG, and debt-to-equity. Ranking is by checks passed, then positive margin of safety, then margin size.
      </p>
      <div className="callout warn">
        <p style={{ margin: 0 }}>
          This is a mechanical screen of published financial data, not research. Flags mark where a number needs a
          check before you rely on it. Full memos exist only for the names linked in the Research column.
        </p>
      </div>
      <RankingTable rows={screen.rows} memoLinks={memoLinks} />
      <p className="note">Data: {screen.data_source}. Method: {screen.method}</p>
    </>
  );
}
