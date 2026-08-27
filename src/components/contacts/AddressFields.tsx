"use client";

import { useState } from "react";
import { MapPin, Plus, Trash2 } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { ADDRESS_PARTS, MAX_ADDRESSES } from "@/lib/contacts/schema";
import { ADDRESS_TYPES, type AddressInput } from "@/lib/contacts/types";

const CONTROL =
  "w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:bg-input";

const BLANK: AddressInput = {
  type: "Home",
  street: "",
  city: null,
  state: null,
  postal_code: null,
  country: null,
};

/**
 * Repeatable address rows. Each row is submitted as `addresses.<i>.<part>`, which
 * `formDataToValues` collects back into a list, so the form stays a plain POST.
 */
export default function AddressFields({
  defaultValue,
  error,
}: {
  defaultValue?: AddressInput[];
  error?: string;
}) {
  const [rows, setRows] = useState<AddressInput[]>(
    defaultValue?.length ? defaultValue : [],
  );

  function update(index: number, part: keyof AddressInput, value: string) {
    // Copy rather than mutate: the previous state is not ours to change.
    setRows((current) =>
      current.map((row, i) => (i === index ? { ...row, [part]: value } : row)),
    );
  }

  return (
    <div className="sm:col-span-2 space-y-3">
      {rows.map((row, index) => (
        <fieldset
          key={index}
          className="rounded-lg border border-border bg-secondary/20 p-3 space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <legend className="sr-only">Address {index + 1}</legend>
            <label className="flex items-center gap-2 text-[13px] font-medium text-foreground">
              <MapPin className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
              <span className="sr-only">Address {index + 1} type</span>
              <select
                name={`addresses.${index}.type`}
                value={row.type}
                onChange={(event) => update(index, "type", event.target.value)}
                className="rounded-md border border-border bg-input px-2 py-1 text-[13px]"
              >
                {ADDRESS_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => setRows((current) => current.filter((_, i) => i !== index))}
              className={buttonClasses("ghost", "sm")}
              aria-label={`Remove address ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              Remove
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {ADDRESS_PARTS.map((part) => (
              <div key={part.name} className={part.wide ? "sm:col-span-2" : undefined}>
                <label
                  htmlFor={`addresses-${index}-${part.name}`}
                  className="mb-1 block text-[12px] text-muted-foreground"
                >
                  {part.label}
                </label>
                <input
                  id={`addresses-${index}-${part.name}`}
                  name={`addresses.${index}.${part.name}`}
                  value={row[part.name] ?? ""}
                  onChange={(event) => update(index, part.name, event.target.value)}
                  maxLength={part.maxLength}
                  placeholder={part.placeholder}
                  autoComplete={part.autoComplete}
                  className={CONTROL}
                />
              </div>
            ))}
          </div>
        </fieldset>
      ))}

      {rows.length < MAX_ADDRESSES ? (
        <button
          type="button"
          onClick={() => setRows((current) => [...current, { ...BLANK }])}
          className={buttonClasses("secondary")}
        >
          <Plus className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          {rows.length ? "Add another address" : "Add an address"}
        </button>
      ) : (
        <p className="text-[13px] text-muted-foreground">
          That is the maximum of {MAX_ADDRESSES} addresses.
        </p>
      )}

      {error ? (
        <p role="alert" className="text-[13px] text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
