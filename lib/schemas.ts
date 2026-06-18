import { z } from "zod";
import { isProspectStatus } from "@/types";

/**
 * Texte optionnel : absent → omis ; "" ou espaces → null ; sinon valeur trimée.
 * `.optional()` en dernier pour que les champs absents soient bien omis de la
 * sortie (important pour le PATCH partiel et pour ne pas écraser des colonnes).
 */
const optionalText = z
  .string()
  .trim()
  .transform((v) => (v.length > 0 ? v : null))
  .nullable()
  .optional();

const statusField = z
  .string()
  .refine(isProspectStatus, "statut invalide")
  .optional();

export const createProspectSchema = z.object({
  company_name: z.string().trim().min(1, "company_name est requis"),
  website: optionalText,
  country: optionalText,
  city: optionalText,
  segment: optionalText,
  source: optionalText,
  notes: optionalText,
  status: statusField,
});

export const updateProspectSchema = z
  .object({
    company_name: z.string().trim().min(1).optional(),
    website: optionalText,
    country: optionalText,
    city: optionalText,
    segment: optionalText,
    source: optionalText,
    notes: optionalText,
    status: statusField,
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "Au moins un champ doit être fourni",
  });

export const listQuerySchema = z.object({
  status: z.string().refine(isProspectStatus, "statut invalide").optional(),
  minScore: z.coerce.number().int().min(0).max(10).optional(),
  limit: z.coerce.number().int().min(1).max(1000).optional(),
});

export const importRowSchema = z.object({
  company_name: z.string().trim().min(1),
  website: optionalText,
  country: optionalText,
  city: optionalText,
  segment: optionalText,
  source: optionalText,
});

export type ImportRow = z.infer<typeof importRowSchema>;

/** Formate les erreurs zod en liste lisible pour les réponses API. */
export function zodDetails(err: z.ZodError): { path: string; message: string }[] {
  return err.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
}
