import { describe, expect, it } from "vitest";

describe("toolchain", () => {
  it("runs vitest with the @ alias available", async () => {
    const mod = await import("@/app/layout");
    expect(mod.metadata.title).toBe("Parent Coach");
  });
});
