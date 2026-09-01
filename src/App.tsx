import React, { useEffect, useState } from "react";
import { ChartStudio, CoachingTool, CsatTool, ErlangTool, ShrinkageTool, SwapTool } from "./tools";
import {
  IconChartStudio,
  IconClipboard,
  IconCsat,
  IconCurve,
  IconLogo,
  IconShield,
  IconShrink,
  IconSwap,
  IconCoffee,
  Reveal,
} from "./components";

export const COFFEE_URL = "https://buymeacoffee.com/nhom";

type TabId = "chart" | "shrinkage" | "erlang" | "csat" | "coaching" | "swap";

const TABS: { id: TabId; label: string; short: string; icon: typeof IconShrink; badge?: string }[] = [
  { id: "chart", label: "Chart Studio", short: "Charts", icon: IconChartStudio, badge: "NEW" },
  { id: "shrinkage", label: "Shrinkage & Occupancy", short: "Shrinkage", icon: IconShrink },
  { id: "erlang", label: "Erlang C Calculator", short: "Erlang C", icon: IconCurve },
  { id: "csat", label: "CSAT / NPS Forecaster", short: "CSAT / NPS", icon: IconCsat },
  { id: "coaching", label: "1:1 Note Generator", short: "1:1 Notes", icon: IconClipboard },
  { id: "swap", label: "Shift Swap Checker", short: "Swap Check", icon: IconSwap },
];

const TICKER = [
  { k: "SHRINKAGE", v: "28.4%" },
  { k: "OCCUPANCY", v: "84.2%" },
  { k: "SL 80/20", v: "81.6%" },
  { k: "AHT", v: "4:37" },
  { k: "CSAT", v: "87.3%" },
  { k: "NPS", v: "+42" },
  { k: "ADHERENCE", v: "93.1%" },
  { k: "ABANDON", v: "2.8%" },
  { k: "CC TOOLKIT", v: "CC.NHOM.ME" },
];

function Ticker() {
  const row = (keyPrefix: string) => (
    <div className="flex flex-none items-center" key={keyPrefix}>
      {TICKER.map((t, i) => (
        <span key={`${keyPrefix}-${i}`} className="flex items-center gap-2 px-6 font-mono text-[11px] tracking-[0.12em] text-white/60">
          <span className="text-white/35">{t.k}</span>
          <span className="font-semibold text-brand-200">{t.v}</span>
          <span className="ml-4 h-1 w-1 rounded-full bg-brand-500/60" />
        </span>
      ))}
    </div>
  );
  return (
    <div className="overflow-hidden border-b border-navy-700/50 bg-navy-950 py-1.5">
      <div className="ticker-track flex w-max">{row("a")}{row("b")}</div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState<TabId>(() => {
    const saved = localStorage.getItem("cctoolkit-tab") as TabId | null;
    return saved && TABS.some((t) => t.id === saved) ? saved : "chart";
  });

  useEffect(() => {
    localStorage.setItem("cctoolkit-tab", tab);
  }, [tab]);

  const Tool = () => {
    switch (tab) {
      case "chart":
        return <ChartStudio />;
      case "shrinkage":
        return <ShrinkageTool />;
      case "erlang":
        return <ErlangTool />;
      case "csat":
        return <CsatTool />;
      case "coaching":
        return <CoachingTool />;
      case "swap":
        return <SwapTool />;
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* ---------- header ---------- */}
      <header className="bg-navy-950 text-white">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-3 px-4 py-4 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <IconLogo className="h-9 w-9 text-brand-500" />
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight">
                CC ToolKit<span className="text-brand-400"> · Contact Center Tools</span>
              </h1>
              <p className="max-w-xl text-xs leading-relaxed text-white/55">
                Client-side toolkit for contact center leaders: workforce planning, quality assurance, shift management, and data visualization.
              </p>
            </div>
          </div>
          <a
            href={COFFEE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 self-start rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_6px_18px_-6px_rgba(46,107,255,0.8)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-400 md:self-auto"
          >
            <IconCoffee className="h-4 w-4" />
            Buy me a coffee
          </a>
        </div>
        <Ticker />
      </header>

      {/* ---------- sticky tab rail ---------- */}
      <nav className="sticky top-0 z-20 border-b border-line bg-white/90 shadow-[0_4px_20px_-12px_rgba(13,36,104,0.25)] backdrop-blur-md">
        <div className="navy-scroll mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 py-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`relative flex flex-none items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-all duration-200 ${
                  active ? "bg-brand-500 text-white shadow-[0_6px_16px_-6px_rgba(46,107,255,0.7)]" : "text-ink-500 hover:bg-brand-50 hover:text-brand-700"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden lg:inline">{t.label}</span>
                <span className="lg:hidden">{t.short}</span>
                {t.badge && (
                  <span className={`rounded px-1 py-px font-mono text-[9px] font-bold tracking-wider ${active ? "bg-white/20 text-white" : "bg-chart-orange/15 text-chart-orange"}`}>
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
          <span className="ml-auto hidden items-center gap-1.5 pl-3 text-[11px] font-medium text-ink-500 md:flex">
            <IconShield className="h-4 w-4 text-chart-green" />
            100% client-side — your data never leaves this tab
          </span>
        </div>
      </nav>

      {/* ---------- intro band ---------- */}
      <div className="border-b border-line bg-white/70">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 px-4 py-5 md:flex-row md:items-center">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink-900">
              Six tools, <span className="text-brand-500">zero</span> servers.
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-500">
              Client-side toolkit for contact center leaders: workforce planning, quality assurance, shift management, and data
              visualization. Runs entirely in your browser — no accounts, no uploads, works offline once loaded.
            </p>
          </div>
          <div className="flex flex-none gap-6">
            {[
              { v: "6", l: "tools" },
              { v: "0", l: "servers" },
              { v: "100%", l: "free" },
            ].map((s) => (
              <div key={s.l} className="text-center">
                <div className="font-display text-2xl font-bold tabular-nums text-brand-600">{s.v}</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-500">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- active tool ---------- */}
      <main className="mx-auto w-full max-w-6xl flex-grow px-4 py-8">
        <div key={tab} className="rise-in">
          <Tool />
        </div>

        <Reveal className="mt-12">
          <div className="rounded-xl border border-line bg-white p-5 shadow-panel">
            <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-500">Formula cheat-sheet</p>
            <div className="grid grid-cols-1 gap-x-8 gap-y-2 text-[12.5px] text-ink-700 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Shrinkage %", "(external + internal) ÷ rostered × 100"],
                ["Occupancy %", "handling ÷ net available × 100"],
                ["Erlangs (A)", "contacts × AHT ÷ interval seconds"],
                ["Scheduled staff", "Erlang C raw ÷ (1 − shrink)"],
                ["CSAT %", "satisfied ÷ surveys × 100"],
                ["NPS", "% promoters − % detractors"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-3 border-b border-dashed border-line pb-1.5">
                  <span className="font-semibold text-ink-900">{k}</span>
                  <span className="text-right font-mono text-[11px] text-brand-700">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </main>

      {/* ---------- footer ---------- */}
      <footer className="mt-8 border-t border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-6 text-center md:flex-row md:justify-between md:text-left">
          <div>
            <p className="font-display text-sm font-bold text-ink-900">CC ToolKit · Contact Center Tools</p>
            <p className="mt-0.5 text-xs text-ink-500">
              Client-side toolkit for contact center leaders: workforce planning, quality assurance, shift management, and data visualization.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={COFFEE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border-[1.5px] border-line px-3 py-1.5 text-xs font-semibold text-ink-700 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
            >
              <IconCoffee className="h-3.5 w-3.5" />
              Support this project
            </a>
            <span className="rounded-lg bg-navy-950 px-3 py-1.5 font-mono text-[11px] font-semibold text-brand-300">cc.nhom.me</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
