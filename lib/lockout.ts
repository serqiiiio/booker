// RF-010: 5 consecutive failed sign-ins for an email lock it for 15 minutes.
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_MS = 15 * 60 * 1000;

export type LockoutState = { failedCount: number; lockedUntil: Date | null };

export function isLocked(state: LockoutState, now: Date): boolean {
  return state.lockedUntil !== null && now.getTime() < state.lockedUntil.getTime();
}

export function registerFailure(state: LockoutState, now: Date): LockoutState {
  // Attempts are rejected before checking the password while locked, so a
  // failure here must not extend the lock.
  if (isLocked(state, now)) return state;

  const previous = state.lockedUntil === null ? state.failedCount : 0;
  const failedCount = previous + 1;
  return {
    failedCount,
    lockedUntil:
      failedCount >= MAX_FAILED_ATTEMPTS ? new Date(now.getTime() + LOCKOUT_MS) : null,
  };
}

export function registerSuccess(): LockoutState {
  return { failedCount: 0, lockedUntil: null };
}
