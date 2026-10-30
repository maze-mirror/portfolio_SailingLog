export const ABOUT_READ_SECONDS = 1

export type TidePlayback = { progress: number; readySeconds: number }

/** The scroll position is a destination, not permission to skip the introduction. */
export function advanceTidePlayback(
  current: TidePlayback, target: number, aboutReady: boolean,
  seconds: number, duration: number, reduced = false,
): TidePlayback {
  const dt = Math.max(0, Math.min(0.08, seconds))
  const readySeconds = aboutReady ? current.readySeconds + dt : 0
  const destination = Math.max(0, Math.min(1, target))
  const allowed = aboutReady && readySeconds >= ABOUT_READ_SECONDS ? destination : 0
  const step = dt / duration
  // Reverse always remains available, including while waiting for the copy.
  const progress = reduced ? allowed : current.progress
    + Math.sign(allowed - current.progress) * Math.min(Math.abs(allowed - current.progress), step)
  return { progress, readySeconds }
}
