"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { useMemo, useState } from "react";
import { DEFAULT_DEPARTMENTS, MACROS } from "@/lib/data";
import type { Question } from "@/lib/jev";
import { ms, pct, usd } from "@/lib/format";
import { FRUSTRATION_LEVELS, PRIORITY_LEVELS } from "@/lib/questions";
import type { Department, Routing, Ticket } from "@/lib/types";

type Explained = { routing: Routing; questions: number; request: { model: string; state: unknown; questions: Record<string, Question> } };

export default function HowJevRoutes({ tickets, routing, departments, threshold, setThreshold }: { tickets: Ticket[]; routing: Record<string, Routing>; departments: Department[]; threshold: number; setThreshold: (v: number) => void }) {
  const [id, setId] = useState(tickets.find((t) => t.subject.startsWith("Lost my work phone"))?.id ?? tickets[0]?.id);
  const [result, setResult] = useState<Explained | null>(null);
  const [loading, setLoading] = useState(false);
  const ticket = tickets.find((t) => t.id === id) ?? tickets[0];
  const deptById = Object.fromEntries(departments.map((d) => [d.id, d]));

  const ask = async () => {
    setLoading(true);
    const res = await fetch("/api/explain", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ticket, departments }) });
    const data = await res.json();
    setResult(data.error ? null : data);
    setLoading(false);
  };

  return (
    <div className="thin-scroll h-full overflow-y-auto">
      <div className="mx-auto max-w-[1180px] px-6 pb-20 pt-8">
        <div className="text-[12.5px] font-semibold uppercase tracking-[0.08em] text-teal">How Jev routes</div>
        <h1 className="mt-1 max-w-3xl font-rounded text-[2.4rem] font-extrabold leading-tight tracking-tight">Six typed questions per ticket, one request, no parsing.</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-ink-2">
          The ticket is the state. Each question returns a calibrated probability for every possible answer, so routing rules live in code: confident
          tickets go straight to a team, uncertain ones wait for a human.
        </p>

        <section className="card mt-7 rounded-2xl p-4">
          <div className="flex flex-wrap items-center gap-3">
            <select value={ticket?.id} onChange={(e) => (setId(e.target.value), setResult(null))} className="h-10 min-w-0 flex-1 rounded-xl bg-fill px-3 text-[14px] outline-none">
              {tickets.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.id} · {t.subject}
                </option>
              ))}
            </select>
            <button onClick={ask} disabled={loading} className="flex h-10 items-center gap-2 rounded-full bg-accent px-5 text-[14px] font-semibold text-white disabled:opacity-60">
              {loading ? <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent spin" /> : <Play size={14} fill="currentColor" />}
              Ask Jev live
            </button>
          </div>
          {ticket && (
            <div className="mt-4 rounded-xl bg-fill p-4">
              <div className="text-[15px] font-semibold">{ticket.subject}</div>
              <div className="mt-1 text-[14px] text-ink-2">{ticket.body}</div>
            </div>
          )}
        </section>

        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 grid gap-4 lg:grid-cols-2">
            <section className="card overflow-hidden rounded-2xl">
              <div className="flex items-center justify-between border-b border-line px-5 py-3">
                <span className="font-mono text-[12.5px] text-teal">POST /v1/systemone</span>
                <span className="text-[12px] text-ink-3">request body</span>
              </div>
              <pre className="thin-scroll max-h-[560px] overflow-auto px-5 py-4 font-mono text-[11.5px] leading-relaxed text-ink-2">{JSON.stringify(result.request, null, 2)}</pre>
            </section>
            <section className="space-y-3">
              <div className="flex flex-wrap gap-2 text-[12.5px]">
                <span className="rounded-full bg-teal-soft px-3 py-1 font-semibold text-teal">{ms(result.routing.latencyMs)}</span>
                <span className="rounded-full bg-fill px-3 py-1">{result.routing.inputTokens.toLocaleString()} input tokens</span>
                <span className="rounded-full bg-fill px-3 py-1">{usd((result.routing.inputTokens / 1e6) * 0.042)}</span>
                <span className="rounded-full bg-fill px-3 py-1">{result.questions} questions</span>
              </div>
              <Answer kind="choice" name="department" title="Which team should handle this ticket?" bars={Object.entries(result.routing.probs).map(([k, p]) => [deptById[k]?.name ?? k, p, deptById[k]?.color])} footer={`confidence ${result.routing.confidence.toFixed(2)} → ${result.routing.confidence >= threshold ? "auto-route" : "human review"} at threshold ${threshold.toFixed(2)}`} />
              <Answer kind="score" name="priority" title="How urgent is this ticket for the business?" value={result.routing.priority} levels={PRIORITY_LEVELS} />
              <Answer kind="score" name="frustration" title="How frustrated does the requester sound?" value={result.routing.frustration} levels={FRUSTRATION_LEVELS} />
              <div className="grid grid-cols-2 gap-3">
                <Answer kind="noul" name="widespread" title="Affects many people?" p={result.routing.widespread} />
                <Answer kind="noul" name="securityRisk" title="Security risk?" p={result.routing.securityRisk} />
              </div>
              <Answer kind="choice" name="macro" title="Which saved reply should the agent start from?" bars={Object.entries(result.routing.macroProbs ?? {}).map(([k, p]) => [k, p, undefined])} footer={result.routing.macro ? MACROS[result.routing.macro] : undefined} />
            </section>
          </motion.div>
        )}

        <Gating tickets={tickets} routing={routing} threshold={threshold} setThreshold={setThreshold} />
      </div>
    </div>
  );
}

function Answer(props: { kind: "choice" | "score" | "noul"; name: string; title: string; bars?: [string, number, string | undefined][]; value?: number; levels?: string[]; p?: number; footer?: string }) {
  const sorted = props.bars ? [...props.bars].sort((a, b) => b[1] - a[1]).slice(0, 5) : [];
  return (
    <div className="card rounded-2xl p-4">
      <div className="flex items-center gap-2">
        <span className="rounded bg-fill-2 px-1.5 py-0.5 font-mono text-[10.5px] uppercase text-ink-3">{props.kind}</span>
        <span className="font-mono text-[11.5px] text-ink-3">{props.name}</span>
      </div>
      <div className="mt-1 text-[13px] text-ink-2">{props.title}</div>
      {props.kind === "choice" && (
        <div className="mt-3 space-y-1.5">
          {sorted.map(([label, p, color], i) => (
            <div key={label} className="grid grid-cols-[1fr_120px_40px] items-center gap-2 text-[12.5px]">
              <span className={`truncate ${i === 0 ? "font-semibold" : "text-ink-2"}`}>{label}</span>
              <div className="h-1.5 overflow-hidden rounded-full bg-fill-2">
                <motion.div className="h-full rounded-full" style={{ background: color ?? "var(--teal)" }} initial={{ width: 0 }} animate={{ width: `${Math.max(1.5, p * 100)}%` }} />
              </div>
              <span className="text-right tabular-nums text-ink-3">{pct(p)}</span>
            </div>
          ))}
        </div>
      )}
      {props.kind === "score" && props.value !== undefined && props.levels && (
        <div className="mt-3">
          <div className="text-[14px] font-semibold">{props.levels[Math.round(props.value)]}</div>
          <div className="relative mt-2 h-2 rounded-full bg-fill-2">
            <motion.span className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-panel bg-accent shadow" initial={{ left: 0 }} animate={{ left: `${(props.value / (props.levels.length - 1)) * 100}%` }} />
          </div>
          <div className="mt-1 font-mono text-[11px] text-ink-3">
            score {props.value.toFixed(2)} on 0–{props.levels.length - 1}
          </div>
        </div>
      )}
      {props.kind === "noul" && props.p !== undefined && (
        <div className="mt-3 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-fill-2">
            <motion.div className="h-full rounded-full" style={{ background: props.p >= 0.5 ? "var(--red)" : "var(--green)" }} initial={{ width: 0 }} animate={{ width: `${props.p * 100}%` }} />
          </div>
          <span className="font-mono text-[13px] font-semibold">{props.p.toFixed(2)}</span>
        </div>
      )}
      {props.footer && <div className="mt-2.5 text-[12px] text-ink-3">{props.footer}</div>}
    </div>
  );
}

/** Confidence-gated routing: pick a threshold, see how much is automated and how accurate that slice is. */
function Gating({ tickets, routing, threshold, setThreshold }: { tickets: Ticket[]; routing: Record<string, Routing>; threshold: number; setThreshold: (v: number) => void }) {
  const ids = new Set(DEFAULT_DEPARTMENTS.map((d) => d.id));
  const labelled = tickets.filter((t) => t.truth && routing[t.id] && ids.has(routing[t.id].department));
  const curve = useMemo(
    () =>
      Array.from({ length: 51 }, (_, i) => {
        const th = i / 50;
        const auto = labelled.filter((t) => routing[t.id].confidence >= th);
        return { th, rate: labelled.length ? auto.length / labelled.length : 0, acc: auto.length ? auto.filter((t) => routing[t.id].department === t.truth).length / auto.length : 1 };
      }),
    [labelled, routing],
  );
  const cur = curve[Math.round(threshold * 50)];
  const W = 640;
  const H = 220;
  const P = { l: 40, r: 16, t: 14, b: 28 };
  // Zoom the y-axis to where the action is; Jev is usually very confident.
  const floor = Math.min(0.5, Math.floor(Math.min(...curve.map((c) => Math.min(c.rate, c.acc))) * 10) / 10);
  const x = (v: number) => P.l + v * (W - P.l - P.r);
  const y = (v: number) => P.t + (1 - (v - floor) / (1 - floor)) * (H - P.t - P.b);
  const line = (k: "rate" | "acc") => curve.map((c, i) => `${i ? "L" : "M"}${x(c.th).toFixed(1)} ${y(c[k]).toFixed(1)}`).join(" ");
  const auto = Math.round(cur.rate * labelled.length);

  return (
    <section className="card mt-8 rounded-2xl p-6">
      <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-3">Confidence-gated routing</div>
      <h2 className="mt-1 font-rounded text-2xl font-extrabold">Where should a human step in?</h2>
      <p className="mt-1 max-w-2xl text-[13.5px] text-ink-2">
        Every team Choice comes with a confidence. Tickets above the threshold route themselves; the rest land in <b>Needs review</b>. Measured on the{" "}
        {labelled.length} labelled tickets routed in this session.
      </p>
      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_280px]">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Automation rate and accuracy by confidence threshold">
          {[0, 0.25, 0.5, 0.75, 1].map((f) => floor + f * (1 - floor)).map((g) => (
            <g key={g}>
              <line x1={P.l} x2={W - P.r} y1={y(g)} y2={y(g)} stroke="var(--line)" />
              <text x={P.l - 8} y={y(g)} textAnchor="end" dominantBaseline="middle" fontSize={10} fill="var(--ink-3)">
                {Math.round(g * 100)}%
              </text>
            </g>
          ))}
          {[0, 0.25, 0.5, 0.75, 1].map((g) => (
            <text key={`x${g}`} x={x(g)} y={H - 8} textAnchor="middle" fontSize={10} fill="var(--ink-3)">
              {g.toFixed(2)}
            </text>
          ))}
          <path d={line("rate")} fill="none" stroke="var(--teal)" strokeWidth={2.5} />
          <path d={line("acc")} fill="none" stroke="#5856D6" strokeWidth={2.5} strokeDasharray="5 4" />
          <line x1={x(threshold)} x2={x(threshold)} y1={P.t} y2={H - P.b} stroke="var(--orange)" strokeWidth={2} />
          <circle cx={x(threshold)} cy={y(cur.rate)} r={5} fill="var(--teal)" stroke="var(--panel)" strokeWidth={2} />
          <circle cx={x(threshold)} cy={y(cur.acc)} r={5} fill="#5856D6" stroke="var(--panel)" strokeWidth={2} />
        </svg>
        <div>
          <label className="block">
            <div className="flex justify-between text-[13px]">
              <span className="font-medium">Threshold</span>
              <span className="font-mono font-semibold text-orange">{threshold.toFixed(2)}</span>
            </div>
            <input type="range" min={0} max={1} step={0.02} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="mt-2 w-full accent-[var(--orange)]" />
          </label>
          <div className="mt-5 space-y-3">
            <Stat color="var(--teal)" label="Auto-routed" value={`${pct(cur.rate)} · ${auto} tickets`} />
            <Stat color="#5856D6" label="Accuracy of auto-routed" value={pct(cur.acc)} dashed />
            <Stat color="var(--orange)" label="Sent to a human" value={`${labelled.length - auto} tickets`} />
          </div>
          <p className="mt-4 text-[12px] text-ink-3">Moving the slider also changes the Needs review mailbox in the inbox.</p>
        </div>
      </div>
    </section>
  );
}

function Stat({ color, label, value, dashed }: { color: string; label: string; value: string; dashed?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-[3px] w-6 rounded" style={{ background: dashed ? `repeating-linear-gradient(90deg, ${color} 0 5px, transparent 5px 9px)` : color }} />
      <span className="flex-1 text-[13px] text-ink-2">{label}</span>
      <span className="text-[13.5px] font-semibold">{value}</span>
    </div>
  );
}
