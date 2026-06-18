import { createServerClient } from "@/lib/supabase/server";
import ImportButton from "@/components/ImportButton";
import { type Prospect } from "@/types";

export const dynamic = "force-dynamic";

// Page minimale (P1-05) : héberge l'import + une liste basique.
// Sera enrichie en P1-09 (PipelineBoard : colonnes, filtres, badges score).
export default async function ProspectsPage() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("prospects")
    .select("*")
    .order("score", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(200);

  const prospects = (data ?? []) as Prospect[];

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="mb-6 text-2xl font-bold">Prospects</h1>

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-semibold">Importer des prospects</h2>
        <ImportButton />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">
          Liste{prospects.length > 0 ? ` (${prospects.length})` : ""}
        </h2>

        {error && <p className="text-sm text-red-600">Erreur : {error.message}</p>}

        {!error && prospects.length === 0 && (
          <p className="text-sm text-gray-500">
            Aucun prospect pour l&apos;instant. Importez un CSV ci-dessus.
          </p>
        )}

        {prospects.length > 0 && (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2 pr-4 font-medium">Société</th>
                <th className="py-2 pr-4 font-medium">Pays</th>
                <th className="py-2 pr-4 font-medium">Segment</th>
                <th className="py-2 pr-4 font-medium">Score</th>
                <th className="py-2 pr-4 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {prospects.map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="py-2 pr-4">{p.company_name}</td>
                  <td className="py-2 pr-4">{p.country ?? "—"}</td>
                  <td className="py-2 pr-4">{p.segment ?? "—"}</td>
                  <td className="py-2 pr-4">{p.score ?? "—"}</td>
                  <td className="py-2 pr-4">{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
