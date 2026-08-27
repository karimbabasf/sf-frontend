import { Building2, Home, MapPin } from "lucide-react";
import { formatAddress } from "@/lib/contacts/format";
import { ADDRESS_TYPES, type Address, type AddressType } from "@/lib/contacts/types";

const ICONS: Record<AddressType, typeof Home> = {
  Home,
  Work: Building2,
  Other: MapPin,
};

/**
 * A contact's addresses, grouped under their type. Types with nothing in them
 * are left out rather than shown empty, so the card reflects the real record.
 */
export default function AddressBook({ addresses }: { addresses: Address[] }) {
  const groups = ADDRESS_TYPES.map((type) => ({
    type,
    items: addresses.filter((address) => address.type === type),
  })).filter((group) => group.items.length > 0);

  if (groups.length === 0) {
    return (
      <p className="px-4 py-3 text-sm text-muted-foreground/70">
        No addresses yet.
      </p>
    );
  }

  return (
    <div className="divide-y divide-hairline">
      {groups.map(({ type, items }) => {
        const Icon = ICONS[type];

        return (
          <section key={type} className="px-4 py-3">
            <h3 className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
              {type}
              {items.length > 1 ? (
                <span className="font-normal normal-case tracking-normal">
                  ({items.length})
                </span>
              ) : null}
            </h3>

            <ul className="space-y-1.5">
              {items.map((address) => (
                <li key={address.id} className="text-sm text-foreground">
                  <address className="not-italic">{formatAddress(address)}</address>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
