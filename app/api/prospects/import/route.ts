import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { createServerClient } from "@/lib/supabase/server";
import { importRowSchema } from "@/lib/schemas";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

interface ImportReport {
  created: number;
  duplicates: number;
  invalid: number;
  invalidRows?: { row: number; error: string }[];
}

interface ProspectInsert {
  company_name: string;
  website: string | null;
  country: string | null;
  city: string | null;
  segment: string | null;
  source: string | null;
}

// POST /api/prospects/import  — CSV via multipart (champ 'file') OU corps text/csv brut.
export async function POST(req: NextRequest) {
  let csvText: string;
  const contentType = req.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ ok: false, error: "Champ 'file' manquant" }, { status: 400 });
      }
      csvText = await file.text();
    } else {
      csvText = await req.text();
    }
  } catch {
    return NextResponse.json({ ok: false, error: "Lecture du fichier impossible" }, { status: 400 });
  }

  // Retire un éventuel BOM (Excel) en tête de fichier.
  if (csvText.charCodeAt(0) === 0xfeff) csvText = csvText.slice(1);

  if (!csvText.trim()) {
    return NextResponse.json({ ok: false, error: "CSV vide" }, { status: 400 });
  }

  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  // Couche 1 — validation zod par ligne.
  const validRows: ProspectInsert[] = [];
  const invalidRows: { row: number; error: string }[] = [];

  parsed.data.forEach((raw, i) => {
    const result = importRowSchema.safeParse(raw);
    if (result.success) {
      validRows.push({
        company_name: result.data.company_name,
        website: result.data.website ?? null,
        country: result.data.country ?? null,
        city: result.data.city ?? null,
        segment: result.data.segment ?? null,
        source: result.data.source ?? null,
      });
    } else {
      // +2 : ligne d'en-tête + index 1-based pour correspondre au fichier.
      invalidRows.push({ row: i + 2, error: result.error.issues[0]?.message ?? "ligne invalide" });
    }
  });

  // Couche 2 — dédup intra-fichier sur company_name|country.
  const seen = new Set<string>();
  const uniqueRows: ProspectInsert[] = [];
  let intraFileDup = 0;
  for (const r of validRows) {
    const key = `${r.company_name.toLowerCase()}|${(r.country ?? "").toLowerCase()}`;
    if (seen.has(key)) {
      intraFileDup++;
    } else {
      seen.add(key);
      uniqueRows.push(r);
    }
  }

  // Couche 3 — upsert ignoreDuplicates (la contrainte DB est le vrai garde-fou).
  let created = 0;
  if (uniqueRows.length > 0) {
    const supabase = createServerClient();
    const rowsToInsert = uniqueRows.map((r) => ({ ...r, status: "new" }));
    const { data, error } = await supabase
      .from("prospects")
      .upsert(rowsToInsert, { onConflict: "company_name,country", ignoreDuplicates: true })
      .select("id");

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    created = data?.length ?? 0;
  }

  const dbDuplicates = uniqueRows.length - created;
  const report: ImportReport = {
    created,
    duplicates: intraFileDup + dbDuplicates,
    invalid: invalidRows.length,
    invalidRows: invalidRows.length > 0 ? invalidRows.slice(0, 20) : undefined,
  };

  await logActivity({
    agent: "crm",
    action: "prospect.import",
    meta: { created: report.created, duplicates: report.duplicates, invalid: report.invalid },
  });

  return NextResponse.json({ ok: true, data: report });
}
