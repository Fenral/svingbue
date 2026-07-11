import { useMemo } from "react";

/* ── StrikeArc dusk tokens ── */
const T = {
  ink: "#EDEAF7", inkDim: "#9A93B8",
  orange: "#F97316", orangeGlow: "#FF8C42",
  gold: "#D9B36A", violet: "#8B7CF6", blue: "#7EB3F0",
};
const mono = "'SF Mono', ui-monospace, Menlo, monospace";
const serif = "'Iowan Old Style', Georgia, serif";
const sans = "-apple-system, 'SF Pro Text', sans-serif";

/* Flight-parabel: ball nederst → apex øverst. t: 0..1 */
const W = 390, H = 760;
const ballP = { x: 195, y: 640 };          // ballen på rangen
const apexP = { x: 150, y: 120 };          // apex høyt til venstre
const ctrl  = { x: 330, y: 340 };          // kontrollpunkt gir buen sving
const flight = (t) => ({
  x: (1 - t) ** 2 * ballP.x + 2 * (1 - t) * t * ctrl.x + t * t * apexP.x,
  y: (1 - t) ** 2 * ballP.y + 2 * (1 - t) * t * ctrl.y + t * t * apexP.y,
});

/* Nodene ligger PÅ flighten — navigasjon = produktfortelling */
const NODES = [
  { t: 0.14, name: "Ball Flight", sub: "See the shot →", start: true },
  { t: 0.34, name: "Strike Window", sub: "Model your strike" },
  { t: 0.55, name: "Why?", sub: "Read the miss" },
  { t: 0.78, name: "Outcome", sub: "Read the launch" },
  { t: 1.0,  name: "Academy", sub: "Learn the physics", ring: true },
];

export default function HomeHeroMock() {
  const stars = useMemo(() =>
    [...Array(46)].map((_, i) => ({
      x: (i * 83.7) % W, y: (i * 47.3) % (H * 0.72),
      r: i % 7 === 0 ? 1.6 : 0.9, d: (i % 5) * 0.9, o: 0.25 + (i % 4) * 0.12,
    })), []);
  const pathD = useMemo(() => {
    let d = `M ${ballP.x} ${ballP.y}`;
    for (let t = 0.02; t <= 1.001; t += 0.02) { const p = flight(t); d += ` L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`; }
    return d;
  }, []);

  return (
    <div style={{ height: "100vh", maxWidth: 430, margin: "0 auto", position: "relative", overflow: "hidden", fontFamily: sans, background: "linear-gradient(180deg, #0A0818 0%, #120E28 46%, #1D1638 72%, #241B44 84%, #101322 100%)" }}>
      <style>{`
        @keyframes twinkle { 0%,100% { opacity: var(--o) } 50% { opacity: calc(var(--o) * 0.3) } }
        @keyframes pulse { 0%,100% { transform: scale(1); opacity: .9 } 50% { transform: scale(1.35); opacity: .45 } }
        @keyframes breathe { 0%,100% { opacity: .5 } 50% { opacity: 1 } }
      `}</style>

      {/* Header */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px", zIndex: 5 }}>
        <span style={{ fontFamily: serif, fontSize: 22, color: T.ink }}>Strike<span style={{ color: T.orange }}>Arc</span></span>
        <span style={{ width: 26, height: 26, borderRadius: 99, border: `1.5px solid ${T.inkDim}`, color: T.inkDim, display: "grid", placeItems: "center", fontSize: 14 }}>?</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <defs>
          <filter id="g"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <radialGradient id="ground" cx="50%" cy="100%" r="80%">
            <stop offset="0%" stopColor="#2E3D2A" stopOpacity="0.9" />
            <stop offset="45%" stopColor="#1C2430" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#0A0818" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Stjerner — glitrer */}
        {stars.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#FFF"
            style={{ "--o": s.o, animation: `twinkle ${3 + s.d}s ease-in-out ${s.d}s infinite` }} />
        ))}

        {/* Range: horisontglød + lysmaster (silhuett) */}
        <rect x="0" y={H - 200} width={W} height="200" fill="url(#ground)" />
        {[60, 330].map((mx) => (
          <g key={mx} opacity="0.55">
            <line x1={mx} y1={H - 60} x2={mx} y2={H - 128} stroke="#3A3354" strokeWidth="3" />
            <circle cx={mx} cy={H - 132} r="4" fill="#CFD8E3" opacity="0.8" filter="url(#g)" />
          </g>
        ))}

        {/* Flighten — den døde sonen ER banen */}
        <path d={pathD} fill="none" stroke={T.orangeGlow} strokeWidth="1.5" strokeDasharray="1 7" strokeLinecap="round" opacity="0.7" />

        {/* Ballen på rangen — varmt punkt #1 */}
        <circle cx={ballP.x} cy={ballP.y} r="16" fill={T.orange} opacity="0.35" style={{ animation: "pulse 2.6s ease-in-out infinite", transformOrigin: `${ballP.x}px ${ballP.y}px` }} />
        <circle cx={ballP.x} cy={ballP.y} r="7" fill={T.orange} filter="url(#g)" />

        {/* Noder langs flighten */}
        {NODES.map((n) => {
          const p = flight(n.t);
          const left = p.x < W / 2;
          const tx = left ? p.x + 18 : p.x - 18;
          const anchor = left ? "start" : "end";
          return (
            <g key={n.name}>
              {n.ring && <circle cx={p.x} cy={p.y} r="15" fill="none" stroke={T.violet} strokeWidth="1" strokeDasharray="2 4" opacity="0.7" />}
              <circle cx={p.x} cy={p.y} r={n.start ? 8 : 5.5}
                fill={n.start ? T.orange : "#CFC9EE"} filter="url(#g)"
                style={n.start ? { animation: "breathe 2.6s ease-in-out infinite" } : {}} />
              {n.start && (
                <text x={tx} y={p.y - 22} textAnchor={anchor} fontFamily={mono} fontSize="11" letterSpacing="2.5" fill={T.orange}>START HERE</text>
              )}
              <text x={tx} y={p.y - 4} textAnchor={anchor} fontFamily={serif} fontSize="19" fill={T.ink}>{n.name}</text>
              <text x={tx} y={p.y + 15} textAnchor={anchor} fontFamily={mono} fontSize="12" fill={T.inkDim}>{n.sub}</text>
            </g>
          );
        })}
      </svg>

      {/* Kveldens drill */}
      <div style={{ position: "absolute", left: 16, right: 16, bottom: 20, borderRadius: 18, padding: "14px 18px", background: "rgba(24,19,44,0.82)", border: "1px solid rgba(139,124,246,0.28)", backdropFilter: "blur(14px)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontFamily: serif, fontSize: 13, color: T.inkDim }}>Tonight at the range</div>
          <div style={{ fontFamily: mono, fontSize: 15, color: T.ink }}>The House Draw</div>
        </div>
        <div style={{ fontFamily: mono, fontSize: 14, color: T.gold }}>try it →</div>
      </div>
    </div>
  );
}
