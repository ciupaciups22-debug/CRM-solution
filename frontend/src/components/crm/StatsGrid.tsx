import { motion } from "motion/react";
import { Users, CalendarCheck, AlertTriangle, Timer } from "lucide-react";
import type { Stats } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FADE_UP, stagger } from "@/lib/motion";

interface Props {
  stats: Stats | undefined;
  onOverdueClick: () => void;
}

export default function StatsGrid({ stats, onOverdueClick }: Props) {
  const v = (n: number | null | undefined) => (n === null || n === undefined ? "—" : String(n));
  const items = [
    { key: "total-clients", label: "Total clients", value: v(stats?.total_clients), icon: Users, tone: "default" },
    { key: "visits-month", label: "Visits this month", value: v(stats?.visits_this_month), icon: CalendarCheck, tone: "healthy" },
    {
      key: "overdue-clients",
      label: `Overdue (>${stats?.overdue_threshold_days ?? 30}d)`,
      value: v(stats?.overdue_clients),
      icon: AlertTriangle,
      tone: "overdue",
    },
    {
      key: "avg-days",
      label: "Avg. days since visit",
      value: v(stats?.avg_days_since_visit),
      icon: Timer,
      tone: "default",
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" data-testid="stats-grid">
      {items.map((it, i) => {
        const Icon = it.icon;
        const overdue = it.tone === "overdue";
        const Comp = overdue ? motion.button : motion.div;
        return (
          <Comp
            key={it.key}
            initial={FADE_UP.initial}
            animate={FADE_UP.animate}
            transition={stagger(i, 0.05)}
            onClick={overdue ? onOverdueClick : undefined}
            data-testid={`stat-${it.key}`}
            className={cn(
              "relative overflow-hidden rounded-xl border p-4 text-left transition-[border-color,background-color] duration-200",
              it.tone === "default" && "border-[#1F2937] bg-[#111827]",
              it.tone === "healthy" && "border-[#064E3B] bg-[#0E1E1C]",
              overdue && "cursor-pointer border-[#881337] bg-[#1C1318] hover:border-[#BE123C]",
            )}
          >
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "text-[11px] font-medium uppercase tracking-[0.15em]",
                  overdue ? "text-[#FDA4AF]" : it.tone === "healthy" ? "text-[#6EE7B7]" : "text-slate-400",
                )}
              >
                {it.label}
              </span>
              {overdue ? (
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex size-full animate-beacon rounded-full bg-[#F43F5E]" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-[#F43F5E]" />
                </span>
              ) : (
                <Icon className="size-4 text-slate-500" />
              )}
            </div>
            <div
              className="mt-3 font-heading text-3xl font-semibold tracking-tight text-slate-50"
              data-testid={`stat-${it.key}-value`}
            >
              {it.value}
            </div>
          </Comp>
        );
      })}
    </div>
  );
}
