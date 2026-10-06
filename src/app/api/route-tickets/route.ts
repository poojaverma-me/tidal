import { routeStream } from "@/lib/router";
import { cleanDepartments, cleanTickets } from "@/lib/validate";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const departments = cleanDepartments(body.departments);
  const tickets = cleanTickets(body.tickets);
  if (!departments.some((d) => d.available) || !tickets.length) return Response.json({ error: "tickets and at least one available department are required" }, { status: 400 });
  const mode = body.mode === "department" ? "department" : "full";
  return new Response(routeStream(tickets, departments, mode), { headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" } });
}
