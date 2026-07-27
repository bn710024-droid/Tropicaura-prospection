"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PROSPECT_STATUSES, type Prospect, type ProspectStatus } from "@/types";
import { statusLabel } from "@/lib/ui";

const STORAGE_KEY = "tropicaura_goals";

type MetricType = "total_prospects" | "countries" | "status_count";

interface Goal {
  id: string;
  label: string;
  metric: MetricType;
  statusFilter?: ProspectStatus;
  target: number;
  dueDate?: string;
}

function loadGoals(): Goal[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveGoals(goals: Goal[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
}

function computeCurrent(goal: Goal, prospects: Prospect[]): number {
  if (goal.metric === "total_prospects") return prospects.length;
  if (goal.metric === "countries") return new Set(prospects.map((p) => p.country).filter(Boolean)).size;
  if (goal.metric === "status_count" && goal.statusFilter) {
    return prospects.filter((p) => p.status === goal.statusFilter).length;
  }
  return 0;
}

// Rendu exclusivement côté client (cf. app/previsions/page.tsx, next/dynamic ssr:false) :
// les objectifs vivent en localStorage, donc aucune valeur initiale à réconcilier avec le SSR.
export default function PrevisionsClient() {
  const [goals, setGoals] = useState<Goal[]>(() => loadGoals());
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [metric, setMetric] = useState<MetricType>("total_prospects");
  const [statusFilter, setStatusFilter] = useState<ProspectStatus>("active_client");
  const [target, setTarget] = useState("");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    fetch("/api/prospects")
      .then((r) => r.json())
      .then((json) => setProspects(json.data ?? []))
      .catch(() => {});
  }, []);

  function addGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim() || !target) return;
    const goal: Goal = {
      id: crypto.randomUUID(),
      label: label.trim(),
      metric,
      statusFilter: metric === "status_count" ? statusFilter : undefined,
      target: Number(target),
      dueDate: dueDate || undefined,
    };
    const next = [...goals, goal];
    setGoals(next);
    saveGoals(next);
    setOpen(false);
    setLabel("");
    setTarget("");
    setDueDate("");
  }

  function removeGoal(id: string) {
    const next = goals.filter((g) => g.id !== id);
    setGoals(next);
    saveGoals(next);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Prévisions</h1>
          <p className="mt-1 text-sm text-muted-foreground">Suivez vos objectifs de prospection.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button>+ Nouvel objectif</Button>} />
          <DialogContent className="max-w-md border-border bg-card">
            <DialogHeader>
              <DialogTitle className="text-foreground">Nouvel objectif</DialogTitle>
            </DialogHeader>
            <form onSubmit={addGoal} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="goal_label">Nom de l&apos;objectif *</Label>
                <Input id="goal_label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Prospecter 300 entreprises" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="goal_metric">Type</Label>
                <NativeSelect id="goal_metric" value={metric} onChange={(e) => setMetric(e.target.value as MetricType)}>
                  <option value="total_prospects" className="bg-popover">Nombre total de prospects</option>
                  <option value="countries" className="bg-popover">Nombre de pays prospectés</option>
                  <option value="status_count" className="bg-popover">Nombre de prospects à un statut donné</option>
                </NativeSelect>
              </div>
              {metric === "status_count" && (
                <div className="space-y-1.5">
                  <Label htmlFor="goal_status">Statut</Label>
                  <NativeSelect id="goal_status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ProspectStatus)}>
                    {PROSPECT_STATUSES.map((s) => (
                      <option key={s} value={s} className="bg-popover">
                        {statusLabel(s)}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="goal_target">Objectif (nombre) *</Label>
                  <Input id="goal_target" type="number" min={1} value={target} onChange={(e) => setTarget(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="goal_due">Échéance</Label>
                  <Input id="goal_due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">Créer l&apos;objectif</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          Aucun objectif pour l&apos;instant.
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const current = computeCurrent(goal, prospects);
            const pct = Math.min((current / goal.target) * 100, 100);
            return (
              <Card key={goal.id} className="border-border bg-card">
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base font-semibold text-foreground">{goal.label}</CardTitle>
                  <button onClick={() => removeGoal(goal.id)} aria-label="Supprimer" className="text-muted-foreground hover:text-destructive">
                    <X className="h-4 w-4" />
                  </button>
                </CardHeader>
                <CardContent>
                  <div className="mb-2 flex items-baseline justify-between text-sm">
                    <span className="font-semibold text-foreground">
                      {current} / {goal.target}
                    </span>
                    <span className="text-muted-foreground">
                      {Math.round(pct)}%{goal.dueDate ? ` · échéance ${new Date(goal.dueDate).toLocaleDateString("fr-FR")}` : ""}
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--primary), var(--secondary))" }}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
