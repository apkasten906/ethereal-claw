import { describe, expect, it } from "vitest";
import { slugify } from "../../packages/core/src/utils/slugs.js";

describe("slugify", () => {
  it("transliterates German characters into ASCII slugs", () => {
    expect(slugify("Änderung für Größenprüfung")).toBe("anderung-fur-grossenprufung");
  });

  it("transliterates Latin-script diacritics used by other languages", () => {
    expect(slugify("Zażółć gęślą jaźń")).toBe("zazolc-gesla-jazn");
    expect(slugify("Smørrebrød à la carte")).toBe("smorrebrod-a-la-carte");
  });
});
