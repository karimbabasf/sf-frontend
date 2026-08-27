import { makeContact } from "@/__tests__/mocks/handlers";
import { toVCard, vCardFilename } from "@/lib/contacts/vcard";

/** Lines as a phone would read them: unfolded, CRLF-separated. */
function lines(vcard: string): string[] {
  return vcard.replace(/\r\n /g, "").trim().split("\r\n");
}

describe("toVCard", () => {
  it("opens and closes with the required envelope", () => {
    const out = lines(toVCard(makeContact()));
    expect(out[0]).toBe("BEGIN:VCARD");
    expect(out[1]).toBe("VERSION:4.0");
    expect(out.at(-1)).toBe("END:VCARD");
  });

  it("writes the name in the order the spec expects", () => {
    expect(lines(toVCard(makeContact()))).toContain("N:Lovelace;Ada;;;");
    expect(lines(toVCard(makeContact()))).toContain("FN:Ada Lovelace");
  });

  it("leaves out the fields the contact does not have", () => {
    const out = lines(
      toVCard(makeContact({ phone: null, company: null, job_title: null, notes: null })),
    );
    expect(out.some((line) => line.startsWith("TEL"))).toBe(false);
    expect(out.some((line) => line.startsWith("ORG"))).toBe(false);
  });

  it("writes one ADR per address, tagged with its type", () => {
    const out = lines(
      toVCard(
        makeContact({
          addresses: [
            { id: 1, type: "Home", street: "12 Ockham Rd", city: "Ockham", state: null, postal_code: null, country: "UK" },
            { id: 2, type: "Work", street: "1 Market St", city: "San Francisco", state: "CA", postal_code: "94105", country: "USA" },
          ],
        }),
      ),
    );
    expect(out).toContain("ADR;TYPE=home:;;12 Ockham Rd;Ockham;;;UK");
    expect(out).toContain("ADR;TYPE=work:;;1 Market St;San Francisco;CA;94105;USA");
  });

  it("escapes the characters that would end a field early", () => {
    const out = lines(toVCard(makeContact({ company: "Analytical, Engines; Ltd" })));
    expect(out).toContain(String.raw`ORG:Analytical\, Engines\; Ltd`);
  });

  it("turns a newline in the notes into an escape, not a new line", () => {
    const out = lines(toVCard(makeContact({ notes: "line one\nline two" })));
    expect(out).toContain("NOTE:line one\\nline two");
    expect(out.some((line) => line === "line two")).toBe(false);
  });

  it("folds a long line so an embedded photo stays within 75 octets", () => {
    const photo = `data:image/jpeg;base64,${"A".repeat(4000)}`;
    const raw = toVCard(makeContact({ photo }));

    expect(raw.split("\r\n").every((line) => line.length <= 75)).toBe(true);
    // Unfolding puts it back together exactly.
    expect(lines(raw).some((line) => line === `PHOTO:${photo}`)).toBe(true);
  });
});

describe("vCardFilename", () => {
  it("slugs the name", () => {
    expect(vCardFilename(makeContact())).toBe("ada-lovelace.vcf");
  });

  it("falls back when the name has nothing sluggable in it", () => {
    expect(vCardFilename(makeContact({ full_name: "!!!" }))).toBe("contact.vcf");
  });
});
