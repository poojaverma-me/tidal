import type { Channel, Department } from "./types";
import type { TicketInput } from "./router";

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

export function cleanDepartments(v: unknown): Department[] {
  if (!Array.isArray(v)) return [];
  return v.slice(0, 24).map((d) => ({
    id: str(d?.id, 40) || str(d?.name, 40),
    name: str(d?.name, 60),
    description: str(d?.description, 300),
    color: str(d?.color, 16) || "#8E8E93",
    available: d?.available !== false,
    lead: str(d?.lead, 60),
  })).filter((d) => d.name);
}

export function cleanTickets(v: unknown, limit = 400): TicketInput[] {
  if (!Array.isArray(v)) return [];
  return v.slice(0, limit).map((t) => ({
    id: str(t?.id, 40),
    subject: str(t?.subject, 200),
    body: str(t?.body, 2000),
    channel: (["Email", "Slack", "Portal", "Chat"].includes(t?.channel) ? t.channel : "Portal") as Channel,
  })).filter((t) => t.id && (t.subject || t.body));
}
