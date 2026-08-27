"use client";

import { useRef, useState, type ChangeEvent, type MouseEvent } from "react";
import { ImagePlus, Sparkles, UserRound, X } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { phoneAvatarDataUrl } from "@/lib/contacts/phoneAvatar";
import {
  AVATAR_PX,
  MAX_PHOTO_BYTES,
  MAX_PHOTO_KB,
  MAX_SOURCE_BYTES,
  PHOTO_MIME_TYPES,
  photoBytes,
  type ContactFieldSpec,
} from "@/lib/contacts/schema";

/** Quality steps tried in order until the encoded avatar fits the cap. */
const JPEG_QUALITY = [0.85, 0.7, 0.55];

/**
 * Crop the image square, scale it to an avatar, and encode it as JPEG.
 *
 * Downscaling here rather than raising the Server Action body limit keeps the
 * submitted form, the stored row, and every list response small. The output is
 * measured, not assumed, because a detailed photo can still encode large.
 */
async function toAvatarDataUrl(file: File): Promise<string> {
  // `from-image` applies the EXIF orientation, so phone photos are not sideways.
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const size = Math.min(side, AVATAR_PX);

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable in this browser.");
    context.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      size,
      size,
    );

    for (const quality of JPEG_QUALITY) {
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      if (photoBytes(dataUrl) <= MAX_PHOTO_BYTES) return dataUrl;
    }
    throw new Error(`That image will not compress under ${MAX_PHOTO_KB} KB.`);
  } finally {
    bitmap.close();
  }
}

/**
 * Profile photo picker. The chosen file is resized in the browser and submitted
 * as a base64 data URL in a hidden input, so the form stays a plain POST and the
 * API keeps taking the same JSON body it always has.
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
  const [busy, setBusy] = useState(false);
  // Every pick and every remove takes the next token. A conversion that finishes
  // after a newer one started no longer owns the field, so it is discarded.
  const selection = useRef(0);

  const id = `field-${field.name}`;
  const errorId = `${id}-error`;
  const message = rejected ?? error;

  async function onPick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Clear it so picking the same file again after a remove still fires.
    event.target.value = "";
    if (!file) return;

    const token = (selection.current += 1);

    if (!PHOTO_MIME_TYPES.includes(file.type)) {
      setRejected("Choose a PNG, JPEG, WebP, or GIF image.");
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      setRejected(`That file is ${(file.size / 1024 / 1024).toFixed(1)} MB, which is too large to open.`);
      return;
    }

    setBusy(true);
    setRejected(null);
    try {
      const dataUrl = await toAvatarDataUrl(file);
      if (selection.current !== token) return;
      setPhoto(dataUrl);
    } catch (cause) {
      if (selection.current !== token) return;
      setRejected(cause instanceof Error ? cause.message : "That image could not be read.");
    } finally {
      if (selection.current === token) setBusy(false);
    }
  }

  /**
   * Generate a face from the phone number already typed into the form. Read
   * from the live form rather than a prop, because the number is usually
   * entered in the same sitting as the photo.
   */
  function onGenerate(event: MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.form;
    const phone = form?.elements.namedItem("phone");
    const digits = phone instanceof HTMLInputElement ? phone.value : "";

    const generated = phoneAvatarDataUrl(digits);
    if (!generated) {
      setRejected("Enter a phone number first, then generate.");
      return;
    }

    selection.current += 1;
    setPhoto(generated);
    setRejected(null);
  }

  function onRemove() {
    selection.current += 1;
    setPhoto("");
    setRejected(null);
    setBusy(false);
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
            className="aspect-square h-16 w-16 shrink-0 rounded-full bg-secondary object-cover"
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
            {busy ? "Resizing…" : photo ? "Replace" : "Choose image"}
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

          <button
            type="button"
            onClick={onGenerate}
            title="Build a halftone face from the phone number"
            className={buttonClasses("secondary", "md")}
          >
            <Sparkles className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            From number
          </button>

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
