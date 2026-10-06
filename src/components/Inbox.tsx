"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, ChevronLeft, Globe, Hash, Mail, MessageCircle, PenSquare, RotateCw, Search, ShieldAlert, Sparkles, Users, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { MACROS } from "@/lib/data";
import { age, ms, pct, priorityColor, priorityLabel, usd } from "@/lib/format";
import { FRUSTRATION_LEVELS, PRIORITY_LEVELS } from "@/lib/questions";
import type { Channel, Department, Routing, Ticket } from "@/lib/types";
import type { Page } from "./TidalApp";
import { Avatar, DeptChip, Ring } from "./ui";

export type Mailbox = { kind: "all" | "review" | "urgent" | "security" | "resolved" } | { kind: "team"; id: string };

const CHANNEL_ICON: Record<Channel, React.ReactNode> = {
  Email: <Mail size={12} />,
  Slack: <Hash size={12} />,
  Portal: <Globe size={12} />,
  Chat: <MessageCircle size={12} />,
};

type Props = {
  tickets: Ticket[];
  mailbox: Mailbox;
  setMailbox: (m: Mailbox) => void;
  routing: Record<string, Routing>;
  pending: Record<string, true>;
  departments: Department[];
  deptById: Record<string, Department>;
  teamOf: (id: string) => string | undefined;
  threshold: number;
  overrides: Record<string, string>;
  resolved: Record<string, true>;
  fresh: Record<string, true>;
  selected: string | null;
  setSelected: (id: string | null) => void;
  onNew: () => void;
  onReassign: (id: string, dept: string) => void;
  onResolve: (id: string) => void;
  onRerun: (t: Ticket) => void;
  onPage: (p: Page) => void;
};

export default function Inbox(p: Props) {
  const { tickets, routing, mailbox, teamOf, threshold, overrides, resolved, departments } = p;
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return tickets.filter((t) => {
      const r = routing[t.id];
      if (mailbox.kind === "resolved") {
        if (!resolved[t.id]) return false;
      } else if (resolved[t.id]) return false;
      if (mailbox.kind === "review" && !(r && !overrides[t.id] && r.confidence < threshold)) return false;
      if (mailbox.kind === "urgent" && !((r?.priority ?? 0) >= 2.5)) return false;
      if (mailbox.kind === "security" && !((r?.securityRisk ?? 0) >= 0.5)) return false;
      if (mailbox.kind === "team" && teamOf(t.id) !== mailbox.id) return false;
      return !needle || `${t.subject} ${t.body} ${t.requester} ${t.id}`.toLowerCase().includes(needle);
    });
  }, [tickets, routing, mailbox, q, teamOf, threshold, overrides, resolved]);

  const title =
    mailbox.kind === "team"
      ? (p.deptById[mailbox.id]?.name ?? "Team")
      : { all: "All open", review: "Needs review", urgent: "Critical (P1)", security: "Security risk", resolved: "Resolved" }[mailbox.kind];
  const ticket = tickets.find((t) => t.id === p.selected);

  return (
    <div className="flex h-full">
      {/* List */}
      <section className={`flex h-full w-full flex-col border-r border-line bg-panel lg:w-[400px] lg:shrink-0 ${ticket ? "hidden lg:flex" : "flex"}`}>
        <div className="border-b border-line px-4 pb-3 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-rounded text-[1.6rem] font-extrabold tracking-tight">{title}</h1>
              <div className="text-[12.5px] text-ink-3">
                {list.length} ticket{list.length === 1 ? "" : "s"}
                {mailbox.kind === "review" && ` · confidence below ${threshold.toFixed(2)}`}
              </div>
            </div>
            <button onClick={p.onNew} className="flex h-9 items-center gap-1.5 rounded-full bg-accent px-3.5 text-[13px] font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-95">
              <PenSquare size={14} /> New ticket
            </button>
          </div>
          <label className="mt-3 flex h-9 items-center gap-2 rounded-[10px] bg-fill px-3">
            <Search size={14} className="text-ink-3" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="min-w-0 flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-ink-3" />
          </label>
          <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto md:hidden">
            {(["all", "review", "urgent", "security"] as const).map((k) => (
              <button key={k} onClick={() => p.setMailbox({ kind: k })} className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-medium ${mailbox.kind === k ? "bg-accent text-white" : "bg-fill text-ink-2"}`}>
                {k === "all" ? "All" : k === "review" ? "Review" : k === "urgent" ? "P1" : "Security"}
              </button>
            ))}
            {(["teams", "insights", "how"] as Page[]).map((pg) => (
              <button key={pg} onClick={() => p.onPage(pg)} className="shrink-0 rounded-full bg-fill px-3 py-1 text-[12px] font-medium text-ink-2">
                {pg === "teams" ? "Teams" : pg === "insights" ? "Insights" : "How Jev routes"}
              </button>
            ))}
          </div>
        </div>
        <div className="thin-scroll flex-1 overflow-y-auto">
          <AnimatePresence initial={false}>
            {list.map((t) => {
              const r = routing[t.id];
              const team = teamOf(t.id);
              const dept = team ? p.deptById[team] : undefined;
              const review = r && !overrides[t.id] && r.confidence < threshold;
              const active = t.id === p.selected;
              return (
                <motion.button
                  layout="position"
                  key={t.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  onClick={() => p.setSelected(t.id)}
                  className={`relative block w-full border-b border-line px-4 py-3 text-left transition ${active ? "bg-accent text-white" : "hover:bg-fill"}`}
                >
                  {p.fresh[t.id] && !active && <span className="absolute left-1.5 top-[18px] h-2 w-2 rounded-full bg-accent" />}
                  <div className="flex items-baseline gap-2">
                    <span className="truncate text-[13.5px] font-semibold">{t.requester}</span>
                    <span className={`ml-auto shrink-0 text-[12px] tabular-nums ${active ? "text-white/80" : "text-ink-3"}`}>{age(t.ageMin)}</span>
                  </div>
                  <div className="truncate text-[13.5px]">{t.subject}</div>
                  <div className={`line-clamp-1 text-[12.5px] ${active ? "text-white/75" : "text-ink-3"}`}>{t.body}</div>
                  <div className="mt-2 flex items-center gap-1.5">
                    {p.pending[t.id] && !r ? (
                      <span className="h-[22px] w-32 rounded-full shimmer" />
                    ) : active ? (
                      <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11.5px] font-medium">{dept?.name ?? "Unrouted"}</span>
                    ) : (
                      <DeptChip dept={dept} p={r && !overrides[t.id] ? r.probs[team ?? ""] : undefined} small />
                    )}
                    {r?.priority !== undefined && (
                      <span className="rounded-md px-1.5 py-0.5 text-[11px] font-bold" style={active ? { background: "rgba(255,255,255,.2)" } : { color: priorityColor(r.priority), background: `color-mix(in srgb, ${priorityColor(r.priority)} 12%, transparent)` }}>
                        {priorityLabel(r.priority)}
                      </span>
                    )}
                    {review && <AlertTriangle size={13} className={active ? "text-white" : "text-orange"} />}
                    {(r?.securityRisk ?? 0) >= 0.5 && <ShieldAlert size={13} className={active ? "text-white" : "text-red"} />}
                    <span className={`ml-auto flex items-center gap-1 text-[11px] ${active ? "text-white/70" : "text-ink-3"}`}>
                      {CHANNEL_ICON[t.channel]} {t.id}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
          {list.length === 0 && <div className="p-10 text-center text-[13px] text-ink-3">Nothing here.</div>}
        </div>
      </section>

      {/* Detail */}
      <section className={`thin-scroll h-full min-w-0 flex-1 overflow-y-auto ${ticket ? "block" : "hidden lg:block"}`}>
        {ticket ? (
          <Detail key={ticket.id} {...p} ticket={ticket} departments={departments} />
        ) : (
          <div className="grid h-full place-items-center text-[14px] text-ink-3">Select a ticket</div>
        )}
      </section>
    </div>
  );
}

function Detail({ ticket, routing, pending, deptById, teamOf, threshold, overrides, departments, onReassign, onResolve, onRerun, setSelected, resolved }: Props & { ticket: Ticket }) {
  const r = routing[ticket.id];
  const team = teamOf(ticket.id);
  const dept = team ? deptById[team] : undefined;
  const auto = r && !overrides[ticket.id] && r.confidence >= threshold;
  const top = r ? Object.entries(r.probs).sort((a, b) => b[1] - a[1]).slice(0, 4) : [];

  return (
    <div className="mx-auto max-w-[860px] px-5 py-6 sm:px-8">
      <button onClick={() => setSelected(null)} className="mb-3 flex items-center gap-1 text-[13px] font-medium text-teal lg:hidden">
        <ChevronLeft size={16} /> Inbox
      </button>
      <div className="flex items-start gap-3">
        <Avatar name={ticket.requester} size={42} />
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold">{ticket.requester}</div>
          <div className="text-[12.5px] text-ink-3">
            {ticket.email} · via {ticket.channel} · {age(ticket.ageMin)} ago · {ticket.id}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onRerun(ticket)} title="Ask Jev again" className="grid h-9 w-9 place-items-center rounded-full bg-fill text-ink-2 hover:text-ink" aria-label="Ask Jev again">
            <RotateCw size={15} className={pending[ticket.id] ? "spin" : ""} />
          </button>
          {!resolved[ticket.id] && (
            <button onClick={() => onResolve(ticket.id)} className="flex h-9 items-center gap-1.5 rounded-full bg-green px-3.5 text-[13px] font-semibold text-white">
              <CheckCircle2 size={15} /> Resolve
            </button>
          )}
        </div>
      </div>
      <h2 className="mt-5 font-rounded text-[1.7rem] font-extrabold leading-tight tracking-tight">{ticket.subject}</h2>
      <p className="mt-3 whitespace-pre-wrap text-[15.5px] leading-relaxed text-ink-2">{ticket.body}</p>

      <div className="card mt-7 overflow-hidden rounded-2xl">
        <div className="flex items-center gap-2 border-b border-line px-5 py-3">
          <Sparkles size={15} className="text-teal" />
          <span className="text-[13.5px] font-semibold">Jev routing</span>
          {r && (
            <span className="ml-auto font-mono text-[11.5px] text-ink-3">
              {ms(r.latencyMs)} · {r.inputTokens.toLocaleString()} tok · {usd((r.inputTokens / 1e6) * 0.042)}
            </span>
          )}
        </div>
        {!r ? (
          <div className="space-y-3 p-5">
            <div className="h-6 w-1/2 rounded-full shimmer" />
            <div className="h-20 rounded-xl shimmer" />
          </div>
        ) : (
          <div className="grid gap-6 p-5 md:grid-cols-[1.2fr_1fr]">
            <div>
              <div className="flex items-center gap-3">
                <Ring value={r.confidence} color={auto ? "var(--teal)" : "var(--orange)"} />
                <div>
                  <div className="text-[12px] text-ink-3">Assigned to</div>
                  <DeptChip dept={dept} />
                </div>
              </div>
              <div className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-[12.5px] ${overrides[ticket.id] ? "bg-fill" : auto ? "bg-teal-soft text-teal" : "bg-orange/10 text-orange"}`}>
                {overrides[ticket.id] ? (
                  <>
                    <Users size={14} /> Reassigned by an agent
                  </>
                ) : auto ? (
                  <>
                    <Zap size={14} /> Auto-routed: confidence {r.confidence.toFixed(2)} ≥ {threshold.toFixed(2)}
                  </>
                ) : (
                  <>
                    <AlertTriangle size={14} /> Held for review: confidence {r.confidence.toFixed(2)} &lt; {threshold.toFixed(2)}
                  </>
                )}
              </div>
              <div className="mt-4 space-y-2">
                {top.map(([id, prob]) => {
                  const d = deptById[id];
                  return (
                    <div key={id} className="grid grid-cols-[1fr_110px_38px] items-center gap-2 text-[12.5px]">
                      <span className="truncate">{d?.name ?? id}</span>
                      <div className="h-1.5 overflow-hidden rounded-full bg-fill-2">
                        <motion.div className="h-full rounded-full" style={{ background: d?.color ?? "var(--ink-3)" }} initial={{ width: 0 }} animate={{ width: `${Math.max(2, prob * 100)}%` }} />
                      </div>
                      <span className="text-right tabular-nums text-ink-3">{pct(prob)}</span>
                    </div>
                  );
                })}
              </div>
              <label className="mt-4 flex items-center gap-2 text-[12.5px] text-ink-2">
                Reassign
                <select value={team ?? ""} onChange={(e) => onReassign(ticket.id, e.target.value)} className="h-8 flex-1 rounded-lg bg-fill px-2 text-[13px] outline-none">
                  {departments.filter((d) => d.available).map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="space-y-3">
              <Field label="Priority" value={r.priority !== undefined ? PRIORITY_LEVELS[Math.round(r.priority)] : "—"} color={priorityColor(r.priority)} sub={r.priority !== undefined ? `score ${r.priority.toFixed(2)} / 3` : undefined} />
              <Field label="Requester mood" value={r.frustration !== undefined ? FRUSTRATION_LEVELS[Math.round(r.frustration)] : "—"} sub={r.frustration !== undefined ? `score ${r.frustration.toFixed(2)} / 3` : undefined} />
              <div className="grid grid-cols-2 gap-2">
                <Flag label="Affects many" p={r.widespread} />
                <Flag label="Security risk" p={r.securityRisk} danger />
              </div>
              {r.macro && (
                <div className="rounded-xl bg-fill p-3">
                  <div className="text-[11.5px] font-semibold uppercase tracking-[0.05em] text-ink-3">Suggested reply</div>
                  <div className="mt-1 text-[13.5px] font-semibold">{r.macro}</div>
                  <div className="text-[12px] text-ink-3">{MACROS[r.macro]}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl bg-fill p-3">
      <div className="text-[11.5px] font-semibold uppercase tracking-[0.05em] text-ink-3">{label}</div>
      <div className="mt-0.5 text-[13.5px] font-semibold" style={{ color }}>
        {value}
      </div>
      {sub && <div className="font-mono text-[11px] text-ink-3">{sub}</div>}
    </div>
  );
}

function Flag({ label, p, danger }: { label: string; p?: number; danger?: boolean }) {
  const on = (p ?? 0) >= 0.5;
  return (
    <div className="rounded-xl bg-fill p-3">
      <div className="text-[11.5px] font-semibold uppercase tracking-[0.05em] text-ink-3">{label}</div>
      <div className={`mt-0.5 text-[13.5px] font-semibold ${on ? (danger ? "text-red" : "text-orange") : "text-ink-2"}`}>{p === undefined ? "—" : on ? "Yes" : "No"}</div>
      {p !== undefined && <div className="font-mono text-[11px] text-ink-3">p = {p.toFixed(2)}</div>}
    </div>
  );
}
