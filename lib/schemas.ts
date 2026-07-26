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

const optionalDate = z.string().trim().min(1).nullable().optional();

const productsField = z.array(z.string().trim().min(1)).optional();

const prospectFields = {
  company_name: z.string().trim().min(1, "company_name est requis"),
  website: optionalText,
  country: optionalText,
  city: optionalText,
  address: optionalText,
  segment: optionalText,
  source: optionalText,
  contact_name: optionalText,
  contact_role: optionalText,
  phone: optionalText,
  whatsapp: optionalText,
  email: optionalText,
  products: productsField,
  notes: optionalText,
  last_contact_at: optionalDate,
  next_reminder_at: optionalDate,
  campaign_id: optionalText,
  status: statusField,
};

export const createProspectSchema = z.object(prospectFields);

export const updateProspectSchema = z
  .object({ ...prospectFields, company_name: prospectFields.company_name.optional() })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "Au moins un champ doit être fourni",
  });

export const listQuerySchema = z.object({
  status: z.string().refine(isProspectStatus, "statut invalide").optional(),
  country: z.string().trim().min(1).optional(),
  product: z.string().trim().min(1).optional(),
  q: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(1000).optional(),
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const campaignFields = {
  name: z.string().trim().min(1, "name est requis"),
  start_date: optionalDate,
  end_date: optionalDate,
  objective_text: optionalText,
  target_products: productsField,
  target_countries: productsField,
  target_company_count: z.coerce.number().int().min(0).nullable().optional(),
};

export const createCampaignSchema = z.object(campaignFields);

export const updateCampaignSchema = z
  .object({ ...campaignFields, name: campaignFields.name.optional() })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "Au moins un champ doit être fourni",
  });

const contactFields = {
  prospect_id: z.string().regex(UUID_RE, "prospect_id invalide"),
  full_name: optionalText,
  role_title: optionalText,
  email: optionalText,
  phone: optionalText,
  whatsapp: optionalText,
  linkedin_url: optionalText,
};

export const createContactSchema = z.object(contactFields);

export const updateContactSchema = z
  .object({
    full_name: optionalText,
    role_title: optionalText,
    email: optionalText,
    phone: optionalText,
    whatsapp: optionalText,
    linkedin_url: optionalText,
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "Au moins un champ doit être fourni",
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
