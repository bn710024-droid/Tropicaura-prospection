import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { createServerClient } from "@/lib/supabase/server";
import AppShell from "@/components/dashboard/AppShell";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tropicaura Prospection",
  description: "Plateforme de prospection export assistée par IA — Tropic-Aura B.C.",
  icons: { icon: "/logo.png" },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = createServerClient();
  const { count: openTasksCount } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("status", "open");

  return (
    <html lang="fr" className={`dark ${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <TooltipProvider delay={200}>
          <AppShell openTasksCount={openTasksCount ?? 0}>{children}</AppShell>
        </TooltipProvider>
      </body>
    </html>
  );
}
