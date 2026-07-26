"use client";

import { useState, type ReactNode } from "react";
import { Menu, Bell, Settings } from "lucide-react";
import SidebarNav from "./SidebarNav";
import SearchBar from "./SearchBar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function AppShell({
  children,
  openTasksCount,
}: {
  children: ReactNode;
  openTasksCount: number;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-sidebar-border bg-sidebar lg:block">
        <SidebarNav />
      </aside>

      {/* Sidebar mobile */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir la navigation"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <SearchBar />

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger
                render={<Button variant="ghost" size="icon" className="relative" aria-label="Notifications" />}
              >
                <Bell className="h-[18px] w-[18px]" />
                {openTasksCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {openTasksCount > 9 ? "9+" : openTasksCount}
                  </span>
                )}
              </TooltipTrigger>
              <TooltipContent>{openTasksCount} tâche(s) ouverte(s)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger render={<Button variant="ghost" size="icon" disabled aria-label="Paramètres (bientôt)" />}>
                <Settings className="h-[18px] w-[18px]" />
              </TooltipTrigger>
              <TooltipContent>Pas encore disponible</TooltipContent>
            </Tooltip>

            <div className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
              BN
            </div>
          </div>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}
