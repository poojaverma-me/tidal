import { routeOne } from "@/lib/router";
import { cleanDepartments, cleanTickets } from "@/lib/validate";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const departments = cleanDepartments(body.departments);
  const [ticket] = cleanTickets([body.ticket]);
  if (!ticket || !departments.length) return Response.json({ error: "ticket and departments are required" }, { status: 400 });
  try {
    return Response.json(await routeOne(ticket, departments, "full"));
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 502 });
  }
}
