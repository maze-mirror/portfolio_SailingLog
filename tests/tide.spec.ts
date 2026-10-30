import { describe, expect, it } from 'vitest'
import { tideCell, tideFront } from '../src/scene/tide-field'
import { createTideTimeline } from '../src/scene/tide'
import { advanceTidePlayback, ABOUT_READ_SECONDS, type TidePlayback } from '../src/scene/tide-playback'

describe('fast scroll sequencing', () => {
  function frames(state: TidePlayback, count: number, ready: boolean, target = 1, reduced = false) {
    for (let i = 0; i < count; i++) state = advanceTidePlayback(state, target, ready, 0.02, 5.86, reduced)
    return state
  }
  it('waits for actual text completion even when the scrollbar jumps to the bottom', () => {
    let state = frames({ progress: 0, readySeconds: 0 }, 500, false)
    expect(state.progress).toBe(0)
    state = frames(state, (ABOUT_READ_SECONDS - 0.1) / 0.02, true)
    expect(state.progress).toBe(0)
    state = frames(state, 15, true)
    expect(state.progress).toBeGreaterThan(0)
    expect(state.progress).toBeLessThan(0.1)
    state = frames(state, 310, true)
    expect(state.progress).toBe(1)
  })
  it('cancels waiting on leaving the introduction and permits reverse scrolling', () => {
    let state = frames({ progress: 0.6, readySeconds: 5 }, 50, true, 0)
    expect(state.progress).toBeLessThan(0.6)
    state = frames(state, 200, false, 0)
    expect(state).toEqual({ progress: 0, readySeconds: 0 })
    const beforeDeadline = Math.max(0, Math.floor(ABOUT_READ_SECONDS / 0.02) - 2)
    expect(frames(state, beforeDeadline, true).progress).toBe(0)
    expect(frames(state, Math.ceil(ABOUT_READ_SECONDS / 0.02) + 2, true).progress).toBeGreaterThan(0)
  })
  it('does not count a background pause as reading and supports reduced motion', () => {
    expect(advanceTidePlayback({ progress: 0, readySeconds: 0 }, 1, true, 60, 5.86).progress).toBe(0)
    const afterDeadline = Math.ceil(ABOUT_READ_SECONDS / 0.02) + 2
    const state = frames({ progress: 0, readySeconds: 0 }, afterDeadline, true, 0.8, true)
    expect(state.progress).toBe(0.8)
    expect(frames(state, 1, true, 0, true).progress).toBe(0)
  })
})

describe('tidal transition', () => {
  it('surges fully over the viewport and retreats completely, with reversible coverage', () => {
    const state = { depth: 0, phase: 0, washed: 0 }
    const timeline = createTideTimeline(state)
    timeline.seek('crest')
    for (let i = 0; i <= 20; i++) expect(tideFront(i / 20, state.depth, state.phase)).toBeGreaterThan(1)
    expect(state.washed).toBe(1)
    timeline.progress(1)
    expect(state.depth).toBe(0)
    expect(state.washed).toBe(1)
    timeline.progress(0)
    expect(state.washed).toBe(0)
    expect(state.depth).toBe(0)
    timeline.kill()
  })
  it('has no characters outside the shore or at the dry endpoints', () => {
    for (let i = 0; i < 100; i++) {
      expect(tideCell(i / 100, 0, 0, 0)).toBeNull()
      expect(tideCell(i / 100, 0.9, 0.3, 1)).toBeNull()
    }
  })
  it('creates porous bands of ASCII and several ink tones rather than a solid fill', () => {
    let empty = 0, filled = 0
    const tones = new Set<number>()
    for (let y = 0; y < 60; y++) for (let x = 0; x < 100; x++) {
      const cell = tideCell(x / 100, y / 100, 0.8, 1)
      if (!cell) empty++
      else {
        filled++
        tones.add(cell.tone)
        expect(cell.glyph.charCodeAt(0)).toBeLessThan(128)
      }
    }
    expect(empty).toBeGreaterThan(500)
    expect(filled).toBeGreaterThan(1500)
    expect(tones.size).toBe(3)
    expect(tideFront(0.2, 0.5, 0)).not.toBe(tideFront(0.7, 0.5, 0))
  })
})
