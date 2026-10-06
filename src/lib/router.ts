import "server-only";
import { askJev, costUsd, type Answer } from "./jev";
import { departmentQuestion, fullQuestions, ticketState } from "./questions";
import type { Department, RouteEvent, Routing, Ticket } from "./types";

export type TicketInput = Pick<Ticket, "id" | "subject" | "body" | "channel">;
export const CONCURRENCY = 24;

export async function pool<T>(items: T[], n: number, fn: (x: T) => Promise<void>) {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) await fn(items[i++]);
  }));
}

function toRouting(answers: Record<string, Answer>, departments: Department[], latencyMs: number, inputTokens: number): Routing {
  const dep = answers.department;
  if (!dep || dep.type !== "choice") throw new Error("missing department answer");
  const byName = Object.fromEntries(departments.map((d) => [d.name, d.id]));
  const probs = Object.fromEntries(Object.entries(dep.probabilities).map(([name, p]) => [byName[name] ?? name, p]));
  const r: Routing = { department: byName[dep.choice] ?? dep.choice, probs, confidence: dep.confidence, latencyMs, inputTokens };
  const pr = answers.priority;
  if (pr?.type === "score") r.priority = pr.score;
  const fr = answers.frustration;
  if (fr?.type === "score") r.frustration = fr.score;
  if (answers.widespread?.type === "noul") r.widespread = answers.widespread.noul;
  if (answers.securityRisk?.type === "noul") r.securityRisk = answers.securityRisk.noul;
  const m = answers.macro;
  if (m?.type === "choice") {
    r.macro = m.choice;
    r.macroProbs = m.probabilities;
  }
  return r;
}

export async function routeOne(t: TicketInput, departments: Department[], mode: "full" | "department") {
  const questions = mode === "full" ? fullQuestions(departments) : { department: departmentQuestion(departments) };
  const res = await askJev(ticketState(t), questions);
  return { routing: toRouting(res.answers, departments, res.latencyMs, res.usage.input_tokens), questions: Object.keys(questions).length, request: res.request };
}

export function routeStream(tickets: TicketInput[], departments: Department[], mode: "full" | "department"): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      const send = (e: RouteEvent) => controller.enqueue(enc.encode(JSON.stringify(e) + "\n"));
      const started = performance.now();
      let requests = 0;
      let questions = 0;
      let inputTokens = 0;
      await pool(tickets, CONCURRENCY, async (t) => {
        try {
          const r = await routeOne(t, departments, mode);
          requests++;
          questions += r.questions;
          inputTokens += r.routing.inputTokens;
          send({ type: "row", id: t.id, routing: r.routing });
        } catch (err) {
          send({ type: "error", id: t.id, message: err instanceof Error ? err.message : String(err) });
        }
      });
      send({ type: "done", wallMs: Math.round(performance.now() - started), requests, questions, inputTokens, costUsd: costUsd(inputTokens) });
      controller.close();
    },
  });
}
