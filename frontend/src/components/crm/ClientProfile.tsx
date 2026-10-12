import { Mail, Phone, User, MapPin } from "lucide-react";
import type { Client } from "@/lib/types";
import { EQUIPMENT_ROWS, telHref } from "@/lib/crm";

const label = "text-[11px] font-medium uppercase tracking-[0.15em] text-slate-500";
const dash = <span className="text-slate-600">—</span>;

function PhoneLink({ phone, testId }: { phone: string; testId: string }) {
  if (!phone) return dash;
  return (
    <a
      href={telHref(phone)}
      className="font-mono text-[#38BDF8] transition-colors duration-150 hover:text-[#7DD3FC]"
      data-testid={testId}
    >
      {phone}
    </a>
  );
}

export default function ClientProfile({ client, onEdit }: { client: Client; onEdit: () => void }) {
  const hasContact = client.contact_name || client.contact_email || client.contact_phone;
  return (
    <div className="mt-5 overflow-hidden rounded-lg border border-[#1F2937] bg-[#0B0F17]" data-testid="client-profile">
      {/* Adresa | Contact */}
      <div className="grid gap-4 p-4 sm:grid-cols-2">
        <div data-testid="client-detail-address-block">
          <p className={label}>Adresa</p>
          {client.address ? (
            <p className="mt-2 flex gap-1.5 whitespace-pre-wrap text-sm text-slate-100" data-testid="client-detail-address">
              <MapPin className="mt-0.5 size-3.5 shrink-0 text-slate-500" />
              {client.address}
            </p>
          ) : (
            <button
              type="button"
              onClick={onEdit}
              className="mt-2 text-sm text-slate-500 underline-offset-4 transition-colors duration-150 hover:text-slate-300 hover:underline"
              data-testid="client-detail-add-address-button"
            >
              Add address
            </button>
          )}
        </div>
        <div className="sm:border-l sm:border-[#1F2937] sm:pl-4" data-testid="client-detail-contact">
          <p className={label}>Contact</p>
          {hasContact ? (
            <div className="mt-2 space-y-1.5 text-sm">
              {client.contact_name && (
                <p className="flex items-center gap-1.5 text-slate-100" data-testid="client-detail-contact-name">
                  <User className="size-3.5 text-slate-500" /> {client.contact_name}
                </p>
              )}
              {client.contact_email && (
                <a
                  href={`mailto:${client.contact_email}`}
                  className="flex items-center gap-1.5 text-[#38BDF8] transition-colors duration-150 hover:text-[#7DD3FC]"
                  data-testid="client-detail-contact-email"
                >
                  <Mail className="size-3.5" /> {client.contact_email}
                </a>
              )}
              {client.contact_phone && (
                <a
                  href={telHref(client.contact_phone)}
                  className="flex items-center gap-1.5 font-mono text-[#38BDF8] transition-colors duration-150 hover:text-[#7DD3FC]"
                  data-testid="client-detail-contact-phone"
                >
                  <Phone className="size-3.5" /> {client.contact_phone}
                </a>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onEdit}
              className="mt-2 text-sm text-slate-500 underline-offset-4 transition-colors duration-150 hover:text-slate-300 hover:underline"
              data-testid="client-detail-add-contact-button"
            >
              Add contact
            </button>
          )}
        </div>
      </div>

      {/* Equipment table */}
      <div className="overflow-x-auto border-t border-[#1F2937]">
        <table className="w-full min-w-[520px] text-sm" data-testid="client-detail-equipment-table">
          <thead>
            <tr className="border-b border-[#1F2937] bg-[#111827]">
              <th className="w-[170px] px-4 py-2" />
              <th className={`px-3 py-2 text-left ${label}`}>Tip</th>
              <th className={`px-3 py-2 text-left ${label}`}>Contact person</th>
              <th className={`px-3 py-2 text-left ${label}`}>Tel.</th>
            </tr>
          </thead>
          <tbody>
            {EQUIPMENT_ROWS.map((r) => {
              const row = client.equipment[r.key];
              return (
                <tr key={r.key} className="border-b border-[#1F2937] last:border-0" data-testid={`equipment-row-${r.key}`}>
                  <td className="px-4 py-2.5 font-medium text-slate-300">{r.label}:</td>
                  <td className="px-3 py-2.5 text-slate-100" data-testid={`equipment-row-${r.key}-type`}>{row.type || dash}</td>
                  <td className="px-3 py-2.5 text-slate-100" data-testid={`equipment-row-${r.key}-contact`}>{row.contact_person || dash}</td>
                  <td className="px-3 py-2.5">
                    <PhoneLink phone={row.phone} testId={`equipment-row-${r.key}-phone`} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
