/* Margin-of-safety bars drawn with CSS 3D transforms. Static: no script, no library. */

export type Bar3D = { ticker: string; value: number | null };

function tone(v: number | null) {
  if (v == null) return "tone-none";
  if (v < 0) return "tone-neg";
  if (v < 0.2) return "tone-low";
  if (v < 0.4) return "tone-mid";
  return "tone-high";
}

export function Bars3D({ bars, title }: { bars: Bar3D[]; title: string }) {
  const max = 1; // bars scale to 100% margin
  return (
    <div className="scene3d" role="img" aria-label={title}>
      <div className="scene3d-title">{title}</div>
      <div className="bars3d">
        {bars.map((b) => {
          const v = b.value == null ? 0 : Math.max(-max, Math.min(max, b.value));
          const h = Math.max(4, Math.abs(v) / max * 100);
          return (
            <div className="bar3d-col" key={b.ticker}>
              <div className="bar3d-val">{b.value == null ? "—" : `${(b.value * 100).toFixed(0)}%`}</div>
              <div className="bar3d-track">
                <div className={`bar3d ${tone(b.value)}`} style={{ height: `${h}%` }}>
                  <span className="bar3d-face front" />
                  <span className="bar3d-face top" />
                  <span className="bar3d-face side" />
                </div>
              </div>
              <div className="bar3d-label">{b.ticker}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
