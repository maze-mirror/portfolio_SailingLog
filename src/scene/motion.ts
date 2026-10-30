export const clamp = (value: number) => Math.max(0, Math.min(1, value))
export function smooth(value: number) {
  const x = clamp(value)
  return x * x * (3 - 2 * x)
}

export const TIMING = {
  oceanStart: 0.3,
  scatterStart: 0.56,
  aboutStart: 0.8,
  portraitGatherSeconds: 1.1,
  portraitHoldSeconds: 0.7,
  portraitScatterSeconds: 1.1,
  scatterSeconds: 2.3,
  scrollDistance: 5600,
} as const

/** Zoom keeps advancing while the same view breaks into characters. */
export function voyageMotion(progress: number) {
  const p = clamp(progress)
  const scatter = clamp((p - TIMING.scatterStart) / (TIMING.aboutStart - TIMING.scatterStart))
  const zoom = 1 + 0.5 * smooth((p - TIMING.oceanStart) / 0.3) + 0.50 * smooth(scatter)
  return {
    zoom,
    scatter,
    stage: p < 0.39 ? 'telescope' : p < 0.56 ? 'ocean' : p < 0.8 ? 'scatter' : 'about',
  }
}

/** A scroll fling cannot skip the scatter; reverse scroll uses the same pace. */
export function advanceProgress(current: number, target: number, seconds: number, reduced = false) {
  if (reduced) return clamp(target)
  const desired = current + (clamp(target) - current) * (1 - Math.exp(-seconds * 10))
  const step = (seconds * (TIMING.aboutStart - TIMING.scatterStart)) / TIMING.scatterSeconds
  if (desired > current) {
    if (current < TIMING.scatterStart && desired > TIMING.scatterStart) return TIMING.scatterStart
    if (current >= TIMING.scatterStart && current < TIMING.aboutStart) {
      return Math.min(desired, current + step, TIMING.aboutStart)
    }
  } else {
    if (current > TIMING.aboutStart && desired < TIMING.aboutStart) return TIMING.aboutStart
    if (current <= TIMING.aboutStart && current > TIMING.scatterStart) {
      return Math.max(desired, current - step, TIMING.scatterStart)
    }
  }
  return desired
}

/** Glyphs travel along rows while staying within their original density band. */
export function flowingGlyph(level: number, column: number, row: number, seconds: number) {
  const bands = [' .,:;TIVL7', 'XYZCPEACR', 'SAGQ6892', 'MW08BWM0']
  const band = bands[Math.max(0, Math.min(3, Math.floor(clamp(level) * 3.999)))]!
  const phase = Math.floor(column + row * 1.73 - seconds * 9)
  return band[((phase % band.length) + band.length) % band.length]!
}

/** Reversible convergence from deterministic scattered origins into the supplied image. */
export function gatheringPosition(x: number, y: number, index: number, progress: number) {
  const amount = 1 - smooth(progress)
  const seed = Math.abs(Math.sin(index * 12.9898 + 3.17))
  const angle = Math.atan2(y - 501, x - 512) + Math.sin(index * 3.7) * 0.7
  const distance = 200 + seed * 850
  return {
    x: x + Math.cos(angle) * distance * amount,
    y: y + Math.sin(angle) * distance * amount,
    opacity: 0.25 + 0.75 * smooth(progress),
  }
}
