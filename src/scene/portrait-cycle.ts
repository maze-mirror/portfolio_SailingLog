import { clamp, TIMING } from './motion'

/** One image gathers, holds fully formed, then scatters before the next image starts. */
export function portraitCycle(seconds: number, count: number, reduced = false) {
  if (reduced || count < 2) return { index: 0, phase: 'hold' as const, gather: 1 }
  const {
    portraitGatherSeconds: gather,
    portraitHoldSeconds: hold,
    portraitScatterSeconds: scatter,
  } = TIMING
  const duration = gather + hold + scatter
  const elapsed = Math.max(0, seconds)
  const slot = Math.floor(elapsed / duration)
  const local = elapsed - slot * duration
  const index = slot % count
  if (local < gather) return { index, phase: 'gather' as const, gather: clamp(local / gather) }
  if (local < gather + hold) return { index, phase: 'hold' as const, gather: 1 }
  return { index, phase: 'scatter' as const, gather: 1 - clamp((local - gather - hold) / scatter) }
}
