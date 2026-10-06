"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Send } from "lucide-react";
import { useEffect, useState } from "react";
import type { Channel, Ticket } from "@/lib/types";
import { Segmented } from "./ui";

const EXAMPLES = [
  { subject: "Laptop stolen from my car", body: "Someone broke into my car and took my work laptop. It wasn't encrypted as far as I know." },
  { subject: "Can't join Wi-Fi in the new office", body: "The new Leeds office Wi-Fi rejects my password. Three of us have the same problem." },
  { subject: "Invoice charged in USD instead of GBP", body: "Our last invoice was charged in dollars but our contract is in pounds. Please correct and refund the FX fees." },
];

let counter = 3000;

export default function NewTicketModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (t: Ticket) => void }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [channel, setChannel] = useState<Channel>("Portal");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const send = () => {
    if (!subject.trim() && !body.trim()) return;
    onSubmit({ id: `TCK-${++counter}`, subject: subject.trim() || body.trim().slice(0, 60), body: body.trim() || subject.trim(), requester: "You", email: "you@northwind.example", channel, ageMin: 0, truth: "", custom: true });
    setSubject("");
    setBody("");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[60] grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal
            aria-label="New ticket"
            initial={{ y: 24, scale: 0.97 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
            className="relative w-full max-w-[600px] overflow-hidden rounded-[20px] bg-panel shadow-2xl ring-1 ring-line"
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <button onClick={onClose} className="text-[14px] text-teal">
                Cancel
              </button>
              <span className="text-[14px] font-semibold">New ticket</span>
              <button onClick={send} disabled={!subject.trim() && !body.trim()} className="flex items-center gap-1.5 text-[14px] font-semibold text-teal disabled:opacity-40">
                <Send size={14} /> Submit
              </button>
            </div>
            <div className="space-y-3 p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13px] text-ink-3">Channel</span>
                <Segmented value={channel} onChange={setChannel} options={(["Portal", "Email", "Slack", "Chat"] as Channel[]).map((c) => ({ value: c, label: c }))} />
              </div>
              <input autoFocus value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="w-full border-b border-line bg-transparent pb-2 text-[17px] font-semibold outline-none placeholder:text-ink-3" />
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="Describe the problem…" className="w-full resize-none bg-transparent text-[15px] leading-relaxed outline-none placeholder:text-ink-3" />
              <div>
                <div className="mb-1.5 text-[12px] text-ink-3">Try one</div>
                <div className="flex flex-wrap gap-1.5">
                  {EXAMPLES.map((e) => (
                    <button
                      key={e.subject}
                      onClick={() => {
                        setSubject(e.subject);
                        setBody(e.body);
                      }}
                      className="rounded-full bg-fill px-3 py-1 text-[12px] text-ink-2 hover:text-ink"
                    >
                      {e.subject}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
