import { useRef, useState } from "react";
import { toast } from "sonner";
import { Download, FileUp, Pencil } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import SolutionTableView from "@/components/crm/SolutionTableView";
import SolutionEditorDialog from "@/components/crm/SolutionEditorDialog";
import { errMessage, solutionExportUrl, useImportSolution } from "@/lib/crm";
import type { Client } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function SolutionSection({ client }: { client: Client }) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const importMut = useImportSolution();
  const hasSolution = client.solution_table.systems.length > 0;

  const runImport = (file: File) => {
    importMut.mutate(
      { id: client.id, file },
      {
        onSuccess: (c) => {
          toast.success(`Imported ${c.solution_table.systems.length} profile system(s)`);
          setPendingFile(null);
        },
        onError: (e) => { toast.error(errMessage(e)); setPendingFile(null); },
      },
    );
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    if (hasSolution) setPendingFile(file); // confirm replace
    else runImport(file);
  };

  return (
    <section data-testid="solution-section">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-heading text-lg font-semibold text-slate-100">Solution</h3>
        <div className="flex flex-wrap gap-2">
          <input ref={fileRef} type="file" accept=".xlsx" className="hidden" onChange={onFile} data-testid="solution-import-file-input" />
          <Button
            size="xs"
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={importMut.isPending}
            data-testid="solution-import-button"
          >
            <FileUp className="size-3" /> {importMut.isPending ? "Importing…" : "Import Excel"}
          </Button>
          {hasSolution ? (
            <a
              href={solutionExportUrl(client.id)}
              download
              className={buttonVariants({ size: "xs", variant: "outline" })}
              data-testid="solution-export-button"
            >
              <Download className="size-3" /> Export Excel
            </a>
          ) : (
            <span className={cn(buttonVariants({ size: "xs", variant: "outline" }), "pointer-events-none opacity-50")} aria-disabled>
              <Download className="size-3" /> Export Excel
            </span>
          )}
          <Button size="xs" onClick={() => setEditorOpen(true)} data-testid="solution-edit-button">
            <Pencil className="size-3" /> {hasSolution ? "Edit solution" : "Add solution"}
          </Button>
        </div>
      </div>

      {hasSolution ? (
        <SolutionTableView table={client.solution_table} />
      ) : (
        <button
          type="button"
          onClick={() => setEditorOpen(true)}
          className="w-full rounded-lg border border-dashed border-[#0369A1]/60 p-6 text-sm text-slate-400 transition-colors duration-150 hover:border-[#0369A1] hover:text-slate-200"
          data-testid="solution-empty-add-button"
        >
          No solution yet — add profile systems, or import a filled Solution-EDV sheet
        </button>
      )}

      <SolutionEditorDialog open={editorOpen} onOpenChange={setEditorOpen} client={client} />

      <Dialog open={!!pendingFile} onOpenChange={(o: boolean) => { if (!o) setPendingFile(null); }}>
        <DialogContent className="border-[#334155] bg-[#0F172A]" data-testid="solution-import-confirm-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading">Replace current solution?</DialogTitle>
            <DialogDescription>
              Importing <span className="font-mono text-slate-300">{pendingFile?.name}</span> replaces all profile systems of {client.company_name}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPendingFile(null)} data-testid="solution-import-cancel-button">Cancel</Button>
            <Button
              onClick={() => pendingFile && runImport(pendingFile)}
              disabled={importMut.isPending}
              data-testid="solution-import-confirm-button"
            >
              {importMut.isPending ? "Importing…" : "Replace"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
