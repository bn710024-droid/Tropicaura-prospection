import { AGENTS } from "@/lib/agents";

// "Mon Équipe IA" : 4 cartes verticales (gros avatar, nom, mission, statut) — une vraie équipe.
export default function AgentTeam() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {AGENTS.map((a) => {
        const active = a.status === "active";
        return (
          <div
            key={a.id}
            className={`rounded-2xl border border-white/[0.06] bg-zinc-900 p-5 text-center transition-all duration-200 ${
              active ? "hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/10" : "opacity-50"
            }`}
          >
            <div className="text-4xl leading-none">{a.emoji}</div>
            <p className="mt-3 text-lg font-bold tracking-tight text-white">{a.name}</p>
            <p className="mt-1 text-sm leading-snug text-zinc-400">{a.role}</p>
            <div className="mt-4 flex items-center justify-center gap-1.5">
              {active ? (
                <>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
                  </span>
                  <span className="text-xs font-medium text-green-400">Actif</span>
                </>
              ) : (
                <span className="text-xs font-medium text-zinc-600">Bientôt</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
