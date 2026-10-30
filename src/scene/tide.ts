import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { TIMING } from './motion'
import { tideCell, tideFront } from './tide-field'
import { advanceTidePlayback, type TidePlayback } from './tide-playback'

export const TIDE_SCROLL_DISTANCE = 2600

/** Reversible surge, suspended crest, then slower backwash. */
export function createTideTimeline(state: { depth: number; phase: number; washed: number }) {
  return gsap.timeline({ paused: true, defaults: { ease: 'sine.inOut' } })
    .addLabel('surge')
    .to(state, { depth: 1, duration: 1.6 }, 'surge')
    .to(state, { phase: 1.7, duration: 1.6, ease: 'none' }, 'surge')
    .to(state, { washed: 1, duration: 0.01 })
    .addLabel('crest')
    .to(state, { depth: 0.97, phase: 2.3, duration: 0.2 }, 'crest')
    .addLabel('ebb')
    .to(state, { depth: 0, phase: 4.4, duration: 2.5 }, 'ebb')
}

export function mountTide(root: HTMLElement) {
  gsap.registerPlugin(ScrollTrigger)
  const canvas = root.querySelector<HTMLCanvasElement>('[data-tide]')!
  const journey = root.querySelector<HTMLElement>('[data-journey]')!
  const stage = root.querySelector<HTMLElement>('.sl-stage')!
  const ctx = canvas.getContext('2d')!
  const state = { depth: 0, phase: 0, washed: 0 }
  let progress = 0, target = 0, drift = 0, width = 0, height = 0, lastPaint = 0
  let playback: TidePlayback = { progress: 0, readySeconds: 0 }
  let timeline: gsap.core.Timeline
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const colors = ['#184d97', '#1888a9', '#619baf']
  const previousHeight = journey.style.height
  journey.style.height = `calc(100dvh + ${TIMING.scrollDistance + TIDE_SCROLL_DISTANCE}px)`

  function paint() {
    ctx.clearRect(0, 0, width, height)
    canvas.dataset.progress = progress.toFixed(3)
    canvas.dataset.depth = state.depth.toFixed(3)
    const copy = stage.querySelector('.sl-about')
    if (state.washed > 0.5 || (reduced.matches && progress > 0.4)) copy?.setAttribute('inert', '')
    else copy?.removeAttribute('inert')
    if (progress <= 0) return
    if (reduced.matches) {
      ctx.globalAlpha = Math.min(1, progress * 3)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)
      ctx.globalAlpha = 1
      return
    }
    const phase = state.phase + drift
    ctx.fillStyle = '#ffffff'
    if (state.washed > 0.5) ctx.fillRect(0, 0, width, height)
    else {
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(width, 0)
      for (let i = 100; i >= 0; i--)
        ctx.lineTo(width * i / 100, height * Math.max(0, tideFront(i / 100, state.depth, phase) + 0.025))
      ctx.closePath()
      ctx.fill()
    }
    const cell = Math.max(6, width / 256), rowHeight = cell * 1.42
    ctx.font = `${cell / 0.6}px "Courier New", monospace`
    ctx.textBaseline = 'top'
    for (let row = 0; row * rowHeight < height; row++) {
      const y = row * rowHeight, lines = ['', '', '']
      for (let col = 0; col * cell < width; col++) {
        const sample = tideCell(col * cell / width, y / height, state.depth, phase)
        for (let tone = 0; tone < 3; tone++) lines[tone] += sample?.tone === tone ? sample.glyph : ' '
      }
      for (let tone = 0; tone < 3; tone++) {
        ctx.fillStyle = colors[tone]!
        if (lines[tone]!.trim()) ctx.fillText(lines[tone]!, 0, y)
      }
    }
  }
  function resize() {
    width = stage.clientWidth
    height = stage.clientHeight
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(width * ratio)
    canvas.height = Math.round(height * ratio)
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    paint()
  }
  const context = gsap.context(() => {
    timeline = createTideTimeline(state)
    ScrollTrigger.create({
      trigger: journey,
      start: () => journey.offsetTop + TIMING.scrollDistance,
      end: `+=${TIDE_SCROLL_DISTANCE}`,
      onUpdate: self => { target = self.progress },
      onRefresh: self => { target = self.progress },
    })
  }, root)
  function tick(time: number) {
    if (document.hidden) { lastPaint = time; return }
    if (time - lastPaint < 1 / 30) return
    const dt = Math.min(0.08, time - lastPaint)
    lastPaint = time
    playback = advanceTidePlayback(playback, target, root.dataset.aboutReady === 'true',
      dt, timeline.duration(), reduced.matches)
    const changed = progress !== playback.progress
    progress = playback.progress
    timeline.progress(progress)
    if (!reduced.matches && progress > 0 && progress < 1) {
      drift += dt * 0.22
      paint()
    } else if (changed) paint()
  }
  gsap.ticker.add(tick)
  const observer = new ResizeObserver(resize)
  observer.observe(stage)
  reduced.addEventListener('change', paint)
  resize()
  ScrollTrigger.refresh()
  return () => {
    context.revert()
    gsap.ticker.remove(tick)
    observer.disconnect()
    reduced.removeEventListener('change', paint)
    journey.style.height = previousHeight
    stage.querySelector('.sl-about')?.removeAttribute('inert')
  }
}
