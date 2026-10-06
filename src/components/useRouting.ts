"use client";

import { useCallback, useRef, useState } from "react";
import type { CallLog, Department, RouteEvent, Routing, Ticket } from "@/lib/types";

type Done = Extract<RouteEvent, { type: "done" }>;

export function useRouting() {
  const [routing, setRouting] = useState<Record<string, Routing>>({});
  const [pending, setPending] = useState<Record<string, true>>({});
  const [logs, setLogs] = useState<CallLog[]>([]);
  const seq = useRef(0);

  /** Streams Jev routings for `tickets`. In "department" mode only the team is re-asked; other answers are kept. */
  const route = useCallback(async (tickets: Ticket[], departments: Department[], mode: "full" | "department", label: string): Promise<Done | null> => {
    if (!tickets.length) return null;
    setPending((p) => ({ ...p, ...Object.fromEntries(tickets.map((t) => [t.id, true as const])) }));
    const res = await fetch("/api/route-tickets", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tickets: tickets.map(({ id, subject, body, channel }) => ({ id, subject, body, channel })), departments, mode }),
    });
    if (!res.ok || !res.body) {
      setPending({});
      return null;
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    let done: Done | null = null;
    for (;;) {
      const { value, done: end } = await reader.read();
      if (end) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      const rows: { id: string; routing: Routing }[] = [];
      const failed: string[] = [];
      for (const line of lines) {
        if (!line.trim()) continue;
        const e = JSON.parse(line) as RouteEvent;
        if (e.type === "row") rows.push(e);
        else if (e.type === "error") failed.push(e.id);
        else done = e;
      }
      if (rows.length)
        setRouting((prev) => {
          const next = { ...prev };
          for (const r of rows) next[r.id] = mode === "full" || !prev[r.id] ? r.routing : { ...prev[r.id], ...pickDept(r.routing) };
          return next;
        });
      if (rows.length || failed.length)
        setPending((p) => {
          const next = { ...p };
          [...rows.map((r) => r.id), ...failed].forEach((id) => delete next[id]);
          return next;
        });
    }
    if (done) {
      const d = done;
      setLogs((l) => [{ id: ++seq.current, at: Date.now(), label, tickets: tickets.length, questions: d.questions, inputTokens: d.inputTokens, costUsd: d.costUsd, wallMs: d.wallMs }, ...l]);
    }
    return done;
  }, []);

  return { routing, pending, logs, route };
}

const pickDept = (r: Routing) => ({ department: r.department, probs: r.probs, confidence: r.confidence, latencyMs: r.latencyMs, inputTokens: r.inputTokens });
