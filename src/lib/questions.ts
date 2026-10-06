import type { Question } from "./jev";
import { MACROS } from "./data";
import type { Department, Ticket } from "./types";

export const PRIORITY_LEVELS = ["P4 · Low: no real impact", "P3 · Normal: one person, has a workaround", "P2 · High: blocks someone's work", "P1 · Critical: outage, security or many people blocked"];
export const FRUSTRATION_LEVELS = ["Calm", "Mildly frustrated", "Frustrated", "Angry"];

export const ticketState = (t: Pick<Ticket, "subject" | "body" | "channel">) => ({ subject: t.subject, message: t.body, channel: t.channel });

/** Only available departments are offered, so an offline team simply can't be chosen. */
export function departmentQuestion(departments: Department[]): Question {
  return {
    type: "choice",
    instructions: "Which team should handle this ticket?",
    criteria: Object.fromEntries(departments.filter((d) => d.available).map((d) => [d.name, d.description])),
  };
}

export function fullQuestions(departments: Department[]): Record<string, Question> {
  return {
    department: departmentQuestion(departments),
    priority: { type: "score", instructions: "How urgent is this ticket for the business?", criteria: PRIORITY_LEVELS },
    frustration: { type: "score", instructions: "How frustrated does the requester sound?", criteria: FRUSTRATION_LEVELS },
    widespread: { type: "noul", instructions: "Does this issue affect multiple people, a whole team or many customers?" },
    securityRisk: { type: "noul", instructions: "Could this ticket involve a security risk such as phishing, leaked credentials, malware or unauthorized access?" },
    macro: { type: "choice", instructions: "Which saved reply should the agent start from?", criteria: MACROS },
  };
}
