import { describe, expect, it } from "vitest";
import {
  LOCKOUT_MS,
  MAX_FAILED_ATTEMPTS,
  type LockoutState,
  isLocked,
  registerFailure,
  registerSuccess,
} from "@/lib/lockout";

const now = new Date("2026-10-15T20:00:00Z");
const MINUTE = 60 * 1000;
const fresh: LockoutState = { failedCount: 0, lockedUntil: null };

function failTimes(times: number, at: Date, from: LockoutState = fresh): LockoutState {
  let state = from;
  for (let i = 0; i < times; i++) state = registerFailure(state, at);
  return state;
}

describe("lockout (RF-010)", () => {
  it("locks for 15 minutes after 5 failed attempts", () => {
    expect(MAX_FAILED_ATTEMPTS).toBe(5);
    expect(LOCKOUT_MS).toBe(15 * MINUTE);
  });

  it("does not lock after 4 failed attempts", () => {
    const state = failTimes(4, now);
    expect(state.failedCount).toBe(4);
    expect(isLocked(state, now)).toBe(false);
  });

  it("locks on the 5th failed attempt", () => {
    const state = failTimes(5, now);
    expect(isLocked(state, now)).toBe(true);
    expect(state.lockedUntil).toEqual(new Date(now.getTime() + 15 * MINUTE));
  });

  it("stays locked until the 15 minutes are over, then unlocks", () => {
    const state = failTimes(5, now);
    expect(isLocked(state, new Date(now.getTime() + 15 * MINUTE - 1))).toBe(true);
    expect(isLocked(state, new Date(now.getTime() + 15 * MINUTE))).toBe(false);
  });

  it("does not extend the lock if failures keep coming while locked", () => {
    const locked = failTimes(5, now);
    const later = new Date(now.getTime() + 10 * MINUTE);
    expect(registerFailure(locked, later)).toEqual(locked);
  });

  it("starts counting from zero after a lock expires", () => {
    const locked = failTimes(5, now);
    const afterLock = new Date(now.getTime() + 16 * MINUTE);
    const state = registerFailure(locked, afterLock);
    expect(state).toEqual({ failedCount: 1, lockedUntil: null });
  });

  it("only counts consecutive failures: a successful sign-in resets the counter", () => {
    expect(registerSuccess()).toEqual(fresh);

    // 4 failures, a success, 4 more failures: never 5 in a row, so no lock.
    const afterSuccess = registerSuccess();
    const state = failTimes(4, now, afterSuccess);
    expect(failTimes(4, now).failedCount).toBe(4);
    expect(state.failedCount).toBe(4);
    expect(isLocked(state, now)).toBe(false);
  });
});
