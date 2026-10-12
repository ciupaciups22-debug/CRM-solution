import { Check } from "lucide-react";
import type { SolutionTable } from "@/lib/types";
import { SOLUTION_ROWS } from "@/lib/solutionRows";
import { cn } from "@/lib/utils";

const head = "text-[11px] font-medium uppercase tracking-[0.12em]";
const dash = <span className="text-slate-700">—</span>;

/** Read-only spreadsheet-style view of the Solution sheet. */
export default function SolutionTableView({ table }: { table: SolutionTable }) {
  const systems = table.systems;
  return (
    <div className="overflow-x-auto rounded-lg border border-[#0369A1]" data-testid="solution-table">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[#032845]">
            <th className={cn(head, "sticky left-0 z-10 min-w-[190px] border-r border-[#0369A1] bg-[#032845] px-3 py-2.5 text-left text-[#7DD3FC]")}>
              Profile system
            </th>
            {systems.map((s, i) => (
              <th
                key={s.id}
                colSpan={2}
                className="min-w-[150px] border-r border-[#0369A1]/50 px-3 py-2.5 text-left font-heading text-sm font-semibold text-[#E0F2FE] last:border-r-0"
                data-testid={`solution-system-name-${i}`}
              >
                {s.name || <span className="text-slate-500">Untitled</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SOLUTION_ROWS.map((row, ri) => {
            if (row.kind === "section") {
              return (
                <tr key={`sec-${ri}`} className="bg-[#111827]">
                  <td
                    colSpan={1 + systems.length * 2}
                    className={cn(head, "sticky left-0 border-y border-[#1F2937] px-3 py-1.5 text-[#38BDF8]")}
                  >
                    {row.label}
                  </td>
                </tr>
              );
            }
            if (row.kind === "subheader") {
              return (
                <tr key={`sub-${ri}`} className="border-t border-[#1F2937] bg-[#0B0F17]">
                  <td className="sticky left-0 border-r border-[#1F2937] bg-[#0B0F17]" />
                  {systems.map((s) => [
                    <td key={`${s.id}-v`} />,
                    <td key={`${s.id}-c`} className={cn(head, "border-r border-[#1F2937] px-2 py-1 text-center text-slate-500 last:border-r-0")}>
                      {row.checkLabel}
                    </td>,
                  ])}
                </tr>
              );
            }
            return (
              <tr key={row.key} className="border-t border-[#1F2937] transition-colors duration-150 hover:bg-[#111827]" data-testid={`solution-row-${row.key}`}>
                <td className="sticky left-0 border-r border-[#1F2937] bg-[#0B0F17] px-3 py-2 font-medium text-slate-300">
                  {row.label}:
                </td>
                {systems.map((s, i) => {
                  const cell = s.cells[row.key];
                  const val = [cell?.value, cell?.extra].filter(Boolean).join(" · ");
                  return [
                    <td
                      key={`${s.id}-v`}
                      className={cn("px-3 py-2 text-slate-100", !row.check && "border-r border-[#1F2937] last:border-r-0")}
                      colSpan={row.check ? 1 : 2}
                      data-testid={`solution-cell-${row.key}-${i}`}
                    >
                      {row.noValue ? null : val || dash}
                    </td>,
                    row.check ? (
                      <td key={`${s.id}-c`} className="w-12 border-r border-[#1F2937] px-2 py-2 text-center last:border-r-0" data-testid={`solution-check-${row.key}-${i}`}>
                        {cell?.checked ? <Check className="mx-auto size-4 text-[#34D399]" /> : <span className="text-slate-700">·</span>}
                      </td>
                    ) : null,
                  ];
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
