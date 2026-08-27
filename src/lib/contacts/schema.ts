import { z } from "zod";
import { ADDRESS_TYPES, type AddressInput, type ContactInput, type ContactTextField } from "./types";

/** Everything on a contact except its addresses, which validate separately. */
export type ContactTextValues = Omit<ContactInput, "addresses">;

/**
 * Client/server-shared validation for the contact form.
 *
 * The rules mirror the API's Pydantic models (`ContactCreate` / `ContactReplace`)
 * so the user sees a mistake before a round trip — the API stays the authority,
 * and anything it rejects anyway is surfaced by `toFieldErrors` in `./api.ts`.
 */

/** Optional text: trimmed, and blank becomes `null` (the API clears the field). */
function optionalText(max: number, label: string) {
  return z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer`)
    .transform((value) => value || null)
    .nullable()
    .default(null);
}

/* ------------------------------------------------------------------ */
/* Photo — mirrors `PhotoDataUrl` in the API's schemas.py               */
/* ------------------------------------------------------------------ */

export const PHOTO_MIME_TYPES: readonly string[] = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
];
/**
 * Limits describe the photo we *store*, not the file the user picks. The picker
 * downscales to a square avatar first, so a large source image is fine.
 *
 * The stored cap has to clear the Next.js Server Action body limit (1 MB by
 * default), which the base64 form value counts against at 4/3 its size.
 */
export const MAX_PHOTO_BYTES = 512 * 1024;
export const MAX_PHOTO_KB = MAX_PHOTO_BYTES / 1024;
/** Source files above this are not worth decoding, whatever they claim to be. */
export const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
/** Square avatars: bigger than any place we render one, small once encoded. */
export const AVATAR_PX = 512;
const MAX_PHOTO_CHARS = Math.ceil((MAX_PHOTO_BYTES * 4) / 3) + 64;

const PHOTO_DATA_URL =
  /^data:image\/(?:png|jpeg|webp|gif);base64,([A-Za-z0-9+/]+={0,2})$/;

/** Decoded byte length of a data URL, measured without decoding it. */
export function photoBytes(dataUrl: string): number {
  const data = PHOTO_DATA_URL.exec(dataUrl)?.[1];
  if (!data) return 0;
  const padding = data.endsWith("==") ? 2 : data.endsWith("=") ? 1 : 0;
  return Math.floor((data.length * 3) / 4) - padding;
}

function requiredText(max: number, label: string) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be ${max} characters or fewer`);
}

export const contactInputSchema = z.object({
  first_name: requiredText(100, "First name"),
  last_name: requiredText(100, "Last name"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .max(320, "Email must be 320 characters or fewer")
    .pipe(z.email("Enter a valid email address"))
    .transform((value) => value.toLowerCase()),
  phone: optionalText(40, "Phone"),
  photo: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || PHOTO_DATA_URL.test(value),
      "Photo must be a PNG, JPEG, WebP, or GIF image",
    )
    .refine(
      (value) => value === "" || photoBytes(value) <= MAX_PHOTO_BYTES,
      `Photo must be ${MAX_PHOTO_KB} KB or smaller once resized`,
    )
    .transform((value) => value || null)
    .nullable()
    .default(null),
  company: optionalText(200, "Company"),
  job_title: optionalText(200, "Job title"),
  notes: z
    .string()
    .trim()
    .transform((value) => value || null)
    .nullable()
    .default(null),
}) satisfies z.ZodType<ContactTextValues, unknown>;

export type ContactFormValues = z.input<typeof contactInputSchema>;

/** Collapse a ZodError into one message per field, keyed by input name. */
export function zodFieldErrors(
  error: z.ZodError,
): Partial<Record<keyof ContactInput, string>> {
  const fieldErrors: Partial<Record<keyof ContactInput, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in fieldErrors)) {
      fieldErrors[key as keyof ContactInput] = issue.message;
    }
  }
  return fieldErrors;
}

/* ------------------------------------------------------------------ */
/* Form metadata — one source of truth for the fields and their limits */
/* ------------------------------------------------------------------ */

export interface ContactFieldSpec {
  name: ContactTextField;
  label: string;
  type?: "text" | "email" | "tel" | "textarea" | "photo";
  required?: boolean;
  maxLength: number;
  placeholder?: string;
  autoComplete?: string;
  /** Column span inside the section grid. */
  wide?: boolean;
}

export interface ContactFieldGroup {
  title: string;
  description: string;
  fields: ContactFieldSpec[];
}

export const CONTACT_FIELD_GROUPS: ContactFieldGroup[] = [
  {
    title: "Photo",
    description: `Optional. Any PNG, JPEG, WebP or GIF; it is cropped square and resized to ${AVATAR_PX}px.`,
    fields: [
      {
        name: "photo",
        label: "Profile photo",
        type: "photo",
        maxLength: MAX_PHOTO_CHARS,
        wide: true,
      },
    ],
  },
  {
    title: "Identity",
    description: "First name, last name, and email are required.",
    fields: [
      {
        name: "first_name",
        label: "First name",
        required: true,
        maxLength: 100,
        placeholder: "Ada",
        autoComplete: "given-name",
      },
      {
        name: "last_name",
        label: "Last name",
        required: true,
        maxLength: 100,
        placeholder: "Lovelace",
        autoComplete: "family-name",
      },
      {
        name: "email",
        label: "Email",
        type: "email",
        required: true,
        maxLength: 320,
        placeholder: "ada@example.com",
        autoComplete: "email",
      },
      {
        name: "phone",
        label: "Phone",
        type: "tel",
        maxLength: 40,
        placeholder: "+1-415-555-0101",
        autoComplete: "tel",
      },
    ],
  },
  {
    title: "Work",
    description: "Where they work and what they do.",
    fields: [
      {
        name: "company",
        label: "Company",
        maxLength: 200,
        placeholder: "Analytical Engines",
        autoComplete: "organization",
      },
      {
        name: "job_title",
        label: "Job title",
        maxLength: 200,
        placeholder: "Mathematician",
        autoComplete: "organization-title",
      },
    ],
  },
  {
    title: "Notes",
    description: "Anything worth remembering. No length limit.",
    fields: [
      {
        name: "notes",
        label: "Notes",
        type: "textarea",
        maxLength: 10_000,
        placeholder: "Met at the SF hackathon.",
        wide: true,
      },
    ],
  },
];

export const CONTACT_FIELDS: ContactFieldSpec[] = CONTACT_FIELD_GROUPS.flatMap(
  (group) => group.fields,
);

/** Pull the contact fields out of a submitted form, as raw strings. */
export function formDataToValues(
  formData: FormData,
): Record<ContactTextField, string> {
  return Object.fromEntries(
    CONTACT_FIELDS.map((field) => [
      field.name,
      String(formData.get(field.name) ?? ""),
    ]),
  ) as Record<ContactTextField, string>;
}

/* ------------------------------------------------------------------ */
/* Addresses — a contact holds many, each typed Home, Work or Other    */
/* ------------------------------------------------------------------ */

/** Matches `MAX_ADDRESSES` in the API's schemas.py. */
export const MAX_ADDRESSES = 10;

export interface AddressPartSpec {
  name: Exclude<keyof AddressInput, "type">;
  label: string;
  maxLength: number;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
  wide?: boolean;
}

/** The same parts, and the same limits, the API enforces on an address. */
export const ADDRESS_PARTS: AddressPartSpec[] = [
  {
    name: "street",
    label: "Street address",
    maxLength: 300,
    required: true,
    placeholder: "1 Market St, Suite 400",
    autoComplete: "street-address",
    wide: true,
  },
  { name: "city", label: "City", maxLength: 120, placeholder: "San Francisco", autoComplete: "address-level2" },
  { name: "state", label: "State / region", maxLength: 120, placeholder: "CA", autoComplete: "address-level1" },
  { name: "postal_code", label: "Postal code", maxLength: 20, placeholder: "94105", autoComplete: "postal-code" },
  { name: "country", label: "Country", maxLength: 120, placeholder: "USA", autoComplete: "country-name" },
];

export const addressInputSchema = z.object({
  type: z.enum(ADDRESS_TYPES),
  street: requiredText(300, "Street address"),
  city: optionalText(120, "City"),
  state: optionalText(120, "State"),
  postal_code: optionalText(20, "Postal code"),
  country: optionalText(120, "Country"),
}) satisfies z.ZodType<AddressInput, unknown>;

export const addressListSchema = z
  .array(addressInputSchema)
  .max(MAX_ADDRESSES, `A contact can have at most ${MAX_ADDRESSES} addresses`);

/**
 * Collect `addresses.<i>.<part>` back into a list.
 *
 * The indexes come from the browser, so rows are gathered into a map and then
 * re-numbered rather than trusted as array positions. A row whose street is
 * blank is dropped, which is how an empty row the user added and left alone
 * stops being an error.
 */
export function formDataToAddresses(formData: FormData): unknown[] {
  const rows = new Map<number, Record<string, string>>();

  for (const [key, value] of formData.entries()) {
    const match = /^addresses\.(\d{1,3})\.(\w+)$/.exec(key);
    if (!match) continue;
    const index = Number(match[1]);
    // Stop collecting once the cap is reached rather than building an unbounded
    // map and rejecting it afterwards: the parsing itself is the cost.
    if (!rows.has(index) && rows.size >= MAX_ADDRESSES) continue;
    rows.set(index, { ...rows.get(index), [match[2]]: String(value) });
  }

  return [...rows.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, row]) => row)
    .filter((row) => (row.street ?? "").trim());
}
