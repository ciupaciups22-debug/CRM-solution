import { motion } from "motion/react";
import type { Client } from "@/lib/types";
import { cn } from "@/lib/utils";
import { fmtDate, relDays } from "@/lib/crm";
import { FADE_UP, stagger } from "@/lib/motion";

const badge = "shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider";

function StatusBadge({ overdue }: { overdue: boolean }) {
  return overdue ? (
    <span className={cn(badge, "border-[#BE123C] bg-[#4C0519] text-[#FFE4E6]")} data-testid="client-card-overdue-badge">
      Overdue
    </span>
  ) : (
    <span className={cn(badge, "border-[#059669] bg-[#064E3B] text-[#ECFDF5]")}>On track</span>
  );
}

interface Props {
  client: Client;
  index: number;
  active: boolean;
  onSelect: (id: string) => void;
}

export default function ClientCard({ client: c, index, active, onSelect }: Props) {
  return (
    <motion.li initial={FADE_UP.initial} animate={FADE_UP.animate} transition={stagger(index)}>
      <button
        type="button"
        onClick={() => onSelect(c.id)}
        data-testid={`client-card-${c.id}`}
        className={cn(
          "group w-full rounded-xl border p-4 text-left transition-[border-color,background-color,transform] duration-200 active:scale-[0.99]",
          active ? "border-[#0284C7] bg-[#0F1B2D]" : "border-[#1F2937] bg-[#111827] hover:border-[#374151]",
          c.overdue && !active && "border-l-2 border-l-[#F43F5E]",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="truncate font-heading text-base font-semibold text-slate-50" data-testid="client-card-name">
            {c.company_name}
          </h3>
          <StatusBadge overdue={c.overdue} />
        </div>
        <p className="mt-0.5 font-mono text-[11px] text-slate-500" data-testid="client-card-cui">
          CUI {c.cui || "—"}
        </p>
        <p className="mt-1 line-clamp-1 text-sm text-[#7DD3FC]" data-testid="client-card-solution">
          {c.solution || <span className="text-slate-500">No solution yet</span>}
        </p>
        {c.contact_name && (
          <p className="mt-0.5 truncate text-xs text-slate-400" data-testid="client-card-contact">
            {c.contact_name}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between font-mono text-xs text-slate-400">
          <span data-testid="client-card-last-visit">Last visit · {fmtDate(c.last_visit)}</span>
          <span className={cn(c.overdue && "text-[#FB7185]")}>{relDays(c.days_since_visit)}</span>
        </div>
      </button>
    </motion.li>
  );
}
