import { describe, expect, it } from 'vitest'
import { createPortraitRenderer } from '../portrait-renderer'
import { PORTRAIT_FLOW_SPEED } from '../portrait-flow'

describe('fully flowing portrait', () => {
  it('moves every rendered row down, with no anchored silhouette layer, and stays continuous across row boundaries', () => {
    const render = createPortraitRenderer({
      width: 20,
      height: 20,
      levels: 'f'.repeat(400),
      speechMask: '0'.repeat(400),
    })
    type Draw = { text: string; x: number; y: number }
    let draws: Draw[] = []
    const context = {
      font: '',
      save() {},
      restore() {},
      translate() {},
      scale() {},
      measureText() {
        return { width: 6 }
      },
      fillText(text: string, x: number, y: number) {
        draws.push({ text, x, y })
      },
    } as unknown as CanvasRenderingContext2D
    const frame = (seconds: number) => {
      draws = []
      render(context, { left: 0, top: 0, width: 600, height: 600, pixelRatio: 1 }, seconds, 1, 1)
      return draws
    }
    const a = frame(0.01),
      b = frame(0.02)
    expect(a.length).toBeGreaterThan(100)
    expect(b).toHaveLength(a.length)
    for (let i = 0; i < a.length; i++) {
      expect(b[i]!.text).toBe(a[i]!.text)
      expect(b[i]!.x).toBe(a[i]!.x)
      expect(b[i]!.y).toBeGreaterThan(a[i]!.y)
    }
    const before = frame(0.99 / PORTRAIT_FLOW_SPEED)
    const after = frame(1.01 / PORTRAIT_FLOW_SPEED)
    const first = before.find((call) => call.y > 20)!
    const same = after.find(
      (call) => call.text === first.text && call.y > first.y && call.y - first.y < 1,
    )
    expect(same).toBeDefined()
  })
})
