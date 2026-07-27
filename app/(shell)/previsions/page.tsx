"use client";

import dynamic from "next/dynamic";

// Objectifs stockés en localStorage : rendu exclusivement côté client, aucun SSR
// possible (pas de fenêtre côté serveur), donc pas de risque de mismatch d'hydratation.
const PrevisionsClient = dynamic(() => import("@/components/previsions/PrevisionsClient"), { ssr: false });

export default function PrevisionsPage() {
  return <PrevisionsClient />;
}
