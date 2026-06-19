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
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-gray-700 hover:file:bg-gray-200"
        />
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="shrink-0 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? "Import…" : "Importer le CSV"}
        </button>
      </div>

      <p className="mt-2 text-xs text-gray-400">
        Colonnes attendues : company_name, website, country, city, segment, source
      </p>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {report && (
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-green-50 px-3 py-1 font-medium text-green-700">
            {report.created} créé(s)
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-600">
            {report.duplicates} doublon(s)
          </span>
          {report.invalid > 0 && (
            <span className="rounded-full bg-red-50 px-3 py-1 font-medium text-red-700">
              {report.invalid} invalide(s)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
