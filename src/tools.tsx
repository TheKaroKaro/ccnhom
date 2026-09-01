import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  calcErlang,
  calcShrinkage,
  checkSwap,
  clamp,
  copyText,
  csatForecast,
  downloadBlob,
  fmt,
  fmtClock,
  fmtDur,
  npsForecast,
  num,
  serializeSvg,
  svgToPngBlob,
  toMin,
} from "./lib";
import {
  DayTimeline,
  DonutChart,
  Field,
  GaugeChart,
  GhostButton,
  HoursBar,
  IconBolt,
  IconChartStudio,
  IconCheck,
  IconClipboard,
  IconCopy,
  IconCsat,
  IconCurve,
  IconDownload,
  IconPlus,
  IconRefresh,
  IconShrink,
  IconSwap,
  IconTrash,
  IconUsers,
  PrimaryButton,
  ResultTile,
  ResultsPanel,
  Sparkline,
  StaffingCurve,
  Toggle,
  ToolHeader,
  useCountUp,
} from "./components";

/* ============================================================
   TOOL 01 · CHART STUDIO
   ============================================================ */

type ChartKind = "bar" | "hbar" | "line" | "pie" | "donut";
interface Series {
  id: number;
  name: string;
  color: string;
  values: number[];
}

const PALETTES: { name: string; colors: string[] }[] = [
  { name: "MakeChart", colors: ["#2E6BFF", "#10B981", "#FF9F1C", "#EF476F", "#7C5CFC", "#06B6D4"] },
  { name: "Ocean", colors: ["#0D2468", "#1244C4", "#2E6BFF", "#5F8DFF", "#8FB2FF", "#B9D0FF"] },
  { name: "Sunset", colors: ["#FF6B6B", "#FF9F1C", "#FFD166", "#EF476F", "#C86BFA", "#7C5CFC"] },
  { name: "Boardroom", colors: ["#1F2937", "#2E6BFF", "#9CA3AF", "#10B981", "#FF9F1C", "#7C5CFC"] },
];

const SIZES = [
  { label: "16:9 · Slide", w: 960, h: 540 },
  { label: "4:3 · Classic", w: 960, h: 720 },
  { label: "1:1 · Square", w: 720, h: 720 },
];

const BGS = [
  { label: "White", value: "#FFFFFF" },
  { label: "Clear", value: "transparent" },
  { label: "Navy", value: "#0D1F4D" },
];

const KINDS: { id: ChartKind; label: string }[] = [
  { id: "bar", label: "Bar" },
  { id: "hbar", label: "H-Bar" },
  { id: "line", label: "Line" },
  { id: "pie", label: "Pie" },
  { id: "donut", label: "Donut" },
];

const SAMPLES: { name: string; labels: string[]; series: { name: string; values: number[] }[] }[] = [
  { name: "CSAT by team", labels: ["Mon", "Tue", "Wed", "Thu", "Fri"], series: [{ name: "Team A", values: [82, 85, 84, 88, 91] }, { name: "Team B", values: [74, 78, 80, 79, 84] }] },
  { name: "Inbound volume", labels: ["8 AM", "10 AM", "12 PM", "2 PM", "4 PM", "6 PM"], series: [{ name: "Calls", values: [42, 68, 91, 74, 58, 33] }, { name: "Chats", values: [18, 31, 44, 39, 27, 12] }] },
  { name: "Shrinkage split", labels: ["PTO", "Sick", "Coaching", "Breaks", "Meetings"], series: [{ name: "Hours lost", values: [26, 14, 18, 32, 10] }] },
];

let sid = 100;

const wrapText = (s: string, max: number): string[] => {
  const words = s.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > max) {
      if (cur) out.push(cur);
      cur = w.slice(0, max);
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (cur) out.push(cur);
  return out.length ? out.slice(0, 2) : [""];
};

const niceMax = (v: number): number => {
  if (v <= 0) return 10;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const d = v / p;
  const m = d <= 1 ? 1 : d <= 2 ? 2 : d <= 2.5 ? 2.5 : d <= 5 ? 5 : 10;
  return m * p;
};

const fmtTick = (v: number): string => (v >= 1000 ? `${+(v / 1000).toFixed(1)}k` : `${+v.toFixed(2)}`);

const fmtVal = (v: number): string => (Math.abs(v) >= 100 ? String(Math.round(v)) : `${+v.toFixed(1)}`);

function ChartSvg({
  labels,
  series,
  kind,
  size,
  bg,
  showValues,
  areaFill,
  innerRef,
  className,
}: {
  labels: string[];
  series: Series[];
  kind: ChartKind;
  size: { w: number; h: number };
  bg: string;
  showValues: boolean;
  areaFill: boolean;
  innerRef?: React.Ref<SVGSVGElement>;
  className?: string;
}) {
  const { w, h } = size;
  const dark = bg === "#0D1F4D";
  const text = dark ? "#FFFFFF" : "#101828";
  const sub = dark ? "rgba(255,255,255,0.6)" : "#64748B";
  const grid = dark ? "rgba(255,255,255,0.12)" : "#E3E9F3";

  const cleanLabels = labels.map((l, i) => l.trim() || `Item ${i + 1}`);
  const data = series.map((s) => s.values.map((v, i) => ({ label: cleanLabels[i] ?? `Item ${i + 1}`, v: Number.isFinite(v) ? Math.max(0, v) : 0 })));
  const maxVal = niceMax(Math.max(1, ...data.flat().map((d) => d.v)));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * maxVal);
  const isCartesian = kind === "bar" || kind === "hbar" || kind === "line";

  const legendItems = kind === "pie" || kind === "donut" ? cleanLabels.map((l, i) => ({ label: l, color: series[0].color ? PALETTES[0].colors[i % 6] : "#2E6BFF", value: data[0][i]?.v ?? 0 })) : series.map((s, i) => ({ label: s.name, color: s.color, value: 0 }));
  const legendText = (dark ? "#FFFFFF" : "#101828");
  const legendW = Math.max(...legendItems.map((l) => l.label.length), 8) * 6.6 + 26;
  const legendCols = Math.max(1, Math.min(legendItems.length, Math.floor((w - 40) / legendW)));
  const legendRows = Math.ceil(legendItems.length / legendCols);
  const legendH = data.length > 1 || kind === "pie" || kind === "donut" ? legendRows * 18 + 8 : 0;

  const mT = 18;
  const mB = 14 + legendH;
  const pie = kind === "pie" || kind === "donut";
  const leftLabelW = kind === "hbar" ? Math.min(150, Math.max(56, ...cleanLabels.map((l) => l.length)) * 7 + 12) : 0;
  const mL = isCartesian ? 56 + leftLabelW * 0.4 : 24;
  const mR = 20;
  const plotW = w - mL - mR;
  const plotH = h - mT - mB;
  const cx = mL + plotW / 2;
  const cy = mT + plotH / 2;
  const R = Math.min(plotW, plotH) / 2 - 8;
  const innerR = kind === "donut" ? R * 0.55 : 0;

  const y = (v: number) => mT + plotH * (1 - v / maxVal);
  const band = plotW / cleanLabels.length;
  const barGroupW = band * 0.68;
  const barW = data.length ? barGroupW / data.length : band;

  const pieTotal = data[0]?.reduce((s, d) => s + d.v, 0) || 1;
  let acc = 0;
  const slices = (data[0] ?? []).map((d, i) => {
    const a0 = (acc / pieTotal) * Math.PI * 2 - Math.PI / 2;
    acc += d.v;
    const a1 = (acc / pieTotal) * Math.PI * 2 - Math.PI / 2;
    const color = PALETTES[0].colors[i % 6];
    const mid = (a0 + a1) / 2;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const p = (a: number, r: number) => `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
    const dPath =
      d.v / pieTotal > 0.999
        ? `M ${cx + R} ${cy} A ${R} ${R} 0 1 1 ${cx - R} ${cy} A ${R} ${R} 0 1 1 ${cx + R} ${cy} Z`
        : innerR > 0
          ? `M ${p(a0, R)} A ${R} ${R} 0 ${large} 1 ${p(a1, R)} L ${p(a1, innerR)} A ${innerR} ${innerR} 0 ${large} 0 ${p(a0, innerR)} Z`
          : `M ${cx} ${cy} L ${p(a0, R)} A ${R} ${R} 0 ${large} 1 ${p(a1, R)} Z`;
    return { ...d, color, dPath, mid, frac: d.v / pieTotal };
  });

  return (
    <svg ref={innerRef} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${w} ${h}`} width={w} height={h} className={className} fontFamily="'IBM Plex Sans','Space Grotesk',sans-serif">
      {bg !== "transparent" && <rect x="0" y="0" width={w} height={h} fill={bg} rx="18" />}
      <text x={mL} y={mT - 4} fontSize="11" fontWeight="600" letterSpacing="2" fill={sub}>
        CC TOOLKIT · CHART STUDIO
      </text>

      {isCartesian &&
        ticks.map((t) => (
          <g key={t}>
            <line x1={mL} y1={y(t)} x2={w - mR} y2={y(t)} stroke={grid} strokeWidth="1" />
            <text x={mL - 8} y={y(t) + 3.5} textAnchor="end" fontSize="10.5" fill={sub}>
              {fmtTick(t)}
            </text>
          </g>
        ))}

      {kind === "bar" &&
        data.map((rows, si) =>
          rows.map((d, i) => {
            const x0 = mL + band * i + (band - barGroupW) / 2 + barW * si;
            const bw = Math.max(2, barW - 3);
            const bh = Math.max(0, mT + plotH - y(d.v));
            return (
              <g key={`${si}-${i}`}>
                <rect x={x0} y={y(d.v)} width={bw} height={bh} rx={Math.min(4, bw / 2)} fill={series[si].color} />
                {showValues && d.v > 0 && (
                  <text x={x0 + bw / 2} y={y(d.v) - 5} textAnchor="middle" fontSize="10" fontWeight="600" fill={text}>
                    {fmtVal(d.v)}
                  </text>
                )}
              </g>
            );
          }),
        )}

      {kind === "hbar" &&
        cleanLabels.map((label, i) => {
          const rowH = plotH / cleanLabels.length;
          const groupH = rowH * 0.7;
          const rbh = data.length ? groupH / data.length : groupH;
          const ly = mT + rowH * i + rowH / 2;
          return (
            <g key={i}>
              <text x={mL - 10} y={ly + 3.5} textAnchor="end" fontSize="11" fill={text}>
                {label.length > 16 ? label.slice(0, 15) + "…" : label}
              </text>
              {data.map((rows, si) => {
                const d = rows[i];
                if (!d) return null;
                const bw = Math.max(0, (d.v / maxVal) * plotW);
                return (
                  <g key={si}>
                    <rect x={mL} y={mT + rowH * i + (rowH - groupH) / 2 + rbh * si} width={bw} height={Math.max(2, rbh - 3)} rx={Math.min(4, rbh / 2)} fill={series[si].color} />
                    {showValues && d.v > 0 && (
                      <text x={mL + bw + 6} y={mT + rowH * i + (rowH - groupH) / 2 + rbh * si + rbh / 2 + 3.5} fontSize="10" fontWeight="600" fill={text}>
                        {fmtVal(d.v)}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}

      {kind === "line" &&
        data.map((rows, si) => {
          const pts = rows.map((d, i) => ({ x: mL + band * i + band / 2, y: y(d.v) }));
          const line = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
          return (
            <g key={si}>
              {areaFill && <polygon points={`${mL + band / 2},${mT + plotH} ${line} ${mL + band * (rows.length - 1) + band / 2},${mT + plotH}`} fill={series[si].color} opacity="0.13" />}
              <polyline points={line} fill="none" stroke={series[si].color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              {pts.map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r="4.2" fill={bg === "transparent" ? "#fff" : bg} stroke={series[si].color} strokeWidth="2.4" />
                  {showValues && (
                    <text x={p.x} y={p.y - 9} textAnchor="middle" fontSize="10" fontWeight="600" fill={text}>
                      {fmtVal(rows[i].v)}
                    </text>
                  )}
                </g>
              ))}
            </g>
          );
        })}

      {pie &&
        slices.map((s, i) => (
          <g key={i}>
            <path d={s.dPath} fill={s.color} stroke={bg === "transparent" ? "#fff" : bg} strokeWidth="2" />
            {showValues && s.frac > 0.06 && (
              <text x={cx + Math.cos(s.mid) * (innerR + (R - innerR) * 0.62)} y={cy + Math.sin(s.mid) * (innerR + (R - innerR) * 0.62) + 3.5} textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">
                {Math.round(s.frac * 100)}%
              </text>
            )}
          </g>
        ))}

      {(kind === "bar" || kind === "line") &&
        cleanLabels.map((l, i) => {
          const x = mL + band * i + band / 2;
          const lines = wrapText(l, Math.max(6, Math.floor(band / 6.2)));
          return (
            <g key={i}>
              {lines.map((ln, j) => (
                <text key={j} x={x} y={mT + plotH + 15 + j * 12} textAnchor="middle" fontSize="10.5" fill={sub}>
                  {ln}
                </text>
              ))}
            </g>
          );
        })}

      {legendH > 0 &&
        legendItems.map((it, i) => {
          const col = i % legendCols;
          const row = Math.floor(i / legendCols);
          const x = mL + col * legendW;
          const yy = h - 14 - (legendRows - 1 - row) * 18;
          return (
            <g key={i}>
              <rect x={x} y={yy - 9} width="12" height="12" rx="3" fill={it.color} />
              <text x={x + 17} y={yy + 1} fontSize="11" fill={legendText}>
                {it.label}
                {pie ? ` · ${fmtVal(it.value)}` : ""}
              </text>
            </g>
          );
        })}
    </svg>
  );
}

function ChartStudio() {
  const [kind, setKind] = useState<ChartKind>("bar");
  const [labels, setLabels] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [series, setSeries] = useState<Series[]>([
    { id: 1, name: "Team A", color: "#2E6BFF", values: [42, 68, 55, 80, 62] },
  ]);
  const [values, setValues] = useState<Record<number, number[]>>({ 1: [42, 68, 55, 80, 62] });
  const [sizeIdx, setSizeIdx] = useState(0);
  const [bg, setBg] = useState("#FFFFFF");
  const [showValues, setShowValues] = useState(true);
  const [areaFill, setAreaFill] = useState(true);
  const [paletteIdx, setPaletteIdx] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const toastTimer = useRef<number>(0);

  const size = SIZES[sizeIdx];
  const renderSeries: Series[] = series.map((s) => ({ ...s, values: values[s.id] ?? [] }));

  const say = (msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  };

  useEffect(() => {
    if (kind === "pie" || kind === "donut") setSeries((prev) => prev.slice(0, 1));
  }, [kind]);

  const applyPalette = (idx: number) => {
    setPaletteIdx(idx);
    setSeries((prev) => prev.map((s, i) => ({ ...s, color: PALETTES[idx].colors[i % 6] })));
  };

  const setLabel = (i: number, v: string) => setLabels((prev) => prev.map((l, j) => (j === i ? v : l)));
  const addRow = () => {
    setLabels((prev) => [...prev, `Item ${prev.length + 1}`]);
    setValues((prev) => {
      const next = { ...prev };
      series.forEach((s) => {
        next[s.id] = [...(next[s.id] ?? []), 0];
      });
      return next;
    });
  };
  const removeRow = (i: number) => {
    if (labels.length <= 2) return;
    setLabels((prev) => prev.filter((_, j) => j !== i));
    setValues((prev) => {
      const next = { ...prev };
      series.forEach((s) => {
        next[s.id] = (next[s.id] ?? []).filter((_, j) => j !== i);
      });
      return next;
    });
  };
  const addSeries = () => {
    if (series.length >= 6) return;
    const id = ++sid;
    const col = PALETTES[paletteIdx].colors[series.length % 6];
    setSeries((prev) => [...prev, { id, name: `Series ${String.fromCharCode(65 + prev.length)}`, color: col, values: labels.map(() => 0) }]);
    setValues((prev) => ({ ...prev, [id]: labels.map(() => 0) }));
  };
  const removeSeries = (id: number) => {
    if (series.length <= 1) return;
    setSeries((prev) => prev.filter((s) => s.id !== id));
    setValues((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };
  const setVal = (sid_: number, i: number, v: string) =>
    setValues((prev) => ({ ...prev, [sid_]: (prev[sid_] ?? []).map((x, j) => (j === i ? Math.max(0, num(v)) : x)) }));

  const loadSample = (idx: number) => {
    const s = SAMPLES[idx];
    const rebuiltSeries: Series[] = s.series.map((sr, i) => ({
      id: ++sid,
      name: sr.name,
      color: PALETTES[0].colors[i % 6],
      values: sr.values,
    }));
    const rebuilt: Record<number, number[]> = {};
    rebuiltSeries.forEach((sr) => {
      rebuilt[sr.id] = sr.values;
    });
    setLabels(s.labels);
    setSeries(rebuiltSeries);
    setValues(rebuilt);
  };

  const getSvgText = (): string | null => {
    const el = svgRef.current;
    if (!el) return null;
    return serializeSvg(el);
  };

  const exportPng = async (mode: "copy" | "download") => {
    const t = getSvgText();
    if (!t) return;
    setBusy(true);
    try {
      const blob = await svgToPngBlob(t, size.w, size.h, 2);
      if (mode === "download") {
        downloadBlob(blob, `cc-toolkit-chart-${size.w}x${size.h}.png`);
        say("PNG downloaded · 2× resolution, slide-ready");
      } else {
        try {
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
          say("PNG copied — paste it straight into PowerPoint");
        } catch {
          downloadBlob(blob, "cc-toolkit-chart.png");
          say("Clipboard blocked by browser — downloaded the PNG instead");
        }
      }
    } catch {
      say("Export failed — try the SVG download instead");
    }
    setBusy(false);
  };

  const exportSvg = async (mode: "copy" | "download") => {
    const t = getSvgText();
    if (!t) return;
    if (mode === "download") {
      downloadBlob(new Blob([t], { type: "image/svg+xml;charset=utf-8" }), "cc-toolkit-chart.svg");
      say("SVG downloaded — infinitely scalable");
    } else {
      (await copyText(t)) ? say("SVG markup copied to clipboard") : say("Copy failed — use Download SVG");
    }
  };

  return (
    <div>
      <ToolHeader
        index="TOOL 01"
        kicker="DATA VIZ"
        title="Chart Studio"
        desc="Turn raw numbers into presentation-ready charts — edit the data grid, pick a type and palette, then export crisp SVG or high-res PNG straight into PowerPoint. Everything renders locally."
        icon={<IconChartStudio className="h-6 w-6" />}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[400px_1fr]">
        {/* ---------- data editor ---------- */}
        <section className="space-y-5">
          <div className="rounded-xl border border-line bg-white p-5 shadow-panel">
            <h3 className="mb-3 font-display text-sm font-semibold text-ink-700">Data grid</h3>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {SAMPLES.map((s, i) => (
                <button key={s.name} type="button" onClick={() => loadSample(i)} className="rounded-md border-[1.5px] border-line bg-paper px-2.5 py-1 text-[11px] font-semibold text-ink-500 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700">
                  {s.name}
                </button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[300px] border-separate" style={{ borderSpacing: "0 4px" }}>
                <thead>
                  <tr>
                    <th className="w-[26%] pb-1 text-left text-[10px] font-semibold uppercase tracking-wider text-ink-500">Label</th>
                    {series.map((s) => (
                      <th key={s.id} className="pb-1 pl-1.5 text-left">
                        <span className="flex items-center gap-1">
                          <input type="color" className="swatch-input !h-6 !w-6" style={{ width: 22, height: 22 }} value={s.color} onChange={(e) => setSeries((prev) => prev.map((x) => (x.id === s.id ? { ...x, color: e.target.value } : x)))} title={`${s.name} color`} />
                          <input className="w-16 rounded-md border-[1.5px] border-transparent bg-transparent px-1 py-0.5 text-[11px] font-semibold text-ink-700 transition-colors hover:border-line focus:border-brand-500 focus:outline-none" value={s.name} onChange={(e) => setSeries((prev) => prev.map((x) => (x.id === s.id ? { ...x, name: e.target.value } : x)))} />
                        </span>
                      </th>
                    ))}
                    <th className="w-7" />
                  </tr>
                </thead>
                <tbody>
                  {labels.map((l, i) => (
                    <tr key={i} className="group">
                      <td className="rounded-l-lg border-y border-l border-line bg-paper/60 px-2 transition-colors group-hover:border-brand-200">
                        <input className="w-full bg-transparent py-1.5 text-[13px] font-medium text-ink-900 focus:outline-none" value={l} onChange={(e) => setLabel(i, e.target.value)} />
                      </td>
                      {series.map((s) => (
                        <td key={s.id} className="border-y border-line bg-white px-1.5 transition-colors group-hover:border-brand-200">
                          <input type="number" min={0} className="w-full bg-transparent py-1.5 font-mono text-[13px] tabular-nums text-ink-900 focus:outline-none" value={(values[s.id] ?? [])[i] ?? 0} onChange={(e) => setVal(s.id, i, e.target.value)} />
                        </td>
                      ))}
                      <td className="rounded-r-lg border-y border-r border-line bg-paper/60 text-center transition-colors group-hover:border-brand-200">
                        <button type="button" onClick={() => removeRow(i)} disabled={labels.length <= 2} title="Remove row" className="rounded-md p-1 text-ink-500/40 transition-all hover:bg-chart-red/10 hover:text-chart-red disabled:opacity-20 disabled:hover:bg-transparent">
                          <IconTrash className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={addRow} className="inline-flex items-center gap-1.5 rounded-lg border-[1.5px] border-dashed border-brand-300 px-3 py-1.5 text-xs font-semibold text-brand-600 transition-all hover:bg-brand-50 active:scale-95">
                <IconPlus className="h-3.5 w-3.5" /> Row
              </button>
              {kind !== "pie" && kind !== "donut" && (
                <button type="button" onClick={addSeries} disabled={series.length >= 6} className="inline-flex items-center gap-1.5 rounded-lg border-[1.5px] border-dashed border-brand-300 px-3 py-1.5 text-xs font-semibold text-brand-600 transition-all hover:bg-brand-50 active:scale-95 disabled:opacity-30">
                  <IconPlus className="h-3.5 w-3.5" /> Series
                </button>
              )}
              {series.length > 1 && (
                <button type="button" onClick={() => removeSeries(series[series.length - 1].id)} className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-ink-500 transition-all hover:bg-chart-red/10 hover:text-chart-red active:scale-95">
                  <IconTrash className="h-3.5 w-3.5" /> Series
                </button>
              )}
            </div>
            {(kind === "pie" || kind === "donut") && <p className="mt-2 text-[11px] text-ink-500">Pie & donut chart the first series across the label rows.</p>}
          </div>

          <div className="rounded-xl border border-line bg-white p-5 shadow-panel">
            <h3 className="mb-3 font-display text-sm font-semibold text-ink-700">Chart options</h3>
            <div className="space-y-4">
              <Field label="Chart type">
                <div className="grid grid-cols-5 gap-1.5">
                  {KINDS.map((k) => (
                    <button key={k.id} type="button" onClick={() => setKind(k.id)} className={`rounded-lg border-[1.5px] px-1 py-2 text-[11px] font-bold transition-all duration-200 ${kind === k.id ? "border-brand-500 bg-brand-500 text-white shadow-[0_6px_14px_-6px_rgba(46,107,255,0.7)]" : "border-line bg-white text-ink-500 hover:border-brand-300 hover:text-brand-600"}`}>
                      {k.label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Canvas size">
                <div className="grid grid-cols-3 gap-1.5">
                  {SIZES.map((s, i) => (
                    <button key={s.label} type="button" onClick={() => setSizeIdx(i)} className={`rounded-lg border-[1.5px] px-2 py-2 text-[11px] font-semibold transition-all ${sizeIdx === i ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line text-ink-500 hover:border-brand-300 hover:text-brand-600"}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Background">
                <div className="grid grid-cols-3 gap-1.5">
                  {BGS.map((b) => (
                    <button key={b.label} type="button" onClick={() => setBg(b.value)} className={`flex items-center justify-center gap-1.5 rounded-lg border-[1.5px] px-2 py-2 text-[11px] font-semibold transition-all ${bg === b.value ? "border-brand-500 text-brand-700" : "border-line text-ink-500 hover:border-brand-300"}`}>
                      <span className={`h-3.5 w-3.5 rounded-[4px] border border-ink-500/20 ${b.value === "transparent" ? "checker" : ""}`} style={b.value !== "transparent" ? { background: b.value } : undefined} />
                      {b.label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Color palette">
                <div className="space-y-1.5">
                  {PALETTES.map((p, i) => (
                    <button key={p.name} type="button" onClick={() => applyPalette(i)} className={`flex w-full items-center gap-2.5 rounded-lg border-[1.5px] px-2.5 py-2 transition-all ${paletteIdx === i ? "border-brand-500 bg-brand-50" : "border-line hover:border-brand-300"}`}>
                      <span className="flex gap-1">
                        {p.colors.slice(0, 6).map((c) => (
                          <span key={c} className="h-4 w-4 rounded-[4px]" style={{ background: c }} />
                        ))}
                      </span>
                      <span className={`text-[11px] font-semibold ${paletteIdx === i ? "text-brand-700" : "text-ink-500"}`}>{p.name}</span>
                    </button>
                  ))}
                </div>
              </Field>
              <div className="flex flex-wrap gap-x-6 gap-y-2.5 border-t border-line pt-3.5">
                <Toggle on={showValues} onChange={setShowValues} label="Value labels" />
                {kind === "line" && <Toggle on={areaFill} onChange={setAreaFill} label="Area fill" />}
              </div>
            </div>
          </div>
        </section>

        {/* ---------- preview + export ---------- */}
        <section className="space-y-4">
          <div className="rounded-xl border border-line bg-white p-5 shadow-panel">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-sm font-semibold text-ink-700">
                Preview <span className="ml-1 font-mono text-[11px] font-normal text-ink-500">{size.w}×{size.h}px</span>
              </h3>
              {toast && (
                <span className="rise-in inline-flex items-center gap-1.5 rounded-full bg-chart-green/10 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-chart-green/30">
                  <IconCheck className="h-3.5 w-3.5" /> {toast}
                </span>
              )}
            </div>
            <div className="checker flex items-center justify-center overflow-hidden rounded-xl border border-line p-3">
              <ChartSvg labels={labels} series={renderSeries} kind={kind} size={size} bg={bg} showValues={showValues} areaFill={areaFill} innerRef={svgRef} className="h-auto max-h-[520px] w-full max-w-full rounded-xl shadow-lift" />
            </div>
            <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-ink-500">
              {kind} · {renderSeries.length} series · {labels.length} rows · renders live as you type
            </p>
          </div>

          <div className="rounded-xl bg-navy-900 p-5 text-white shadow-panel ring-1 ring-navy-700/40">
            <h3 className="mb-1 font-display text-sm font-semibold text-brand-200">Export for your deck</h3>
            <p className="mb-4 text-xs text-white/55">PNG exports at 2× (a 16:9 chart becomes a 1920×1080 slide-resolution image). SVG stays sharp at any size.</p>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <PrimaryButton onClick={() => exportPng("copy")} className="w-full !px-2 text-[13px]">
                {busy ? <IconRefresh className="h-4 w-4 animate-spin" /> : <IconCopy className="h-4 w-4" />} Copy PNG
              </PrimaryButton>
              <GhostButton onClick={() => exportPng("download")} className="w-full !border-white/15 !bg-white/5 !px-2 text-[13px] !text-white hover:!border-brand-400 hover:!bg-brand-500/20">
                <IconDownload className="h-4 w-4" /> PNG 2×
              </GhostButton>
              <GhostButton onClick={() => exportSvg("download")} className="w-full !border-white/15 !bg-white/5 !px-2 text-[13px] !text-white hover:!border-brand-400 hover:!bg-brand-500/20">
                <IconDownload className="h-4 w-4" /> SVG
              </GhostButton>
              <GhostButton onClick={() => exportSvg("copy")} className="w-full !border-white/15 !bg-white/5 !px-2 text-[13px] !text-white hover:!border-brand-400 hover:!bg-brand-500/20">
                <IconCopy className="h-4 w-4" /> SVG code
              </GhostButton>
            </div>
            <p className="mt-3.5 flex items-center gap-1.5 text-[11px] text-white/45">
              <IconCheck className="h-3.5 w-3.5 text-chart-green" /> In PowerPoint: Insert → Picture → from clipboard (Ctrl+V) or from the downloaded file.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ============================================================
   TOOL 02 · SHRINKAGE & OCCUPANCY
   ============================================================ */

function ShrinkageTool() {
  const [rostered, setRostered] = useState("80");
  const [external, setExternal] = useState("8");
  const [internal, setInternal] = useState("12");
  const [handling, setHandling] = useState("45");
  const [flashKey, setFlashKey] = useState(0);

  const r = useMemo(
    () => calcShrinkage({ rostered: num(rostered), external: num(external), internal: num(internal), handling: num(handling) }),
    [rostered, external, internal, handling],
  );

  const shrinkPct = useCountUp(r.shrinkPct);
  const occ = useCountUp(r.occupancy);
  const net = useCountUp(r.netAvailable);
  const idle = useCountUp(r.idle);

  const statusMeta = {
    healthy: { label: "Healthy utilization", color: "#10B981", note: "Room for volume spikes without burning the team out." },
    hot: { label: "Running hot", color: "#FF9F1C", note: "Near the burnout ceiling — watch queues and AHT drift closely." },
    overloaded: { label: "Overloaded", color: "#EF476F", note: "Sustained above 90% drives fatigue, errors and attrition." },
  }[r.status];

  return (
    <div>
      <ToolHeader
        index="TOOL 02"
        kicker="WORKFORCE PLANNING"
        title="Shrinkage & Occupancy Calculator"
        desc="See exactly where scheduled hours go — planned shrink, net available capacity, and how hard your team is actually running. Results update live as you type."
        icon={<IconShrink className="h-6 w-6" />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-line bg-white p-6 shadow-panel transition-shadow duration-300 hover:shadow-lift">
          <h3 className="mb-4 border-b border-line pb-3 font-display text-sm font-semibold text-ink-700">Inputs · hours for the period</h3>
          <div className="space-y-4">
            <Field label="Total rostered hours" hint="schedule, not payroll">
              <input type="number" min={0} className="field-input font-mono" value={rostered} onChange={(e) => setRostered(e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="External shrink" hint="PTO · sick · absent">
                <input type="number" min={0} className="field-input font-mono" value={external} onChange={(e) => setExternal(e.target.value)} />
              </Field>
              <Field label="Internal shrink" hint="coaching · breaks · meetings">
                <input type="number" min={0} className="field-input font-mono" value={internal} onChange={(e) => setInternal(e.target.value)} />
              </Field>
            </div>
            <Field label="Total handling hours" hint="talk + hold + wrap">
              <input type="number" min={0} className="field-input font-mono" value={handling} onChange={(e) => setHandling(e.target.value)} />
            </Field>
            <PrimaryButton onClick={() => setFlashKey((k) => k + 1)} className="w-full">
              <IconRefresh className="h-4 w-4 transition-transform duration-500 group-hover:rotate-180" />
              Calculate metrics
            </PrimaryButton>
          </div>
        </section>

        <ResultsPanel title="Results dashboard" flashKey={flashKey} footnote={<>Occupancy = handling ÷ net available × 100 · Shrinkage = (external + internal) ÷ rostered × 100</>}>
          <div className="grid grid-cols-2 gap-3">
            <ResultTile label="Total shrinkage" value={fmt(shrinkPct)} suffix="%" tone="text-chart-orange" sub={`${fmt(num(external) + num(internal))}h of ${fmt(num(rostered))}h rostered`} />
            <ResultTile label="Occupancy" value={fmt(occ)} suffix="%" tone="text-chart-green" sub="handling vs net available" />
            <ResultTile label="Net available" value={fmt(net)} suffix="h" sub="rostered minus all shrink" />
            <ResultTile label="Idle / waiting" value={fmt(idle)} suffix="h" tone="text-chart-cyan" sub="available but not handling" />
          </div>

          <div className="mt-4 space-y-4">
            <div className="rounded-lg bg-white/[0.05] p-4 ring-1 ring-white/[0.07]">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">Where the hours go</p>
              <HoursBar rostered={num(rostered)} external={num(external)} internal={num(internal)} handling={num(handling)} />
            </div>
            <div className="grid grid-cols-2 items-center gap-3">
              <div className="flex justify-center rounded-lg bg-white/[0.05] p-3 ring-1 ring-white/[0.07]">
                <DonutChart
                  size={132}
                  thickness={20}
                  centerTop={`${fmt(shrinkPct)}%`}
                  centerBottom="SHRINK"
                  segments={[
                    { label: "External", value: num(external), color: "#EF476F" },
                    { label: "Internal", value: num(internal), color: "#FF9F1C" },
                    { label: "Productive", value: Math.max(0, num(rostered) - num(external) - num(internal)), color: "#2E6BFF" },
                  ]}
                />
              </div>
              <div className="flex justify-center rounded-lg bg-white/[0.05] p-3 ring-1 ring-white/[0.07]">
                <GaugeChart pct={r.occupancy} size={132} />
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg p-3.5 ring-1 transition-colors duration-300" style={{ background: `${statusMeta.color}14`, borderColor: "transparent", boxShadow: `inset 0 0 0 1px ${statusMeta.color}40` }}>
              <span className="mt-1.5 h-2.5 w-2.5 flex-none rounded-full pulse-dot" style={{ background: statusMeta.color }} />
              <div>
                <p className="font-display text-sm font-semibold" style={{ color: statusMeta.color }}>{statusMeta.label}</p>
                <p className="text-xs leading-relaxed text-white/60">{statusMeta.note}</p>
              </div>
            </div>
          </div>
        </ResultsPanel>
      </div>
    </div>
  );
}

/* ============================================================
   TOOL 03 · ERLANG C
   ============================================================ */

function ErlangTool() {
  const [interval, setInterval_] = useState("30");
  const [calls, setCalls] = useState("150");
  const [aht, setAht] = useState("280");
  const [slTarget, setSlTarget] = useState("80");
  const [answer, setAnswer] = useState("20");
  const [shrink, setShrink] = useState("30");
  const [flashKey, setFlashKey] = useState(0);

  const r = useMemo(
    () => calcErlang({ intervalMin: num(interval), calls: num(calls), ahtSec: num(aht), slTargetPct: num(slTarget), answerSec: num(answer), shrinkPct: num(shrink) }),
    [interval, calls, aht, slTarget, answer, shrink],
  );

  const raw = useCountUp(r.rawAgents);
  const scheduled = useCountUp(r.scheduled);
  const achieved = useCountUp(r.achievedSL * 100);
  const intensity = useCountUp(r.intensity);

  return (
    <div>
      <ToolHeader
        index="TOOL 03"
        kicker="WORKFORCE PLANNING"
        title="Erlang C Headcount Estimator"
        desc="Classic queueing math for a single interval: how many agents answer X contacts at AHT Y while holding your service level."
        icon={<IconCurve className="h-6 w-6" />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-line bg-white p-6 shadow-panel transition-shadow duration-300 hover:shadow-lift">
          <h3 className="mb-4 border-b border-line pb-3 font-display text-sm font-semibold text-ink-700">Interval inputs</h3>
          <div className="space-y-4">
            <Field label="Interval length">
              <div className="grid grid-cols-3 gap-2">
                {[{ v: "15", l: "15 min" }, { v: "30", l: "30 min" }, { v: "60", l: "60 min" }].map((o) => (
                  <button key={o.v} type="button" onClick={() => setInterval_(o.v)} className={`rounded-[10px] border-[1.5px] px-3 py-2 font-mono text-sm font-semibold transition-all duration-200 ${interval === o.v ? "border-brand-500 bg-brand-50 text-brand-700 shadow-[0_4px_12px_-6px_rgba(46,107,255,0.6)]" : "border-line bg-white text-ink-500 hover:border-brand-300 hover:text-brand-600"}`}>
                    {o.l}
                  </button>
                ))}
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Expected contacts" hint="calls / chats / tickets">
                <input type="number" min={0} className="field-input font-mono" value={calls} onChange={(e) => setCalls(e.target.value)} />
              </Field>
              <Field label="Average handle time" hint="seconds">
                <input type="number" min={0} className="field-input font-mono" value={aht} onChange={(e) => setAht(e.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Service level target" hint="% answered">
                <input type="number" min={1} max={99} className="field-input font-mono" value={slTarget} onChange={(e) => setSlTarget(e.target.value)} />
              </Field>
              <Field label="Answer-time target" hint="seconds">
                <input type="number" min={1} className="field-input font-mono" value={answer} onChange={(e) => setAnswer(e.target.value)} />
              </Field>
            </div>
            <Field label="Planned shrinkage" hint="applied to raw headcount">
              <input type="number" min={0} max={90} className="field-input font-mono" value={shrink} onChange={(e) => setShrink(e.target.value)} />
            </Field>
            <PrimaryButton onClick={() => setFlashKey((k) => k + 1)} className="w-full">
              <IconRefresh className="h-4 w-4 transition-transform duration-500 group-hover:rotate-180" />
              Calculate staffing
            </PrimaryButton>
          </div>
        </section>

        <ResultsPanel title="Required staffing" flashKey={flashKey} footnote={<>A = contacts × AHT ÷ interval · SL = 1 − C(N,A)·e^(−(N−A)·t/AHT) · Scheduled = raw ÷ (1 − shrink)</>}>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex items-center justify-between rounded-lg bg-brand-500/15 p-4 ring-1 ring-brand-400/30">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/25 text-brand-300">
                  <IconUsers className="h-5 w-5" />
                </span>
                <div>
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-300/90">Minimum agents on queue</span>
                  <span className="text-[11px] text-white/50">raw Erlang C answer for this interval</span>
                </div>
              </div>
              <span className="font-mono text-4xl font-semibold tabular-nums text-white">{r.ok ? Math.round(raw) : "—"}</span>
            </div>
            <ResultTile label="Service level achieved" value={r.ok ? fmt(achieved) : "—"} suffix={r.ok ? "%" : ""} tone="text-chart-green" sub={`target ${fmt(num(slTarget), 0)}% in ${fmt(num(answer), 0)}s`} />
            <ResultTile label="Traffic intensity" value={r.ok ? fmt(intensity) : "—"} suffix={r.ok ? " Erl" : ""} sub="offered load in erlangs" />
            <div className="col-span-2">
              <ResultTile label="Scheduled headcount (shrinkage loaded)" value={r.ok ? Math.round(scheduled).toString() : "—"} suffix={r.ok ? " agents" : ""} tone="text-chart-purple" sub={`${fmt(num(shrink), 0)}% shrink applied — put this number on the roster`} big />
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-white/[0.05] p-3 ring-1 ring-white/[0.07]">
            <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">Service level vs headcount</p>
            <StaffingCurve curve={r.curve} targetSL={Math.min(99.9, Math.max(1, num(slTarget))) / 100} chosenN={r.rawAgents} />
          </div>

          <p className="mt-4 text-xs leading-relaxed text-white/55">
            The orange dashed line is your SL target. Erlang C assumes a single queue, random arrivals and no abandonment — treat the output as a planning baseline, then overlay your real shrinkage and peak patterns.
          </p>
        </ResultsPanel>
      </div>
    </div>
  );
}

/* ============================================================
   TOOL 04 · CSAT / NPS FORECASTER
   ============================================================ */

function CsatTool() {
  const [mode, setMode] = useState<"csat" | "nps">("csat");
  const [pos, setPos] = useState("82");
  const [total, setTotal] = useState("100");
  const [target, setTarget] = useState("88");
  const [prom, setProm] = useState("45");
  const [pass, setPass] = useState("30");
  const [detr, setDetr] = useState("25");
  const [npsTarget, setNpsTarget] = useState("30");
  const [flashKey, setFlashKey] = useState(0);

  const r = useMemo(
    () => (mode === "csat" ? csatForecast(num(pos), num(total), num(target)) : npsForecast(num(prom), num(detr), num(pass), num(npsTarget))),
    [mode, pos, total, target, prom, detr, pass, npsTarget],
  );

  const current = useCountUp(clamp(r.currentPct, -100, 100));
  const progress = r.alreadyMet ? 100 : !r.achievable ? 0 : clamp((r.currentPct / (mode === "csat" ? num(target) : num(npsTarget))) * 100, 0, 100);

  const modeBtn = (m: "csat" | "nps", label: string, sub: string) => (
    <button
      type="button"
      onClick={() => setMode(m)}
      className={`flex-1 rounded-[10px] border-[1.5px] px-4 py-3 text-left transition-all duration-200 ${mode === m ? "border-brand-500 bg-brand-50 shadow-[0_6px_16px_-8px_rgba(46,107,255,0.5)]" : "border-line bg-white hover:border-brand-300"}`}
    >
      <span className={`block font-display text-sm font-bold ${mode === m ? "text-brand-700" : "text-ink-700"}`}>{label}</span>
      <span className="block text-[11px] text-ink-500">{sub}</span>
    </button>
  );

  return (
    <div>
      <ToolHeader
        index="TOOL 04"
        kicker="QUALITY ASSURANCE"
        title="CSAT / NPS Impact Forecaster"
        desc="Working a recovery plan? See exactly how many consecutive perfect responses it takes to drag your score back to target — before you promise it in the QBR."
        icon={<IconCsat className="h-6 w-6" />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-line bg-white p-6 shadow-panel transition-shadow duration-300 hover:shadow-lift">
          <h3 className="mb-4 border-b border-line pb-3 font-display text-sm font-semibold text-ink-700">Current score status</h3>
          <div className="space-y-4">
            <div className="flex gap-2">{modeBtn("csat", "CSAT mode", "satisfied ÷ surveys × 100")}{modeBtn("nps", "NPS mode", "promoters − detractors")}</div>
            {mode === "csat" ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Satisfied responses" hint="positive only">
                    <input type="number" min={0} className="field-input font-mono" value={pos} onChange={(e) => setPos(e.target.value)} />
                  </Field>
                  <Field label="Surveys received" hint="all responses">
                    <input type="number" min={0} className="field-input font-mono" value={total} onChange={(e) => setTotal(e.target.value)} />
                  </Field>
                </div>
                <Field label="Target CSAT" hint="%">
                  <input type="number" min={0} max={100} className="field-input font-mono" value={target} onChange={(e) => setTarget(e.target.value)} />
                </Field>
              </>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Promoters" hint="9–10">
                    <input type="number" min={0} className="field-input font-mono" value={prom} onChange={(e) => setProm(e.target.value)} />
                  </Field>
                  <Field label="Passives" hint="7–8">
                    <input type="number" min={0} className="field-input font-mono" value={pass} onChange={(e) => setPass(e.target.value)} />
                  </Field>
                  <Field label="Detractors" hint="0–6">
                    <input type="number" min={0} className="field-input font-mono" value={detr} onChange={(e) => setDetr(e.target.value)} />
                  </Field>
                </div>
                <Field label="Target NPS" hint="−100 to 100">
                  <input type="number" min={-100} max={100} className="field-input font-mono" value={npsTarget} onChange={(e) => setNpsTarget(e.target.value)} />
                </Field>
              </>
            )}
            <PrimaryButton onClick={() => setFlashKey((k) => k + 1)} className="w-full">
              <IconBolt className="h-4 w-4" />
              Forecast recovery
            </PrimaryButton>
          </div>
        </section>

        <ResultsPanel title="Target recovery plan" flashKey={flashKey} footnote={<>Needed n solves ({mode === "csat" ? "pos + n) ÷ (total + n" : "prom + n − det) ÷ (total + n"} × scale ≥ target — assuming every new response is a perfect one.</>}>
          <div className="space-y-3">
            <div className="rounded-lg bg-white/[0.06] p-4 ring-1 ring-white/[0.08]">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">Current {mode.toUpperCase()} score</span>
              <span className="font-display text-4xl font-bold tabular-nums text-white">
                {fmt(current)}
                <span className="text-lg text-white/50">{mode === "csat" ? "%" : ""}</span>
              </span>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="bar-grow h-full rounded-full bg-gradient-to-r from-brand-500 to-chart-cyan transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-1.5 font-mono text-[10px] text-white/45">
                progress to {mode === "csat" ? `${fmt(num(target), 0)}%` : `NPS ${fmt(num(npsTarget), 0)}`} target
              </p>
            </div>

            <div className="rounded-lg bg-brand-500/15 p-4 ring-1 ring-brand-400/30">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-300/90">
                Consecutive perfect {mode === "csat" ? "surveys" : "promoter scores"} needed
              </span>
              <span className="font-mono text-5xl font-semibold tabular-nums text-white">
                {r.alreadyMet ? "0" : !r.achievable ? "∞" : fmt(r.needed, 0)}
              </span>
              <p className="mt-1 text-[11px] leading-relaxed text-white/60">
                {r.alreadyMet
                  ? "Target already met — protect it instead of chasing it."
                  : !r.achievable
                    ? "Mathematically unreachable: the target sits at or above the scale ceiling."
                    : `If every single next response is a ${mode === "csat" ? "satisfied survey" : "9 or 10"}, you hit target after ${fmt(r.needed, 0)} more.`}
              </p>
            </div>

            {!r.alreadyMet && r.achievable && (
              <div className="grid grid-cols-2 gap-3">
                <ResultTile label={mode === "csat" ? "Surveys after recovery" : "Responses after recovery"} value={fmt(mode === "csat" ? num(total) + r.needed : num(prom) + num(pass) + num(detr) + r.needed, 0)} sub="new sample size" />
                <ResultTile label={mode === "csat" ? "Satisfied after recovery" : "Promoters after recovery"} value={fmt((mode === "csat" ? num(pos) : num(prom)) + r.needed, 0)} tone="text-chart-green" sub="all-positive assumption" />
              </div>
            )}

            {r.achievable && !r.alreadyMet && r.needed > 25 && (
              <p className="rounded-lg bg-chart-orange/10 p-3 text-xs leading-relaxed text-chart-orange ring-1 ring-chart-orange/25">
                Heads up — needing {fmt(r.needed, 0)} straight perfect responses is a steep climb. Pair it with a root-cause fix on the detractor drivers instead of relying on survey volume.
              </p>
            )}

            <Sparkline values={[...Array(12)].map((_, i) => r.currentPct + (i / 11) * (Math.max(0, (mode === "csat" ? num(target) : num(npsTarget)) - r.currentPct)))} color="#2E6BFF" w={220} h={30} />
          </div>
        </ResultsPanel>
      </div>
    </div>
  );
}

/* ============================================================
   TOOL 05 · COACHING NOTE GENERATOR
   ============================================================ */

const today = () => new Date().toISOString().slice(0, 10);
const docLines = (s: string): string[] => s.split("\n").map((l) => l.trim()).filter(Boolean);
const bullet = (l: string): string => (/^\d+[.)]\s/.test(l) ? `  ${l}` : l.startsWith("•") ? `  ${l}` : `  • ${l.replace(/^[-–—]\s*/, "")}`);

function CoachingTool() {
  const [agent, setAgent] = useState("");
  const [date, setDate] = useState(today());
  const [focus, setFocus] = useState("");
  const [wins, setWins] = useState("");
  const [opps, setOpps] = useState("");
  const [actions, setActions] = useState("");
  const [copied, setCopied] = useState(false);
  const [stamp, setStamp] = useState<string | null>(null);
  const previewRef = useRef<HTMLPreElement>(null);

  const doc = useMemo(() => {
    const bar = "─".repeat(52);
    const top = "═".repeat(52);
    const section = (title: string, body: string[], numbered = false) => {
      const rows = body.length ? body.map((l, i) => (numbered ? `  ${i + 1}. ${l.replace(/^\d+[.)]\s*/, "")}` : bullet(l))) : ["  —"];
      return [`▍ ${title}`, ...rows, ""];
    };
    return [
      `╔${top}╗`,
      `║  1:1 COACHING RECORD · CC TOOLKIT`.padEnd(53) + "║",
      `╚${top}╝`,
      `AGENT        : ${agent || "—"}`,
      `DATE         : ${date || "—"}`,
      `FOCUS AREA   : ${focus || "—"}`,
      "",
      bar,
      "",
      ...section("WINS & STRENGTHS", docLines(wins)),
      ...section("OPPORTUNITIES / ROOT CAUSE", docLines(opps)),
      ...section("ACTION ITEMS (SMART)", docLines(actions), true),
      bar,
      `NEXT CHECK-IN: ______________    TL SIGN-OFF: ______________`,
      ``,
      `Generated locally in the browser · no data was uploaded`,
    ].join("\n");
  }, [agent, date, focus, wins, opps, actions]);

  const copy = async () => {
    (await copyText(doc)) && setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    const name = `coaching-${(agent || "agent").toLowerCase().replace(/\s+/g, "-")}-${date || "note"}.txt`;
    downloadBlob(new Blob([doc], { type: "text/plain;charset=utf-8" }), name);
  };

  const generate = () => {
    setStamp(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    previewRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  return (
    <div>
      <ToolHeader
        index="TOOL 05"
        kicker="QUALITY ASSURANCE"
        title="1:1 & Coaching Note Generator"
        desc="Type raw notes, get a clean structured record you can paste into your tracker or HR system. Built entirely in your browser — nothing is stored or sent anywhere."
        icon={<IconClipboard className="h-6 w-6" />}
      />

      <section className="rounded-xl border border-line bg-white p-6 shadow-panel transition-shadow duration-300 hover:shadow-lift">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Agent name / ID">
            <input type="text" className="field-input" placeholder="e.g. Agent A" value={agent} onChange={(e) => setAgent(e.target.value)} />
          </Field>
          <Field label="Session date">
            <input type="date" className="field-input font-mono" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Focus metric / area">
            <input type="text" className="field-input" placeholder="e.g. AHT reduction, Quality" value={focus} onChange={(e) => setFocus(e.target.value)} />
          </Field>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Field label="Wins & strengths" hint="one per line">
            <textarea rows={5} className="field-input resize-y leading-relaxed" placeholder={"Great empathy on ticket #1234\nConsistently meeting schedule adherence"} value={wins} onChange={(e) => setWins(e.target.value)} />
          </Field>
          <Field label="Opportunities / root cause" hint="one per line">
            <textarea rows={5} className="field-input resize-y leading-relaxed" placeholder={"Long holds during system lookups\nUnfamiliar with refund policy steps"} value={opps} onChange={(e) => setOpps(e.target.value)} />
          </Field>
          <Field label="Action items" hint="become numbered SMART goals">
            <textarea rows={5} className="field-input resize-y leading-relaxed" placeholder={"Review refund KB article by Friday\nUse quick-text macros to cut wrap time"} value={actions} onChange={(e) => setActions(e.target.value)} />
          </Field>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <PrimaryButton onClick={generate}>
            <IconBolt className="h-4 w-4" />
            Generate formatted note
          </PrimaryButton>
          <GhostButton onClick={copy}>
            {copied ? <IconCheck className="h-4 w-4 text-chart-green" /> : <IconCopy className="h-4 w-4" />}
            {copied ? "Copied to clipboard" : "Copy to clipboard"}
          </GhostButton>
          <GhostButton onClick={download}>
            <IconDownload className="h-4 w-4" />
            Download .txt
          </GhostButton>
          {stamp && (
            <span className="rise-in font-mono text-[11px] text-ink-500">
              formatted at <strong className="text-brand-600">{stamp}</strong>
            </span>
          )}
        </div>

        <div className="mt-5">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-500">Output preview — updates live</p>
          <pre ref={previewRef} key={stamp ?? "live"} className="navy-scroll max-h-96 overflow-auto rounded-xl bg-navy-900 p-5 font-mono text-[12px] leading-relaxed text-brand-100/90 ring-1 ring-white/10">
            {doc}
          </pre>
        </div>
      </section>
    </div>
  );
}

/* ============================================================
   TOOL 06 · SHIFT SWAP CHECKER
   ============================================================ */

function SwapTool() {
  const [aStart, setAStart] = useState("08:00");
  const [aEnd, setAEnd] = useState("17:00");
  const [bStart, setBStart] = useState("13:00");
  const [bEnd, setBEnd] = useState("22:00");
  const [ran, setRan] = useState(false);

  const r = useMemo(() => (ran ? checkSwap(toMin(aStart), toMin(aEnd), toMin(bStart), toMin(bEnd)) : null), [ran, aStart, aEnd, bStart, bEnd]);

  const verdictMeta = r
    ? {
        ok: { label: "Swap approved", color: "#10B981", note: "All scheduling rules pass — safe to approve and publish." },
        caution: { label: "Approve with caution", color: "#FF9F1C", note: "One rule is bent. Review the flagged check before signing off." },
        block: { label: "Block this swap", color: "#EF476F", note: "Multiple rules fail — approving creates compliance or coverage risk." },
      }[r.verdict]
    : null;

  const shiftCard = (who: string, color: string, start: string, end: string, setStart: (v: string) => void, setEnd: (v: string) => void, dur?: number) => (
    <div className="rounded-lg border border-line bg-paper/50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-2 font-display text-sm font-semibold text-ink-700">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
          {who}
        </span>
        {dur !== undefined && <span className="font-mono text-[11px] text-ink-500">{fmtDur(dur)}</span>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ink-500">Start</span>
          <input type="time" className="field-input font-mono" value={start} onChange={(e) => setStart(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ink-500">End</span>
          <input type="time" className="field-input font-mono" value={end} onChange={(e) => setEnd(e.target.value)} />
        </label>
      </div>
    </div>
  );

  return (
    <div>
      <ToolHeader
        index="TOOL 06"
        kicker="SHIFT MANAGEMENT"
        title="Shift Trade / Roster Swap Checker"
        desc="Two agents want to trade shifts? Run the swap against overtime, 12-hour cap, coverage and booking rules before you say yes."
        icon={<IconSwap className="h-6 w-6" />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-xl border border-line bg-white p-6 shadow-panel transition-shadow duration-300 hover:shadow-lift">
          <h3 className="border-b border-line pb-3 font-display text-sm font-semibold text-ink-700">The proposed trade</h3>
          {shiftCard("Agent A — original shift", "#2E6BFF", aStart, aEnd, setAStart, setAEnd, r?.durA)}
          {shiftCard("Agent B — original shift", "#FF9F1C", bStart, bEnd, setBStart, setBEnd, r?.durB)}
          <PrimaryButton onClick={() => setRan(true)} className="w-full">
            <IconSwap className="h-4 w-4" />
            Evaluate swap
          </PrimaryButton>
          <p className="text-[11px] leading-relaxed text-ink-500">
            After the trade, Agent B works A's shift and vice versa — coverage is checked on the combined timeline. Overnight shifts (end before start) are handled automatically.
          </p>
        </section>

        <ResultsPanel title="Swap validation" footnote={<>Rules: no overlap · no overtime over 8h 30m · under 12h cap · coverage preserved · inside 6 AM – 11 PM window.</>}>
          {!r || !verdictMeta ? (
            <p className="text-sm leading-relaxed text-white/55">Set both shifts and click <strong className="text-brand-200">Evaluate swap</strong> to run the rule checks.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg p-3.5 ring-1" style={{ background: `${verdictMeta.color}14`, boxShadow: `inset 0 0 0 1px ${verdictMeta.color}40` }}>
                <span className="mt-1.5 h-2.5 w-2.5 flex-none rounded-full pulse-dot" style={{ background: verdictMeta.color }} />
                <div>
                  <p className="font-display text-sm font-semibold" style={{ color: verdictMeta.color }}>{verdictMeta.label}</p>
                  <p className="text-xs leading-relaxed text-white/60">{verdictMeta.note}</p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">Combined coverage timeline</p>
                <DayTimeline a={r.a} b={r.b} overlapStart={r.overlapStart} overlapEnd={r.overlapEnd} hasOverlap={r.hasOverlap} />
              </div>

              <ul className="space-y-2">
                {r.checks.map((c, i) => (
                  <li key={i} className={`flex items-start gap-2.5 rounded-lg p-2.5 ring-1 transition-all duration-300 ${c.pass ? "bg-white/[0.05] ring-white/[0.08]" : "bg-chart-red/10 ring-chart-red/25"}`} style={{ animationDelay: `${i * 60}ms` }}>
                    <span className={`mt-0.5 flex h-4.5 w-4.5 flex-none items-center justify-center rounded-full ${c.pass ? "bg-chart-green/20 text-chart-green" : "bg-chart-red/20 text-chart-red"}`} style={{ width: 18, height: 18 }}>
                      {c.pass ? <IconCheck className="h-3 w-3" /> : <span className="font-mono text-[11px] font-bold">!</span>}
                    </span>
                    <div>
                      <p className={`text-[13px] font-semibold ${c.pass ? "text-white/85" : "text-chart-red"}`}>{c.label}</p>
                      <p className="text-[11px] text-white/50">{c.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="grid grid-cols-2 gap-3">
                <ResultTile label="Combined coverage" value={fmtDur(r.coverageAfter)} sub={r.delta === 0 ? `unchanged · was ${fmtDur(r.coverageBefore)}` : r.delta > 0 ? `grows by ${fmtDur(r.delta)}` : `drops by ${fmtDur(-r.delta)} — flag it`} />
                <ResultTile label="Double-booked time" value={r.hasOverlap ? fmtDur(r.doubleBooked) : "0m"} tone={r.hasOverlap ? "text-chart-red" : "text-chart-green"} sub={r.hasOverlap ? "agents overlap on the floor" : "no overlap detected"} />
              </div>
            </div>
          )}
        </ResultsPanel>
      </div>
    </div>
  );
}

export { ChartStudio, ShrinkageTool, ErlangTool, CsatTool, CoachingTool, SwapTool };
