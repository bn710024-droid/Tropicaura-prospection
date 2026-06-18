// Source de vérité commerciale Tropic-Aura B.C.
// Baba met à jour `availableNow` et `prospectingEnabled` au fil des saisons.
// Seule la mangue est prospectable pour l'instant.
export const OFFER = {
  company: "Tropic-Aura B.C.",
  origin: "Senegal",
  incoterm: "FOB Dakar (Port Autonome de Dakar)",
  certifications: ["GlobalG.A.P."],
  contactEmail: "sales@tropic-aura.com",
  contactWhatsApp: "+221 78 917 98 05",
  products: [
    {
      name: "Mango",
      varieties: ["Kent", "Keitt"],
      calibers: ["7", "8", "9", "10", "12"],
      season: "May - September",
      availableNow: false,
      prospectingEnabled: true,
    },
    { name: "Watermelon", season: "November - April", availableNow: false, prospectingEnabled: false },
    { name: "Melon", season: "January - May", availableNow: false, prospectingEnabled: false },
    { name: "Lime", season: "Year-round", availableNow: false, prospectingEnabled: false },
    { name: "Okra", season: "June - October", availableNow: false, prospectingEnabled: false },
    { name: "Chili Pepper", season: "Year-round", availableNow: false, prospectingEnabled: false },
    { name: "Avocado", season: "October - February", availableNow: false, prospectingEnabled: false },
  ],
} as const;

export type Offer = typeof OFFER;
export type OfferProduct = Offer["products"][number];
