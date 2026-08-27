import Link from "next/link";
import { Mail, Pencil, Phone } from "lucide-react";
import AlphabetRail from "./AlphabetRail";
import ContactAvatar from "./ContactAvatar";
import DeleteContactButton from "./DeleteContactButton";
import { buttonClasses } from "@/components/ui/Button";
import { jobLine } from "@/lib/contacts/format";
import {
  OTHER_LETTER,
  groupByInitial,
  letterAnchorId,
  localityLine,
} from "@/lib/contacts/directory";
import type { Contact } from "@/lib/contacts/types";
import { sortHref, type ContactListQuery } from "@/lib/contacts/query";

/**
 * The contacts list as an A-Z directory: one section per last-name initial,
 * sticky letter headings, and a rail down the side that jumps between them.
 * Narrow screens drop the rail and fold the phone number into the name line.
 */
export default function ContactsDirectory({
  contacts,
  query,
}: {
  contacts: Contact[];
  query: ContactListQuery;
}) {
  const groups = groupByInitial(contacts);
  const descending = query.sortBy === "last_name" && query.order === "desc";

  return (
    <div className="flex items-start gap-2">
      {/* `overflow-clip`, not `overflow-hidden`: hidden would make this a scroll
          container and the sticky letter headings would stop following the page. */}
      <div className="min-w-0 flex-1 overflow-clip rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between gap-3 border-b border-hairline bg-secondary/30 px-4 py-2">
          <h2 className="font-display text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            Filed by last name
          </h2>
          <Link
            href={sortHref(query, "last_name")}
            scroll={false}
            aria-label={`Sort by last name, ${descending ? "A to Z" : "Z to A"}`}
            className={`${buttonClasses("ghost", "sm")} font-mono text-[11px] tracking-wider`}
          >
            {descending ? "Z → A" : "A → Z"}
          </Link>
        </div>

        {groups.map((group) => {
          const anchor = letterAnchorId(group.letter);

          return (
            <section
              key={group.letter}
              id={anchor}
              tabIndex={-1}
              aria-labelledby={`${anchor}-label`}
              className="scroll-mt-14 outline-none"
            >
              <h3
                id={`${anchor}-label`}
                className="sticky top-14 z-10 flex items-center gap-2.5 border-b border-hairline bg-card/95 px-4 py-1.5 backdrop-blur"
              >
                <span
                  aria-hidden="true"
                  className="letter-plate flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-display text-[12px] font-extrabold"
                >
                  {group.letter}
                </span>
                <span className="sr-only">
                  {group.letter === OTHER_LETTER ? "Other names" : group.letter}
                </span>
                <span aria-hidden="true" className="h-px flex-1 bg-hairline" />
                <span className="font-mono text-[10px] tabular-nums text-muted-foreground/70">
                  {group.contacts.length}
                </span>
              </h3>

              <ul>
                {group.contacts.map((contact) => {
                  const detail = [jobLine(contact), localityLine(contact)]
                    .filter(Boolean)
                    .join(" · ");

                  return (
                    <li
                      key={contact.id}
                      className="group border-b border-hairline last:border-b-0"
                    >
                      <div className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-secondary/40 sm:px-4">
                        <ContactAvatar contact={contact} size="md" />

                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/contacts/${contact.id}`}
                            className="block truncate font-display text-[15px] font-bold text-foreground transition-colors hover:text-primary"
                          >
                            {contact.full_name}
                          </Link>
                          <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
                            {contact.phone ? (
                              <span className="shrink-0 font-mono tabular-nums sm:hidden">
                                {contact.phone}
                              </span>
                            ) : null}
                            {contact.phone && detail ? (
                              <span aria-hidden="true" className="sm:hidden">
                                ·
                              </span>
                            ) : null}
                            {detail ? (
                              <span className="truncate">{detail}</span>
                            ) : (
                              <span className="truncate sm:hidden">
                                {contact.email}
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="hidden min-w-0 shrink-0 flex-col items-end gap-0.5 text-[12.5px] sm:flex">
                          <a
                            href={`mailto:${contact.email}`}
                            className="flex max-w-[15rem] items-center gap-1.5 text-muted-foreground transition-colors hover:text-primary"
                          >
                            <Mail className="h-3 w-3 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                            <span className="truncate">{contact.email}</span>
                          </a>
                          {contact.phone ? (
                            <a
                              href={`tel:${contact.phone}`}
                              className="flex items-center gap-1.5 font-mono tabular-nums text-muted-foreground transition-colors hover:text-primary"
                            >
                              <Phone className="h-3 w-3 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                              {contact.phone}
                            </a>
                          ) : (
                            <span className="flex items-center gap-1.5 text-muted-foreground/50">
                              <Phone className="h-3 w-3 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                              No number
                            </span>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-0.5 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                          <Link
                            href={`/contacts/${contact.id}/edit`}
                            aria-label={`Edit ${contact.full_name}`}
                            className={buttonClasses("ghost", "sm")}
                          >
                            <Pencil className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                          </Link>
                          <DeleteContactButton
                            contactId={contact.id}
                            contactName={contact.full_name}
                          />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <AlphabetRail letters={groups.map((group) => group.letter)} />
    </div>
  );
}
