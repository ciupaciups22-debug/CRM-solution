import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Client, ClientCreate, Equipment, EquipmentKey, EquipmentRow } from "@/lib/types";
import { EQUIPMENT_ROWS, emptyEquipment, errMessage, useCreateClient, useUpdateClient } from "@/lib/crm";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null; // edit mode when set
  onCreated?: (c: Client) => void;
}

const sectionLabel = "text-[11px] font-medium uppercase tracking-[0.15em] text-slate-500";
const CLIENT_EXISTS = "Client exists.";

interface FormState {
  company_name: string;
  cui: string;
  address: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  equipment: Equipment;
}
type TextField = Exclude<keyof FormState, "equipment">;
type SetText = (field: TextField, value: string) => void;

const initialState = (c?: Client | null): FormState => ({
  company_name: c?.company_name ?? "",
  cui: c?.cui ?? "",
  address: c?.address ?? "",
  contact_name: c?.contact_name ?? "",
  contact_email: c?.contact_email ?? "",
  contact_phone: c?.contact_phone ?? "",
  equipment: c?.equipment ?? emptyEquipment(),
});

const toBody = (f: FormState): ClientCreate => ({
  company_name: f.company_name.trim(),
  cui: f.cui.trim(),
  address: f.address.trim(),
  contact_name: f.contact_name.trim(),
  contact_email: f.contact_email.trim(),
  contact_phone: f.contact_phone.trim(),
  equipment: f.equipment,
});

/** Form state + save/validation logic, kept out of the markup. */
function useClientForm(client: Client | null | undefined, onDone: () => void, onCreated?: (c: Client) => void) {
  const [form, setForm] = useState<FormState>(() => initialState(client));
  const [cuiError, setCuiError] = useState<string | null>(null);
  const create = useCreateClient();
  const update = useUpdateClient();

  const setText: SetText = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (field === "cui") setCuiError(null);
  };
  const setEquipment = (key: EquipmentKey, field: keyof EquipmentRow, value: string) =>
    setForm((f) => ({ ...f, equipment: { ...f.equipment, [key]: { ...f.equipment[key], [field]: value } } }));

  const onError = (err: unknown) => {
    if (err instanceof ApiError && err.status === 409) {
      setCuiError(CLIENT_EXISTS);
      toast.warning(CLIENT_EXISTS);
      return;
    }
    const msg = errMessage(err);
    if (/cui/i.test(msg)) setCuiError(msg);
    toast.error(msg);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name.trim() || !form.cui.trim()) {
      toast.error("Name and CUI are required");
      return;
    }
    const body = toBody(form);
    if (client) {
      update.mutate({ id: client.id, body }, { onSuccess: () => { toast.success("Client updated"); onDone(); }, onError });
    } else {
      create.mutate(body, { onSuccess: (c) => { toast.success(`${c.company_name} added`); onCreated?.(c); onDone(); }, onError });
    }
  };

  return { form, cuiError, setText, setEquipment, submit, pending: create.isPending || update.isPending };
}

function IdentityFields({ form, setText, cuiError }: { form: FormState; setText: SetText; cuiError: string | null }) {
  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
      <div className="space-y-1.5">
        <Label htmlFor="company_name">Name</Label>
        <Input
          id="company_name"
          value={form.company_name}
          onChange={(e) => setText("company_name", e.target.value)}
          placeholder="e.g. Trionec SRL"
          data-testid="client-form-name-input"
          autoFocus
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cui">CUI</Label>
        <Input
          id="cui"
          value={form.cui}
          onChange={(e) => setText("cui", e.target.value)}
          placeholder="e.g. RO12345678"
          aria-invalid={!!cuiError}
          className={cn("font-mono", cuiError && "border-[#F43F5E] focus-visible:ring-[#F43F5E]/40")}
          data-testid="client-form-cui-input"
        />
        {cuiError && (
          <p role="alert" className="flex items-center gap-1 text-xs font-medium text-[#FB7185]" data-testid="client-form-cui-error">
            <AlertTriangle className="size-3.5" /> {cuiError}
          </p>
        )}
      </div>
    </div>
  );
}

function AddressContactFields({ form, setText }: { form: FormState; setText: SetText }) {
  return (
    <div className="grid gap-4 rounded-lg border border-[#1E293B] p-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="address" className={sectionLabel}>Adresa</Label>
        <Textarea
          id="address"
          value={form.address}
          onChange={(e) => setText("address", e.target.value)}
          rows={4}
          placeholder="Street, city, county"
          data-testid="client-form-address-input"
        />
      </div>
      <div className="space-y-2">
        <p className={sectionLabel}>Contact</p>
        <Input aria-label="Contact person" value={form.contact_name} onChange={(e) => setText("contact_name", e.target.value)} placeholder="Contact person" data-testid="client-form-contact-name-input" />
        <Input aria-label="Email" type="email" value={form.contact_email} onChange={(e) => setText("contact_email", e.target.value)} placeholder="Email" data-testid="client-form-contact-email-input" />
        <Input aria-label="Phone" type="tel" value={form.contact_phone} onChange={(e) => setText("contact_phone", e.target.value)} placeholder="Tel." data-testid="client-form-contact-phone-input" />
      </div>
    </div>
  );
}

const EQUIPMENT_INPUTS: { field: keyof EquipmentRow; placeholder: string; testid: string; type?: string }[] = [
  { field: "type", placeholder: "Tip", testid: "type" },
  { field: "contact_person", placeholder: "Contact person", testid: "contact" },
  { field: "phone", placeholder: "Tel.", testid: "phone", type: "tel" },
];

function EquipmentFields({ equipment, setEquipment }: { equipment: Equipment; setEquipment: (k: EquipmentKey, f: keyof EquipmentRow, v: string) => void }) {
  return (
    <div className="rounded-lg border border-[#1E293B] p-3" data-testid="client-form-equipment">
      <div className="hidden grid-cols-[150px_1fr_1fr_130px] gap-2 pb-2 sm:grid">
        <span />
        <span className={sectionLabel}>Tip</span>
        <span className={sectionLabel}>Contact person</span>
        <span className={sectionLabel}>Tel.</span>
      </div>
      <div className="space-y-3 sm:space-y-2">
        {EQUIPMENT_ROWS.map((r) => (
          <div key={r.key} className="grid grid-cols-1 gap-2 sm:grid-cols-[150px_1fr_1fr_130px] sm:items-center">
            <span className="text-sm font-medium text-slate-300">{r.label}:</span>
            {EQUIPMENT_INPUTS.map((inp) => (
              <Input
                key={inp.field}
                aria-label={`${r.label} ${inp.placeholder}`}
                type={inp.type}
                value={equipment[r.key][inp.field]}
                onChange={(e) => setEquipment(r.key, inp.field, e.target.value)}
                placeholder={inp.placeholder}
                data-testid={`client-form-equipment-${r.key}-${inp.testid}-input`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ClientForm({ client, onDone, onCreated }: { client?: Client | null; onDone: () => void; onCreated?: (c: Client) => void }) {
  const { form, cuiError, setText, setEquipment, submit, pending } = useClientForm(client, onDone, onCreated);
  return (
    <form onSubmit={submit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1" data-testid="client-form">
      <IdentityFields form={form} setText={setText} cuiError={cuiError} />
      <AddressContactFields form={form} setText={setText} />
      <EquipmentFields equipment={form.equipment} setEquipment={setEquipment} />
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone} data-testid="client-form-cancel-button">
          Cancel
        </Button>
        <Button type="submit" disabled={pending} data-testid="client-form-submit-button" className="active:scale-[0.98]">
          {pending ? "Saving…" : client ? "Save changes" : "Add client"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function ClientDialog({ open, onOpenChange, client, onCreated }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o: boolean) => onOpenChange(o)}>
      <DialogContent className="border-[#334155] bg-[#0F172A] sm:max-w-3xl" data-testid="client-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading">{client ? "Edit client" : "New client"}</DialogTitle>
          <DialogDescription>Address, contacts and equipment. The solution table is filled in from the client dossier.</DialogDescription>
        </DialogHeader>
        {open && <ClientForm key={client?.id ?? "new"} client={client} onDone={() => onOpenChange(false)} onCreated={onCreated} />}
      </DialogContent>
    </Dialog>
  );
}
