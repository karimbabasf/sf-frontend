"use client";

import { useState, type ChangeEvent } from "react";
import { ImagePlus, UserRound, X } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import {
  MAX_PHOTO_BYTES,
  MAX_PHOTO_MB,
  PHOTO_MIME_TYPES,
  type ContactFieldSpec,
} from "@/lib/contacts/schema";

/**
 * Profile photo picker. The file is read in the browser and submitted as a
 * base64 data URL in a hidden input, so the form stays a plain POST and the API
 * keeps taking the same JSON body it always has.
 */
export default function PhotoField({
  field,
  defaultValue,
  error,
}: {
  field: ContactFieldSpec;
  defaultValue?: string;
  error?: string;
}) {
  const [photo, setPhoto] = useState(defaultValue ?? "");
  const [rejected, setRejected] = useState<string | null>(null);

  const id = `field-${field.name}`;
  const errorId = `${id}-error`;
  const message = rejected ?? error;

  function onPick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Clear it so picking the same file again after a remove still fires.
    event.target.value = "";
    if (!file) return;

    if (!PHOTO_MIME_TYPES.includes(file.type)) {
      setRejected("Choose a PNG, JPEG, WebP, or GIF image.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      const size = (file.size / 1024 / 1024).toFixed(1);
      setRejected(`That image is ${size} MB. The limit is ${MAX_PHOTO_MB} MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(String(reader.result));
      setRejected(null);
    };
    reader.onerror = () => setRejected("That image could not be read.");
    reader.readAsDataURL(file);
  }

  function onRemove() {
    setPhoto("");
    setRejected(null);
  }

  return (
    <div className={field.wide ? "sm:col-span-2" : undefined}>
      <span className="mb-1.5 block text-[13px] font-medium text-foreground">
        {field.label}
        <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">
          optional
        </span>
      </span>

      <div className="flex items-center gap-4">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt="Selected profile photo"
            className="h-16 w-16 aspect-square shrink-0 rounded-full bg-secondary object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground/60"
          >
            <UserRound className="h-6 w-6" strokeWidth={1.5} />
          </span>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor={id} className={buttonClasses("secondary", "md", "cursor-pointer")}>
            <ImagePlus className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            {photo ? "Replace" : "Choose image"}
          </label>
          <input
            id={id}
            type="file"
            accept={PHOTO_MIME_TYPES.join(",")}
            onChange={onPick}
            aria-invalid={message ? true : undefined}
            aria-describedby={message ? errorId : undefined}
            className="sr-only"
          />

          {photo ? (
            <button type="button" onClick={onRemove} className={buttonClasses("ghost", "sm")}>
              <X className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              Remove
            </button>
          ) : null}
        </div>
      </div>

      {/* Carries the photo through the plain form POST, including on edit,
          where an omitted field would be cleared by the API's PUT. */}
      <input type="hidden" name={field.name} value={photo} />

      {message ? (
        <p id={errorId} role="alert" className="mt-1.5 text-[13px] text-destructive">
          {message}
        </p>
      ) : null}
    </div>
  );
}
