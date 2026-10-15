import { describe, expect, it } from "vitest";
import { can } from "@/lib/permissions";

describe("can (RF-018)", () => {
  it("lets the owner manage the team and settings, and operate the panel", () => {
    expect(can("owner", "team.manage")).toBe(true);
    expect(can("owner", "settings.manage")).toBe(true);
    expect(can("owner", "panel.operate")).toBe(true);
  });

  it("lets staff only operate the panel", () => {
    expect(can("staff", "panel.operate")).toBe(true);
    expect(can("staff", "team.manage")).toBe(false);
    expect(can("staff", "settings.manage")).toBe(false);
  });
});
