import { createPortraitRenderer } from './portrait-renderer'
import { portraitCycle } from './portrait-cycle'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { advanceProgress, clamp, smooth, flowingGlyph, voyageMotion, TIMING } from './motion'

gsap.registerPlugin(ScrollTrigger)

/**
 * Canvas implementation; public options and lifetime are declared in scene.d.ts.
 * Each mounted portfolio owns its own observers, GSAP context and render loop.
 * @param {HTMLElement} root
 * @param {import('./types').SailingSceneOptions} options
 * @returns {() => void}
 */

export function mountSailingLog(root, options) {
  const stage = root.querySelector('.sl-stage'),
    canvas = root.querySelector('canvas'),
    ctx = canvas.getContext('2d')
  const slider = root.querySelector('input'),
    output = root.querySelector('output'),
    heading = root.querySelector('.sl-heading')
  const data = options.assets.telescope
  const portraits = [options.assets.portrait, options.assets.alternatePortrait]
  const about = root.querySelector('.sl-about'),
    locationIcon = root.querySelector('.sl-location-icon')
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const state = { p: 0 },
    pose = { turn: 0, zoom: 0, approach: 0 }
  const palette = ['#184D97', '#184D97', '#184D97', '#184D97'],
    inkAlpha = [1, 0.86, 0.61, 0.32]
  const cache = new Map()
  let timeline = null,
    target = 0,
    time = 0,
    visible = true,
    raf = 0,
    lastTime = 0,
    lastPaint = 0,
    introTime = 0,
    aboutTime = 0
  let pointerX = 0.5,
    pointerY = 0.5,
    progressDirty = true
  const ocean = document.createElement('canvas')
  ocean.width = 1000
  ocean.height = 625
  const oc = ocean.getContext('2d')
  const title = root.querySelector('.sl-title'),
    subtitle = root.querySelector('.sl-subtitle')
  function splitLetters(element) {
    const text = element.textContent
    element.textContent = ''
    return Array.from(text, (letter, i) => {
      const span = document.createElement('span')
      span.className = 'sl-char'
      span.setAttribute('aria-hidden', 'true')
      span.textContent = letter
      span.dataset.letter = letter
      span.dataset.index = String(i)
      element.appendChild(span)
      return span
    })
  }
  const titleLetters = splitLetters(title),
    subtitleLetters = splitLetters(subtitle)
  const aboutLetters = Array.from(root.querySelectorAll('.sl-about-text'), splitLetters)
  const aboutDelays = [0, 0.58, 1.5, 2.15, 3.65]
  const aboutRevealDuration = Math.max(...aboutLetters.map((letters, i) =>
    aboutDelays[i] + Math.max(0, letters.length - 1) * 0.04 + 0.21))
  const originalIntroDuration = Math.max(
    0.12 + (titleLetters.length - 1) * 0.065 + 0.21,
    0.78 + (subtitleLetters.length - 1) * 0.045 + 0.21,
  )
  const introDuration = originalIntroDuration + 0.2
  function revealLetters(letters, elapsed, step) {
    letters.forEach((span, i) => {
      const age = elapsed - i * step
      span.style.opacity = age < 0 ? '0' : '1'
      const mode = age < 0.11 ? 'scan' : age < 0.21 ? 'edge' : 'done'
      if (span.dataset.mode !== mode) span.dataset.mode = mode
      const scrambled = age >= 0 && age < 0.12 && span.dataset.letter !== ' '
      span.textContent = scrambled
        ? '01ABCDEFGHIJKLMNOPQRSTUVWXYZ'[(Math.floor(age * 45) + i * 7) % 28]
        : span.dataset.letter
    })
  }
  function drawIntro() {
    const elapsed = reduced.matches ? 99 : introTime * (originalIntroDuration / introDuration)
    revealLetters(titleLetters, elapsed - 0.12, 0.065)
    revealLetters(subtitleLetters, elapsed - 0.78, 0.045)
  }
  const portraitRenderers = portraits.map(createPortraitRenderer)
  function drawAboutCopy(progress) {
    const opacity = smooth((progress - 0.79) / 0.055)
    about.style.opacity = String(opacity)
    about.setAttribute('aria-hidden', opacity > 0.05 ? 'false' : 'true')
    const elapsed = reduced.matches ? 99 : aboutTime
    aboutLetters.forEach((letters, i) => revealLetters(letters, elapsed - aboutDelays[i], 0.04))
    locationIcon.style.opacity = elapsed > aboutDelays[4] ? '1' : '0'
    root.dataset.aboutReady = String(opacity >= 0.999 && elapsed >= aboutRevealDuration)
  }
  let debris = null,
    frozenOcean = null,
    frozenOceanTime = 0
  function buildDebris() {
    frozenOceanTime = reduced.matches ? 0 : time
    drawOcean(reduced.matches ? 0 : time, 0)
    frozenOcean = document.createElement('canvas')
    frozenOcean.width = 1000
    frozenOcean.height = 625
    frozenOcean.getContext('2d').drawImage(ocean, 0, 0)
    const pixels = oc.getImageData(0, 0, 1000, 625).data
    debris = []
    const glyphs = '.,:;~i1tfxC08MX@'
    for (let y = 2; y < 625; y += 6)
      for (let x = 2; x < 1000; x += 5) {
        const at = (y * 1000 + x) * 4,
          r = pixels[at],
          g = pixels[at + 1],
          b = pixels[at + 2]
        const blue = b > r * 1.18 && g > r * 1.08 && r < 210
        const gold = r > 215 && g > 170 && g < 230 && b < 175
        const cloud = y < 276 && r < 200 && Math.max(r, g, b) - Math.min(r, g, b) < 32
        const foam = y > 276 && r > 245 && g > 245 && b > 245 && (x + y) % 3 === 0
        if (!blue && !gold && !cloud && !foam) continue
        const seed = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1
        const seed2 = Math.abs(Math.sin(x * 5.7 + y * 13.1))
        const angle = Math.atan2(y - 310, x - 500) + seed * 0.85
        debris.push({
          x,
          y,
          glyph: glyphs[(x + y * 7) % glyphs.length],
          color: gold
            ? '#F6D081'
            : cloud
              ? '#9ca7af'
              : foam
                ? '#ffffff'
                : seed2 > 0.4
                  ? '#1888BF'
                  : '#34B8C5',
          vx: Math.cos(angle) * (260 + seed2 * 900),
          vy: Math.sin(angle) * (200 + seed2 * 650),
          delay: seed2 * 0.1,
        })
      }
  }
  function drawScatter(progress) {
    if (!debris) buildDebris()
    const w = canvas.width,
      h = canvas.height
    ctx.globalAlpha = 1
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    const u = reduced.matches ? progress : smooth(progress)
    const under = 1 - smooth(u / 0.28)
    const camera = voyageMotion(state.p)
    if (under > 0.001) {
      ctx.globalAlpha = under
      paintOcean(ctx, frozenOcean, camera.zoom, w, h)
    }
    ctx.save()
    ctx.scale(w / 1000, h / 625)
    ctx.translate(560, 275)
    ctx.scale(camera.zoom, camera.zoom)
    ctx.translate(-560, -275)
    ctx.translate(-15, -9.375)
    ctx.scale(1.03, 1.03)
    ctx.font = '7px "Courier New",monospace'
    ctx.textBaseline = 'top'
    const appear = smooth(u / 0.16)
    for (const d of debris) {
      const k = clamp((u - d.delay) / (1 - d.delay)),
        travel = Math.pow(k, 1.25)
      ctx.globalAlpha = appear * (1 - smooth((k - 0.12) / 0.88))
      if (ctx.globalAlpha < 0.005) continue
      ctx.fillStyle = d.color
      ctx.fillText(d.glyph, d.x + d.vx * travel, d.y + d.vy * travel + 100 * travel * travel)
    }
    ctx.restore()
    ctx.globalAlpha = 1
  }
  function drawAbout() {
    const w = canvas.width,
      h = canvas.height
    ctx.globalAlpha = 1
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    const cycle = portraitCycle(aboutTime, portraits.length, reduced.matches)
    const boxWidth = w * (cycle.index === 1 ? 0.42 : 0.32),
      boxHeight = boxWidth * (1002 / 1024)
    const aspectRatio = portraits[cycle.index].aspectRatio || 1024 / 1002
    const width = Math.min(boxWidth, boxHeight * aspectRatio),
      height = width / aspectRatio
    const reveal = smooth((state.p - 0.8) / 0.055)
    const gather = cycle.gather
    ctx.save()
    if (gather < 1) {
      ctx.beginPath()
      ctx.rect(w * 0.48, 0, w * 0.52, h)
      ctx.clip()
    }
    const detail = portraitRenderers[cycle.index](
      ctx,
      {
       // 第二张横向中心 70%，第一张保持 68%
        left: w * (cycle.index === 1 ? 0.70 : 0.68) - width / 2,

       // 第二张向下移动页面高度的 3%，第一张保持居中
        top: (h - height) / 2 + (cycle.index === 1 ? h * (-0.03) : 0),

        width,
        height,
        pixelRatio: window.devicePixelRatio || 1,
      },
      reduced.matches ? 0 : time,
      gather,
      reveal * smooth(gather / 0.3),
    )
    ctx.restore()
    root.dataset.portraitColumns = String(detail.columns)
    root.dataset.portraitFont = String(detail.fontPx)
    root.dataset.portraitSpeechFont = String(detail.speechFontPx)
    root.dataset.portraitFlow = detail.fraction.toFixed(4)
    root.dataset.portraitIndex = String(cycle.index)
    root.dataset.portraitPhase = cycle.phase
    root.dataset.portraitWidth = String(width / w)
    ctx.globalAlpha = 1
    root.dataset.gather = gather.toFixed(3)
  }
  function paintOcean(context, image, zoom, w, h) {
    context.save()
    context.translate(w * 0.56, h * 0.44)
    context.scale(zoom, zoom)
    context.translate(-w * 0.56 - w * 0.015, -h * 0.44 - h * 0.015)
    context.scale((w * 1.03) / 1000, (h * 1.03) / 625)
    // Repaint text at the actual view transform; never magnify a low-resolution sea bitmap.
    drawOcean(
      image === frozenOcean ? frozenOceanTime : reduced.matches ? 0 : time,
      0,
      context,
      context.globalAlpha,
    )
    context.restore()
  }
  function updateProgress(progress, fi) {
    if (!progressDirty) return
    slider.value = String(Math.round(progress * 1000))
    output.value = `${Math.round(progress * 100)}%`
    root.dataset.progress = progress.toFixed(3)
    root.dataset.frame = String(fi)
    root.dataset.zoom = voyageMotion(progress).zoom.toFixed(3)
    root.dataset.scatter = voyageMotion(progress).scatter.toFixed(3)
    root.dataset.scene =
      progress < 0.39
        ? 'telescope'
        : progress < 0.56
          ? 'ocean'
          : progress < 0.8
            ? 'scatter'
            : 'about'
    progressDirty = false
  }
  function makeFrame(index) {
    const key = `${index}:${reduced.matches ? 0 : Math.floor(time * 9)}`
    if (cache.has(key)) return cache.get(key)
    const frame = data[index],
      rows = frame.rows.split('\n')
    const image = { glyphRows: [] }
    let k = 0
    image.glyphRows = []
    rows.forEach((row, r) => {
      const lines = ['', '', '', '']
      for (let col = 0; col < row.length; col++) {
        const original = row[col],
          tone = original === ' ' ? -1 : Number(frame.ink[k++])
        const density = ' .,:;irsXA253hMHGS#9B&@'.indexOf(original) / 21
        const ch = tone < 0 ? ' ' : flowingGlyph(density, col, r, reduced.matches ? 0 : time)
        for (let n = 0; n < 4; n++) lines[n] += n === tone ? ch : ' '
      }
      image.glyphRows.push(lines)
    })
    if (cache.size >= 5) cache.delete(cache.keys().next().value)
    cache.set(key, image)
    return image
  }
  function prepareTimeline() {
    if (timeline) return
    timeline = gsap
      .timeline({ paused: true })
      .to(pose, { turn: 1, duration: 0.4, ease: 'none' }, 0)
      .to(pose, { zoom: 1, duration: 0.28, ease: 'power2.in' }, 0.4)
      .to(pose, { approach: 1, duration: 0.3, ease: 'power1.inOut' }, 0.7)
  }
  const clouds = [
    { x: 0.08, y: 0.2, w: 0.22, h: 0.023 },
    { x: 0.57, y: 0.12, w: 0.18, h: 0.018 },
    { x: 0.82, y: 0.29, w: 0.15, h: 0.019 },
  ]
  function drawClouds(t, paintContext = oc, opacity = 1) {
    const oc = paintContext
    const glyphs = ' .,:;~'
    for (let ci = 0; ci < clouds.length; ci++) {
      const cloud = clouds[ci],
        cx = (((cloud.x + t * 0.006 * (ci % 2 ? -0.6 : 1) + 1.5) % 1.5) - 0.25) * 1000
      const cy = cloud.y * 625,
        ww = cloud.w * 1000,
        hh = cloud.h * 625
      oc.font = '7px "Courier New",monospace'
      oc.fillStyle = '#9ca7af'
      oc.globalAlpha = 0.44 * opacity
      for (let row = -2; row <= 2; row++) {
        let line = ''
        const count = Math.round(ww / 4.2)
        for (let col = 0; col < count; col++) {
          const u = (col / count - 0.5) * 2,
            ell = u * u + (row / 2.8) ** 2
          const n = Math.sin(col * 4.317 + row * 9.1 + ci) * 0.5 + 0.5
          line += ell < 0.92 && n > 0.68 ? glyphs[2 + (Math.floor(n * 3) % 4)] : ' '
        }
        oc.fillText(line, cx - ww / 2 + Math.sin(row + ci) * 10, cy + (row * hh) / 2)
      }
    }
    oc.globalAlpha = opacity
  }
  function drawIsland(t, approach, horizon, paintContext = oc) {
    const oc = paintContext
    const width = 285,
      height = 76
    const x = 560 + (pointerX - 0.5) * -15,
      base = horizon
    const silhouette = [
      [0, 0.98],
      [0.09, 0.91],
      [0.17, 0.73],
      [0.25, 0.57],
      [0.32, 0.5],
      [0.4, 0.28],
      [0.47, 0.22],
      [0.55, 0.31],
      [0.62, 0.46],
      [0.69, 0.42],
      [0.77, 0.65],
      [0.85, 0.78],
      [0.94, 0.91],
      [1, 0.98],
      [1, 1],
      [0, 1],
    ]
    oc.save()
    oc.translate(x - width / 2, base - height)
    oc.beginPath()
    silhouette.forEach(([u, v], i) =>
      i ? oc.lineTo(u * width, v * height) : oc.moveTo(u * width, v * height),
    )
    oc.closePath()
    oc.clip()
    const font = 6.8,
      line = font * 1.12,
      cell = font * 0.6
    oc.font = `${font}px "Courier New",monospace`
    oc.textBaseline = 'top'
    const glyphs = '.,:;irsxX25hGM#@'
    for (let row = 0; row < Math.ceil(height / line) + 1; row++) {
      oc.fillStyle = '#F6D081'
      let text = ''
      for (let col = 0; col < Math.ceil(width / cell) + 1; col++) {
        const grain = Math.abs(Math.sin(col * 6.17 + row * 13.71) * 0.5 + 0.5)
        const index = Math.min(
          glyphs.length - 1,
          Math.floor((grain * 0.45 + (row / (height / line)) * 0.55) * (glyphs.length - 1)),
        )
        text += glyphs[(index + Math.floor(t * 0.7)) % glyphs.length]
      }
      oc.fillText(text, 0, row * line)
    }
    oc.restore()
    return { width, height }
  }
  function drawOcean(t, approach, paintContext = oc, opacity = 1) {
    const oc = paintContext
    const W = 1000,
      H = 625,
      horizon = 276
    oc.globalAlpha = opacity
    oc.fillStyle = '#f8fafb'
    oc.fillRect(0, 0, W, H)
    drawClouds(t, oc, opacity)
    const wash = oc.createLinearGradient(0, horizon, 0, H)
    wash.addColorStop(0, '#f1f9fc')
    wash.addColorStop(0.5, '#34B8C520')
    wash.addColorStop(1, '#1888BF38')
    oc.fillStyle = wash
    oc.fillRect(0, horizon, W, H - horizon)
    const colors = ['#1888BF', '#1888BF', '#34B8C5', '#ffffff']
    const glyphs = '.,:;~=-i1tfLCG08@'
    const count = 48
    for (let row = 0; row < count; row++) {
      const v = row / (count - 1),
        y = horizon + Math.pow(v, 1.58) * (H - horizon)
      const cell = 3.0 + v * 2.5,
        cols = Math.ceil(W / cell),
        lines = ['', '', '', '']
      const depthPhase = 22 * Math.pow(v, 0.69) - t * (0.72 + v * 0.65)
      for (let col = 0; col < cols; col++) {
        const x = col / cols
        const a = Math.sin(depthPhase + x * 12 + Math.sin(x * 8 + t * 0.22) * 1.4)
        const b = Math.sin(depthPhase * 2.17 - x * 21 + t * 0.3)
        const c = Math.sin(x * 94 + row * 1.8 - t * 0.8)
        const value = 0.65 * a + 0.28 * b + 0.07 * c
        const cap = Math.abs(Math.sin(depthPhase + x * 9 + Math.sin(x * 19 + t * 0.18) * 0.32))
        const foam = cap < 0.1 + v * 0.045 && Math.sin(x * 73 + row * 0.77 + t * 0.25) > -0.3
        const tone = foam ? 3 : value > 0.43 ? 0 : value > -0.35 ? 1 : 2
        const grain = (Math.sin(col * 12.9898 + row * 78.233) * 43758.5453) % 1
        const gi = Math.max(
          0,
          Math.min(
            glyphs.length - 1,
            Math.floor(((value + 1) * 0.5 + grain * 0.1) * (glyphs.length - 1)),
          ),
        )
        const ch = foam ? '~=-'[Math.abs(col + row) % 3] : glyphs[gi]
        for (let n = 0; n < 4; n++) lines[n] += n === tone ? ch : ' '
      }
      oc.font = `${cell / 0.6}px "Courier New",monospace`
      oc.textBaseline = 'top'
      for (let n = 0; n < 4; n++) {
        oc.fillStyle = colors[n]
        for (let start = 0; start < cols; start += 24) {
          const chunk = lines[n].slice(start, start + 24)
          if (!chunk.trim()) continue
          const drift = Math.sin((start / cols) * 11 + depthPhase * 0.35 + t * 0.24) * (v * 2.5)
          oc.fillText(chunk, start * cell + Math.sin(row * 0.8 + t * 0.15) * 2, y + drift)
        }
      }
    }
    drawIsland(t, approach, horizon, oc)
    // Low-density mist at the horizon is also made of characters.
    oc.font = '5px "Courier New",monospace'
    oc.fillStyle = '#1888BF'
    oc.globalAlpha = 0.32 * opacity
    oc.fillText('.  . .    . : .  .     .  . '.repeat(18), 0, horizon - 2)
    oc.globalAlpha = opacity
  }
  function draw() {
    prepareTimeline()
    const progress = state.p,
      p = clamp(progress / 0.56)
    if (progress > 0.56) {
      heading.style.opacity = '0'
      if (progress < 0.8) drawScatter((progress - 0.56) / 0.24)
      else drawAbout()
      drawAboutCopy(progress)
      updateProgress(progress, data.length - 1)
      return
    }
    debris = null
    frozenOcean = null
    about.style.opacity = '0'
    root.dataset.aboutReady = 'false'
    about.setAttribute('aria-hidden', 'true')
    if (timeline) timeline.progress(p)
    else {
      pose.turn = clamp(p / 0.4)
      pose.zoom = Math.pow(clamp((p - 0.4) / 0.28), 3)
      pose.approach = smooth((p - 0.7) / 0.3)
    }
    const w = canvas.width,
      h = canvas.height,
      cx = w / 2,
      cy = h * 0.55,
      zoom = 1 + pose.zoom * 13
    ctx.globalAlpha = 1
    ctx.fillStyle = '#f8fafb'
    ctx.fillRect(0, 0, w, h)
    if (p > 0.4) {
      const aperture = w * 0.061 * zoom
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, aperture, 0, Math.PI * 2)
      ctx.clip()
      paintOcean(ctx, ocean, voyageMotion(progress).zoom, w, h)
      // A very light glass vignette disappears as the viewing circle fills the screen.
      const rim = ctx.createRadialGradient(cx, cy, aperture * 0.72, cx, cy, aperture)
      rim.addColorStop(0, '#143e5b00')
      rim.addColorStop(1, '#143e5b24')
      ctx.fillStyle = rim
      ctx.fillRect(0, 0, w, h)
      ctx.restore()
    }
    const alpha = 1 - smooth((p - 0.6) / 0.11)
    const fi = Math.round(pose.turn * (data.length - 1))
    if (alpha > 0.001) {
      const image = makeFrame(fi)
      ctx.save()
      ctx.translate(cx, cy)
      ctx.scale(zoom, zoom)
      ctx.globalAlpha = alpha
      if (pose.zoom > 0) {
        // The even-odd clip opens the glass without removing the navy rim.
        ctx.beginPath()
        ctx.rect(-w, -h, w * 2, h * 2)
        ctx.arc(0, 0, w * 0.058, 0, Math.PI * 2)
        ctx.clip('evenodd')
      }
      {
        ctx.scale(w / 1056, w / 1056)
        ctx.translate(-528, -242)
        ctx.font = '6.6666667px "Courier New",monospace'
        ctx.textBaseline = 'top'
        image.glyphRows.forEach((lines, r) => {
          const y = (r - 63) * 4 * (220 / 115) + 242
          if ((Math.abs(y - 242) * zoom * w) / 1056 > h) return
          for (let n = 0; n < 4; n++)
            if (lines[n].trim()) {
              ctx.fillStyle = palette[n]
              ctx.globalAlpha = alpha * inkAlpha[n]
              ctx.fillText(lines[n], 0, y)
            }
        })
      }
      ctx.restore()
    }
    heading.style.opacity = String(1 - smooth((p - 0.1) / 0.25))
    drawIntro()
    updateProgress(progress, fi)
  }

  function setProgress(p) {
    target = clamp(p)
    window.scrollTo({
      top: journey.offsetTop + target * TIMING.scrollDistance,
      behavior: 'auto',
    })
    progressDirty = true
    ScrollTrigger.update()
    requestLoop()
  }
  function loop(now) {
    raf = 0
    if (!root.isConnected || !visible) return
    if (now - lastPaint < 16) {
      raf = requestAnimationFrame(loop)
      return
    }
    const dt = lastTime ? Math.min(0.08, (now - lastTime) / 1000) : 0.033
    lastTime = now
    lastPaint = now
    if (reduced.matches) state.p = target
    else if (Math.abs(state.p - target) > 0.00015) {
      state.p = advanceProgress(state.p, target, dt)
      progressDirty = true
    } else if (state.p !== target) {
      state.p = target
      progressDirty = true
    }
    if (!reduced.matches) {
      time += dt
      introTime += dt
    }
    if (state.p >= TIMING.aboutStart && !reduced.matches) aboutTime += dt
    else if (state.p < 0.73) aboutTime = 0
    draw()
    if (!reduced.matches || Math.abs(state.p - target) > 0.00015) raf = requestAnimationFrame(loop)
  }
  function requestLoop() {
    if (!raf && visible) raf = requestAnimationFrame(loop)
  }
  function onSlider() {
    setProgress(Number(slider.value) / 1000)
  }
  slider.addEventListener('input', onSlider)
  function onPointerMove(e) {
    if (reduced.matches) return
    const rect = stage.getBoundingClientRect()
    pointerX = clamp((e.clientX - rect.left) / rect.width)
    pointerY = clamp((e.clientY - rect.top) / rect.height)
    requestLoop()
  }
  stage.addEventListener('pointermove', onPointerMove)
  function resize() {
    const width = Math.max(320, stage.clientWidth)
    canvas.width = Math.round(width * (window.devicePixelRatio || 1))
    canvas.height = Math.round((canvas.width * stage.clientHeight) / width)
    progressDirty = true
    draw()
    requestLoop()
  }
  window.addEventListener('resize', resize)
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(stage)
  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting
      if (visible) {
        lastTime = 0
        requestLoop()
      } else {
        cancelAnimationFrame(raf)
        raf = 0
      }
    },
    { threshold: 0.01 },
  )
  intersectionObserver.observe(stage)
  function onVisibility() {
    if (document.hidden) {
      cancelAnimationFrame(raf)
      raf = 0
    } else {
      lastTime = 0
      requestLoop()
    }
  }
  document.addEventListener('visibilitychange', onVisibility)
  function onMotionChange() {
    progressDirty = true
    draw()
    requestLoop()
  }
  reduced.addEventListener('change', onMotionChange)
  const journey = root.querySelector('[data-journey]')
  const context = gsap.context(() => {
    prepareTimeline()
    ScrollTrigger.create({
      trigger: journey,
      start: 'top top',
      end: () => `+=${TIMING.scrollDistance}`,
      onUpdate: (self) => {
        target = self.progress
        progressDirty = true
        requestLoop()
      },
    })
  }, root)
  resize()
  ScrollTrigger.refresh()
  return () => {
    cancelAnimationFrame(raf)
    window.removeEventListener('resize', resize)
    resizeObserver.disconnect()
    intersectionObserver.disconnect()
    context.revert()
    timeline?.kill()
    slider.removeEventListener('input', onSlider)
    stage.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('visibilitychange', onVisibility)
    reduced.removeEventListener('change', onMotionChange)
    cache.clear()
    debris = null
    frozenOcean = null
  }
}
