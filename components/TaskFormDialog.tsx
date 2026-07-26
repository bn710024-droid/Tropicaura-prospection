"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { Campaign, Prospect } from "@/types";

interface FormState {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  due_date: string;
  prospect_id: string;
  campaign_id: string;
}

const EMPTY: FormState = { title: "", description: "", priority: "medium", due_date: "", prospect_id: "", campaign_id: "" };

export default function TaskFormDialog({ trigger, defaultProspectId }: { trigger: ReactNode; defaultProspectId?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>({ ...EMPTY, prospect_id: defaultProspectId ?? "" });
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    fetch("/api/prospects")
      .then((r) => r.json())
      .then((json) => setProspects(json.data ?? []))
      .catch(() => {});
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((json) => setCampaigns(json.data ?? []))
      .catch(() => {});
  }, [open]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Le titre est obligatoire.");
      return;
    }
    if (!form.prospect_id) {
      setError("Sélectionnez une entreprise.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      title: form.title,
      description: form.description || null,
      priority: form.priority,
      due_date: form.due_date || null,
      prospect_id: form.prospect_id,
      campaign_id: form.campaign_id || null,
    };

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  const selectClass = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-border bg-card">
        <DialogHeader>
          <DialogTitle className="text-foreground">Nouvelle tâche</DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="task_title">Titre *</Label>
            <Input id="task_title" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Appeler Fresh4U" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task_description">Description</Label>
            <Textarea id="task_description" value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} />
          </div>

          {!defaultProspectId && (
            <div className="space-y-1.5">
              <Label htmlFor="task_prospect">Entreprise *</Label>
              <select id="task_prospect" value={form.prospect_id} onChange={(e) => set("prospect_id", e.target.value)} className={selectClass}>
                <option value="">Sélectionner…</option>
                {prospects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-popover">
                    {p.company_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="task_priority">Priorité</Label>
              <select
                id="task_priority"
                value={form.priority}
                onChange={(e) => set("priority", e.target.value as FormState["priority"])}
                className={selectClass}
              >
                <option value="low" className="bg-popover">Basse</option>
                <option value="medium" className="bg-popover">Moyenne</option>
                <option value="high" className="bg-popover">Haute</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task_due">Échéance</Label>
              <Input id="task_due" type="date" value={form.due_date} onChange={(e) => set("due_date", e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task_campaign">Campagne</Label>
            <select id="task_campaign" value={form.campaign_id} onChange={(e) => set("campaign_id", e.target.value)} className={selectClass}>
              <option value="">Aucune</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id} className="bg-popover">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Enregistrement…" : "Créer la tâche"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
