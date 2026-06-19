import { AGENTS } from "@/lib/agents";

// Carte "Mon Équipe IA" : les 4 robots, 2 actifs en couleur, 2 grisés "Bientôt".
export default function AgentTeam() {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-gray-500 uppercase">
        Mon équipe IA
      </h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {AGENTS.map((a) => {
          const active = a.status === "active";
          return (
            <div
              key={a.id}
              className={`rounded-xl border p-3 ${
                active
                  ? "border-gray-200 bg-white"
                  : "border-dashed border-gray-200 bg-gray-50 opacity-70"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl leading-none">{a.emoji}</span>
                <span className="font-bold text-[#1A1A1A]">{a.name}</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">{a.role}</p>
              <span
                className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  active
                    ? "bg-orange-100 text-orange-700"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {active ? "Actif" : "Bientôt"}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
