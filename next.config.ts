import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fixe la racine du workspace sur ce projet. Sans ça, Next infère par erreur
  // C:\Users\HP comme racine (à cause d'un package-lock.json parasite dans le home).
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
