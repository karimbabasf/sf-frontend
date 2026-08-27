"use client";

import type { KeyboardEvent } from "react";
import { ALPHABET, OTHER_LETTER, letterAnchorId } from "@/lib/contacts/directory";

/**
 * The A-Z tab strip down the side of the directory. Letters with nobody filed
 * under them render as plain text: dimmed, unfocusable, and skipped by screen
 * readers, so the rail only ever offers jumps that go somewhere.
 */
export default function AlphabetRail({ letters }: { letters: string[] }) {
  const present = new Set(letters);
  const rail = present.has(OTHER_LETTER)
    ? [...ALPHABET, OTHER_LETTER]
    : ALPHABET;

  function jump(letter: string) {
    const target = document.getElementById(letterAnchorId(letter));
    if (!target) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    // Move the caret with the viewport, so Tab carries on from the new section
    // instead of from the rail.
    target.focus({ preventScroll: true });
  }

  // Up/down walks the enabled letters; Home and End jump to the ends. Tab still
  // works on its own, this just makes the rail behave like a real tab strip.
  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[
      event.key
    ];
    if (step === undefined && event.key !== "Home" && event.key !== "End") return;

    const buttons = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>("button"),
    );
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (index === -1) return;

    event.preventDefault();
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? buttons.length - 1
          : Math.min(Math.max(index + (step ?? 0), 0), buttons.length - 1);
    buttons[next]?.focus();
  }

  return (
    <nav
      aria-label="Jump to letter"
      onKeyDown={onKeyDown}
      className="sticky top-20 hidden h-fit select-none flex-col items-center gap-px rounded-full border border-hairline bg-card/70 px-1 py-2 backdrop-blur lg:flex"
    >
      {rail.map((letter) =>
        present.has(letter) ? (
          <button
            key={letter}
            type="button"
            onClick={() => jump(letter)}
            aria-label={`Jump to ${letter === OTHER_LETTER ? "other names" : letter}`}
            className="flex h-[18px] w-5 items-center justify-center rounded-full font-display text-[10px] font-bold leading-none text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:bg-primary focus-visible:text-primary-foreground"
          >
            {letter}
          </button>
        ) : (
          <span
            key={letter}
            aria-hidden="true"
            className="flex h-[18px] w-5 items-center justify-center font-display text-[10px] font-medium leading-none text-muted-foreground/25"
          >
            {letter}
          </span>
        ),
      )}
    </nav>
  );
}
