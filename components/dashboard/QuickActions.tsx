import Link from "next/link";
import { Users, Kanban } from "lucide-react";
import ImportButton from "@/components/ImportButton";

const LINKS = [
  { label: "Voir les prospects", href: "/prospects", icon: Users },
  { label: "Voir le pipeline", href: "/prospects#pipeline", icon: Kanban },
];

export default function QuickActions() {
  return (
    <div className="flex flex-wrap items-start gap-3">
      <ImportButton />
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-accent"
        >
          <link.icon className="h-4 w-4 text-primary" />
          {link.label}
        </Link>
      ))}
    </div>
  );
}
