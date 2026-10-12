import { motion } from "motion/react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { errMessage, fmtDate, useDeleteVisit, useVisits } from "@/lib/crm";
import { FADE_UP, stagger } from "@/lib/motion";
import type { Visit } from "@/lib/types";

function VisitEntry({ visit: v, index, onDelete }: { visit: Visit; index: number; onDelete: (v: Visit) => void }) {
  return (
    <motion.li
      initial={FADE_UP.initial}
      animate={FADE_UP.animate}
      transition={stagger(index, 0.04)}
      className="relative"
      data-testid={`visit-entry-${v.id}`}
    >
      <span className="absolute -left-[29px] top-3 size-2.5 rounded-full border-2 border-[#0B0F17] bg-[#38BDF8]" />
      <div className="group rounded-lg border border-[#273549] bg-[#161F30] p-4">
        <div className="flex items-center justify-between">
          <span className="rounded bg-[#0F172A] px-2 py-0.5 font-mono text-xs text-[#38BDF8]" data-testid="visit-entry-date">
            {fmtDate(v.date)}
          </span>
          <button
            type="button"
            aria-label="Delete visit"
            onClick={() => onDelete(v)}
            className="rounded p-1 text-slate-500 opacity-0 transition-[opacity,color] duration-150 hover:text-[#FB7185] group-hover:opacity-100 focus-visible:opacity-100"
            data-testid="visit-entry-delete-button"
          >
            <X className="size-3.5" />
          </button>
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-200" data-testid="visit-entry-note">{v.note}</p>
      </div>
    </motion.li>
  );
}

export default function VisitLog({ clientId }: { clientId: string }) {
  const { data: visits, isLoading } = useVisits(clientId);
  const delVisit = useDeleteVisit();

  const onDelete = (v: Visit) =>
    delVisit.mutate(
      { clientId, visitId: v.id },
      { onSuccess: () => toast.success("Visit removed"), onError: (e) => toast.error(errMessage(e)) },
    );

  let body;
  if (isLoading) {
    body = <div className="mt-4 h-24 animate-pulse rounded-lg bg-[#161F30]" />;
  } else if (!visits || visits.length === 0) {
    body = (
      <p className="mt-4 rounded-lg border border-dashed border-[#334155] p-6 text-sm text-slate-400" data-testid="visit-log-empty">
        No visits logged yet. Log the first one to start tracking.
      </p>
    );
  } else {
    body = (
      <ol role="feed" className="relative mt-5 space-y-4 border-l border-[#334155] pl-6" data-testid="visit-log">
        {visits.map((v, i) => (
          <VisitEntry key={v.id} visit={v} index={i} onDelete={onDelete} />
        ))}
      </ol>
    );
  }

  return (
    <section>
      <h3 className="font-heading text-lg font-semibold text-slate-100">Visit log</h3>
      {body}
    </section>
  );
}
