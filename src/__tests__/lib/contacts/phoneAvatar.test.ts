import { phoneAvatarDataUrl, phoneSeedSource } from "@/lib/contacts/phoneAvatar";

describe("phoneSeedSource", () => {
  it("keeps only the digits, so formatting cannot change the face", () => {
    expect(phoneSeedSource("+1-415-555-0101")).toBe("14155550101");
    expect(phoneSeedSource("(415) 555 0101")).toBe("4155550101");
  });

  it("is empty when there is nothing to seed with", () => {
    expect(phoneSeedSource("")).toBe("");
    expect(phoneSeedSource("no digits here")).toBe("");
  });

  it("treats the same number written two ways as the same seed", () => {
    expect(phoneSeedSource("+1 415 555 0101")).toBe(phoneSeedSource("+1-415-555-0101"));
  });
});

describe("phoneAvatarDataUrl", () => {
  it("returns null rather than a face when there is no number", () => {
    expect(phoneAvatarDataUrl("")).toBeNull();
    expect(phoneAvatarDataUrl("nope")).toBeNull();
  });
});
