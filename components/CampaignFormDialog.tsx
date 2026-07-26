"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface FormState {
  name: string;
  start_date: string;
  end_date: string;
  objective_text: string;
  target_company_count: string;
}

const EMPTY: FormState = { name: "", start_date: "", end_date: "", objective_text: "", target_company_count: "" };

function TagInput({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");
  function add() {
    const v = input.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInput("");
  }
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
        />
        <Button type="button" variant="outline" onClick={add}>
          Ajouter
        </Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {values.map((v) => (
            <span key={v} className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {v}
              <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} aria-label={`Retirer ${v}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CampaignFormDialog({ trigger }: { trigger: ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [products, setProducts] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Le nom de la campagne est obligatoire.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      name: form.name,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      objective_text: form.objective_text || null,
      target_products: products,
      target_countries: countries,
      target_company_count: form.target_company_count ? Number(form.target_company_count) : null,
    };

    try {
      const res = await fetch("/api/campaigns", {
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
      setForm(EMPTY);
      setProducts([]);
      setCountries([]);
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
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-border bg-card">
        <DialogHeader>
          <DialogTitle className="text-foreground">Nouvelle campagne</DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="camp_name">Nom *</Label>
            <Input id="camp_name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Citron Sénégal 2026" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="camp_start">Début</Label>
              <Input id="camp_start" type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="camp_end">Fin</Label>
              <Input id="camp_end" type="date" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="camp_objective">Objectif</Label>
            <Textarea
              id="camp_objective"
              value={form.objective_text}
              onChange={(e) => set("objective_text", e.target.value)}
              placeholder="Trouver des importateurs de citron vert"
              rows={2}
            />
          </div>

          <TagInput label="Produits ciblés" values={products} onChange={setProducts} placeholder="Citron vert, puis Entrée" />
          <TagInput label="Pays ciblés" values={countries} onChange={setCountries} placeholder="Pays-Bas, puis Entrée" />

          <div className="space-y-1.5">
            <Label htmlFor="camp_target">Objectif (nombre d&apos;entreprises)</Label>
            <Input
              id="camp_target"
              type="number"
              min={0}
              value={form.target_company_count}
              onChange={(e) => set("target_company_count", e.target.value)}
              placeholder="200"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Enregistrement…" : "Créer la campagne"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
