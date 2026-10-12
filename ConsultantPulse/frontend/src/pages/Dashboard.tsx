import { useEffect, useState } from "react";
import { Plus, Search, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { useClients, useStats } from "@/lib/crm";
import type { Client, ClientFilter, ClientSort } from "@/lib/types";
import StatsGrid from "@/components/crm/StatsGrid";
import ClientList from "@/components/crm/ClientList";
import ClientDetail from "@/components/crm/ClientDetail";
import ClientDialog from "@/components/crm/ClientDialog";
import VisitDialog from "@/components/crm/VisitDialog";

const FILTERS: { value: ClientFilter; label: string }[] = [
  { value: "all", label: "All clients" },
  { value: "overdue", label: "Overdue" },
  { value: "recent", label: "Visited ≤7d" },
];

const SORT_LABELS: Record<ClientSort, string> = {
  oldest: "Last visit: oldest first",
  newest: "Last visit: newest first",
  name: "Company A–Z",
};

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const q = useDebounced(search, 250);
  const [filter, setFilter] = useState<ClientFilter>("all");
  const [sort, setSort] = useState<ClientSort>("oldest");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [clientDialog, setClientDialog] = useState<{ open: boolean; client: Client | null }>({ open: false, client: null });
  const [visitDialog, setVisitDialog] = useState<{ open: boolean; client: Client | null }>({ open: false, client: null });

  const clients = useClients(q, filter, sort);
  const stats = useStats();
  const today = stats.data?.today ?? new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-[#0B0F17]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-lg bg-[#0284C7] shadow-[0_0_20px_rgba(2,132,199,0.35)]">
              <Activity className="size-4 text-white" />
            </div>
            <span className="font-heading text-lg font-bold tracking-tight" data-testid="app-brand">ConsultantPulse</span>
            <span className="ml-2 hidden font-mono text-xs text-slate-500 sm:inline" data-testid="header-today">{today}</span>
          </div>
          <Button
            onClick={() => setClientDialog({ open: true, client: null })}
            className="active:scale-[0.98]"
            data-testid="add-client-button"
          >
            <Plus className="size-4" /> New client
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-[-0.025em] sm:text-4xl">Client engagements</h1>
          <p className="mt-1 text-sm text-slate-400">Solutions, visit cadence, and notes for every account.</p>
        </div>

        <StatsGrid stats={stats.isError ? undefined : stats.data} onOverdueClick={() => setFilter("overdue")} />

        <div className="grid grid-cols-12 gap-6">
          <section className="col-span-12 space-y-3 lg:col-span-5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, CUI, solution, contact, or notes…"
                className="h-10 pl-9"
                data-testid="client-search-input"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex rounded-lg border border-[#1F2937] bg-[#111827] p-1" role="tablist">
                {FILTERS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    role="tab"
                    aria-selected={filter === f.value}
                    onClick={() => setFilter(f.value)}
                    data-testid={`filter-${f.value}-button`}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-medium transition-[background-color,color] duration-150",
                      filter === f.value ? "bg-[#1E293B] text-slate-50" : "text-slate-400 hover:text-slate-200",
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <Select value={sort} onValueChange={(v: string) => setSort(v as ClientSort)}>
                <SelectTrigger size="sm" className="w-52" data-testid="client-sort-select">
                  <SelectValue>{(v) => SORT_LABELS[v as ClientSort]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(SORT_LABELS) as ClientSort[]).map((k) => (
                    <SelectItem key={k} value={k} data-testid={`client-sort-option-${k}`}>
                      {SORT_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="font-mono text-xs text-slate-500" data-testid="client-result-count">
              {clients.data && !clients.isError ? `${clients.data.length} client${clients.data.length === 1 ? "" : "s"}` : "\u00a0"}
            </p>
            <ClientList
              clients={clients.data}
              isLoading={clients.isLoading}
              isError={clients.isError}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </section>

          <section className="col-span-12 lg:col-span-7">
            <div className="lg:sticky lg:top-24">
              <ClientDetail
                clientId={selectedId}
                onLogVisit={(c) => setVisitDialog({ open: true, client: c })}
                onEdit={(c) => setClientDialog({ open: true, client: c })}
                onDeleted={() => setSelectedId(null)}
              />
            </div>
          </section>
        </div>
      </main>

      <ClientDialog
        open={clientDialog.open}
        client={clientDialog.client}
        onOpenChange={(o) => setClientDialog((s) => ({ ...s, open: o }))}
        onCreated={(c) => setSelectedId(c.id)}
      />
      <VisitDialog
        open={visitDialog.open}
        clientId={visitDialog.client?.id ?? null}
        clientName={visitDialog.client?.company_name}
        today={today}
        onOpenChange={(o) => setVisitDialog((s) => ({ ...s, open: o }))}
      />
      <Toaster richColors />
    </div>
  );
}
