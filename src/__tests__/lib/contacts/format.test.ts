import {
  formatAddress,
  primaryAddress,
  avatarHue,
  formatTimestamp,
  initials,
  jobLine,
} from "@/lib/contacts/format";
import { makeContact } from "../../mocks/handlers";

describe("initials", () => {
  it("takes the first letter of each name", () => {
    expect(initials({ first_name: "ada", last_name: "lovelace" })).toBe("AL");
  });
});

describe("avatarHue", () => {
  it("is stable for the same seed and within the hue range", () => {
    expect(avatarHue("ada@example.com")).toBe(avatarHue("ada@example.com"));
    expect(avatarHue("ada@example.com")).toBeGreaterThanOrEqual(0);
    expect(avatarHue("ada@example.com")).toBeLessThan(360);
  });

  it("separates different seeds", () => {
    expect(avatarHue("ada@example.com")).not.toBe(avatarHue("grace@example.com"));
  });
});

describe("formatTimestamp", () => {
  it("renders UTC regardless of the machine's zone", () => {
    expect(formatTimestamp("2026-08-19T17:04:53.743932Z")).toBe(
      "19 Aug 2026, 17:04 UTC",
    );
  });

  it("degrades to a dash on garbage input", () => {
    expect(formatTimestamp("not a date")).toBe("—");
  });
});

describe("jobLine", () => {
  it("joins the title and the company", () => {
    expect(jobLine(makeContact())).toBe("Mathematician at Analytical Engines");
  });

  it("falls back to whichever one is set", () => {
    expect(jobLine(makeContact({ company: null }))).toBe("Mathematician");
    expect(jobLine(makeContact({ job_title: null }))).toBe("Analytical Engines");
    expect(jobLine(makeContact({ job_title: null, company: null }))).toBeNull();
  });
});

describe("formatAddress", () => {
  const home = {
    id: 1,
    type: "Home" as const,
    street: "1 Market St",
    city: "San Francisco",
    state: "CA",
    postal_code: null,
    country: "USA",
  };

  it("skips the parts that are not filled in", () => {
    expect(formatAddress(home)).toBe("1 Market St, San Francisco, CA, USA");
  });

  it("pairs the state with the postal code", () => {
    expect(formatAddress({ ...home, postal_code: "94105" })).toBe(
      "1 Market St, San Francisco, CA 94105, USA",
    );
  });

  it("falls back to the street alone", () => {
    expect(
      formatAddress({ ...home, city: null, state: null, country: null }),
    ).toBe("1 Market St");
  });
});

describe("primaryAddress", () => {
  const home = { id: 1, type: "Home" as const, street: "Home St", city: null, state: null, postal_code: null, country: null };
  const work = { id: 2, type: "Work" as const, street: "Work St", city: null, state: null, postal_code: null, country: null };
  const other = { id: 3, type: "Other" as const, street: "Other St", city: null, state: null, postal_code: null, country: null };

  it("prefers home, then work, then whatever is first", () => {
    expect(primaryAddress(makeContact({ addresses: [work, home] }))?.type).toBe("Home");
    expect(primaryAddress(makeContact({ addresses: [other, work] }))?.type).toBe("Work");
    expect(primaryAddress(makeContact({ addresses: [other] }))?.type).toBe("Other");
  });

  it("returns null when the contact has no addresses", () => {
    expect(primaryAddress(makeContact({ addresses: [] }))).toBeNull();
  });
});
