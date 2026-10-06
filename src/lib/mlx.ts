import "server-only";
import type { Department } from "./types";
import type { TicketInput } from "./router";

/** A local Apple-silicon model served by `mlx_lm.server` (OpenAI-compatible). Optional. */
export const mlxConfig = () => ({
  baseUrl: process.env.MLX_BASE_URL?.replace(/\/$/, "") ?? "",
  model: process.env.MLX_MODEL ?? "mlx-community/Llama-3.2-3B-Instruct-4bit",
});

export async function mlxStatus() {
  const { baseUrl, model } = mlxConfig();
  if (!baseUrl) return { configured: false, reachable: false, model, baseUrl };
  try {
    const res = await fetch(`${baseUrl}/v1/models`, { signal: AbortSignal.timeout(1500), cache: "no-store" });
    return { configured: true, reachable: res.ok, model, baseUrl };
  } catch {
    return { configured: true, reachable: false, model, baseUrl };
  }
}

/** Ask the local model for a department name and map its free-text answer back to a department. */
export async function mlxRoute(t: TicketInput, departments: Department[]) {
  const { baseUrl, model } = mlxConfig();
  const active = departments.filter((d) => d.available);
  const system = `You route IT and support tickets. Reply with exactly one team name from this list and nothing else:\n${active.map((d) => `- ${d.name}: ${d.description}`).join("\n")}`;
  const started = performance.now();
  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0,
      max_tokens: 16,
      messages: [
        { role: "system", content: system },
        { role: "user", content: `Subject: ${t.subject}\n\n${t.body}` },
      ],
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`MLX ${res.status}`);
  const json = await res.json();
  const latencyMs = Math.round(performance.now() - started);
  const text: string = json.choices?.[0]?.message?.content ?? "";
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
  const hit = active.find((d) => norm(text).includes(norm(d.name))) ?? active.find((d) => norm(d.name).includes(norm(text)) && norm(text).length > 3);
  return {
    department: hit?.id ?? null,
    raw: text.trim(),
    latencyMs,
    inputTokens: json.usage?.prompt_tokens ?? Math.ceil((system.length + t.body.length) / 4),
    outputTokens: json.usage?.completion_tokens ?? 8,
  };
}
