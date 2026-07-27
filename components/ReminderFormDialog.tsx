"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { Prospect } from "@/types";

interface FormState {
  note: string;
  due_at: string;
  prospect_id: string;
}

const EMPTY: FormState = { note: "", due_at: "", prospect_id: "" };

export default function ReminderFormDialog({ trigger, defaultProspectId }: { trigger: ReactNode; defaultProspectId?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>({ ...EMPTY, prospect_id: defaultProspectId ?? "" });
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || defaultProspectId) return;
    fetch("/api/prospects")
      .then((r) => r.json())
      .then((json) => setProspects(json.data ?? []))
      .catch(() => {});
  }, [open, defaultProspectId]);

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.note.trim()) {
      setError("La note est obligatoire.");
      return;
    }
    if (!form.due_at) {
      setError("La date d'échéance est obligatoire.");
      return;
    }
    if (!form.prospect_id) {
      setError("Sélectionnez une entreprise.");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: form.note,
          due_at: new Date(form.due_at).toISOString(),
          prospect_id: form.prospect_id,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Échec de l'enregistrement");
        return;
      }
      setOpen(false);
      setForm({ ...EMPTY, prospect_id: defaultProspectId ?? "" });
      router.refresh();
    } catch {
      setError("Erreur réseau");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="max-w-md border-border bg-card">
        <DialogHeader>
          <DialogTitle className="text-foreground">Nouveau rappel</DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          {!defaultProspectId && (
            <div className="space-y-1.5">
              <Label htmlFor="rem_prospect">Entreprise *</Label>
              <NativeSelect id="rem_prospect" value={form.prospect_id} onChange={(e) => set("prospect_id", e.target.value)}>
                <option value="">Sélectionner…</option>
                {prospects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-popover">
                    {p.company_name}
                  </option>
                ))}
              </NativeSelect>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="rem_note">Note *</Label>
            <Textarea id="rem_note" value={form.note} onChange={(e) => set("note", e.target.value)} placeholder="Relancer BioFresh" rows={2} required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rem_due">Échéance *</Label>
            <Input id="rem_due" type="date" value={form.due_at} onChange={(e) => set("due_at", e.target.value)} required />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Enregistrement…" : "Créer le rappel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
