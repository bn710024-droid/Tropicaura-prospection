"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { NAV_GROUPS } from "@/lib/nav-config";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export default function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
        <Image
          src="/logo.png"
          alt="Tropic-Aura"
          width={32}
          height={32}
          className="h-8 w-8 shrink-0 rounded-md object-contain"
        />
        <div className="leading-tight">
          <p className="text-sm font-bold tracking-tight text-sidebar-foreground">
            Tropic<span className="text-primary">-</span>Aura
          </p>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">CRM Pro</p>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-2 text-[10px] font-semibold tracking-[0.15em] text-muted-foreground uppercase">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = item.href && pathname === item.href;

                if (item.disabled || !item.href) {
                  return (
                    <li key={item.label}>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <div className="flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground/50" />
                          }
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                          <span className="ml-auto rounded-full border border-border px-1.5 py-0.5 text-[9px] font-medium tracking-wide uppercase">
                            Bientôt
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="right">Pas encore disponible</TooltipContent>
                      </Tooltip>
                    </li>
                  );
                }

                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg border border-transparent px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "border-primary/30 bg-primary/15 text-primary"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
            BN
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-medium text-sidebar-foreground">Babacar Niang</p>
            <p className="truncate text-xs text-muted-foreground">Admin</p>
          </div>
        </div>
      </div>
    </div>
  );
}
