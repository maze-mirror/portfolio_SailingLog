import { describe, expect, it } from 'vitest'
import { portraitCycle } from '../portrait-cycle'
import { TIMING } from '../motion'

const gather = TIMING.portraitGatherSeconds
const hold = TIMING.portraitHoldSeconds
const scatter = TIMING.portraitScatterSeconds
const duration = gather + hold + scatter

describe('alternating portrait assembly', () => {
  it('uses the configured assembly, full-image hold and scatter durations', () => {
    expect(gather).toBeGreaterThan(0)
    expect(hold).toBeGreaterThan(0)
    expect(scatter).toBeGreaterThan(0)
    expect(portraitCycle(0, 2)).toEqual({index: 0, phase: 'gather', gather: 0})
    expect(portraitCycle(gather / 2, 2).gather).toBeCloseTo(.5)
    for(const time of [gather, gather + hold / 2, gather + hold - .001])
      expect(portraitCycle(time, 2)).toEqual({index: 0, phase: 'hold', gather: 1})
    const outgoing = portraitCycle(gather + hold + scatter / 2, 2)
    expect(outgoing.phase).toBe('scatter')
    expect(outgoing.gather).toBeCloseTo(.5)
  })

  it('switches only after complete scattering and then loops back to the first image', () => {
    expect(portraitCycle(duration - .001, 2).index).toBe(0)
    expect(portraitCycle(duration - .001, 2).gather).toBeLessThan(.01)
    expect(portraitCycle(duration, 2)).toEqual({index: 1, phase: 'gather', gather: 0})
    expect(portraitCycle(duration + gather + hold / 2, 2)).toEqual({index: 1, phase: 'hold', gather: 1})
    expect(portraitCycle(duration * 2, 2)).toEqual({index: 0, phase: 'gather', gather: 0})
  })

  it('keeps the first portrait stable when reduced motion is requested', () => {
    for(const time of [0, 3, 5, 100])
      expect(portraitCycle(time, 2, true)).toEqual({index: 0, phase: 'hold', gather: 1})
  })

  it('starts safely for negative clocks and a single image', () => {
    expect(portraitCycle(-2, 2)).toEqual(portraitCycle(0, 2))
    expect(portraitCycle(30, 1)).toEqual({index: 0, phase: 'hold', gather: 1})
  })
})
