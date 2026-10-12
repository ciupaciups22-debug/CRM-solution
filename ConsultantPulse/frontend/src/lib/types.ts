export interface EquipmentRow {
  type: string;
  contact_person: string;
  phone: string;
}

export interface Equipment {
  cutting: EquipmentRow; // Centru de debitare
  machining: EquipmentRow; // Centru prelucrare
  welding: EquipmentRow; // Centru sudura
  additional: EquipmentRow; // Utilaje aditionale
}

export type EquipmentKey = keyof Equipment;

export interface SolutionCell {
  value: string;
  extra: string;
  checked: boolean;
}

export interface SolutionSystem {
  id: string;
  name: string;
  cells: Record<string, SolutionCell>;
}

export interface SolutionTable {
  systems: SolutionSystem[];
}

// Mirrors backend/models/client.py — keep in sync by hand.
export interface Client {
  id: string;
  company_name: string; // shown as "Name"
  cui: string; // unique (normalised without RO prefix / spaces)
  solution: string; // summary: profile system names
  solution_table: SolutionTable;
  address: string;
  equipment: Equipment;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  last_visit: string | null;
  visit_count: number;
  created_at: string;
  days_since_visit: number | null;
  overdue: boolean;
}

export interface ClientCreate {
  company_name: string;
  cui: string;
  solution_table?: SolutionTable | null;
  address?: string | null;
  equipment?: Equipment | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
}

export type ClientUpdate = Partial<ClientCreate>;

export interface Visit {
  id: string;
  client_id: string;
  date: string;
  note: string;
  created_at: string;
}

export interface VisitCreate {
  date?: string | null;
  note: string;
}

export interface Stats {
  today: string;
  total_clients: number;
  visits_this_month: number;
  overdue_clients: number;
  avg_days_since_visit: number | null;
  overdue_threshold_days: number;
}

export type ClientFilter = "all" | "overdue" | "recent";
export type ClientSort = "oldest" | "newest" | "name";
