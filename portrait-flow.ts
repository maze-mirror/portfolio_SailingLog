import { clamp } from './motion'

export const PORTRAIT_COLUMNS = 130
export const SPEECH_COLUMNS = 384
export const PORTRAIT_FLOW_SPEED = 2.2
const INK_NEIGHBORS = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
] as const

/** Downward travel in row units; columns stay fixed. */
export function portraitFlow(seconds: number) {
  const travel = Math.max(0, seconds) * PORTRAIT_FLOW_SPEED
  const whole = Math.floor(travel)
  return { whole, fraction: travel - whole }
}

export function isSpeechCell(mask: string, width: number, height: number, u: number, v: number) {
  if (u < 0 || v < 0 || u >= 1 || v >= 1) return false
  return mask[Math.floor(v * height) * width + Math.floor(u * width)] === '1'
}

export function portraitStreamGlyph(level: number, column: number, sourceRow: number) {
  const bands = [' .,:;TIVL7', 'XYZCPEACR', 'SAGQ6892', 'MW08BWM0']
  const band = bands[Math.min(3, Math.floor(clamp(level) * 3.999))]!
  let hash = Math.imul(column, 374761393) ^ Math.imul(sourceRow, 668265263)
  hash = Math.imul(hash ^ (hash >>> 13), 1274126177)
  return band[(hash >>> 0) % band.length]!
}

/** Sample brightness only. Font edges are always drawn as text by the display canvas. */
export function samplePortraitLevel(
  levels: Uint8Array,
  width: number,
  height: number,
  u: number,
  v: number,
) {
  if (u < 0 || v < 0 || u > 1 || v > 1) return 0
  const x = u * (width - 1),
    y = v * (height - 1)
  const x0 = Math.floor(x),
    y0 = Math.floor(y)
  const x1 = Math.min(width - 1, x0 + 1),
    y1 = Math.min(height - 1, y0 + 1)
  const dx = x - x0,
    dy = y - y0
  const top = (levels[y0 * width + x0] ?? 0) * (1 - dx) + (levels[y0 * width + x1] ?? 0) * dx
  const bottom = (levels[y1 * width + x0] ?? 0) * (1 - dx) + (levels[y1 * width + x1] ?? 0) * dx
  return (top * (1 - dy) + bottom * dy) / 15
}

/** Keep thin manga ink strokes that would otherwise fall between character centers. */
export function samplePortraitCell(
  levels: Uint8Array,
  width: number,
  height: number,
  u: number,
  v: number,
  du: number,
  dv: number,
) {
  let level = samplePortraitLevel(levels, width, height, u, v)
  for (const [x, y] of INK_NEIGHBORS) {
    level = Math.max(
      level,
      0.92 * samplePortraitLevel(levels, width, height, u + x * du, v + y * dv),
    )
  }
  return Math.pow(level, 0.8)
}
