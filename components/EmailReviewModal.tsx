"use client";

import { useState } from "react";
import { PLUME } from "@/lib/agents";

export interface DraftEmail {
  id: string;
  subject: string;
  body: string;
}

interface Props {
  email: DraftEmail;
  onClose: () => void;
  onApproved: () => void;
}

// Revue humaine obligatoire avant tout envoi (l'envoi réel est Phase 2).
export default function EmailReviewModal({ email, onClose, onApproved }: Props) {
  const [subject, setSubject] = useState(email.subject);
  const [body, setBody] = useState(email.body);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function approve() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/emails/${email.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, status: "ready_to_send" }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) setError(json.error ?? "Échec de l'approbation");
      else onApproved();
    } catch {
      setError("Erreur réseau");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex h-full max-h-full w-full flex-col overflow-hidden border border-white/10 bg-zinc-900 shadow-2xl sm:h-auto sm:max-h-[92vh] sm:max-w-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center gap-3 border-b border-white/5 px-5 py-4">
          <span className="text-2xl">{PLUME.emoji}</span>
          <div>
            <p className="font-semibold text-white">Email rédigé par {PLUME.name}</p>
            <p className="text-xs text-zinc-500">Relisez et modifiez avant d&apos;approuver</p>
          </div>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-500">Objet</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 transition-colors focus:border-orange-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-500">Corps</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-64 w-full resize-y rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm leading-relaxed text-zinc-100 placeholder-zinc-600 transition-colors focus:border-orange-500 focus:outline-none"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <p className="text-xs text-zinc-600">📮 Envoi réel : activé en Phase 2 (désactivé pour l&apos;instant)</p>
        </div>

        <footer className="flex gap-3 border-t border-white/5 px-5 py-4">
          <button
            onClick={approve}
            disabled={saving}
            className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-500 disabled:opacity-50"
          >
            {saving ? "Enregistrement…" : "✅ Approuver"}
          </button>
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 rounded-lg bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:bg-zinc-700 disabled:opacity-50"
          >
            ❌ Annuler
          </button>
        </footer>
      </div>
    </div>
  );
}
