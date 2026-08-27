import { primaryAddress } from "./format";
import type { Contact } from "./types";

/**
 * Grouping for the A-Z directory: contacts sit under the first letter of their
 * last name, the way a printed phone book files them.
 */

export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/** Names that do not start with A-Z (digits, symbols) share one bucket. */
export const OTHER_LETTER = "#";

export interface DirectoryGroup {
  letter: string;
  contacts: Contact[];
}

export function groupInitial(
  contact: Pick<Contact, "first_name" | "last_name">,
): string {
  const source = contact.last_name.trim() || contact.first_name.trim();
  const letter = source.at(0)?.toUpperCase() ?? OTHER_LETTER;
  return ALPHABET.includes(letter) ? letter : OTHER_LETTER;
}

/** DOM id of a letter section, so the rail can scroll to it. */
export function letterAnchorId(letter: string): string {
  return `letter-${letter === OTHER_LETTER ? "other" : letter}`;
}

/**
 * Bucket contacts by initial, keeping the order the API returned them in so the
 * sort chosen in the URL still decides what comes first. The input array is
 * copied into fresh buckets, never mutated.
 */
export function groupByInitial(contacts: Contact[]): DirectoryGroup[] {
  const groups = new Map<string, Contact[]>();

  for (const contact of contacts) {
    const letter = groupInitial(contact);
    const bucket = groups.get(letter);
    if (bucket) bucket.push(contact);
    else groups.set(letter, [contact]);
  }

  return Array.from(groups, ([letter, list]) => ({ letter, contacts: list }));
}

/** "San Francisco, CA" for the row's second line, from the primary address. */
export function localityLine(contact: Contact): string | null {
  const address = primaryAddress(contact);
  if (!address) return null;

  const parts = [address.city, address.state].filter(
    (part): part is string => Boolean(part && part.trim()),
  );
  return parts.length ? parts.join(", ") : null;
}
