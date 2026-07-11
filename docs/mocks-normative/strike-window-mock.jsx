import { useState, useMemo } from "react";

/* ── StrikeArc dusk tokens ─────────────────────────────── */
const T = {
  bg: "#0D0A1C",
  canvas: "radial-gradient(120% 90% at 50% 20%, #1A1433 0%, #0D0A1C 70%)",
  glass: "rgba(24,19,44,0.88)",
  glassBorder: "rgba(139,124,246,0.28)",
  ink: "#EDEAF7",
  inkDim: "#9A93B8",
  orange: "#F97316",
  orangeGlow: "#FF8C42",
  gold: "#D9B36A",
  green: "#34D399",
  pink: "#F472B6",   // attack
  blue: "#7EB3F0",   // path
  violet: "#A78BFA", // loft / plane
  amber: "#F59E0B",  // launch
  red: "#F87171",
};
const mono = "'SF Mono', ui-monospace, 'JetBrains Mono', Menlo, monospace";
const serif = "'Iowan Old Style', Georgia, 'Times New Roman', serif";
const sans = "-apple-system, 'SF Pro Text', 'Segoe UI', sans-serif";

/* ── Model ──────────────────────────────────────────────── */
function useModel(lowPt, lowH, plane, dir) {
  return useMemo(() => {
    const attack = -(lowPt * 0.42);
    const strikeMm = Math.round(-lowPt * 0.4 - lowH * 3);
    const contact =
      lowH < -1 ? "Turf first" : lowH > 1.5 ? "Thin strike" :
      lowPt >= 1.5 ? "Ball first" : lowPt >= -1 ? "Pinched" : "Turf first";
    const verdict =
      lowH < -1 || lowPt < 0 ? "Fat" : lowH > 1.5 || lowPt > 11 ? "Thin" : "Pure";
    const vColor =
      verdict === "Pure" ? T.green : verdict === "Fat" ? T.red : T.amber;
    return { attack, strikeMm, contact, verdict, vColor, path: dir + 1.9 };
  }, [lowPt, lowH, plane, dir]);
}

/* ── Canvas (SVG, pinned) ───────────────────────────────── */
function ArcCanvas({ lowPt, lowH, plane, m }) {
  const W = 360, H = 300, groundY = 214, ballX = 150;
  const scale = 6.5;
  const lowX = ballX + lowPt * scale;
  const lowY = groundY - 4 - lowH * 7;
  const k = 0.0026 + (plane - 55) * 0.00012;
  const pts = [];
  for (let x = 6; x <= W - 6; x += 4) pts.push(`${x},${(lowY - k * (x - lowX) ** 2).toFixed(1)}`);
  const slope = -2 * k * (ballX - lowX);
  const yB = lowY - k * (ballX - lowX) ** 2;
  const tX = 68;
  const tan = `M ${ballX - tX} ${yB - slope * tX} L ${ballX + tX} ${yB + slope * tX}`;
  const angle = (Math.atan(slope) * 180) / Math.PI;
  const midX = (ballX + lowX) / 2;
  const lowLabelX = Math.min(Math.max(midX, 74), W - 74);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <filter id="glow"><feGaussianBlur stdDeviation="3.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <linearGradient id="arcG" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={T.orange} stopOpacity="0.25" />
          <stop offset="0.5" stopColor={T.orangeGlow} />
          <stop offset="1" stopColor={T.orange} stopOpacity="0.25" />
        </linearGradient>
      </defs>

      {[...Array(24)].map((_, i) => (
        <circle key={i} cx={(i * 89) % W} cy={(i * 53) % (groundY - 70)} r={i % 5 ? 0.8 : 1.4} fill="#FFFFFF" opacity={0.12 + (i % 3) * 0.08} />
      ))}

      <line x1="0" y1={groundY} x2={W} y2={groundY} stroke="#3A3354" strokeWidth="1.5" />
      <text x={W - 14} y={groundY + 16} textAnchor="end" fontFamily={mono} fontSize="9" fill={T.inkDim} letterSpacing="2">GROUND</text>

      {/* attack tangent */}
      <path d={tan} stroke={T.pink} strokeWidth="2" strokeDasharray="5 5" opacity="0.85" />
      <text x={ballX + tX + 4} y={yB + slope * tX - 6} fontFamily={mono} fontSize="11" fill={T.pink}>
        {m.attack >= 0 ? "+" : "−"}{Math.abs(m.attack).toFixed(1)}°
      </text>

      {/* swing arc */}
      <polyline points={pts.join(" ")} fill="none" stroke="url(#arcG)" strokeWidth="6.5" strokeLinecap="round" filter="url(#glow)" />

      {/* clubhead riding the arc, behind the ball */}
      <g transform={`translate(${ballX - 30}, ${lowY - k * (ballX - 30 - lowX) ** 2}) rotate(${angle})`}>
        <line x1="4" y1="-4" x2="18" y2="-30" stroke="#C9C4DE" strokeWidth="3.5" strokeLinecap="round" />
        <rect x="-16" y="-7" width="24" height="12" rx="4" fill={T.orange} filter="url(#glow)" />
        <rect x="-16" y="-7" width="5" height="12" rx="2.5" fill="#FFD9B8" />
      </g>

      {/* low point measure (ball → low point) */}
      <line x1={ballX} y1={groundY - 46} x2={lowX} y2={groundY - 46} stroke={T.gold} strokeWidth="1" />
      <line x1={ballX} y1={groundY - 52} x2={ballX} y2={groundY - 40} stroke={T.gold} strokeWidth="1" />
      <line x1={lowX} y1={groundY - 52} x2={lowX} y2={groundY - 40} stroke={T.gold} strokeWidth="1" />
      <text x={lowLabelX} y={groundY - 58} textAnchor="middle" fontFamily={mono} fontSize="11" fill={T.gold}>
        low pt {lowPt >= 0 ? "+" : ""}{lowPt} cm
      </text>

      {/* low point + ball — oversized for lesbarhet */}
      <line x1={lowX} y1={lowY + 4} x2={lowX} y2={groundY} stroke={T.green} strokeWidth="1" strokeDasharray="2 3" opacity="0.6" />
      <circle cx={lowX} cy={lowY} r="8" fill={T.green} filter="url(#glow)" />
      <circle cx={ballX} cy={groundY - 12} r="13" fill="#F5F3EE" />
      <circle cx={ballX - 4} cy={groundY - 16} r="3.5" fill="#FFFFFF" />
    </svg>
  );
}

/* ── Chip + expanded card ───────────────────────────────── */
const chipStyle = (active) => ({
  display: "flex", alignItems: "center", gap: 7, padding: "9px 13px",
  borderRadius: 999, whiteSpace: "nowrap", fontFamily: mono, fontSize: 13,
  color: T.ink, background: active ? "rgba(139,124,246,0.18)" : T.glass,
  border: `1px solid ${active ? T.violet : T.glassBorder}`,
  backdropFilter: "blur(12px)", cursor: "pointer", userSelect: "none",
});
const Dot = ({ c }) => <span style={{ width: 7, height: 7, borderRadius: 99, background: c, boxShadow: `0 0 8px ${c}` }} />;

function DetailCard({ chip, onClose }) {
  if (!chip) return null;
  return (
    <div onClick={onClose} style={{
      position: "absolute", inset: 0, zIndex: 40, display: "flex",
      alignItems: "center", justifyContent: "center",
      background: "rgba(10,8,22,0.45)", backdropFilter: "blur(6px)",
      animation: "fadeIn .18s ease",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "78%", maxWidth: 300, borderRadius: 20, padding: "20px 20px 16px",
        background: T.glass, border: `1px solid ${T.glassBorder}`,
        boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
        animation: "pop .22s cubic-bezier(.2,1.4,.4,1)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Dot c={chip.color} />
          <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: 2, color: T.inkDim }}>{chip.label.toUpperCase()}</span>
        </div>
        <div style={{ fontFamily: mono, fontSize: 40, fontWeight: 600, color: T.ink, marginBottom: 6 }}>
          {chip.value}<span style={{ fontSize: 15, color: T.inkDim, marginLeft: 6 }}>{chip.unit}</span>
        </div>
        <div style={{ fontFamily: sans, fontSize: 13.5, lineHeight: 1.5, color: T.inkDim }}>{chip.copy}</div>
        <div style={{ marginTop: 14, fontFamily: mono, fontSize: 11, color: T.violet, letterSpacing: 1 }}>Tap utenfor for å lukke</div>
      </div>
    </div>
  );
}

/* ── Slider ─────────────────────────────────────────────── */
function Slider({ value, min, max, onChange, color }) {
  const pct = ((value - min) / (max - min)) * 100;
  const set = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    onChange(Math.round(min + Math.min(Math.max(x / r.width, 0), 1) * (max - min)));
  };
  return (
    <div onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); set(e); }}
      onPointerMove={(e) => e.buttons && set(e)}
      style={{ position: "relative", height: 44, display: "flex", alignItems: "center", touchAction: "none", cursor: "pointer" }}>
      <div style={{ position: "absolute", left: 0, right: 0, height: 4, borderRadius: 4, background: "#2A2344" }} />
      <div style={{ position: "absolute", left: 0, width: `${pct}%`, height: 4, borderRadius: 4, background: color, boxShadow: `0 0 12px ${color}66` }} />
      <div style={{
        position: "absolute", left: `calc(${pct}% - 14px)`, width: 28, height: 28, borderRadius: 99,
        background: "#0D0A1C", border: `3px solid ${color}`, boxShadow: `0 0 16px ${color}55`,
        transition: "box-shadow .15s",
      }} />
    </div>
  );
}

/* ── App ────────────────────────────────────────────────── */
export default function StrikeWindowMock() {
  const [lowPt, setLowPt] = useState(8);
  const [lowH, setLowH] = useState(0);
  const [plane, setPlane] = useState(60);
  const [dir, setDir] = useState(0);
  const [openChip, setOpenChip] = useState(null);
  const [param, setParam] = useState("low");
  const m = useModel(lowPt, lowH, plane, dir);

  const chips = [
    { id: "attack", label: "Attack", color: T.pink, value: `${m.attack >= 0 ? "+" : "−"}${Math.abs(m.attack).toFixed(1)}°`, unit: "", copy: "Skaftets vinkel mot bakken i treff. Negativ = nedadgående slag — lavpunktet ligger foran ballen." },
    { id: "path", label: "Path", color: T.blue, value: `+${m.path.toFixed(1)}°`, unit: "", copy: "Køllens retning gjennom treffet, sett ovenfra. Positiv = inn-til-ut." },
    { id: "strike", label: "Strike", color: T.violet, value: `${m.strikeMm >= 0 ? "+" : "−"}${Math.abs(m.strikeMm)}`, unit: "mm", copy: "Treffpunkt på køllebladet relativt til senter. Lavt treff gir mer spinn, mindre fart." },
    { id: "contact", label: m.contact, color: m.vColor, value: m.verdict, unit: "", copy: m.verdict === "Pure" ? "Ball først, så gress. Lavpunktet ligger riktig — foran ballen." : m.verdict === "Fat" ? "Gress før ball. Lavpunktet ligger bak ballen — energi dør i bakken." : "Lavpunktet er for langt fremme — bladet treffer ballen på vei opp." },
  ];
  const params = {
    low: { label: "LOW PT", color: T.green, value: lowPt, min: -6, max: 14, set: setLowPt, fmt: (v) => `${v >= 0 ? "+" : ""}${v} cm` },
    height: { label: "LOW HEIGHT", color: T.gold, value: lowH, min: -3, max: 3, set: setLowH, fmt: (v) => `${v >= 0 ? "+" : ""}${v} cm` },
    plane: { label: "PLANE", color: T.violet, value: plane, min: 52, max: 70, set: setPlane, fmt: (v) => `${v}°` },
    dir: { label: "DIRECTION", color: T.blue, value: dir, min: -4, max: 4, set: setDir, fmt: (v) => `${v >= 0 ? "+" : ""}${v.toFixed(0)}°` },
  };
  const p = params[param];

  return (
    <div style={{ height: "100vh", maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column", background: T.bg, fontFamily: sans, overflow: "hidden", position: "relative" }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes pop { from { transform: scale(.88); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        ::-webkit-scrollbar { display: none }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: serif, fontSize: 19, color: T.ink }}>Strike<span style={{ color: T.orange }}>Arc</span></span>
          <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: 2.5, color: T.inkDim }}>STRIKE WINDOW · SIDE-ON</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 999, background: `${m.vColor}1A`, border: `1px solid ${m.vColor}55` }}>
          <Dot c={m.vColor} />
          <span style={{ fontFamily: serif, fontSize: 14, color: m.vColor }}>{m.verdict}</span>
        </div>
      </div>

      {/* Pinned canvas — modellen eier skjermen */}
      <div style={{ flex: 1, position: "relative", margin: "10px 12px 0", borderRadius: 22, background: T.canvas, border: `1px solid #241D40`, overflow: "hidden" }}>
        <ArcCanvas lowPt={lowPt} lowH={lowH} plane={plane} m={m} />
        {/* Outcome-chips — avlesninger, ikke kontroller */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 12 }}>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 2.5, color: T.gold, padding: "0 14px 6px" }}>OUTCOME · LES AV</div>
          <div style={{ display: "flex", gap: 8, padding: "0 12px", overflowX: "auto" }}>
            {chips.map((c) => (
              <div key={c.id} onClick={() => setOpenChip(c)} style={{ ...chipStyle(false), borderStyle: "dashed" }}>
                <Dot c={c.color} /><span style={{ color: T.inkDim, fontSize: 11 }}>{c.label}</span>
                <span>{c.value}{c.unit && <span style={{ color: T.inkDim, fontSize: 11 }}> {c.unit}</span>}</span>
              </div>
            ))}
          </div>
        </div>
        <DetailCard chip={openChip} onClose={() => setOpenChip(null)} />
      </div>

      {/* Control sheet — én aktiv slider */}
      <div style={{ padding: "12px 18px 20px", background: "linear-gradient(180deg, transparent, #120E24 30%)" }}>
        <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 2.5, color: T.violet, padding: "0 2px 6px" }}>INPUT · STYR</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 10, overflowX: "auto", paddingBottom: 2 }}>
          {Object.entries(params).map(([k, v]) => (
            <div key={k} onClick={() => setParam(k)} style={chipStyle(param === k)}>
              <Dot c={v.color} /><span style={{ color: T.inkDim, fontSize: 10, letterSpacing: 1 }}>{v.label}</span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{v.fmt(v.value)}</span>
            </div>
          ))}
          <div style={{ ...chipStyle(false), marginLeft: "auto", borderColor: T.orange + "66", color: T.orange }}>◈ 3D</div>
        </div>
        <Slider value={p.value} min={p.min} max={p.max} onChange={p.set} color={p.color} />
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: mono, fontSize: 10, color: T.inkDim, marginTop: 2 }}>
          <span>{p.fmt(p.min)}</span><span>Dra for å se modellen svare</span><span>{p.fmt(p.max)}</span>
        </div>
      </div>
    </div>
  );
}
