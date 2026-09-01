import React, { useEffect, useRef, useState } from "react";

/* =============================================================
   ICONS — every glyph is hand-drawn inline SVG
   ============================================================= */
type P = React.SVGProps<SVGSVGElement>;
const base = (props: P) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...props,
});

export const IconLogo = (props: P) => (
  <svg viewBox="0 0 32 32" fill="none" {...props}>
    <rect width="32" height="32" rx="7" fill="currentColor" />
    <rect x="7" y="17" width="4.5" height="8" rx="1.4" fill="#fff" />
    <rect x="13.75" y="11" width="4.5" height="14" rx="1.4" fill="#fff" />
    <rect x="20.5" y="6" width="4.5" height="19" rx="1.4" fill="#FFD166" />
  </svg>
);

export const IconChartStudio = (props: P) => (
  <svg {...base(props)}>
    <path d="M3 3v16a2 2 0 0 0 2 2h16" />
    <rect x="7" y="12" width="3" height="6" rx="0.8" fill="currentColor" stroke="none" />
    <rect x="12" y="8" width="3" height="10" rx="0.8" fill="currentColor" stroke="none" />
    <path d="M7 9.5 12 6l4 2.5 5-4" />
    <circle cx="21" cy="4.5" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);

export const IconShrink = (props: P) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 3.5A8.5 8.5 0 0 1 20.5 12H12z" fill="currentColor" stroke="none" opacity="0.9" />
    <circle cx="12" cy="12" r="3" fill="#fff" stroke="none" />
  </svg>
);

export const IconCurve = (props: P) => (
  <svg {...base(props)}>
    <path d="M3 20c6 0 6-13 10-13 2.5 0 3 3 8 3" />
    <path d="M3 20h18" opacity="0.5" />
    <circle cx="13" cy="7" r="1.6" fill="currentColor" stroke="none" />
  </svg>
);

export const IconCsat = (props: P) => (
  <svg {...base(props)}>
    <path d="m12 3 2.7 5.6 6.1.8-4.5 4.3 1.1 6L12 16.8 6.6 19.7l1.1-6L3.2 9.4l6.1-.8z" />
  </svg>
);

export const IconClipboard = (props: P) => (
  <svg {...base(props)}>
    <rect x="5" y="4.5" width="14" height="16" rx="2.5" />
    <path d="M9 4.5a3 3 0 0 1 6 0" />
    <path d="M9 11h6M9 15h4" />
  </svg>
);

export const IconSwap = (props: P) => (
  <svg {...base(props)}>
    <path d="M4 8h13l-3-3M20 16H7l3 3" />
  </svg>
);

export const IconCoffee = (props: P) => (
  <svg {...base(props)}>
    <path d="M4 9h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" />
    <path d="M16 10h2a2.5 2.5 0 0 1 0 5h-2M7 6V4.5M11 6V4.5" />
  </svg>
);

export const IconShield = (props: P) => (
  <svg {...base(props)}>
    <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z" />
    <path d="m9 11.5 2.2 2.2L15.5 9.5" />
  </svg>
);

export const IconCopy = (props: P) => (
  <svg {...base(props)}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5" />
  </svg>
);

export const IconCheck = (props: P) => (
  <svg {...base(props)}>
    <path d="m4.5 12.5 5 5L19.5 7" />
  </svg>
);

export const IconDownload = (props: P) => (
  <svg {...base(props)}>
    <path d="M12 4v11m0 0 4-4m-4 4-4-4" />
    <path d="M4.5 19.5h15" />
  </svg>
);

export const IconBolt = (props: P) => (
  <svg {...base(props)}>
    <path d="M13 2.5 4.5 13.5H11l-1 8L19.5 10H13z" />
  </svg>
);

export const IconRefresh = (props: P) => (
  <svg {...base(props)}>
    <path d="M20 12a8 8 0 1 1-2.3-5.6" />
    <path d="M20 3v4.5h-4.5" />
  </svg>
);

export const IconUsers = (props: P) => (
  <svg {...base(props)}>
    <circle cx="9" cy="8.5" r="3.2" />
    <path d="M3.5 19.5c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" />
    <path d="M15.5 5.8a3.2 3.2 0 1 1 1.6 6M17.5 14.7c1.7.6 2.7 2.2 3 4.8" />
  </svg>
);

export const IconPlus = (props: P) => (
  <svg {...base(props)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconTrash = (props: P) => (
  <svg {...base(props)}>
    <path d="M4.5 6.5h15M9.5 6V4.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V6" />
    <path d="M6.5 6.5 7.4 19a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4l.9-12.5" />
    <path d="M10 10.5v6M14 10.5v6" />
  </svg>
);

/* =============================================================
   UI PRIMITIVES
   ============================================================= */

export function useCountUp(target: number, duration = 650): number {
  const [val, setVal] = useState(target);
  const prev = useRef(target);
  useEffect(() => {
    const from = prev.current;
    prev.current = target;
    if (from === target) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(from + (target - from) * e);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

export function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVis(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${vis ? "is-visible" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">{label}</span>
        {hint && <span className="font-mono text-[10px] text-brand-500">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="group flex items-center gap-2.5 text-left text-sm font-medium text-ink-700 transition-colors hover:text-brand-700"
      role="switch"
      aria-checked={on}
    >
      <span className={`relative inline-flex h-6 w-10 flex-none items-center rounded-full transition-colors duration-200 ${on ? "bg-brand-500" : "bg-slate-300"}`}>
        <span
          className={`inline-block transform rounded-full bg-white shadow transition-transform duration-200 ${on ? "translate-x-[19px]" : "translate-x-[3px]"}`}
          style={{ width: 18, height: 18 }}
        />
      </span>
      {label}
    </button>
  );
}

export function PrimaryButton({ children, onClick, className = "" }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 rounded-[10px] bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgba(46,107,255,0.65)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-[0_14px_28px_-10px_rgba(46,107,255,0.7)] focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30 active:translate-y-0 active:scale-[0.98] ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, className = "" }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-[10px] border-[1.5px] border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 transition-all duration-200 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 active:scale-[0.97] ${className}`}
    >
      {children}
    </button>
  );
}

export function ToolHeader({ index, kicker, title, desc, icon }: { index: string; kicker: string; title: string; desc: string; icon: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="max-w-2xl">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-md bg-brand-500/10 px-2 py-0.5 font-mono text-[11px] font-semibold tracking-[0.14em] text-brand-600">{index}</span>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-500">{kicker}</span>
        </div>
        <h2 className="font-display text-[1.65rem] font-bold leading-tight text-ink-900 md:text-3xl">{title}</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-500">{desc}</p>
      </div>
      <div className="hidden h-14 w-14 flex-none items-center justify-center rounded-2xl border border-brand-200 bg-brand-50 text-brand-600 shadow-[inset_0_-2px_0_rgba(46,107,255,0.15)] md:flex">
        {icon}
      </div>
    </div>
  );
}

export function ResultTile({
  label,
  value,
  suffix = "",
  tone = "text-white",
  sub,
  big = false,
}: {
  label: string;
  value: string;
  suffix?: string;
  tone?: string;
  sub?: string;
  big?: boolean;
}) {
  return (
    <div className="rounded-lg bg-white/[0.06] p-4 ring-1 ring-white/[0.08] transition-colors duration-200 hover:bg-white/[0.09]">
      <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">{label}</span>
      <span className={`font-display font-bold tabular-nums ${tone} ${big ? "text-4xl" : "text-2xl"}`}>
        {value}
        {suffix && <span className="ml-1 text-sm font-semibold opacity-70">{suffix}</span>}
      </span>
      {sub && <span className="mt-1 block text-[11px] leading-snug text-white/55">{sub}</span>}
    </div>
  );
}

export function ResultsPanel({ title, children, footnote, flashKey = 0 }: { title: string; children: React.ReactNode; footnote?: React.ReactNode; flashKey?: number }) {
  return (
    <section key={flashKey} className="flex flex-col rounded-xl bg-navy-900 p-6 text-white shadow-panel ring-1 ring-navy-700/40 flash-once">
      <h3 className="mb-4 border-b border-white/10 pb-3 font-display text-sm font-semibold tracking-wide text-brand-200">{title}</h3>
      <div className="flex-grow">{children}</div>
      {footnote && <p className="mt-5 border-t border-white/10 pt-3 text-[11px] leading-relaxed text-white/50">{footnote}</p>}
    </section>
  );
}

/* =============================================================
   CHART PRIMITIVES — hand-rolled SVG
   ============================================================= */

export function DonutChart({
  segments,
  size = 170,
  thickness = 26,
  centerTop,
  centerBottom,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  centerTop?: string;
  centerBottom?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - thickness) / 2;
  const C = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={thickness} />
      {segments.map((s, i) => {
        const frac = s.value / total;
        const dash = Math.max(0, frac * C - 2.5);
        const off = acc * C;
        acc += frac;
        return (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={thickness}
            strokeDasharray={`${dash} ${C - dash}`}
            strokeDashoffset={-off}
            strokeLinecap="butt"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: "stroke-dasharray .6s cubic-bezier(.22,1,.36,1), stroke-dashoffset .6s cubic-bezier(.22,1,.36,1)" }}
          >
            <title>{`${s.label}: ${s.value}`}</title>
          </circle>
        );
      })}
      {centerTop && (
        <text x="50%" y="47%" textAnchor="middle" className="font-display" fontSize={size * 0.14} fontWeight={700} fill="#fff">
          {centerTop}
        </text>
      )}
      {centerBottom && (
        <text x="50%" y="62%" textAnchor="middle" fontSize={size * 0.058} fill="rgba(255,255,255,0.55)" letterSpacing="1">
          {centerBottom}
        </text>
      )}
    </svg>
  );
}

export function GaugeChart({ pct, size = 150 }: { pct: number; size?: number }) {
  const v = Math.min(100, Math.max(0, pct));
  const r = size / 2 - 14;
  const C = 2 * Math.PI * r;
  const arc = 0.75;
  const color = v > 90 ? "#EF476F" : v >= 80 ? "#FF9F1C" : "#10B981";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.09)"
        strokeWidth={12}
        strokeDasharray={`${arc * C} ${C}`}
        strokeLinecap="round"
        transform={`rotate(135 ${size / 2} ${size / 2})`}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={12}
        strokeDasharray={`${(arc * C * v) / 100} ${C}`}
        strokeLinecap="round"
        transform={`rotate(135 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dasharray .7s cubic-bezier(.22,1,.36,1), stroke .3s" }}
      />
      <text x="50%" y="50%" textAnchor="middle" fontSize={size * 0.19} fontWeight={700} fill="#fff" className="font-display">
        {Math.round(v)}%
      </text>
      <text x="50%" y="64%" textAnchor="middle" fontSize={size * 0.07} fill="rgba(255,255,255,0.55)" letterSpacing="1.5">
        OCCUPANCY
      </text>
    </svg>
  );
}

export function HoursBar({ rostered, external, internal, handling }: { rostered: number; external: number; internal: number; handling: number }) {
  const total = rostered || 1;
  const segs = [
    { label: "Handling", value: Math.min(handling, Math.max(0, total - external - internal)), color: "#10B981" },
    { label: "Idle / available", value: Math.max(0, total - external - internal - handling), color: "#06B6D4" },
    { label: "Internal shrink", value: internal, color: "#FF9F1C" },
    { label: "External shrink", value: external, color: "#EF476F" },
  ].filter((s) => s.value > 0.001);
  return (
    <div>
      <div className="flex h-9 w-full overflow-hidden rounded-lg ring-1 ring-white/10">
        {segs.map((s, i) => (
          <div
            key={i}
            className="bar-grow group relative h-full transition-opacity hover:opacity-80"
            style={{ width: `${(s.value / total) * 100}%`, background: s.color, animationDelay: `${i * 90}ms` }}
            title={`${s.label}: ${s.value.toFixed(1)}h`}
          />
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
        {segs.map((s, i) => (
          <span key={i} className="flex items-center gap-1.5 text-[11px] text-white/60">
            <span className="h-2 w-2 rounded-[3px]" style={{ background: s.color }} />
            {s.label}
            <span className="font-mono text-white/85">{s.value.toFixed(1)}h</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function StaffingCurve({ curve, targetSL, chosenN }: { curve: { n: number; sl: number }[]; targetSL: number; chosenN: number }) {
  if (!curve.length) return null;
  const w = 340;
  const h = 140;
  const padL = 30;
  const padB = 22;
  const padT = 8;
  const maxSL = Math.min(1, Math.max(targetSL + 0.08, curve[curve.length - 1].sl));
  const minN = curve[0].n - 1;
  const maxN = curve[curve.length - 1].n + 1;
  const x = (n: number) => padL + ((n - minN) / (maxN - minN)) * (w - padL - 6);
  const y = (s: number) => padT + (1 - s / maxSL) * (h - padT - padB);
  const pts = curve.map((c) => `${x(c.n).toFixed(1)},${y(c.sl).toFixed(1)}`).join(" ");
  const area = `${padL},${h - padB} ${pts} ${x(curve[curve.length - 1].n).toFixed(1)},${h - padB}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line key={f} x1={padL} x2={w - 6} y1={y(maxSL * f)} y2={y(maxSL * f)} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
      ))}
      <line x1={padL} x2={w - 6} y1={y(targetSL)} y2={y(targetSL)} stroke="#FF9F1C" strokeWidth={1.5} strokeDasharray="5 4" opacity={0.9} />
      <text x={w - 8} y={y(targetSL) - 4} textAnchor="end" fontSize={9} fill="#FFB85C" className="font-mono">
        target {(targetSL * 100).toFixed(0)}%
      </text>
      <polygon points={area} fill="rgba(46,107,255,0.22)" />
      <polyline points={pts} fill="none" stroke="#2E6BFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" pathLength={1200} className="draw-line" style={{ ["--dash" as string]: 1200 }} />
      {curve.map((c) => (
        <circle key={c.n} cx={x(c.n)} cy={y(c.sl)} r={c.n === chosenN ? 5 : 3} fill={c.n === chosenN ? "#FFD166" : "#8FB2FF"} stroke={c.n === chosenN ? "#0D2468" : "none"} strokeWidth={2}>
          <title>{`${c.n} agents → ${(c.sl * 100).toFixed(1)}% SL`}</title>
        </circle>
      ))}
      {curve.map((c) =>
        c.n % 2 === minN % 2 ? (
          <text key={c.n} x={x(c.n)} y={h - 8} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.45)" className="font-mono">
            {c.n}
          </text>
        ) : null,
      )}
    </svg>
  );
}

export function Sparkline({ values, color = "#06B6D4", w = 72, h = 24 }: { values: number[]; color?: string; w?: number; h?: number }) {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => `${((i / (values.length - 1)) * (w - 4) + 2).toFixed(1)},${(h - 3 - ((v - min) / span) * (h - 6)).toFixed(1)}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
    </svg>
  );
}

export function DayTimeline({
  a,
  b,
  overlapStart,
  overlapEnd,
  hasOverlap,
}: {
  a: { start: number; end: number };
  b: { start: number; end: number };
  overlapStart: number;
  overlapEnd: number;
  hasOverlap: boolean;
}) {
  const lo = Math.floor(Math.min(a.start, b.start) / 60) * 60;
  const hi = Math.ceil(Math.max(a.end, b.end) / 60) * 60;
  const span = hi - lo || 1440;
  const pct = (m: number) => ((m - lo) / span) * 100;
  const domainH = span / 60;
  const Bar = ({ w, color, label }: { w: { start: number; end: number }; color: string; label: string }) => {
    const left = pct(w.start);
    const width = pct(w.end) - left;
    return (
      <div
        className="absolute inset-y-1 flex items-center overflow-hidden whitespace-nowrap rounded-md px-2 font-mono text-[10px] font-semibold text-white shadow-sm transition-all duration-500"
        style={{ left: `${left}%`, width: `${width}%`, background: color, minWidth: width < 16 ? "4.2rem" : undefined }}
      >
        {label}
      </div>
    );
  };
  return (
    <div>
      <div className="relative h-[4.8rem] overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
        {Array.from({ length: domainH + 1 }, (_, h) => (
          <div key={h} className="absolute top-0 h-full border-l border-white/[0.07]" style={{ left: `${(h / domainH) * 100}%` }} />
        ))}
        <div className="absolute left-0 right-0 top-1 h-7">
          <Bar w={a} color="#2E6BFF" label={`A · ${fmtClockLocal(a.start)}–${fmtClockLocal(a.end)}`} />
        </div>
        <div className="absolute left-0 right-0 top-9 h-7">
          <Bar w={b} color="#FF9F1C" label={`B · ${fmtClockLocal(b.start)}–${fmtClockLocal(b.end)}`} />
        </div>
        {hasOverlap && (
          <div
            className="absolute top-0 h-full border-x border-dashed border-[#7C5CFC] bg-[#7C5CFC]/20"
            style={{ left: `${pct(overlapStart)}%`, width: `${pct(overlapEnd - overlapStart)}%` }}
            title={`Overlap ${fmtDurLocal(overlapEnd - overlapStart)}`}
          />
        )}
      </div>
      <div className="relative mt-1 h-4 font-mono text-[9px] text-white/40">
        {Array.from({ length: domainH + 1 }, (_, h) => (
          <span key={h} className="absolute -translate-x-1/2" style={{ left: `${(h / domainH) * 100}%` }}>
            {fmtClockLocal(lo + h * 60)}
          </span>
        ))}
      </div>
    </div>
  );
}

const fmtClockLocal = (min: number): string => {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const r = m % 60;
  const ap = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${r.toString().padStart(2, "0")}${ap}`;
};

const fmtDurLocal = (min: number): string => {
  const m = Math.round(min);
  const h = Math.floor(m / 60);
  return h === 0 ? `${m % 60}m` : `${h}h ${(m % 60).toString().padStart(2, "0")}m`;
};
