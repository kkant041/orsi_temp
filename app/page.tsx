import Starfield from "./components/Starfield";

// One heartbeat cycle (ms). Starfield drives the clock; the wordmark and ECG follow via CSS vars.
const BEAT_MS = 2000;

export default function Home() {
  return (
    <main className="stage">
      <Starfield beatMs={BEAT_MS} />
      <div className="nebula" aria-hidden />
      <div className="horizon" aria-hidden />
      <div className="grain" aria-hidden />

      <section className="center">
        <div className="title-wrap">
          <h1 className="title" aria-label="ORSI">
            {"ORSI".split("").map((ch, i) => (
              <span key={i} className="letter" style={{ ["--i" as string]: i }}>
                {ch}
              </span>
            ))}
          </h1>

          {/* ECG trace running through the wordmark */}
          <svg
            className="ecg"
            viewBox="0 0 1000 200"
            preserveAspectRatio="none"
            aria-hidden
          >
            <defs>
              <linearGradient id="ecgFade" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stopColor="#7cf7ff" stopOpacity="0" />
                <stop offset="0.15" stopColor="#7cf7ff" stopOpacity="1" />
                <stop offset="0.85" stopColor="#b88cff" stopOpacity="1" />
                <stop offset="1" stopColor="#b88cff" stopOpacity="0" />
              </linearGradient>
              <filter id="ecgGlow" x="-20%" y="-50%" width="140%" height="200%">
                <feGaussianBlur stdDeviation="4" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path className="ecg-base" d={ECG_PATH} pathLength={1000} />
            <path
              className="ecg-pulse"
              d={ECG_PATH}
              pathLength={1000}
              filter="url(#ecgGlow)"
            />
          </svg>
        </div>

        <p className="tagline">
          <span className="dot" aria-hidden />
          Coming&nbsp;Soon
        </p>
      </section>
    </main>
  );
}

const ECG_PATH =
  "M0 100 L380 100 L400 90 L418 100 L440 100 L456 116 L480 18 L506 176 L526 100 L560 100 L590 84 L622 100 L1000 100";
