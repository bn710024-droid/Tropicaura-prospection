"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Campaign, Prospect } from "@/types";

interface FormState {
  company_name: string;
  contact_name: string;
  contact_role: string;
  country: string;
  city: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  notes: string;
  last_contact_at: string;
  next_reminder_at: string;
  campaign_id: string;
}

const EMPTY: FormState = {
  company_name: "",
  contact_name: "",
  contact_role: "",
  country: "",
  city: "",
  phone: "",
  whatsapp: "",
  email: "",
  website: "",
  notes: "",
  last_contact_at: "",
  next_reminder_at: "",
  campaign_id: "",
};

function toFormState(p: Prospect): FormState {
  return {
    company_name: p.company_name,
    contact_name: p.contact_name ?? "",
    contact_role: p.contact_role ?? "",
    country: p.country ?? "",
    city: p.city ?? "",
    phone: p.phone ?? "",
    whatsapp: p.whatsapp ?? "",
    email: p.email ?? "",
    website: p.website ?? "",
    notes: p.notes ?? "",
    last_contact_at: p.last_contact_at?.slice(0, 10) ?? "",
    next_reminder_at: p.next_reminder_at?.slice(0, 10) ?? "",
    campaign_id: p.campaign_id ?? "",
  };
}

export default function ProspectFormDialog({
  trigger,
  prospect,
}: {
  trigger: ReactNode;
  prospect?: Prospect;
}) {
  const router = useRouter();
  const isEdit = !!prospect;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(prospect ? toFormState(prospect) : EMPTY);
  const [products, setProducts] = useState<string[]>(prospect?.products ?? []);
  const [productInput, setProductInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    if (!open) return;
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((json) => setCampaigns(json.data ?? []))
      .catch(() => {});
  }, [open]);

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addProduct() {
    const v = productInput.trim();
    if (v && !products.includes(v)) setProducts((p) => [...p, v]);
    setProductInput("");
  }

  function removeProduct(v: string) {
    setProducts((p) => p.filter((x) => x !== v));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.company_name.trim()) {
      setError("Le nom de l'entreprise est obligatoire.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      company_name: form.company_name,
      contact_name: form.contact_name || null,
      contact_role: form.contact_role || null,
      country: form.country || null,
      city: form.city || null,
      phone: form.phone || null,
      whatsapp: form.whatsapp || null,
      email: form.email || null,
      website: form.website || null,
      notes: form.notes || null,
      products,
      last_contact_at: form.last_contact_at || null,
      next_reminder_at: form.next_reminder_at || null,
      campaign_id: form.campaign_id || null,
    };

    try {
      const res = await fetch(isEdit ? `/api/prospects/${prospect.id}` : "/api/prospects", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Échec de l'enregistrement");
        return;
      }
      setOpen(false);
      if (!isEdit) {
        setForm(EMPTY);
        setProducts([]);
      }
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
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-border bg-card">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEdit ? "Modifier le prospect" : "Nouveau prospect"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="company_name">Nom de l&apos;entreprise *</Label>
              <Input
                id="company_name"
                value={form.company_name}
                onChange={(e) => set("company_name", e.target.value)}
                placeholder="Fresh4U BV"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact_name">Nom du contact</Label>
              <Input id="contact_name" value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact_role">Fonction du contact</Label>
              <Input id="contact_role" value={form.contact_role} onChange={(e) => set("contact_role", e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="country">Pays</Label>
              <Input id="country" value={form.country} onChange={(e) => set("country", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city">Ville</Label>
              <Input id="city" value={form.city} onChange={(e) => set("city", e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="website">Site internet</Label>
              <Input id="website" value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://…" />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="product_input">Produits recherchés</Label>
              <div className="flex gap-2">
                <Input
                  id="product_input"
                  value={productInput}
                  onChange={(e) => setProductInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addProduct();
                    }
                  }}
                  placeholder="Mangue, puis Entrée"
                />
                <Button type="button" variant="outline" onClick={addProduct}>
                  Ajouter
                </Button>
              </div>
              {products.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {products.map((p) => (
                    <span
                      key={p}
                      className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs text-primary"
                    >
                      {p}
                      <button type="button" onClick={() => removeProduct(p)} aria-label={`Retirer ${p}`}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="last_contact_at">Dernier contact</Label>
              <Input
                id="last_contact_at"
                type="date"
                value={form.last_contact_at}
                onChange={(e) => set("last_contact_at", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="next_reminder_at">Prochaine relance</Label>
              <Input
                id="next_reminder_at"
                type="date"
                value={form.next_reminder_at}
                onChange={(e) => set("next_reminder_at", e.target.value)}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="campaign_id">Campagne</Label>
              <select
                id="campaign_id"
                value={form.campaign_id}
                onChange={(e) => set("campaign_id", e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              >
                <option value="">Aucune</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id} className="bg-popover">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer le prospect"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
