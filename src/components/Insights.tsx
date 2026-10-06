"use client";

import { motion } from "framer-motion";
import { Cpu, Laptop, Play, Sparkles, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { ALL_TICKETS, DEFAULT_DEPARTMENTS } from "@/lib/data";
import { ms, pct, usd } from "@/lib/format";
import type { CallLog, Department, Routing, Ticket } from "@/lib/types";
import { Segmented } from "./ui";

// Hosted-LLM baselines (estimates, clearly labelled in the UI).
const LLMS = [
  { id: "frontier", name: "Frontier LLM", note: "$3 / $15 per M tokens · ~75 tok/s", inPrice: 3, outPrice: 15, tps: 75 },
  { id: "small", name: "Small hosted LLM", note: "$0.25 / $1.25 per M tokens · ~150 tok/s", inPrice: 0.25, outPrice: 1.25, tps: 150 },
];
const LLM_OUT_TOKENS = 80; // a JSON object with team, priority, mood, flags and macro
const JEV_PRICE = 0.042;

type BenchRow = { id: string; predicted: string | null; correct: boolean; latencyMs: number; inputTokens: number; outputTokens: number; costUsd: number; raw?: string };
type Bench = { rows: BenchRow[]; wallMs: number; running: boolean; error?: string };
type Summary = { n: number; acc: number; p50: number; p95: number; tokens: number; per1k: number; wall: number };

export default function Insights({ tickets, routing, logs, departments, teamOf, threshold }: { tickets: Ticket[]; routing: Record<string, Routing>; logs: CallLog[]; departments: Department[]; teamOf: (id: string) => string | undefined; threshold: number }) {
  const routed = tickets.filter((t) => routing[t.id]);
  const avgTokens = routed.length ? routed.reduce((s, t) => s + routing[t.id].inputTokens, 0) / routed.length : 1000;
  // Median, so the initial burst of parallel requests doesn't skew the typical per-ticket time.
  const lats = routed.map((t) => routing[t.id].latencyMs).sort((a, b) => a - b);
  const avgLatency = lats.length ? lats[Math.floor(lats.length / 2)] : 0;
  const auto = routed.filter((t) => routing[t.id].confidence >= threshold).length;
  const spent = logs.reduce((s, l) => s + l.costUsd, 0);

  const perK = {
    jev: (avgTokens / 1e6) * JEV_PRICE * 1000,
    llms: LLMS.map((l) => ({ ...l, cost: ((avgTokens / 1e6) * l.inPrice + (LLM_OUT_TOKENS / 1e6) * l.outPrice) * 1000, latency: 600 + (LLM_OUT_TOKENS / l.tps) * 1000 })),
  };
  const maxCost = Math.max(perK.jev, ...perK.llms.map((l) => l.cost));

  const volume = departments.map((d) => ({ d, n: tickets.filter((t) => teamOf(t.id) === d.id).length })).sort((a, b) => b.n - a.n);
  const maxVol = Math.max(1, ...volume.map((v) => v.n));
  const prio = [0, 1, 2, 3].map((p) => routed.filter((t) => Math.round(routing[t.id].priority ?? -1) === p).length);

  return (
    <div className="thin-scroll h-full overflow-y-auto">
      <div className="mx-auto max-w-[1180px] px-6 pb-20 pt-8">
        <div className="text-[12.5px] font-semibold uppercase tracking-[0.08em] text-teal">Insights & costs</div>
        <h1 className="mt-1 font-rounded text-[2.4rem] font-extrabold leading-tight tracking-tight">Every token, out in the open.</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-ink-2">What routing costs with Jev compared with hosted LLMs and a local Apple MLX model. Jev numbers are measured from this session; hosted-LLM numbers are estimates from token counts and list prices.</p>

        <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi label="Tickets routed" value={String(routed.length)} />
          <Kpi label={`Auto-routed at ≥ ${threshold.toFixed(2)}`} value={routed.length ? pct(auto / routed.length) : "—"} tone="var(--teal)" />
          <Kpi label="Median Jev latency" value={avgLatency ? ms(avgLatency) : "—"} />
          <Kpi label="Spent this session" value={usd(spent)} tone="var(--teal)" />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <section className="card rounded-2xl p-5">
            <h3 className="text-[15px] font-semibold">Cost to triage 1,000 tickets</h3>
            <p className="text-[12.5px] text-ink-3">
              Same work: team, priority, mood, two flags and a reply macro. Avg {Math.round(avgTokens).toLocaleString()} input tokens per ticket.
            </p>
            <div className="mt-5 space-y-4">
              <CostBar label="Jev" sub="measured · output tokens are free" value={perK.jev} max={maxCost} color="var(--teal)" icon={<Zap size={14} />} />
              {perK.llms.map((l) => (
                <CostBar key={l.id} label={l.name} sub={`estimate · ${l.note}`} value={l.cost} max={maxCost} color="var(--ink-3)" icon={<Sparkles size={14} />} ratio={l.cost / perK.jev} />
              ))}
              <CostBar label="Local MLX model" sub="no per-token fee · runs on your Mac's GPU, one ticket at a time" value={0} max={maxCost} color="var(--orange)" icon={<Laptop size={14} />} />
            </div>
          </section>
          <section className="card rounded-2xl p-5">
            <h3 className="text-[15px] font-semibold">Time per ticket</h3>
            <p className="text-[12.5px] text-ink-3">Jev measured; hosted LLMs estimated as ~0.6 s to first token plus {LLM_OUT_TOKENS} output tokens.</p>
            <div className="mt-5 space-y-4">
              {[{ name: "Jev", v: avgLatency, color: "var(--teal)" }, ...perK.llms.map((l) => ({ name: l.name, v: l.latency, color: "var(--ink-3)" }))].map((x) => (
                <div key={x.name}>
                  <div className="flex justify-between text-[13px]">
                    <span className="font-medium">{x.name}</span>
                    <span className="font-mono">{x.v ? ms(x.v) : "—"}</span>
                  </div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-fill-2">
                    <motion.div className="h-full rounded-full" style={{ background: x.color }} initial={{ width: 0 }} animate={{ width: `${Math.max(1.5, (x.v / Math.max(...perK.llms.map((l) => l.latency), avgLatency)) * 100)}%` }} transition={{ duration: 0.8 }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <Benchmark />

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <section className="card rounded-2xl p-5">
            <h3 className="text-[15px] font-semibold">Volume by team</h3>
            <div className="mt-4 space-y-2.5">
              {volume.map(({ d, n }) => (
                <div key={d.id} className="grid grid-cols-[150px_1fr_32px] items-center gap-3 text-[12.5px]">
                  <span className="truncate">{d.name}</span>
                  <div className="h-2 overflow-hidden rounded-full bg-fill-2">
                    <motion.div className="h-full rounded-full" style={{ background: d.color }} initial={{ width: 0 }} animate={{ width: `${(n / maxVol) * 100}%` }} />
                  </div>
                  <span className="text-right tabular-nums text-ink-3">{n}</span>
                </div>
              ))}
            </div>
          </section>
          <section className="card rounded-2xl p-5">
            <h3 className="text-[15px] font-semibold">Priority mix</h3>
            <div className="mt-4 flex h-32 items-end gap-3">
              {["P4", "P3", "P2", "P1"].map((label, i) => (
                <div key={label} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="text-[12px] tabular-nums text-ink-3">{prio[i]}</span>
                  <motion.div className="w-full rounded-t-lg" style={{ background: ["var(--ink-3)", "#007AFF", "var(--orange)", "var(--red)"][i] }} initial={{ height: 0 }} animate={{ height: `${(prio[i] / Math.max(1, ...prio)) * 90}px` }} />
                  <span className="text-[12px] font-semibold">{label}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="card mt-4 overflow-hidden rounded-2xl">
          <div className="border-b border-line px-5 py-4">
            <h3 className="text-[15px] font-semibold">Jev usage log</h3>
            <p className="text-[12.5px] text-ink-3">Every batch sent to POST /v1/systemone this session.</p>
          </div>
          <div className="thin-scroll overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-fill text-left text-[11.5px] text-ink-2">
                <tr>
                  <th className="px-5 py-2.5 font-semibold">When</th>
                  <th className="px-3 font-semibold">What</th>
                  <th className="px-3 font-semibold">Tickets</th>
                  <th className="px-3 font-semibold">Questions</th>
                  <th className="px-3 font-semibold">Input tokens</th>
                  <th className="px-3 font-semibold">Wall time</th>
                  <th className="px-5 font-semibold">Cost</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-t border-line">
                    <td className="whitespace-nowrap px-5 py-2.5 text-ink-3">{new Date(l.at).toLocaleTimeString("en-GB")}</td>
                    <td className="px-3">{l.label}</td>
                    <td className="px-3 tabular-nums">{l.tickets}</td>
                    <td className="px-3 tabular-nums">{l.questions}</td>
                    <td className="px-3 tabular-nums">{l.inputTokens.toLocaleString()}</td>
                    <td className="px-3 tabular-nums">{ms(l.wallMs)}</td>
                    <td className="px-5 tabular-nums text-teal">{usd(l.costUsd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="card rounded-2xl p-4">
      <div className="text-[12px] text-ink-3">{label}</div>
      <div className="mt-1 font-rounded text-[1.9rem] font-extrabold tabular-nums" style={{ color: tone }}>
        {value}
      </div>
    </div>
  );
}

function CostBar({ label, sub, value, max, color, icon, ratio }: { label: string; sub: string; value: number; max: number; color: string; icon: React.ReactNode; ratio?: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex items-center gap-1.5 text-[13.5px] font-semibold" style={{ color }}>
          {icon} <span className="text-ink">{label}</span>
        </span>
        <span className="font-mono text-[13px]">
          {usd(value)}
          {ratio ? <span className="ml-2 text-[11.5px] text-ink-3">{Math.round(ratio)}× Jev</span> : null}
        </span>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-fill-2">
        <motion.div className="h-full rounded-full" style={{ background: color }} initial={{ width: 0 }} animate={{ width: `${Math.max(value ? 1.2 : 0, (value / max) * 100)}%` }} transition={{ duration: 0.8 }} />
      </div>
      <div className="mt-1 text-[11.5px] text-ink-3">{sub}</div>
    </div>
  );
}

/* ───────────── Benchmark ───────────── */

function Benchmark() {
  const [size, setSize] = useState(48);
  const [jev, setJev] = useState<Bench | null>(null);
  const [mlx, setMlx] = useState<Bench | null>(null);
  const [status, setStatus] = useState<{ configured: boolean; reachable: boolean; model: string; baseUrl: string } | null>(null);

  useEffect(() => {
    void fetch("/api/mlx")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ configured: false, reachable: false, model: "", baseUrl: "" }));
  }, []);

  const run = async (provider: "jev" | "mlx", set: (b: Bench) => void) => {
    const ids = ALL_TICKETS.slice(0, provider === "mlx" ? Math.min(size, 24) : size).map((t) => t.id);
    const started = performance.now();
    let rows: BenchRow[] = [];
    set({ rows, wallMs: 0, running: true });
    const res = await fetch("/api/benchmark", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ provider, ids, departments: DEFAULT_DEPARTMENTS }) });
    if (!res.ok || !res.body) {
      const err = await res.json().catch(() => ({ error: "failed" }));
      set({ rows, wallMs: 0, running: false, error: err.error });
      return;
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const l of lines) {
        if (!l.trim()) continue;
        const e = JSON.parse(l);
        if (e.type === "row") rows = [...rows, e];
      }
      set({ rows, wallMs: Math.round(performance.now() - started), running: true });
    }
    set({ rows, wallMs: Math.round(performance.now() - started), running: false });
  };

  const summary = (b: Bench | null): Summary | null => {
    if (!b || !b.rows.length) return null;
    const lat = b.rows.map((r) => r.latencyMs).sort((x, y) => x - y);
    const q = (p: number) => lat[Math.min(lat.length - 1, Math.floor(p * lat.length))];
    return {
      n: b.rows.length,
      acc: b.rows.filter((r) => r.correct).length / b.rows.length,
      p50: q(0.5),
      p95: q(0.95),
      tokens: b.rows.reduce((s, r) => s + r.inputTokens + r.outputTokens, 0) / b.rows.length,
      per1k: (b.rows.reduce((s, r) => s + r.costUsd, 0) / b.rows.length) * 1000,
      wall: b.wallMs,
    };
  };
  const js = summary(jev);
  const ms_ = summary(mlx);

  return (
    <section className="card mt-4 overflow-hidden rounded-2xl">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line px-5 py-4">
        <div>
          <h3 className="text-[15px] font-semibold">Benchmark on labelled tickets</h3>
          <p className="text-[12.5px] text-ink-3">Team routing only, against the hand-labelled answer for each synthetic ticket, using the default eight teams.</p>
        </div>
        <div className="flex items-center gap-2">
          <Segmented value={size} onChange={setSize} options={[24, 48, 96].map((n) => ({ value: n, label: `${n} tickets` }))} />
          <button onClick={() => run("jev", setJev)} disabled={jev?.running} className="flex h-9 items-center gap-1.5 rounded-full bg-accent px-4 text-[13px] font-semibold text-white disabled:opacity-60">
            <Play size={13} fill="currentColor" /> Run Jev
          </button>
          <button
            onClick={() => run("mlx", setMlx)}
            disabled={!status?.reachable || mlx?.running}
            title={status?.reachable ? "" : "Start a local mlx_lm.server first"}
            className="flex h-9 items-center gap-1.5 rounded-full bg-fill px-4 text-[13px] font-semibold text-ink disabled:opacity-40"
          >
            <Cpu size={13} /> Run local MLX
          </button>
        </div>
      </div>
      <div className="thin-scroll overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="bg-fill text-left text-[11.5px] text-ink-2">
            <tr>
              <th className="px-5 py-2.5 font-semibold">Model</th>
              <th className="px-3 font-semibold">Tickets</th>
              <th className="px-3 font-semibold">Accuracy</th>
              <th className="px-3 font-semibold">p50 latency</th>
              <th className="px-3 font-semibold">p95 latency</th>
              <th className="px-3 font-semibold">Tokens / ticket</th>
              <th className="px-3 font-semibold">Batch wall time</th>
              <th className="px-5 font-semibold">Cost / 1k</th>
            </tr>
          </thead>
          <tbody>
            <BenchLine name="Jev (jev-latest)" s={js} running={jev?.running} idle="Press Run Jev" />
            <BenchLine
              name={`Local MLX${status?.model ? ` · ${status.model.split("/").pop()}` : ""}`}
              s={ms_}
              running={mlx?.running}
              idle={mlx?.error ?? (status?.reachable ? "Press Run local MLX (max 24 tickets)" : status?.configured ? `Not reachable at ${status.baseUrl}` : "Not connected. See setup below")}
              free
            />
            <tr className="border-t border-line text-ink-3">
              <td className="px-5 py-2.5">Frontier LLM</td>
              <td className="px-3" colSpan={7}>
                Not run here: needs a separate API key. Estimated cost and latency are in the charts above.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {status && !status.reachable && (
        <div className="border-t border-line bg-fill px-5 py-4 text-[12.5px] text-ink-2">
          <div className="font-semibold text-ink">Compare against a local Apple MLX model</div>
          <p className="mt-1">On an Apple-silicon Mac, serve any MLX chat model with an OpenAI-compatible endpoint, then point Tidal at it in <code className="font-mono">.env.local</code>:</p>
          <pre className="mt-2 overflow-x-auto rounded-xl bg-panel p-3 font-mono text-[12px] ring-1 ring-line">{`pip install mlx-lm
mlx_lm.server --model mlx-community/Llama-3.2-3B-Instruct-4bit --port 8080

# .env.local
MLX_BASE_URL=http://127.0.0.1:8080
MLX_MODEL=mlx-community/Llama-3.2-3B-Instruct-4bit`}</pre>
        </div>
      )}
    </section>
  );
}

function BenchLine({ name, s: v, running, idle, free }: { name: string; s: Summary | null; running?: boolean; idle: string; free?: boolean }) {
  return (
    <tr className="border-t border-line">
      <td className="whitespace-nowrap px-5 py-2.5 font-medium">
        {name} {running && <span className="ml-1 inline-block h-3 w-3 rounded-full border-2 border-teal border-t-transparent align-middle spin" />}
      </td>
      {v ? (
        <>
          <td className="px-3 tabular-nums">{v.n}</td>
          <td className="px-3 font-semibold tabular-nums text-teal">{pct(v.acc)}</td>
          <td className="px-3 tabular-nums">{ms(v.p50)}</td>
          <td className="px-3 tabular-nums">{ms(v.p95)}</td>
          <td className="px-3 tabular-nums">{Math.round(v.tokens).toLocaleString()}</td>
          <td className="px-3 tabular-nums">{ms(v.wall)}</td>
          <td className="px-5 tabular-nums">{free ? "$0 (local)" : usd(v.per1k)}</td>
        </>
      ) : (
        <td className="px-3 text-ink-3" colSpan={7}>
          {idle}
        </td>
      )}
    </tr>
  );
}
