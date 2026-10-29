export interface TelescopeFrame {
  rows: string
  ink: string
}

export interface PortraitData {
  width: number
  height: number
  levels: string
  speechMask: string
  aspectRatio?: number
}

export interface SceneAssets {
  telescope: TelescopeFrame[]
  portrait: PortraitData
  alternatePortrait: PortraitData
}

export interface SailingSceneOptions {
  assets: SceneAssets
}
