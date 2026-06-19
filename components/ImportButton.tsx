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
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/prospects/import", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Échec de l'import");
      } else {
        setReport(json.data as ImportReport);
        setFile(null);
        if (inputRef.current) inputRef.current.value = "";
        router.refresh();
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="hidden"
        />
        <button
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-zinc-300 transition-all duration-200 hover:border-orange-500/50 hover:text-white"
        >
          Importer CSV
        </button>
        {file && <span className="max-w-[180px] truncate text-xs text-zinc-400">{file.name}</span>}
        {file && (
          <button
            onClick={handleUpload}
            disabled={loading}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? "Import…" : "Lancer l'import"}
          </button>
        )}
      </div>

      <p className="text-[11px] text-zinc-600">
        Colonnes : company_name, website, country, city, segment, source
      </p>

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
