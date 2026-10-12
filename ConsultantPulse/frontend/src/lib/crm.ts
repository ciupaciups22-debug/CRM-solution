import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { apiDelete, apiGet, apiPost, apiPut, apiUpload } from "@/lib/api";
import type {
  Client,
  ClientCreate,
  ClientFilter,
  ClientSort,
  ClientUpdate,
  Equipment,
  EquipmentKey,
  Stats,
  Visit,
  VisitCreate,
} from "@/lib/types";

export const keys = {
  clients: ["clients"] as const,
  stats: ["stats"] as const,
  client: (id: string) => ["client", id] as const,
  visits: (id: string) => ["visits", id] as const,
};

export function useClients(q: string, filter: ClientFilter, sort: ClientSort) {
  const params = new URLSearchParams({ q, filter, sort });
  return useQuery({
    queryKey: [...keys.clients, q, filter, sort],
    queryFn: () => apiGet<Client[]>(`/clients?${params.toString()}`),
  });
}

export function useStats() {
  return useQuery({ queryKey: keys.stats, queryFn: () => apiGet<Stats>("/stats") });
}

export function useClient(id: string | null) {
  return useQuery({
    queryKey: keys.client(id ?? ""),
    queryFn: () => apiGet<Client>(`/clients/${id}`),
    enabled: !!id,
  });
}

export function useVisits(id: string | null) {
  return useQuery({
    queryKey: keys.visits(id ?? ""),
    queryFn: () => apiGet<Visit[]>(`/clients/${id}/visits`),
    enabled: !!id,
  });
}

function useInvalidateAll() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: keys.clients });
    qc.invalidateQueries({ queryKey: keys.stats });
    qc.invalidateQueries({ queryKey: ["client"] });
    qc.invalidateQueries({ queryKey: ["visits"] });
  };
}

export function useCreateClient() {
  const inv = useInvalidateAll();
  return useMutation({
    mutationFn: (body: ClientCreate) => apiPost<Client>("/clients", body),
    onSuccess: inv,
  });
}

export function useUpdateClient() {
  const inv = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ClientUpdate }) =>
      apiPut<Client>(`/clients/${id}`, body),
    onSuccess: inv,
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<void>(`/clients/${id}`),
    // Drop the deleted client's cached queries instead of refetching them (they'd 404), and remove
    // it from every cached list right away so no stale card can survive a racing list refetch.
    onSuccess: (_data, id) => {
      qc.removeQueries({ queryKey: keys.client(id) });
      qc.removeQueries({ queryKey: keys.visits(id) });
      qc.setQueriesData<Client[]>({ queryKey: keys.clients }, (list) => list?.filter((c) => c.id !== id));
      qc.invalidateQueries({ queryKey: keys.clients });
      qc.invalidateQueries({ queryKey: keys.stats });
    },
  });
}

export function useImportSolution() {
  const inv = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const form = new FormData();
      form.append("file", file);
      return apiUpload<Client>(`/clients/${id}/solution/import`, form);
    },
    onSuccess: inv,
  });
}

export const solutionExportUrl = (id: string) => `/api/clients/${id}/solution/export`;

export function useLogVisit() {
  const inv = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: VisitCreate }) =>
      apiPost<Visit>(`/clients/${id}/visits`, body),
    onSuccess: inv,
  });
}

export function useDeleteVisit() {
  const inv = useInvalidateAll();
  return useMutation({
    mutationFn: ({ clientId, visitId }: { clientId: string; visitId: string }) =>
      apiDelete<void>(`/clients/${clientId}/visits/${visitId}`),
    onSuccess: inv,
  });
}

export const EQUIPMENT_ROWS: { key: EquipmentKey; label: string }[] = [
  { key: "cutting", label: "Centru de debitare" },
  { key: "machining", label: "Centru prelucrare" },
  { key: "welding", label: "Centru sudura" },
  { key: "additional", label: "Utilaje aditionale" },
];

export const emptyEquipment = (): Equipment => ({
  cutting: { type: "", contact_person: "", phone: "" },
  machining: { type: "", contact_person: "", phone: "" },
  welding: { type: "", contact_person: "", phone: "" },
  additional: { type: "", contact_person: "", phone: "" },
});

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

export function fmtDate(d: string | null): string {
  if (!d) return "Never";
  return format(parseISO(d), "MMM d, yyyy");
}

export function relDays(days: number | null): string {
  if (days === null) return "No visits yet";
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export function errMessage(e: unknown): string {
  const body = (e as { body?: { detail?: unknown } })?.body;
  if (body && typeof body.detail === "string") return body.detail;
  if (body && Array.isArray(body.detail) && body.detail.length > 0) {
    const msg = (body.detail[0] as { msg?: unknown })?.msg;
    if (typeof msg === "string") return msg.replace(/^Value error, /, "");
  }
  return "Something went wrong";
}
