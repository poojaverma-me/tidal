import { ALL_TICKETS } from "@/lib/data";
import { costUsd } from "@/lib/jev";
import { mlxRoute, mlxStatus } from "@/lib/mlx";
import { pool, routeOne } from "@/lib/router";
import { cleanDepartments } from "@/lib/validate";

/** Runs a labelled sample through Jev or a local MLX model and streams per-ticket results. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const departments = cleanDepartments(body.departments);
  const provider = body.provider === "mlx" ? "mlx" : "jev";
  const ids: string[] = Array.isArray(body.ids) ? body.ids.slice(0, 200) : [];
  const tickets = ALL_TICKETS.filter((t) => ids.includes(t.id));
  if (!tickets.length || !departments.length) return Response.json({ error: "ids and departments are required" }, { status: 400 });
  if (provider === "mlx" && !(await mlxStatus()).reachable) return Response.json({ error: "Local MLX server is not reachable" }, { status: 503 });

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (o: unknown) => controller.enqueue(enc.encode(JSON.stringify(o) + "\n"));
      const started = performance.now();
      // A local model shares one GPU, so it runs one ticket at a time.
      await pool(tickets, provider === "mlx" ? 1 : 24, async (t) => {
        try {
          if (provider === "jev") {
            const r = await routeOne(t, departments, "department");
            send({ type: "row", id: t.id, predicted: r.routing.department, confidence: r.routing.confidence, correct: r.routing.department === t.truth, latencyMs: r.routing.latencyMs, inputTokens: r.routing.inputTokens, outputTokens: 0, costUsd: costUsd(r.routing.inputTokens) });
          } else {
            const r = await mlxRoute(t, departments);
            send({ type: "row", id: t.id, predicted: r.department, raw: r.raw, correct: r.department === t.truth, latencyMs: r.latencyMs, inputTokens: r.inputTokens, outputTokens: r.outputTokens, costUsd: 0 });
          }
        } catch (err) {
          send({ type: "error", id: t.id, message: err instanceof Error ? err.message : String(err) });
        }
      });
      send({ type: "done", wallMs: Math.round(performance.now() - started) });
      controller.close();
    },
  });
  return new Response(stream, { headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" } });
}
