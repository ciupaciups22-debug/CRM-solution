import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Client, SolutionCell, SolutionSystem } from "@/lib/types";
import { MAX_SYSTEMS, SOLUTION_ROWS, type SolutionRow } from "@/lib/solutionRows";
import { errMessage, useUpdateClient } from "@/lib/crm";
import { cn } from "@/lib/utils";

type FieldRow = Extract<SolutionRow, { kind: "field" }>;
type SetCell = (i: number, key: string, patch: Partial<SolutionCell>) => void;

const EMPTY: SolutionCell = { value: "", extra: "", checked: false };
const head = "text-[11px] font-medium uppercase tracking-[0.12em]";
const cellInput =
  "h-8 w-full min-w-0 rounded-md border border-[#1E293B] bg-[#0B0F17] px-2 text-sm text-slate-100 outline-none transition-[border-color] duration-150 placeholder:text-slate-600 focus:border-[#0284C7]";

const newSystem = (): SolutionSystem => ({
  id: crypto.randomUUID(),
  name: "",
  cells: { dormas_cilindru: { value: "25/30", extra: "", checked: false } }, // sheet default
});

const initialSystems = (client: Client): SolutionSystem[] =>
  client.solution_table.systems.length
    ? client.solution_table.systems.map((s) => ({ ...s, id: s.id.startsWith("legacy-") ? crypto.randomUUID() : s.id }))
    : [newSystem()];

/** Editable copy of the client's profile-system columns + save. */
function useSolutionSystems(client: Client, onDone: () => void) {
  const [systems, setSystems] = useState<SolutionSystem[]>(() => initialSystems(client));
  const update = useUpdateClient();

  const setName = (i: number, name: string) => setSystems((ss) => ss.map((s, j) => (j === i ? { ...s, name } : s)));
  const setCell: SetCell = (i, key, patch) =>
    setSystems((ss) =>
      ss.map((s, j) => (j === i ? { ...s, cells: { ...s.cells, [key]: { ...EMPTY, ...s.cells[key], ...patch } } } : s)),
    );
  const addSystem = () => setSystems((ss) => (ss.length >= MAX_SYSTEMS ? ss : [...ss, newSystem()]));
  const removeSystem = (i: number) => setSystems((ss) => ss.filter((_, j) => j !== i));

  const save = () =>
    update.mutate(
      { id: client.id, body: { solution_table: { systems } } },
      {
        onSuccess: () => { toast.success("Solution saved"); onDone(); },
        onError: (e) => toast.error(errMessage(e)),
      },
    );

  return { systems, setName, setCell, addSystem, removeSystem, save, saving: update.isPending };
}

function MultiSelect({ options, value, onChange, testId }: { options: string[]; value: string; onChange: (v: string) => void; testId: string }) {
  const selected = value ? value.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const toggle = (opt: string) =>
    onChange((selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]).join(", "));
  return (
    <Popover>
      <PopoverTrigger className={cn(cellInput, "flex items-center justify-between gap-1 text-left")} data-testid={testId}>
        <span className={cn("truncate", !selected.length && "text-slate-600")}>{selected.length ? selected.join(", ") : "Select…"}</span>
        <ChevronDown className="size-3.5 shrink-0 text-slate-500" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 border-[#334155] bg-[#0F172A] p-1">
        {options.map((opt) => (
          <label key={opt} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-[#1E293B]">
            <Checkbox checked={selected.includes(opt)} onCheckedChange={() => toggle(opt)} />
            {opt}
          </label>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function SystemHeaderCell({ system, index, onName, onRemove }: { system: SolutionSystem; index: number; onName: (v: string) => void; onRemove: () => void }) {
  return (
    <th colSpan={2} className="min-w-[230px] border-l border-[#0369A1]/50 px-2 py-2">
      <div className="flex items-center gap-1">
        <input
          value={system.name}
          onChange={(e) => onName(e.target.value)}
          placeholder={`System ${index + 1} (e.g. Rehau)`}
          className={cn(cellInput, "font-semibold")}
          data-testid={`solution-system-name-input-${index}`}
        />
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Remove profile system"
          onClick={onRemove}
          className="shrink-0 text-slate-500 hover:text-[#FB7185]"
          data-testid={`solution-remove-system-${index}`}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </th>
  );
}

/** Value part of one cell: multi-select chips, or text input(s) backed by datalist suggestions. */
function ValueEditor({ row, cell, index, setCell }: { row: FieldRow; cell: SolutionCell; index: number; setCell: SetCell }) {
  if (row.noValue) return null;
  if (row.multi && row.options) {
    return (
      <MultiSelect
        options={row.options}
        value={cell.value}
        onChange={(v) => setCell(index, row.key, { value: v })}
        testId={`solution-input-${row.key}-${index}`}
      />
    );
  }
  return (
    <div className="flex gap-1">
      <input
        list={row.options ? `dl-${row.key}` : undefined}
        value={cell.value}
        onChange={(e) => setCell(index, row.key, { value: e.target.value })}
        placeholder={row.options ? "Select or type…" : ""}
        className={cellInput}
        data-testid={`solution-input-${row.key}-${index}`}
      />
      {row.extraOptions && (
        <input
          list={`dl-${row.key}-extra`}
          value={cell.extra}
          onChange={(e) => setCell(index, row.key, { extra: e.target.value })}
          placeholder="Falt…"
          className={cellInput}
          data-testid={`solution-input-${row.key}-extra-${index}`}
        />
      )}
    </div>
  );
}

function FieldRowEditor({ row, systems, setCell }: { row: FieldRow; systems: SolutionSystem[]; setCell: SetCell }) {
  return (
    <tr className="border-t border-[#1F2937]">
      <td className="sticky left-0 z-10 bg-[#0F172A] px-3 py-1.5 font-medium text-slate-300">{row.label}:</td>
      {systems.map((s, i) => {
        const cell = { ...EMPTY, ...s.cells[row.key] };
        return [
          <td key={`${s.id}-v`} className="border-l border-[#1F2937] px-2 py-1.5" colSpan={row.check ? 1 : 2}>
            <ValueEditor row={row} cell={cell} index={i} setCell={setCell} />
          </td>,
          row.check ? (
            <td key={`${s.id}-c`} className="w-14 px-1 py-1.5 text-center">
              <Checkbox
                checked={cell.checked}
                onCheckedChange={(c) => setCell(i, row.key, { checked: c === true })}
                aria-label={`${row.label} ${s.name}`}
                data-testid={`solution-check-input-${row.key}-${i}`}
              />
            </td>
          ) : null,
        ];
      })}
    </tr>
  );
}

function RowEditor({ row, rowIndex, systems, setCell }: { row: SolutionRow; rowIndex: number; systems: SolutionSystem[]; setCell: SetCell }) {
  if (row.kind === "section") {
    return (
      <tr className="bg-[#111827]">
        <td colSpan={1 + systems.length * 2} className={cn(head, "sticky left-0 px-3 py-1.5 text-[#38BDF8]")}>{row.label}</td>
      </tr>
    );
  }
  if (row.kind === "subheader") {
    return (
      <tr>
        <td className="sticky left-0 bg-[#0F172A]" />
        {systems.map((s) => [
          <td key={`${s.id}-v-${rowIndex}`} className="border-l border-[#1F2937]" />,
          <td key={`${s.id}-c-${rowIndex}`} className={cn(head, "w-14 px-1 py-1 text-center text-slate-500")}>{row.checkLabel}</td>,
        ])}
      </tr>
    );
  }
  return <FieldRowEditor row={row} systems={systems} setCell={setCell} />;
}

const rowKey = (row: SolutionRow, i: number) => (row.kind === "field" ? row.key : `${row.kind}-${i}`);

/** Datalists back the dropdown suggestions; values stay free-typed like the sheet allows. Static, so rendered once. */
function SolutionDatalists() {
  return (
    <>
      {SOLUTION_ROWS.map((row) =>
        row.kind === "field" ? (
          <span key={`dl-${row.key}`} className="hidden">
            {row.options && !row.multi && (
              <datalist id={`dl-${row.key}`}>{row.options.map((o) => <option key={o} value={o} />)}</datalist>
            )}
            {row.extraOptions && (
              <datalist id={`dl-${row.key}-extra`}>{row.extraOptions.map((o) => <option key={o} value={o} />)}</datalist>
            )}
          </span>
        ) : null,
      )}
    </>
  );
}

function Editor({ client, onDone }: { client: Client; onDone: () => void }) {
  const { systems, setName, setCell, addSystem, removeSystem, save, saving } = useSolutionSystems(client, onDone);
  const full = systems.length >= MAX_SYSTEMS;
  return (
    <>
      <div className="max-h-[68vh] overflow-auto rounded-lg border border-[#1E293B]" data-testid="solution-editor">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-20">
            <tr className="bg-[#032845]">
              <th className={cn(head, "sticky left-0 z-30 min-w-[200px] bg-[#032845] px-3 py-2 text-left text-[#7DD3FC]")}>Profile system</th>
              {systems.map((s, i) => (
                <SystemHeaderCell key={s.id} system={s} index={i} onName={(v) => setName(i, v)} onRemove={() => removeSystem(i)} />
              ))}
            </tr>
          </thead>
          <tbody>
            {SOLUTION_ROWS.map((row, ri) => (
              <RowEditor key={rowKey(row, ri)} row={row} rowIndex={ri} systems={systems} setCell={setCell} />
            ))}
          </tbody>
        </table>
        <SolutionDatalists />
      </div>
      <DialogFooter className="items-center sm:justify-between">
        <Button type="button" variant="outline" disabled={full} onClick={addSystem} data-testid="solution-add-system-button">
          <Plus className="size-4" /> Add profile system {full && `(max ${MAX_SYSTEMS})`}
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onDone} data-testid="solution-cancel-button">Cancel</Button>
          <Button type="button" onClick={save} disabled={saving} className="active:scale-[0.98]" data-testid="solution-save-button">
            {saving ? "Saving…" : "Save solution"}
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}

export default function SolutionEditorDialog({ open, onOpenChange, client }: { open: boolean; onOpenChange: (o: boolean) => void; client: Client }) {
  return (
    <Dialog open={open} onOpenChange={(o: boolean) => onOpenChange(o)}>
      <DialogContent className="w-[96vw] max-w-[96vw] border-[#334155] bg-[#0F172A] sm:max-w-[96vw]" data-testid="solution-editor-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading">Solution — {client.company_name}</DialogTitle>
          <DialogDescription>One column per profile system (up to {MAX_SYSTEMS}). Dropdowns follow the Solution-EDV sheet; you can also type custom values.</DialogDescription>
        </DialogHeader>
        {open && <Editor client={client} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
