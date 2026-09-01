/* =========================================================
   CC ToolKit — all math, formatting & chart-export helpers.
   100% client-side. Nothing ever leaves the browser.
   ========================================================= */

export const num = (s: string): number => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export const fmt = (n: number, d = 1) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: d });

export const toMin = (t: string): number => {
  const [h, m] = t.split(":").map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
};

export const fmtDur = (min: number): string => {
  const m = Math.round(min);
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r}m`;
  return `${h}h ${r.toString().padStart(2, "0")}m`;
};

export const fmtClock = (min: number): string => {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const r = m % 60;
  const ap = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${r.toString().padStart(2, "0")} ${ap}`;
};

/* ---------- Tool 02 · Shrinkage & Occupancy ---------- */
export interface ShrinkInput {
  rostered: number;
  external: number;
  internal: number;
  handling: number;
}
export interface ShrinkResult {
  ok: boolean;
  totalShrink: number;
  shrinkPct: number;
  externalPct: number;
  internalPct: number;
  netAvailable: number;
  occupancy: number;
  idle: number;
  status: "healthy" | "hot" | "overloaded";
}

export function calcShrinkage(i: ShrinkInput): ShrinkResult {
  const totalShrink = i.external + i.internal;
  const netAvailable = i.rostered - totalShrink;
  const shrinkPct = i.rostered > 0 ? (totalShrink / i.rostered) * 100 : 0;
  const externalPct = i.rostered > 0 ? (i.external / i.rostered) * 100 : 0;
  const internalPct = i.rostered > 0 ? (i.internal / i.rostered) * 100 : 0;
  const occupancy = netAvailable > 0 ? clamp((i.handling / netAvailable) * 100, 0, 999) : 0;
  const idle = Math.max(0, netAvailable - i.handling);
  const ok = i.rostered > 0 && netAvailable > 0;
  const status: ShrinkResult["status"] = occupancy > 90 ? "overloaded" : occupancy >= 80 ? "hot" : "healthy";
  return { ok, totalShrink, shrinkPct, externalPct, internalPct, netAvailable, occupancy, idle, status };
}

/* ---------- Tool 03 · Erlang C ---------- */
export interface ErlangInput {
  intervalMin: number;
  calls: number;
  ahtSec: number;
  slTargetPct: number;
  answerSec: number;
  shrinkPct: number;
}
export interface ErlangResult {
  ok: boolean;
  intensity: number;
  rawAgents: number;
  scheduled: number;
  achievedSL: number;
  probWait: number;
  curve: { n: number; sl: number }[];
}

const erlangC = (A: number, N: number): number => {
  if (N <= 0) return 1;
  if (A <= 0) return 0;
  let sum = 0;
  let term = 1;
  for (let k = 0; k <= N - 1; k++) {
    if (k > 0) term *= A / k;
    sum += term;
  }
  const last = term * (A / N);
  const denom = sum + last / (1 - A / N);
  if (!Number.isFinite(denom) || denom === 0) return 1;
  return clamp(last / ((1 - A / N) * denom), 0, 1);
};

const serviceLevel = (A: number, N: number, t: number, aht: number): number => {
  if (N <= A) return 0;
  const pw = erlangC(A, N);
  return clamp(1 - pw * Math.exp(-((N - A) * (t / aht))), 0, 1);
};

export function calcErlang(i: ErlangInput): ErlangResult {
  const A = (i.calls * i.ahtSec) / 60 / i.intervalMin;
  const fail: ErlangResult = { ok: false, intensity: A, rawAgents: 0, scheduled: 0, achievedSL: 0, probWait: 0, curve: [] };
  if (!(A > 0) || i.ahtSec <= 0 || i.intervalMin <= 0) return fail;
  const nFloor = Math.max(1, Math.floor(A));
  let N = nFloor + 1;
  const target = clamp(i.slTargetPct, 1, 99.9) / 100;
  while (N < 500 && serviceLevel(A, N, i.answerSec, i.ahtSec) < target) N++;
  if (N >= 500) return fail;
  const curve: { n: number; sl: number }[] = [];
  for (let n = nFloor + 1; n <= Math.max(N + 4, nFloor + 10); n++) {
    curve.push({ n, sl: serviceLevel(A, n, i.answerSec, i.ahtSec) });
  }
  const scheduled = Math.ceil(N / (1 - clamp(i.shrinkPct, 0, 90) / 100));
  return {
    ok: true,
    intensity: A,
    rawAgents: N,
    scheduled,
    achievedSL: serviceLevel(A, N, i.answerSec, i.ahtSec),
    probWait: erlangC(A, N),
    curve,
  };
}

/* ---------- Tool 04 · CSAT / NPS forecaster ---------- */
export interface SurveyForecast {
  currentPct: number;
  needed: number;
  achievable: boolean;
  alreadyMet: boolean;
}

export const csatForecast = (pos: number, total: number, targetPct: number): SurveyForecast =>
  surveyForecast(pos, total, targetPct, 100);

export const npsForecast = (prom: number, detr: number, pass: number, target: number): SurveyForecast =>
  surveyForecast(prom - detr, prom + detr + pass, target, 200);

function surveyForecast(numer: number, denom: number, target: number, scale: number): SurveyForecast {
  const currentPct = denom > 0 ? (numer / denom) * scale : 0;
  if (denom <= 0) return { currentPct: 0, needed: 0, achievable: false, alreadyMet: false };
  if (currentPct >= target) return { currentPct, needed: 0, achievable: true, alreadyMet: true };
  if (target >= scale) return { currentPct, needed: Infinity, achievable: false, alreadyMet: false };
  const needed = Math.ceil((target * denom - scale * numer) / (scale - target));
  return { currentPct, needed, achievable: true, alreadyMet: false };
}

/* ---------- Tool 06 · shift swap checker ---------- */
export interface SwapShift {
  start: number;
  end: number;
}
export interface SwapCheck {
  a: SwapShift;
  b: SwapShift;
  durA: number;
  durB: number;
  hasOverlap: boolean;
  overlapStart: number;
  overlapEnd: number;
  coverageBefore: number;
  coverageAfter: number;
  doubleBooked: number;
  overtimeA: boolean;
  overtimeB: boolean;
  longShiftA: boolean;
  longShiftB: boolean;
  delta: number;
  earlyStart: boolean;
  lateEnd: boolean;
  verdict: "ok" | "caution" | "block";
  checks: { label: string; pass: boolean; detail: string }[];
}

export function checkSwap(aStart: number, aEnd: number, bStart: number, bEnd: number): SwapCheck {
  const a: SwapShift = { start: aStart, end: aEnd <= aStart ? aEnd + 1440 : aEnd };
  const b: SwapShift = { start: bStart, end: bEnd <= bStart ? bEnd + 1440 : bEnd };
  const durA = a.end - a.start;
  const durB = b.end - b.start;

  const overlapStart = Math.max(a.start, b.start);
  const overlapEnd = Math.min(a.end, b.end);
  const hasOverlap = overlapEnd > overlapStart;

  const before = Math.max(a.end, b.end) - Math.min(a.start, b.start);
  const after = Math.abs(a.end - b.start) + Math.abs(b.end - a.start);
  const doubleBooked = hasOverlap ? overlapEnd - overlapStart : 0;
  const delta = after - before;

  const overtimeA = durA > 510;
  const overtimeB = durB > 510;
  const longShiftA = durA > 720;
  const longShiftB = durB > 720;
  const earlyStart = Math.min(a.start, b.start) < 360;
  const lateEnd = Math.max(a.end, b.end) > 1380;

  const checks = [
    {
      label: "No double-booking",
      pass: !hasOverlap,
      detail: hasOverlap ? `Overlap ${fmtClock(overlapStart)} – ${fmtClock(overlapEnd)} (${fmtDur(doubleBooked)})` : "Shifts never overlap",
    },
    {
      label: "No overtime created",
      pass: !overtimeA && !overtimeB,
      detail:
        overtimeA || overtimeB
          ? `${[overtimeA && "Agent A", overtimeB && "Agent B"].filter(Boolean).join(" & ")} exceed 8h 30m`
          : "Both shifts within 8h 30m",
    },
    {
      label: "Under 12-hour cap",
      pass: !longShiftA && !longShiftB,
      detail: longShiftA || longShiftB ? "A shift exceeds the 12h safety cap" : "Both under 12 hours",
    },
    {
      label: "Coverage preserved",
      pass: delta >= 0,
      detail:
        delta === 0
          ? `Same span · ${fmtDur(before)}`
          : delta > 0
            ? `Team coverage grows by ${fmtDur(delta)}`
            : `Team coverage drops by ${fmtDur(-delta)}`,
    },
    {
      label: "Inside standard window",
      pass: !earlyStart && !lateEnd,
      detail:
        earlyStart || lateEnd
          ? `${earlyStart ? "Starts before 6:00 AM" : ""}${earlyStart && lateEnd ? " · " : ""}${lateEnd ? "Ends after 11:00 PM" : ""}`
          : "Falls within 6:00 AM – 11:00 PM",
    },
  ];

  const failed = checks.filter((c) => !c.pass);
  const verdict: SwapCheck["verdict"] = failed.length === 0 ? "ok" : failed.length === 1 ? "caution" : "block";

  return {
    a,
    b,
    durA,
    durB,
    hasOverlap,
    overlapStart,
    overlapEnd,
    coverageBefore: before,
    coverageAfter: after,
    doubleBooked,
    overtimeA,
    overtimeB,
    longShiftA,
    longShiftB,
    delta,
    earlyStart,
    lateEnd,
    verdict,
    checks,
  };
}

/* ---------- Chart Studio · export helpers ---------- */
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export function serializeSvg(el: SVGSVGElement): string {
  const clone = el.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(el.viewBox.baseVal.width || 960));
  clone.setAttribute("height", String(el.viewBox.baseVal.height || 540));
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(clone);
}

export function svgToPngBlob(svgText: string, w: number, h: number, scale: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG encode failed"))), "image/png");
    };
    img.onerror = () => reject(new Error("SVG rasterize failed"));
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgText);
  });
}
