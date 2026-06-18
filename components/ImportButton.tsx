"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ImportReport {
  created: number;
  duplicates: number;
  invalid: number;
  invalidRows?: { row: number; error: string }[];
}

export default function ImportButton() {
  const router = useRouter();
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
        router.refresh(); // recharge la liste de la page (server component)
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-300 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Import…" : "Importer le CSV"}
        </button>
      </div>

      <p className="text-xs text-gray-500">
        Colonnes attendues : company_name, website, country, city, segment, source
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {report && (
        <div className="text-sm">
          <p className="font-medium">Rapport d&apos;import</p>
          <ul className="list-inside list-disc text-gray-700">
            <li>{report.created} créé(s)</li>
            <li>{report.duplicates} doublon(s) ignoré(s)</li>
            <li>{report.invalid} ligne(s) invalide(s)</li>
          </ul>
        </div>
      )}
    </div>
  );
}
