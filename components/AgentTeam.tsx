import { AGENTS } from "@/lib/agents";

// Bande compacte "Mon Équipe IA" : 4 robots, actifs avec pastille verte pulse.
export default function AgentTeam() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {AGENTS.map((a) => {
        const active = a.status === "active";
        return (
          <div
            key={a.id}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-3 transition-all duration-200 ${
              active ? "border border-white/5 bg-[#141414]" : "opacity-50"
            }`}
          >
            <span className="text-xl leading-none">{a.emoji}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {active && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
                  </span>
                )}
                <span className="truncate text-sm font-semibold text-zinc-50">{a.name}</span>
              </div>
              <p className="truncate text-xs text-zinc-500">{a.role}</p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                active ? "bg-green-500/10 text-green-400" : "bg-white/5 text-zinc-500"
              }`}
            >
              {active ? "Actif" : "Bientôt"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
