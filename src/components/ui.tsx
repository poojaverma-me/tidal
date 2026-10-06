"use client";

import { motion } from "framer-motion";
import { initials } from "@/lib/format";
import type { Department } from "@/lib/types";

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return (
    <div className="grid shrink-0 place-items-center rounded-full font-rounded font-bold text-white" style={{ width: size, height: size, fontSize: size * 0.38, background: `linear-gradient(150deg, hsl(${h} 60% 60%), hsl(${(h + 35) % 360} 55% 45%))` }}>
      {initials(name)}
    </div>
  );
}

export function DeptChip({ dept, p, small }: { dept?: Department; p?: number; small?: boolean }) {
  if (!dept) return <span className="text-[12px] text-ink-3">Unrouted</span>;
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full font-medium ${small ? "px-2 py-0.5 text-[11.5px]" : "px-2.5 py-1 text-[12.5px]"}`}
      style={{ color: dept.color, background: `color-mix(in srgb, ${dept.color} 13%, transparent)` }}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: dept.color }} />
      <span className="truncate">{dept.name}</span>
      {p !== undefined && <span className="tabular-nums opacity-70">{Math.round(p * 100)}%</span>}
    </span>
  );
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className="relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors" style={{ background: on ? "var(--green)" : "var(--fill-2)" }}>
      <motion.span className="absolute top-[2px] h-[22px] w-[22px] rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,.2)]" animate={{ left: on ? 20 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 32 }} />
    </button>
  );
}

export function Ring({ value, size = 44, color = "var(--teal)" }: { value: number; size?: number; color?: string }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--fill-2)" strokeWidth={5} fill="none" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={5} fill="none" strokeLinecap="round" strokeDasharray={c} initial={false} animate={{ strokeDashoffset: c * (1 - value) }} />
      </svg>
      <span className="absolute font-rounded text-[12px] font-bold">{value.toFixed(2)}</span>
    </div>
  );
}

export function Segmented<T extends string | number>({ value, options, onChange }: { value: T; options: { value: T; label: React.ReactNode }[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-[9px] bg-fill-2 p-0.5 text-[12.5px]">
      {options.map((o) => (
        <button key={String(o.value)} onClick={() => onChange(o.value)} className={`rounded-[7px] px-2.5 py-1 font-medium transition ${value === o.value ? "bg-panel text-ink shadow-[0_1px_3px_rgba(0,0,0,.15)]" : "text-ink-2"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
