import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SOLPIENT Research",
  description: "Point-in-time fundamental research and stock screening.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <a className="brand" href="/">
            <strong>SOLPIENT Research</strong>
            <small>See clearly. Invest deliberately.</small>
          </a>
          <nav aria-label="Primary">
            <a href="/ranking/">Ranking</a>
            <a href="/memos/intu/">Memos</a>
            <a href="/ask/">Ask (local AI)</a>
            <a href="https://github.com/ngkenzy/solpient-money" target="_blank" rel="noopener noreferrer">Solpient Finance</a>
            <a href="https://github.com/ngkenzy/solpient-research" target="_blank" rel="noopener noreferrer">Source</a>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <p style={{ margin: "0 0 6px" }}>
            Research and screening output for education and reference only. Not investment advice and not a
            recommendation to buy or sell any security. Screen results are mechanical and unreviewed.
          </p>
        </footer>
      </body>
    </html>
  );
}
