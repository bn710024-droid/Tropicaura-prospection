"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import ContactFormDialog from "./ContactFormDialog";
import type { Contact } from "@/types";

export default function ContactsList({ prospectId, contacts }: { prospectId: string; contacts: Contact[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function remove(contact: Contact) {
    if (!confirm(`Supprimer le contact ${contact.full_name ?? ""} ?`)) return;
    setBusyId(contact.id);
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok && json.ok) router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-3">
      {contacts.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun contact enregistré pour cette entreprise.</p>
      ) : (
        <ul className="space-y-2">
          {contacts.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3"
            >
              <div className="min-w-0">
                <p className="font-medium text-foreground">{c.full_name ?? "—"}</p>
                <p className="text-xs text-muted-foreground">
                  {[c.role_title, c.phone, c.whatsapp && `WA ${c.whatsapp}`, c.email].filter(Boolean).join(" · ") || "—"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <ContactFormDialog
                  prospectId={prospectId}
                  contact={c}
                  trigger={
                    <Button variant="ghost" size="icon" aria-label="Modifier">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  disabled={busyId === c.id}
                  onClick={() => remove(c)}
                  aria-label="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ContactFormDialog
        prospectId={prospectId}
        trigger={
          <Button variant="outline" size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Ajouter un contact
          </Button>
        }
      />
    </div>
  );
}
