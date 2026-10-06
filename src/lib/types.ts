export type Department = {
  id: string;
  name: string;
  description: string;
  color: string;
  available: boolean;
  lead: string;
};

export type Channel = "Email" | "Slack" | "Portal" | "Chat";

export type Ticket = {
  id: string;
  subject: string;
  body: string;
  requester: string;
  email: string;
  channel: Channel;
  /** Minutes before "now" when the ticket was opened. */
  ageMin: number;
  /** Ground truth used only for the benchmark. */
  truth: string;
  custom?: boolean;
};

export type Routing = {
  department: string;
  probs: Record<string, number>;
  confidence: number;
  priority?: number; // 0 (P4) … 3 (P1), probability-weighted
  frustration?: number; // 0 … 3
  widespread?: number;
  securityRisk?: number;
  macro?: string;
  macroProbs?: Record<string, number>;
  latencyMs: number;
  inputTokens: number;
};

export type RouteEvent =
  | { type: "row"; id: string; routing: Routing }
  | { type: "error"; id: string; message: string }
  | { type: "done"; wallMs: number; requests: number; questions: number; inputTokens: number; costUsd: number };

export type CallLog = {
  id: number;
  at: number;
  label: string;
  tickets: number;
  questions: number;
  inputTokens: number;
  costUsd: number;
  wallMs: number;
};
