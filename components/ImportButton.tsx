"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface ImportReport {
  created: number;
  duplicates: number;
  invalid: number;
  invalidRows?: { row: number; error: string }[];
}

export default function ImportButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/prospects/import", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok || !json.ok) setError(json.error ?? "Échec de l'import");
      else {
        setReport(json.data as ImportReport);
        router.refresh();
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={onFile} className="hidden" />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        title="CSV — colonnes : company_name, website, country, city, segment, source"
        className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-orange-600 disabled:opacity-50"
      >
        {loading ? "Import en cours…" : "+ Importer des prospects"}
      </button>
      <p className="text-xs text-zinc-600">CSV : company_name, website, country, city, segment, source</p>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {report && (
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 font-medium text-green-400">
            {report.created} créé(s)
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-medium text-zinc-400">
            {report.duplicates} doublon(s)
          </span>
          {report.invalid > 0 && (
            <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 font-medium text-red-400">
              {report.invalid} invalide(s)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
