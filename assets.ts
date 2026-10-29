import telescopeUrl from './assets/telescope-frames.json?url'
import portraitUrl from './assets/portrait.json?url'
import alternatePortraitUrl from './assets/portrait-alternate.json?url'
import type { SceneAssets } from './types'

export async function loadSceneAssets(signal: AbortSignal): Promise<SceneAssets> {
  const responses = await Promise.all([
    fetch(telescopeUrl, { signal }),
    fetch(portraitUrl, { signal }),
    fetch(alternatePortraitUrl, { signal }),
  ])
  if (responses.some((response) => !response.ok)) throw new Error('Scene assets unavailable')
  const [telescope, portrait, alternatePortrait] = await Promise.all(
    responses.map((response) => response.json()),
  )
  if (
    !Array.isArray(telescope) ||
    !telescope.length ||
    telescope.some((frame) => typeof frame.rows !== 'string' || typeof frame.ink !== 'string') ||
    [portrait, alternatePortrait].some(
      (image) =>
        !Number.isInteger(image?.width) ||
        !Number.isInteger(image?.height) ||
        image.width <= 0 ||
        image.height <= 0 ||
        typeof image.levels !== 'string' ||
        image.levels.length !== image.width * image.height ||
        typeof image.speechMask !== 'string' ||
        image.speechMask.length !== image.levels.length ||
        (image.aspectRatio !== undefined &&
          (!Number.isFinite(image.aspectRatio) || image.aspectRatio <= 0)),
    )
  ) {
    throw new Error('Invalid scene data')
  }
  return { telescope, portrait, alternatePortrait }
}
