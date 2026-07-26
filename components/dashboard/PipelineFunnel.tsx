"use client";

import { motion } from "framer-motion";
import type { FunnelStage } from "@/lib/dashboard/queries";

export default function PipelineFunnel({ funnel }: { funnel: FunnelStage[] }) {
  const max = Math.max(...funnel.map((f) => f.count), 1);

  return (
    <div className="flex items-end gap-2 sm:gap-3">
      {funnel.map((stage, i) => {
        const heightPct = Math.max((stage.count / max) * 100, 6);
        return (
          <div key={stage.key} className="flex flex-1 flex-col items-center gap-2">
            <span className="text-lg font-bold text-foreground">{stage.count}</span>
            <div className="flex h-32 w-full items-end overflow-hidden rounded-t-lg bg-muted">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${heightPct}%` }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}
                className="w-full rounded-t-lg"
                style={{
                  background: "linear-gradient(180deg, var(--primary) 0%, var(--secondary) 100%)",
                }}
              />
            </div>
            <span className="text-center text-[11px] leading-tight text-muted-foreground">{stage.label}</span>
          </div>
        );
      })}
    </div>
  );
}
