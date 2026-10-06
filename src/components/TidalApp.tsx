"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, BarChart3, CheckCircle2, Flame, Inbox as InboxIcon, Network, Radio, ShieldAlert, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BACKLOG, DEFAULT_DEPARTMENTS, INTAKE } from "@/lib/data";
import { ms, usd } from "@/lib/format";
import type { Department, Ticket } from "@/lib/types";
import HowJevRoutes from "./HowJevRoutes";
import Inbox, { type Mailbox } from "./Inbox";
import Insights from "./Insights";
import NewTicketModal from "./NewTicketModal";
import Teams, { type Reroute } from "./Teams";
import { Switch } from "./ui";
import { useRouting } from "./useRouting";

export type Page = "inbox" | "teams" | "insights" | "how";
const clock = () => performance.now();
const HASH: Record<Page, string> = { inbox: "", teams: "teams", insights: "insights", how: "how-jev-routes" };

export default function TidalApp() {
  const [page, setPageState] = useState<Page>("inbox");
  const [departments, setDepartments] = useState<Department[]>(DEFAULT_DEPARTMENTS);
  const [routedWith, setRoutedWith] = useState<Department[]>(DEFAULT_DEPARTMENTS);
  const [tickets, setTickets] = useState<Ticket[]>(BACKLOG);
  const [mailbox, setMailbox] = useState<Mailbox>({ kind: "all" });
  const [selected, setSelected] = useState<string | null>(BACKLOG[0]?.id ?? null);
  const [threshold, setThreshold] = useState(0.6);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [resolved, setResolved] = useState<Record<string, true>>({});
  const [fresh, setFresh] = useState<Record<string, true>>({});
  const [intakeOn, setIntakeOn] = useState(false);
  const [composer, setComposer] = useState(false);
  const [reroute, setReroute] = useState<Reroute | null>(null);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const { routing, pending, logs, route } = useRouting();
  const intakeIdx = useRef(0);
  const started = useRef(false);

  const say = useCallback((text: string) => setToast({ id: Date.now(), text }), []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3800);
    return () => clearTimeout(t);
  }, [toast]);

  const setPage = useCallback((p: Page) => {
    setPageState(p);
    window.history.replaceState(null, "", HASH[p] ? `#${HASH[p]}` : window.location.pathname);
  }, []);
  useEffect(() => {
    const fromHash = () => {
      const p = (Object.keys(HASH) as Page[]).find((k) => HASH[k] && HASH[k] === window.location.hash.slice(1));
      if (p) setPageState(p);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  // Route the whole backlog once on load.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void route(BACKLOG, DEFAULT_DEPARTMENTS, "full", `Initial triage · ${BACKLOG.length} tickets`);
  }, [route]);

  const deptById = useMemo(() => Object.fromEntries(departments.map((d) => [d.id, d])), [departments]);
  const teamOf = useCallback((id: string) => overrides[id] ?? routing[id]?.department, [overrides, routing]);
  const open = tickets.filter((t) => !resolved[t.id]);

  // Live intake: a new ticket every few seconds, routed the moment it lands.
  useEffect(() => {
    if (!intakeOn) return;
    const tick = () => {
      const t = INTAKE[intakeIdx.current % INTAKE.length];
      const copy: Ticket = { ...t, id: intakeIdx.current < INTAKE.length ? t.id : `${t.id}-${intakeIdx.current}`, ageMin: 0 };
      intakeIdx.current++;
      setTickets((ts) => [copy, ...ts]);
      setFresh((f) => ({ ...f, [copy.id]: true }));
      void route([copy], routedWith, "full", `Live intake · ${copy.id}`).then((d) => d && say(`${copy.id} routed in ${ms(d.wallMs)}`));
    };
    tick();
    const id = setInterval(tick, 5500);
    return () => clearInterval(id);
  }, [intakeOn, route, routedWith, say]);

  const submit = async (t: Ticket) => {
    setTickets((ts) => [t, ...ts]);
    setFresh((f) => ({ ...f, [t.id]: true }));
    setComposer(false);
    setMailbox({ kind: "all" });
    setSelected(t.id);
    setPage("inbox");
    const d = await route([t], routedWith, "full", `New ticket · ${t.id}`);
    if (d) say(`Routed by Jev in ${ms(d.wallMs)} · ${usd(d.costUsd)}`);
  };

  const doReroute = async () => {
    const before = Object.fromEntries(open.map((t) => [t.id, teamOf(t.id) ?? ""]));
    const prevDepts = routedWith;
    setRoutedWith(departments);
    setOverrides({});
    const t0 = clock();
    const d = await route(open, departments, "department", `Re-route backlog · ${open.length} tickets`);
    setReroute({ before, prevDepts, nextDepts: departments, wallMs: d?.wallMs ?? Math.round(clock() - t0), costUsd: d?.costUsd ?? 0, tickets: open.length });
    if (d) say(`Re-routed ${open.length} tickets in ${ms(d.wallMs)} · ${usd(d.costUsd)}`);
  };

  const changed = JSON.stringify(departments) !== JSON.stringify(routedWith);
  const needsReview = open.filter((t) => routing[t.id] && !overrides[t.id] && routing[t.id].confidence < threshold);
  const urgent = open.filter((t) => (routing[t.id]?.priority ?? 0) >= 2.5);
  const security = open.filter((t) => (routing[t.id]?.securityRisk ?? 0) >= 0.5);
  const spent = logs.reduce((s, l) => s + l.costUsd, 0);

  return (
    <div className="flex h-full">
      <aside className="sidebar thin-scroll hidden h-full w-[250px] shrink-0 flex-col overflow-y-auto border-r border-line md:flex">
        <div className="flex items-center gap-2 px-5 pb-3 pt-5">
          <TidalMark />
          <span className="font-rounded text-[1.35rem] font-extrabold tracking-tight">Tidal</span>
          <span className="ml-auto rounded-full bg-teal-soft px-2 py-0.5 text-[10.5px] font-bold text-teal">Jev</span>
        </div>

        <div className="space-y-0.5 px-3">
          <NavItem icon={<InboxIcon size={16} />} active={page === "inbox"} onClick={() => setPage("inbox")} label="Inbox" count={open.length} />
          <NavItem icon={<Network size={16} />} active={page === "teams"} onClick={() => setPage("teams")} label="Teams & routing" badge={changed ? "Changed" : undefined} />
          <NavItem icon={<BarChart3 size={16} />} active={page === "insights"} onClick={() => setPage("insights")} label="Insights & costs" />
          <NavItem icon={<Sparkles size={16} />} active={page === "how"} onClick={() => setPage("how")} label="How Jev routes" />
        </div>

        <Label>Mailboxes</Label>
        <div className="space-y-0.5 px-3">
          <NavItem icon={<InboxIcon size={15} />} active={page === "inbox" && mailbox.kind === "all"} onClick={() => (setMailbox({ kind: "all" }), setPage("inbox"))} label="All open" count={open.length} />
          <NavItem icon={<AlertTriangle size={15} className="text-orange" />} active={page === "inbox" && mailbox.kind === "review"} onClick={() => (setMailbox({ kind: "review" }), setPage("inbox"))} label="Needs review" count={needsReview.length} />
          <NavItem icon={<Flame size={15} className="text-red" />} active={page === "inbox" && mailbox.kind === "urgent"} onClick={() => (setMailbox({ kind: "urgent" }), setPage("inbox"))} label="Critical (P1)" count={urgent.length} />
          <NavItem icon={<ShieldAlert size={15} className="text-red" />} active={page === "inbox" && mailbox.kind === "security"} onClick={() => (setMailbox({ kind: "security" }), setPage("inbox"))} label="Security risk" count={security.length} />
          <NavItem icon={<CheckCircle2 size={15} className="text-green" />} active={page === "inbox" && mailbox.kind === "resolved"} onClick={() => (setMailbox({ kind: "resolved" }), setPage("inbox"))} label="Resolved" count={Object.keys(resolved).length} />
        </div>

        <Label>Teams</Label>
        <div className="space-y-0.5 px-3">
          {routedWith.map((d) => (
            <button
              key={d.id}
              onClick={() => (setMailbox({ kind: "team", id: d.id }), setPage("inbox"))}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition ${page === "inbox" && mailbox.kind === "team" && mailbox.id === d.id ? "bg-fill-2 font-semibold" : "hover:bg-fill"}`}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color, opacity: d.available ? 1 : 0.35 }} />
              <span className={`min-w-0 flex-1 truncate ${d.available ? "" : "text-ink-3 line-through"}`}>{d.name}</span>
              <span className="tabular-nums text-ink-3">{open.filter((t) => teamOf(t.id) === d.id).length}</span>
            </button>
          ))}
        </div>

        <div className="mt-auto space-y-2 p-3">
          <div className="card flex items-center gap-3 rounded-xl p-3">
            <Radio size={16} className={intakeOn ? "text-teal" : "text-ink-3"} />
            <div className="flex-1 text-[12.5px]">
              <div className="font-semibold">Live intake</div>
              <div className="text-ink-3">{intakeOn ? "New ticket every 5 s" : "Paused"}</div>
            </div>
            <Switch on={intakeOn} onChange={setIntakeOn} label="Live intake" />
          </div>
          <div className="card rounded-xl p-3 text-[12px]">
            <div className="flex justify-between">
              <span className="text-ink-3">Jev calls this session</span>
              <span className="font-semibold tabular-nums">{logs.reduce((s, l) => s + l.tickets, 0)}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-ink-3">Spent</span>
              <span className="font-semibold tabular-nums text-teal">{usd(spent)}</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="h-full min-w-0 flex-1">
        {page === "inbox" && (
          <Inbox
            tickets={tickets}
            mailbox={mailbox}
            setMailbox={setMailbox}
            routing={routing}
            pending={pending}
            departments={routedWith}
            deptById={deptById}
            teamOf={teamOf}
            threshold={threshold}
            overrides={overrides}
            resolved={resolved}
            fresh={fresh}
            selected={selected}
            setSelected={setSelected}
            onNew={() => setComposer(true)}
            onReassign={(id, dept) => {
              setOverrides((o) => ({ ...o, [id]: dept }));
              say(`Reassigned ${id} to ${deptById[dept]?.name}`);
            }}
            onResolve={(id) => {
              setResolved((r) => ({ ...r, [id]: true }));
              say(`${id} resolved`);
            }}
            onRerun={(t) => void route([t], routedWith, "full", `Re-run · ${t.id}`)}
            onPage={setPage}
          />
        )}
        {page === "teams" && (
          <Teams departments={departments} setDepartments={setDepartments} routedWith={routedWith} changed={changed} openCount={open.length} onReroute={doReroute} reroute={reroute} routing={routing} pendingCount={Object.keys(pending).length} />
        )}
        {page === "insights" && <Insights tickets={tickets} routing={routing} logs={logs} departments={routedWith} teamOf={teamOf} threshold={threshold} />}
        {page === "how" && <HowJevRoutes tickets={tickets} routing={routing} departments={routedWith} threshold={threshold} setThreshold={setThreshold} />}
      </main>

      <NewTicketModal open={composer} onClose={() => setComposer(false)} onSubmit={submit} />

      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-ink px-5 py-2.5 text-[13px] font-medium text-bg shadow-2xl"
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="mb-1 mt-5 px-5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">{children}</div>;
}

function NavItem({ icon, label, active, onClick, count, badge }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void; count?: number; badge?: string }) {
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13.5px] transition ${active ? "bg-accent text-white" : "hover:bg-fill"}`}>
      <span className={active ? "text-white" : "text-teal"}>{icon}</span>
      <span className="flex-1 truncate font-medium">{label}</span>
      {badge && <span className="rounded-full bg-orange px-1.5 text-[10.5px] font-bold text-white">{badge}</span>}
      {count !== undefined && <span className={`tabular-nums text-[12px] ${active ? "text-white/80" : "text-ink-3"}`}>{count}</span>}
    </button>
  );
}

function TidalMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden>
      <defs>
        <linearGradient id="tm" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#2dd4bf" />
          <stop offset="1" stopColor="#0f766e" />
        </linearGradient>
      </defs>
      <rect width="28" height="28" rx="8" fill="url(#tm)" />
      <path d="M5 16c3-4 6-4 9 0s6 4 9 0M5 11c3-4 6-4 9 0s6 4 9 0" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
