import { describe, expect, it } from "vitest";
import { type TeamMember, checkTeamChange } from "@/lib/team-rules";

const ana: TeamMember = { userId: "ana", role: "owner" };
const beto: TeamMember = { userId: "beto", role: "owner" };
const carla: TeamMember = { userId: "carla", role: "staff" };

describe("checkTeamChange (RF-017, RF-025)", () => {
  it("does not let the only owner be removed", () => {
    expect(checkTeamChange([ana, carla], { type: "remove", userId: "ana" })).toEqual({
      ok: false,
      reason: "last_owner",
    });
  });

  it("does not let the only owner be demoted to staff", () => {
    expect(
      checkTeamChange([ana, carla], { type: "changeRole", userId: "ana", role: "staff" }),
    ).toEqual({ ok: false, reason: "last_owner" });
  });

  it("lets an owner be removed or demoted when another owner remains", () => {
    expect(checkTeamChange([ana, beto, carla], { type: "remove", userId: "ana" })).toEqual({
      ok: true,
    });
    expect(
      checkTeamChange([ana, beto], { type: "changeRole", userId: "beto", role: "staff" }),
    ).toEqual({ ok: true });
  });

  it("lets staff be removed or promoted", () => {
    expect(checkTeamChange([ana, carla], { type: "remove", userId: "carla" })).toEqual({
      ok: true,
    });
    expect(
      checkTeamChange([ana, carla], { type: "changeRole", userId: "carla", role: "owner" }),
    ).toEqual({ ok: true });
  });

  it("accepts a role change to the same role", () => {
    expect(
      checkTeamChange([ana], { type: "changeRole", userId: "ana", role: "owner" }),
    ).toEqual({ ok: true });
  });

  it("rejects changes to someone who is not on the team", () => {
    expect(checkTeamChange([ana], { type: "remove", userId: "zoe" })).toEqual({
      ok: false,
      reason: "not_member",
    });
  });
});
