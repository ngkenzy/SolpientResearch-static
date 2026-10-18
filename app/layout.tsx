import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SOLPIENT Research",
  description: "See clearly. Invest deliberately.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <a className="brand" href="/">SOLPIENT Research</a>
          <nav>
            <a href="https://github.com/ngkenzy/solpient-money" target="_blank" rel="noopener noreferrer">
              Solpient Finance
            </a>
            <a href="https://github.com/ngkenzy/solpient-research" target="_blank" rel="noopener noreferrer">
              Source
            </a>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <p>
            Research snapshots for education and reference only. Not investment advice, and
            not a recommendation to buy or sell any security.
          </p>
        </footer>
      </body>
    </html>
  );
}
