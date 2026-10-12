import { Building2 } from "lucide-react";
import ClientCard from "@/components/crm/ClientCard";
import type { Client } from "@/lib/types";

interface Props {
  clients: Client[] | undefined;
  isLoading: boolean;
  isError: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const SKELETON_KEYS = [0, 1, 2, 3];

function ListPlaceholder({ kind }: { kind: "loading" | "error" | "empty" }) {
  if (kind === "loading") {
    return (
      <div className="space-y-2" data-testid="client-list-loading">
        {SKELETON_KEYS.map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl border border-[#1F2937] bg-[#111827]" />
        ))}
      </div>
    );
  }
  if (kind === "error") {
    return (
      <div className="rounded-xl border border-dashed border-[#334155] p-8 text-sm text-slate-400" data-testid="client-list-error">
        Client data is unavailable right now.
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-dashed border-[#334155] p-10 text-center" data-testid="client-list-empty">
      <Building2 className="mx-auto size-8 text-slate-600" />
      <p className="mt-3 text-sm text-slate-400">No clients match. Adjust filters or add a new client.</p>
    </div>
  );
}

// Filtering and sorting happen server-side (GET /api/clients?q=&filter=&sort=); this only renders.
export default function ClientList({ clients, isLoading, isError, selectedId, onSelect }: Props) {
  if (isLoading) return <ListPlaceholder kind="loading" />;
  if (isError || !clients) return <ListPlaceholder kind="error" />;
  if (clients.length === 0) return <ListPlaceholder kind="empty" />;
  return (
    <ul className="space-y-2" aria-live="polite" data-testid="client-list">
      {clients.map((c, i) => (
        <ClientCard key={c.id} client={c} index={i} active={c.id === selectedId} onSelect={onSelect} />
      ))}
    </ul>
  );
}
