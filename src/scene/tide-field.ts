/** Normalized irregular shore line, with multiple scales of rolling crests. */
export function tideFront(x: number, depth: number, phase: number) {
  return -0.18 + depth * 1.43 + Math.sin(x * 9 + phase * 0.7) * 0.055
    + Math.sin(x * 23 - phase * 0.9) * 0.024 + Math.sin(x * 47 + phase) * 0.009
}
const glyphs = ' .:cvrxAMWHKQBO'
const fract = (n: number) => n - Math.floor(n)
const noise = (x: number, y: number) => fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453)

/** Smooth bands curl and branch into porous foam on a stable monospace grid. */
export function tideCell(x: number, y: number, depth: number, phase: number) {
  const distance = tideFront(x, depth, phase) - y
  if (distance < -0.045 || depth <= 0) return null
  const warp = Math.sin(x * 11 + y * 8 + phase * 0.6) * 1.8
  const curl = Math.sin(y * 27 - phase * 2.4 + warp + Math.sin(x * 17 - y * 9))
  const vein = Math.sin(x * 19 + y * 13 + Math.sin(y * 19 - phase) * 2.5)
  const seed = noise(Math.floor(x * 260), Math.floor(y * 150))
  const edge = Math.max(0, 1 - Math.abs(distance) / 0.085)
  const density = distance < 0 ? 0.12 : 0.53 + curl * 0.28 + vein * 0.14 + edge * 0.1
  if (seed > density) return null
  return { glyph: glyphs[Math.min(glyphs.length - 1, 2 + Math.floor(seed * 12))]!,
    tone: edge > 0.5 || curl > 0.58 ? 2 : vein > 0.2 ? 1 : 0 }
}
