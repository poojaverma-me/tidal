"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Plus, RotateCcw, Sparkles, Trash2, Wand2, Zap } from "lucide-react";
import { useMemo } from "react";
import { DEFAULT_DEPARTMENTS, SCENARIOS } from "@/lib/data";
import { ms, usd } from "@/lib/format";
import type { Department, Routing } from "@/lib/types";
import { Switch } from "./ui";

export type Reroute = { before: Record<string, string>; prevDepts: Department[]; nextDepts: Department[]; wallMs: number; costUsd: number; tickets: number };

const PALETTE = ["#007AFF", "#5856D6", "#32ADE6", "#FF9500", "#FF3B30", "#34C759", "#AF52DE", "#A2845E", "#FF2D55", "#00C7BE", "#FFCC00"];

type Props = {
  departments: Department[];
  setDepartments: (d: Department[] | ((d: Department[]) => Department[])) => void;
  routedWith: Department[];
  changed: boolean;
  openCount: number;
  onReroute: () => void;
  reroute: Reroute | null;
  routing: Record<string, Routing>;
  pendingCount: number;
};

export default function Teams({ departments, setDepartments, routedWith, changed, openCount, onReroute, reroute, routing, pendingCount }: Props) {
  const update = (id: string, patch: Partial<Department>) => setDepartments((ds) => ds.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  const busy = pendingCount > 0;

  return (
    <div className="thin-scroll h-full overflow-y-auto">
      <AnimatePresence>
        {(changed || busy) && (
          <motion.div initial={{ y: -60 }} animate={{ y: 0 }} exit={{ y: -60 }} className="sidebar sticky top-0 z-20 border-b border-line">
            <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-3 px-6 py-3">
              <Wand2 size={17} className="text-teal" />
              <span className="text-[13.5px] font-medium">{busy ? `Jev is re-routing… ${pendingCount} to go` : "Routing changed. The open backlog still uses the old team list."}</span>
              <button onClick={() => setDepartments(routedWith)} disabled={busy} className="ml-auto text-[13px] text-ink-2 hover:text-ink disabled:opacity-40">
                Discard
              </button>
              <button
                onClick={onReroute}
                disabled={busy || !departments.some((d) => d.available)}
                className="flex h-9 items-center gap-2 rounded-full bg-accent px-4 text-[13.5px] font-semibold text-white shadow-[0_8px_20px_-8px_var(--teal)] transition hover:brightness-110 active:scale-95 disabled:opacity-60"
              >
                {busy ? <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent spin" /> : <Zap size={15} fill="currentColor" />}
                Re-route {openCount} open tickets
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-[1100px] px-6 pb-20 pt-8">
        <div className="text-[12.5px] font-semibold uppercase tracking-[0.08em] text-teal">Teams & routing</div>
        <h1 className="mt-1 font-rounded text-[2.4rem] font-extrabold leading-tight tracking-tight">Your org chart is the routing rule.</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-ink-2">
          Jev routes to whatever teams are listed here, using their names and descriptions as the options of one Choice question. Take a team offline,
          merge two, or add a new one, then re-route the whole backlog in about a second. No retraining, no prompt rewrite.
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => setDepartments(s.apply(DEFAULT_DEPARTMENTS))}
              className="card group flex items-start gap-3 rounded-2xl p-4 text-left transition hover:-translate-y-0.5 hover:ring-2 hover:ring-teal/40"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-teal-soft text-teal group-hover:bg-accent group-hover:text-white">
                <Sparkles size={16} />
              </span>
              <span>
                <span className="block text-[14px] font-semibold">{s.title}</span>
                <span className="block text-[12.5px] text-ink-3">{s.detail}</span>
              </span>
            </button>
          ))}
        </div>

        {reroute && <RerouteDiff reroute={reroute} routing={routing} />}

        <div className="mt-8 flex items-center justify-between">
          <h2 className="font-rounded text-xl font-bold">{departments.length} teams</h2>
          <div className="flex gap-2">
            <button onClick={() => setDepartments(DEFAULT_DEPARTMENTS)} className="flex h-8 items-center gap-1.5 rounded-full bg-fill px-3 text-[12.5px] font-medium text-ink-2 hover:text-ink">
              <RotateCcw size={13} /> Default teams
            </button>
            <button
              onClick={() =>
                setDepartments((ds) => [
                  ...ds,
                  { id: `team-${ds.length + 1}-${Math.random().toString(36).slice(2, 6)}`, name: "New team", description: "Describe what this team handles", color: PALETTE[ds.length % PALETTE.length], available: true, lead: "" },
                ])
              }
              className="flex h-8 items-center gap-1.5 rounded-full bg-accent px-3 text-[12.5px] font-semibold text-white"
            >
              <Plus size={14} /> Add team
            </button>
          </div>
        </div>

        <div className="card mt-3 divide-y divide-line overflow-hidden rounded-2xl">
          {departments.map((d) => (
            <motion.div layout key={d.id} className={`grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] ${d.available ? "" : "bg-fill"}`}>
              <div className="flex min-w-0 gap-3">
                <input type="color" value={d.color} onChange={(e) => update(d.id, { color: e.target.value })} className="mt-1 h-6 w-6 shrink-0 cursor-pointer rounded-full border-0 bg-transparent p-0" aria-label={`${d.name} colour`} />
                <div className="min-w-0 flex-1">
                  <input value={d.name} onChange={(e) => update(d.id, { name: e.target.value })} className="w-full bg-transparent text-[15px] font-semibold outline-none" aria-label="Team name" />
                  <textarea
                    value={d.description}
                    onChange={(e) => update(d.id, { description: e.target.value })}
                    rows={2}
                    className="mt-0.5 w-full resize-none bg-transparent text-[13px] leading-snug text-ink-2 outline-none"
                    aria-label={`${d.name} description`}
                  />
                  {d.lead && <div className="text-[11.5px] text-ink-3">Lead: {d.lead}</div>}
                </div>
              </div>
              <div className="flex items-center gap-3 self-start">
                <span className={`text-[12px] font-medium ${d.available ? "text-green" : "text-ink-3"}`}>{d.available ? "Available" : "Unavailable"}</span>
                <Switch on={d.available} onChange={(v) => update(d.id, { available: v })} label={`${d.name} available`} />
                <button onClick={() => setDepartments((ds) => ds.filter((x) => x.id !== d.id))} className="grid h-8 w-8 place-items-center rounded-full text-ink-3 hover:bg-red/10 hover:text-red" aria-label={`Delete ${d.name}`}>
                  <Trash2 size={15} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Before → after flows, drawn as a small Sankey: bright bands are tickets that moved. */
function RerouteDiff({ reroute, routing }: { reroute: Reroute; routing: Record<string, Routing> }) {
  const flows = useMemo(() => {
    const m = new Map<string, number>();
    for (const [id, from] of Object.entries(reroute.before)) {
      const to = routing[id]?.department;
      if (!from || !to) continue;
      m.set(`${from}→${to}`, (m.get(`${from}→${to}`) ?? 0) + 1);
    }
    return [...m.entries()].map(([k, n]) => {
      const [from, to] = k.split("→");
      return { from, to, n };
    });
  }, [reroute, routing]);
  const moved = flows.filter((f) => f.from !== f.to).reduce((s, f) => s + f.n, 0);
  const prevById = Object.fromEntries(reroute.prevDepts.map((d) => [d.id, d]));
  const nextById = Object.fromEntries(reroute.nextDepts.map((d) => [d.id, d]));

  const H = 360;
  const W = 760;
  const { left, right, bands } = useMemo(() => layoutSankey(flows, reroute, H, W), [flows, reroute]);

  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card mt-8 rounded-2xl p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-3">Last re-route</div>
          <div className="mt-1 font-rounded text-2xl font-extrabold">
            {moved} of {reroute.tickets} tickets moved
          </div>
        </div>
        <div className="flex gap-2 text-[12.5px]">
          <span className="rounded-full bg-teal-soft px-3 py-1 font-semibold text-teal">{ms(reroute.wallMs)}</span>
          <span className="rounded-full bg-fill px-3 py-1 font-medium">{usd(reroute.costUsd)}</span>
          <span className="rounded-full bg-fill px-3 py-1 font-medium">1 question per ticket</span>
        </div>
      </div>
      <div className="thin-scroll mt-4 overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[640px]" width="100%" role="img" aria-label="Tickets moved between teams">
          {bands.map((b, i) => (
            <motion.path key={`${b.from}-${b.to}`} d={b.d} fill={b.color} initial={{ opacity: 0 }} animate={{ opacity: b.from === b.to ? 0.14 : 0.55 }} transition={{ delay: i * 0.03 }} />
          ))}
          {Object.entries(left).map(([id, r]) => (
            <g key={`l-${id}`}>
              <rect x={180} y={r.y} width={10} height={Math.max(2, r.h)} rx={3} fill={prevById[id]?.color} />
              <text x={172} y={r.y + r.h / 2} textAnchor="end" dominantBaseline="middle" fontSize={12} fill="var(--ink-2)">
                {prevById[id]?.name}
              </text>
            </g>
          ))}
          {Object.entries(right).map(([id, r]) => (
            <g key={`r-${id}`}>
              <rect x={W - 190} y={r.y} width={10} height={Math.max(2, r.h)} rx={3} fill={nextById[id]?.color} />
              <text x={W - 172} y={r.y + r.h / 2} dominantBaseline="middle" fontSize={12} fill="var(--ink)" fontWeight={600}>
                {nextById[id]?.name}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {flows
          .filter((f) => f.from !== f.to)
          .sort((a, b) => b.n - a.n)
          .slice(0, 8)
          .map((f) => (
            <span key={`${f.from}-${f.to}`} className="flex items-center gap-1.5 rounded-full bg-fill px-3 py-1 text-[12px]">
              <span style={{ color: prevById[f.from]?.color }}>{prevById[f.from]?.name}</span>
              <ArrowRight size={12} className="text-ink-3" />
              <span style={{ color: nextById[f.to]?.color }} className="font-semibold">
                {nextById[f.to]?.name}
              </span>
              <span className="tabular-nums text-ink-3">{f.n}</span>
            </span>
          ))}
      </div>
    </motion.section>
  );
}

type Flow = { from: string; to: string; n: number };

/** Plain stacked layout: each side's nodes share the height in proportion to their tickets. */
function layoutSankey(flows: Flow[], reroute: Reroute, H: number, W: number) {
  const GAP = 6;
  const side = (ids: string[], key: "from" | "to") => {
    const counts = ids.map((id) => ({ id, n: flows.filter((f) => f[key] === id).reduce((s, f) => s + f.n, 0) })).filter((x) => x.n > 0);
    const total = counts.reduce((s, x) => s + x.n, 0) || 1;
    const k = (H - GAP * Math.max(0, counts.length - 1)) / total;
    const nodes: Record<string, { y: number; h: number }> = {};
    let y = 0;
    for (const c of counts) {
      nodes[c.id] = { y, h: c.n * k };
      y += c.n * k + GAP;
    }
    return { nodes, k };
  };
  const L = side(reroute.prevDepts.map((d) => d.id), "from");
  const R = side(reroute.nextDepts.map((d) => d.id), "to");
  const nextById = Object.fromEntries(reroute.nextDepts.map((d) => [d.id, d]));
  const lo: Record<string, number> = {};
  const ro: Record<string, number> = {};
  const x0 = 190;
  const x1 = W - 190;
  const mid = (x0 + x1) / 2;
  const bands: (Flow & { d: string; color: string })[] = [];
  for (const f of [...flows].sort((a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to))) {
    if (!L.nodes[f.from] || !R.nodes[f.to]) continue;
    const hl = f.n * L.k;
    const hr = f.n * R.k;
    const y0 = L.nodes[f.from].y + (lo[f.from] ?? 0);
    const y1 = R.nodes[f.to].y + (ro[f.to] ?? 0);
    lo[f.from] = (lo[f.from] ?? 0) + hl;
    ro[f.to] = (ro[f.to] ?? 0) + hr;
    const d = `M${x0} ${y0} C${mid} ${y0} ${mid} ${y1} ${x1} ${y1} L${x1} ${y1 + hr} C${mid} ${y1 + hr} ${mid} ${y0 + hl} ${x0} ${y0 + hl} Z`;
    bands.push({ ...f, d, color: nextById[f.to]?.color ?? "#999" });
  }
  return { left: L.nodes, right: R.nodes, bands };
}
