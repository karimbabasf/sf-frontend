import type { Contact } from "./types";

/**
 * vCard 4.0 export (RFC 6350), so a contact can be saved straight into a phone's
 * address book. Written by hand rather than pulled from a package: the format is
 * a handful of lines and this app takes no dependencies.
 */

/** Escape the characters that would otherwise end a property or a field. */
function escape(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    // A bare CR would start a new physical line as surely as a LF does.
    .replace(/\r\n?|\n/g, "\\n")
    .replace(/([,;])/g, "\\$1");
}

/**
 * Fold long lines. RFC 6350 caps a line at 75 **octets** and continues it with a
 * leading space, which matters because an embedded photo is thousands of bytes.
 *
 * Measured in UTF-8 octets rather than JavaScript string length: an accented or
 * CJK character is several octets, and slicing by length would both overrun the
 * limit and cut a surrogate pair in half.
 */
function fold(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;

  const parts: string[] = [];
  let current = "";
  let octets = 0;
  // First line gets 75, continuations 74, because each starts with a space.
  let limit = 75;

  for (const character of line) {
    const size = encoder.encode(character).length;
    if (octets + size > limit) {
      parts.push(parts.length === 0 ? current : ` ${current}`);
      current = "";
      octets = 0;
      limit = 74;
    }
    current += character;
    octets += size;
  }
  if (current) parts.push(parts.length === 0 ? current : ` ${current}`);

  return parts.join("\r\n");
}

export function toVCard(contact: Contact): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:4.0",
    `N:${escape(contact.last_name)};${escape(contact.first_name)};;;`,
    `FN:${escape(contact.full_name)}`,
    `EMAIL;TYPE=work:${escape(contact.email)}`,
  ];

  // TEL defaults to a URI in vCard 4.0, and this app stores whatever the user
  // typed, so it is declared as text rather than mislabelled as a tel: URI.
  if (contact.phone) lines.push(`TEL;TYPE=cell;VALUE=text:${escape(contact.phone)}`);
  if (contact.company) lines.push(`ORG:${escape(contact.company)}`);
  if (contact.job_title) lines.push(`TITLE:${escape(contact.job_title)}`);

  for (const address of contact.addresses ?? []) {
    const parts = [
      address.street,
      address.city,
      address.state,
      address.postal_code,
      address.country,
    ].map((part) => escape(part ?? ""));
    // ADR is: po box; extended; street; locality; region; postal code; country
    lines.push(`ADR;TYPE=${address.type.toLowerCase()}:;;${parts.join(";")}`);
  }

  if (contact.notes) lines.push(`NOTE:${escape(contact.notes)}`);
  if (contact.photo) lines.push(`PHOTO:${contact.photo}`);

  lines.push(`REV:${contact.updated_at}`, "END:VCARD");

  // vCard requires CRLF line endings.
  return lines.map(fold).join("\r\n") + "\r\n";
}

/** `ada-lovelace.vcf`, safe on every filesystem. */
export function vCardFilename(contact: Contact): string {
  const slug = contact.full_name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "contact"}.vcf`;
}
