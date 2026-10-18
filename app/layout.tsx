import type { Metadata } from "next";
import "./globals.css";
import { AskPanel } from "@/components/AskPanel";
import { buildKnowledge } from "@/lib/ask-knowledge";

export const metadata: Metadata = {
  title: "SOLPIENT Research",
  description: "Point-in-time fundamental research and stock screening.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const knowledge = buildKnowledge();
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <a className="brand" href="/">
            <strong>SOLPIENT Research</strong>
            <small>See clearly. Invest deliberately.</small>
          </a>
          <nav aria-label="Primary">
            <a href="/">Ranking</a>
            <a href="#ask">Ask</a>
            <a href="https://money.phnguyen.com" target="_blank" rel="noopener noreferrer">Solpient Finance</a>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <p style={{ margin: "0 0 6px" }}>
            Research and screening output for education and reference only. Not investment advice and not a
            recommendation to buy or sell any security. Screen results are mechanical and unreviewed.
          </p>
        </footer>
        <AskPanel knowledge={knowledge} />
      </body>
    </html>
  );
}
