import { describe, expect, it } from "vitest";

describe("toolchain", () => {
  it("runs vitest with the @ alias available", async () => {
    const mod = await import("@/lib/contract");
    expect(mod.Region.options).toEqual(["AE", "PK"]);
  });
});
