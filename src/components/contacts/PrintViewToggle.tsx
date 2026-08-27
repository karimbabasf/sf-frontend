"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Newspaper } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";

const PRINT_VIEW_STORAGE_KEY = "app-print-view";
const PRINT_VIEW_CHANGE_EVENT = "app-print-view-change";

/**
 * Fallback when storage is unavailable. Without it a private window, where
 * every storage call throws, could never turn the print view on at all: the
 * write would fail and the next read would report it still off.
 */
let inMemoryPrintView: boolean | null = null;

function readStoredPrintView(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return localStorage.getItem(PRINT_VIEW_STORAGE_KEY) === "on";
  } catch {
    return inMemoryPrintView ?? false;
  }
}

function subscribeToPrintViewChange(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleChange = () => onStoreChange();
  window.addEventListener("storage", handleChange);
  window.addEventListener(PRINT_VIEW_CHANGE_EVENT, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(PRINT_VIEW_CHANGE_EVENT, handleChange);
  };
}

/**
 * Turns the directory into newsprint: every avatar becomes a 1-bit halftone.
 *
 * Display only. The state is one attribute on the document, so the whole page
 * switches with a CSS filter and no stored photo is touched. Follows the same
 * external-store shape as the theme toggle, so the server never has to guess a
 * preference it cannot know.
 */
export default function PrintViewToggle() {
  const on = useSyncExternalStore(
    subscribeToPrintViewChange,
    readStoredPrintView,
    () => false,
  );

  useEffect(() => {
    document.documentElement.toggleAttribute("data-print-view", on);
  }, [on]);

  function toggle() {
    const next = !on;
    inMemoryPrintView = next;
    try {
      localStorage.setItem(PRINT_VIEW_STORAGE_KEY, next ? "on" : "off");
    } catch {
      // The preference works for this page view, it is just not remembered.
    }
    window.dispatchEvent(new Event(PRINT_VIEW_CHANGE_EVENT));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      title="Show the directory as newsprint"
      className={buttonClasses("ghost", "sm")}
    >
      <Newspaper className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
      {/* The header is a fixed-height row that does not wrap, so on narrow
          screens the icon carries the meaning and the title carries the name. */}
      <span className="sr-only sm:not-sr-only">Print view</span>
    </button>
  );
}
