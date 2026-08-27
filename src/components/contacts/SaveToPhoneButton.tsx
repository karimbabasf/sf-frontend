"use client";

import { useState } from "react";
import { Check, Smartphone } from "lucide-react";
import Button from "@/components/ui/Button";
import { toVCard, vCardFilename } from "@/lib/contacts/vcard";
import type { Contact } from "@/lib/contacts/types";

/**
 * Download the contact as a .vcf, which is what a phone, Outlook or the macOS
 * Contacts app all read. Built in the browser from data already on the page, so
 * there is no extra round trip and no new endpoint.
 */
export default function SaveToPhoneButton({ contact }: { contact: Contact }) {
  const [saved, setSaved] = useState(false);

  function onSave() {
    const blob = new Blob([toVCard(contact)], {
      type: "text/vcard;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = vCardFilename(contact);
    link.click();

    // Revoking immediately can cancel the download in some browsers.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);

    setSaved(true);
    setTimeout(() => setSaved(false), 2_000);
  }

  return (
    <Button variant="secondary" onClick={onSave}>
      {saved ? (
        <Check className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
      ) : (
        <Smartphone className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
      )}
      {saved ? "Saved" : "Save to phone"}
    </Button>
  );
}
