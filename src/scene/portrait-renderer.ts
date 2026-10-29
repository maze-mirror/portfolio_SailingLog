import { gatheringPosition } from './motion'
import {
  PORTRAIT_COLUMNS,
  SPEECH_COLUMNS,
  isSpeechCell,
  portraitFlow,
  portraitStreamGlyph,
  samplePortraitCell,
} from './portrait-flow'
import type { PortraitData } from './types'

interface PortraitView {
  left: number
  top: number
  width: number
  height: number
  pixelRatio: number
}
const ALPHA = [0.045, 0.11, 0.23, 0.37, 0.51, 0.66, 0.81, 0.97]

/** Draw moving text directly, sampling the portrait at each travelling glyph's center. */
export function createPortraitRenderer(data: PortraitData) {
  const source = Uint8Array.from(data.levels, (ch) => parseInt(ch, 16))
  const speechMin = new Int32Array(data.height).fill(-1),
    speechMax = new Int32Array(data.height).fill(-1)
  for (let row = 0; row < data.height; row++)
    for (let col = 0; col < data.width; col++) {
      if (data.speechMask[row * data.width + col] !== '1') continue
      if (speechMin[row] === -1) speechMin[row] = col
      speechMax[row] = col
    }
  const hasSpeech = speechMin.some((value) => value >= 0)

  return function renderPortrait(
    context: CanvasRenderingContext2D,
    view: PortraitView,
    seconds: number,
    gather: number,
    reveal: number,
  ) {
    context.save()
    context.translate(view.left, view.top)
    context.scale(view.pixelRatio, view.pixelRatio)
    context.font = '10px Consolas, "Courier New", monospace'
    context.textBaseline = 'top'
    context.fillStyle = '#184D97'
    const width = view.width / view.pixelRatio,
      height = view.height / view.pixelRatio
    const advanceRatio = context.measureText('M').width / 10
    const fontPx = width / PORTRAIT_COLUMNS / advanceRatio
    const speechFontPx = width / SPEECH_COLUMNS / advanceRatio
    const flow = portraitFlow(seconds)
    for (const speech of hasSpeech ? [false, true] : [false]) {
      const columns = speech ? SPEECH_COLUMNS : PORTRAIT_COLUMNS
      const rows = Math.round((columns * data.height) / data.width)
      const cell = width / columns,
        leading = height / rows
      context.font = `${speech ? speechFontPx : fontPx}px Consolas, "Courier New", monospace`
      for (let row = -1; row <= rows; row++) {
        const y = (row + flow.fraction) * leading
        const v = (y + leading * 0.45) / height
        if (v < 0 || v >= 1) continue
        let firstColumn = 0,
          lastColumn = columns - 1
        if (speech) {
          const maskRow = Math.min(data.height - 1, Math.floor(v * data.height))
          const min = speechMin[maskRow] ?? -1,
            max = speechMax[maskRow] ?? -1
          if (min < 0) continue
          firstColumn = Math.max(0, Math.floor((min / data.width) * columns) - 2)
          lastColumn = Math.min(columns - 1, Math.ceil(((max + 1) / data.width) * columns) + 2)
        }
        const lines = Array<string>(8).fill('')
        for (let column = firstColumn; column <= lastColumn; column++) {
          const x = column * cell,
            u = (x + cell * 0.5) / width
          const du = (cell * 0.48) / width,
            dv = (leading * 0.48) / height
          const inSpeech = isSpeechCell(data.speechMask, data.width, data.height, u, v)
          const nearSpeech =
            !speech &&
            (inSpeech ||
              isSpeechCell(data.speechMask, data.width, data.height, u - du, v - dv) ||
              isSpeechCell(data.speechMask, data.width, data.height, u + du, v - dv) ||
              isSpeechCell(data.speechMask, data.width, data.height, u - du, v + dv) ||
              isSpeechCell(data.speechMask, data.width, data.height, u + du, v + dv))
          const included = speech ? inSpeech : !nearSpeech
          const level = included
            ? samplePortraitCell(
                source,
                data.width,
                data.height,
                u,
                v,
                (speech ? 0.15 : 0.36) / columns,
                (speech ? 0.15 : 0.32) / rows,
              )
            : 0
          const tone = level < 0.025 ? -1 : Math.min(7, Math.floor(level * 7.999))
          const glyph = tone < 0 ? ' ' : portraitStreamGlyph(level, column, row - flow.whole)
          if (gather < 1) {
            if (tone < 0 || glyph === ' ') continue
            const position = gatheringPosition(
              (x / width) * 1024,
              (y / height) * 1002,
              (row + 1) * columns + column,
              gather,
            )
            context.globalAlpha = reveal * (ALPHA[tone] ?? 0) * position.opacity
            context.fillText(glyph, (position.x / 1024) * width, (position.y / 1002) * height)
          } else {
            for (let n = 0; n < 8; n++) lines[n] += n === tone ? glyph : ' '
          }
        }
        if (gather >= 1)
          for (let tone = 0; tone < 8; tone++) {
            const text = lines[tone]?.trimEnd() ?? ''
            if (!text.trim()) continue
            context.globalAlpha = reveal * (ALPHA[tone] ?? 0)
            context.fillText(text, firstColumn * cell, y)
          }
      }
    }
    context.restore()
    return {
      columns: PORTRAIT_COLUMNS,
      rows: Math.round((PORTRAIT_COLUMNS * data.height) / data.width),
      speechColumns: SPEECH_COLUMNS,
      fraction: flow.fraction,
      fontPx,
      speechFontPx,
    }
  }
}
