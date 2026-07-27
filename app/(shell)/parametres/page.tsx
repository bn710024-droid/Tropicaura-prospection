"use client";

import dynamic from "next/dynamic";

// Profil stocké en localStorage : rendu exclusivement côté client (pas de SSR possible).
const ParametresClient = dynamic(() => import("@/components/parametres/ParametresClient"), { ssr: false });

export default function ParametresPage() {
  return <ParametresClient />;
}
