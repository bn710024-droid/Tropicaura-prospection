"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { Contact } from "@/types";

interface FormState {
  full_name: string;
  role_title: string;
  phone: string;
  whatsapp: string;
  email: string;
  linkedin_url: string;
}

const EMPTY: FormState = { full_name: "", role_title: "", phone: "", whatsapp: "", email: "", linkedin_url: "" };

function toFormState(c: Contact): FormState {
  return {
    full_name: c.full_name ?? "",
    role_title: c.role_title ?? "",
    phone: c.phone ?? "",
    whatsapp: c.whatsapp ?? "",
    email: c.email ?? "",
    linkedin_url: c.linkedin_url ?? "",
  };
}

export default function ContactFormDialog({
  trigger,
  prospectId,
  contact,
}: {
  trigger: ReactNode;
  prospectId: string;
  contact?: Contact;
}) {
  const router = useRouter();
  const isEdit = !!contact;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(contact ? toFormState(contact) : EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim()) {
      setError("Le nom est obligatoire.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      full_name: form.full_name,
      role_title: form.role_title || null,
      phone: form.phone || null,
      whatsapp: form.whatsapp || null,
      email: form.email || null,
      linkedin_url: form.linkedin_url || null,
      ...(isEdit ? {} : { prospect_id: prospectId }),
    };

    try {
      const res = await fetch(isEdit ? `/api/contacts/${contact.id}` : "/api/contacts", {
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
      if (!isEdit) setForm(EMPTY);
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
          <DialogTitle className="text-foreground">{isEdit ? "Modifier le contact" : "Nouveau contact"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="c_full_name">Nom *</Label>
            <Input id="c_full_name" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c_role">Fonction</Label>
            <Input id="c_role" value={form.role_title} onChange={(e) => set("role_title", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="c_phone">Téléphone</Label>
              <Input id="c_phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c_whatsapp">WhatsApp</Label>
              <Input id="c_whatsapp" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c_email">Email</Label>
            <Input id="c_email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c_linkedin">LinkedIn</Label>
            <Input id="c_linkedin" value={form.linkedin_url} onChange={(e) => set("linkedin_url", e.target.value)} placeholder="https://…" />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Enregistrement…" : isEdit ? "Enregistrer" : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
