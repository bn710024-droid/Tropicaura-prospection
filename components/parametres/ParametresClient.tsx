"use client";

import { useState } from "react";
import { Moon, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STORAGE_KEY = "tropicaura_profile";

interface Profile {
  name: string;
  company: string;
  email: string;
  phone: string;
  language: string;
  timezone: string;
}

const EMPTY: Profile = { name: "", company: "", email: "", phone: "", language: "fr", timezone: "Africa/Dakar" };

const LANGUAGES = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
  { value: "nl", label: "Nederlands" },
];

const TIMEZONES = [
  "Africa/Dakar",
  "Africa/Casablanca",
  "Europe/Paris",
  "Europe/Amsterdam",
  "Europe/London",
  "Asia/Dubai",
  "America/New_York",
];

function loadProfile(): Profile {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...EMPTY, ...JSON.parse(stored) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

// Rendu exclusivement côté client (cf. app/parametres/page.tsx, next/dynamic ssr:false).
export default function ParametresClient() {
  const [profile, setProfile] = useState<Profile>(() => loadProfile());
  const [saved, setSaved] = useState(false);

  function set<K extends keyof Profile>(key: K, value: string) {
    setProfile((p) => ({ ...p, [key]: value }));
    setSaved(false);
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    setSaved(true);
  }

  function exportData() {
    const blob = new Blob([JSON.stringify({ profile }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tropicaura-profil.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function clearData() {
    if (!confirm("Effacer les données de profil enregistrées localement ?")) return;
    localStorage.removeItem(STORAGE_KEY);
    setProfile(EMPTY);
    setSaved(false);
  }

  const selectClass = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary";

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Paramètres</h1>
        <p className="mt-1 text-sm text-muted-foreground">Votre profil et vos préférences.</p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Profil</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="p_name">Nom</Label>
                <Input id="p_name" value={profile.name} onChange={(e) => set("name", e.target.value)} placeholder="Babacar Niang" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p_company">Entreprise</Label>
                <Input id="p_company" value={profile.company} onChange={(e) => set("company", e.target.value)} placeholder="Tropic-Aura B.C." />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p_email">Email</Label>
                <Input id="p_email" type="email" value={profile.email} onChange={(e) => set("email", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p_phone">Téléphone</Label>
                <Input id="p_phone" value={profile.phone} onChange={(e) => set("phone", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p_lang">Langue</Label>
                <select id="p_lang" value={profile.language} onChange={(e) => set("language", e.target.value)} className={selectClass}>
                  {LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value} className="bg-popover">
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p_tz">Fuseau horaire</Label>
                <select id="p_tz" value={profile.timezone} onChange={(e) => set("timezone", e.target.value)} className={selectClass}>
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz} className="bg-popover">
                      {tz}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit">Enregistrer</Button>
              {saved && <span className="text-xs text-success">Enregistré ✓</span>}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Moon className="h-4 w-4 text-primary" />
            Thème
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Tropicaura CRM est conçu exclusivement en mode sombre — aucun autre thème n&apos;est disponible.
          </p>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <HardDrive className="h-4 w-4 text-primary" />
            Sauvegarde locale
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Votre profil est enregistré uniquement dans ce navigateur (aucun serveur). Vos prospects, contacts, campagnes,
            tâches et rappels restent dans votre base Supabase.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={exportData}>
              Exporter mon profil
            </Button>
            <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" onClick={clearData}>
              Effacer les données locales
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
