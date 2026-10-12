import { useState } from "react";
import { toast } from "sonner";
import { CalendarPlus, Pencil, Trash2, MousePointerClick } from "lucide-react";
import ClientProfile from "@/components/crm/ClientProfile";
import SolutionSection from "@/components/crm/SolutionSection";
import VisitLog from "@/components/crm/VisitLog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { errMessage, fmtDate, relDays, useClient, useDeleteClient } from "@/lib/crm";
import type { Client } from "@/lib/types";

interface Props {
  clientId: string | null;
  onLogVisit: (c: Client) => void;
  onEdit: (c: Client) => void;
  onDeleted: () => void;
}

function DetailHeader({ client, onLogVisit, onEdit, onDelete }: { client: Client; onLogVisit: () => void; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-slate-500">Client dossier</p>
        <h2 className="mt-1 font-heading text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl" data-testid="client-detail-name">
          {client.company_name}
        </h2>
        <p className="mt-1 font-mono text-xs text-slate-400" data-testid="client-detail-cui">
          CUI: {client.cui || <span className="text-[#FBBF24]">missing — edit to add</span>}
        </p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={onLogVisit} className="active:scale-[0.98]" data-testid="client-detail-log-visit-button">
          <CalendarPlus className="size-4" /> Log visit
        </Button>
        <Button size="icon-sm" variant="outline" onClick={onEdit} aria-label="Edit client" data-testid="client-detail-edit-button">
          <Pencil className="size-4" />
        </Button>
        <Button size="icon-sm" variant="outline" onClick={onDelete} aria-label="Delete client" data-testid="client-detail-delete-button" className="hover:text-[#FB7185]">
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function VisitStats({ client }: { client: Client }) {
  return (
    <div className="mt-4 grid grid-cols-3 gap-3 font-mono text-xs">
      <div className="rounded-lg bg-[#0B0F17] p-3">
        <p className="text-slate-500">Last visit</p>
        <p className="mt-1 text-slate-100" data-testid="client-detail-last-visit">{fmtDate(client.last_visit)}</p>
      </div>
      <div className={cn("rounded-lg p-3", client.overdue ? "bg-[#1C1318]" : "bg-[#0E1E1C]")}>
        <p className="text-slate-500">Status</p>
        <p className={cn("mt-1", client.overdue ? "text-[#FB7185]" : "text-[#34D399]")} data-testid="client-detail-status">
          {client.overdue ? "Overdue" : "On track"} · {relDays(client.days_since_visit)}
        </p>
      </div>
      <div className="rounded-lg bg-[#0B0F17] p-3">
        <p className="text-slate-500">Visits</p>
        <p className="mt-1 text-slate-100" data-testid="client-detail-visit-count">{client.visit_count}</p>
      </div>
    </div>
  );
}

function DeleteClientDialog({ client, open, onOpenChange, onDeleted }: { client: Client; open: boolean; onOpenChange: (o: boolean) => void; onDeleted: () => void }) {
  const del = useDeleteClient();
  const handleDelete = () =>
    del.mutate(client.id, {
      onSuccess: () => { toast.success("Client deleted"); onOpenChange(false); onDeleted(); },
      onError: (e) => toast.error(errMessage(e)),
    });
  return (
    <Dialog open={open} onOpenChange={(o: boolean) => onOpenChange(o)}>
      <DialogContent className="border-[#334155] bg-[#0F172A]" data-testid="delete-client-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading">Delete {client.company_name}?</DialogTitle>
          <DialogDescription>This removes the client and all of their visit notes.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} data-testid="delete-client-cancel-button">Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={del.isPending} data-testid="delete-client-confirm-button">
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ClientDetail({ clientId, onLogVisit, onEdit, onDeleted }: Props) {
  const { data: client, isError } = useClient(clientId);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!clientId) {
    return (
      <div className="flex h-full min-h-72 flex-col items-center justify-center rounded-xl border border-dashed border-[#334155] p-10 text-center" data-testid="client-detail-empty">
        <MousePointerClick className="size-8 text-slate-600" />
        <p className="mt-3 text-sm text-slate-400">Select a client to see their solution and visit log.</p>
      </div>
    );
  }
  if (isError || !client) {
    return <div className="h-72 animate-pulse rounded-xl border border-[#1F2937] bg-[#111827]" data-testid="client-detail-loading" />;
  }

  return (
    <div className="rounded-xl border border-[#1F2937] bg-[#111827]" data-testid="client-detail">
      <div className="border-b border-[#1F2937] p-6">
        <DetailHeader
          client={client}
          onLogVisit={() => onLogVisit(client)}
          onEdit={() => onEdit(client)}
          onDelete={() => setConfirmOpen(true)}
        />
        <ClientProfile client={client} onEdit={() => onEdit(client)} />
        <VisitStats client={client} />
      </div>

      <div className="p-6">
        <VisitLog clientId={client.id} />
      </div>

      <div className="border-t border-[#1F2937] p-6">
        <SolutionSection client={client} />
      </div>

      <DeleteClientDialog client={client} open={confirmOpen} onOpenChange={setConfirmOpen} onDeleted={onDeleted} />
    </div>
  );
}
