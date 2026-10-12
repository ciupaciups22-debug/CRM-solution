import { useState } from "react";
import { format, parseISO, subDays } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { errMessage, useLogVisit } from "@/lib/crm";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string | null;
  clientName?: string;
  today: string; // server-anchored YYYY-MM-DD
}

function VisitForm({ clientId, today, onDone }: { clientId: string; today: string; onDone: () => void }) {
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");
  const log = useLogVisit();
  const yesterday = format(subDays(parseISO(today), 1), "yyyy-MM-dd");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      toast.error("Add a note for this visit");
      return;
    }
    log.mutate(
      { id: clientId, body: { date, note: note.trim() } },
      {
        onSuccess: () => { toast.success("Visit logged"); onDone(); },
        onError: (err) => toast.error(errMessage(err)),
      },
    );
  };

  return (
    <form onSubmit={submit} className="space-y-4" data-testid="visit-form">
      <div className="space-y-1.5">
        <Label htmlFor="visit-date">Visit date</Label>
        <div className="flex gap-2">
          <Input
            id="visit-date"
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            className="font-mono"
            data-testid="visit-form-date-input"
          />
          <Button type="button" variant="outline" size="sm" className="h-9" onClick={() => setDate(today)} data-testid="visit-form-today-button">
            Today
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-9" onClick={() => setDate(yesterday)} data-testid="visit-form-yesterday-button">
            Yesterday
          </Button>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="visit-note">Notes</Label>
        <Textarea
          id="visit-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={5}
          placeholder="What was discussed, decisions, next steps…"
          data-testid="visit-form-note-input"
          autoFocus
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone} data-testid="visit-form-cancel-button">
          Cancel
        </Button>
        <Button type="submit" disabled={log.isPending} className="active:scale-[0.98]" data-testid="log-visit-submit-btn">
          {log.isPending ? "Logging…" : "Log visit"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function VisitDialog({ open, onOpenChange, clientId, clientName, today }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o: boolean) => onOpenChange(o)}>
      <DialogContent className="border-[#334155] bg-[#0F172A] sm:max-w-lg" data-testid="visit-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading">Log visit</DialogTitle>
          <DialogDescription>{clientName ? `Record a visit with ${clientName}.` : "Record a client visit."}</DialogDescription>
        </DialogHeader>
        {open && clientId && <VisitForm key={clientId} clientId={clientId} today={today} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
