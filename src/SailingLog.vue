<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { loadSceneAssets } from './scene/assets'
import { mountSailingLog } from './scene/scene.js'
import LocationPin from './components/LocationPin.vue'
import './styles/sailing-log.css'

const container = ref<HTMLElement | null>(null)
const debug = new URLSearchParams(window.location.search).has('debug')
const controller = new AbortController()
const loadFailed = ref(false)
let dispose: (() => void) | undefined
onMounted(async () => {
  try {
    const assets = await loadSceneAssets(controller.signal)
    if (container.value && !controller.signal.aborted)
      dispose = mountSailingLog(container.value, { assets })
  } catch {
    if (!controller.signal.aborted) loadFailed.value = true
  }
})
onUnmounted(() => {
  controller.abort()
  dispose?.()
})
</script>

<template>
  <main ref="container" class="sailing-log">
    <section class="sl-journey" data-journey>
      <div class="sl-stage">
        <p v-if="loadFailed" role="alert" class="sl-load-error">
          Unable to open this voyage. Please reload to try again.
        </p>
        <canvas
          width="1000"
          height="625"
          role="img"
          aria-label="字符望远镜进入海洋与随机字符小岛，字符碎散后进入白色介绍页；右侧两幅蓝色路飞字符画通过扩散和收拢交替出现，其中一幅保留草帽、衣服和台词框。"
        ></canvas>
        <div class="sl-heading">
          <strong class="sl-title" aria-label="Sailing Log">Sailing Log</strong
          ><span class="sl-subtitle" aria-label="Hi, this is L's site">Hi, this is L's site</span>
        </div>
        <div class="sl-about" aria-hidden="true">
          <div class="sl-about-copy">
            <div class="sl-about-line" aria-label="HELLO!">
              <span class="sl-about-text">HELLO!</span>
            </div>
            <div class="sl-about-line" aria-label="Welcome to my website,">
              <span class="sl-about-text">Welcome to my website,</span>
            </div>
            <div class="sl-about-line" aria-label="this is L.">
              <span class="sl-about-text">this is L.</span>
            </div>
            <div class="sl-about-line" aria-label="an undergraduate majoring in CS">
              <span class="sl-about-text">an undergraduate majoring in CS</span>
            </div>
            <div class="sl-about-line sl-location" aria-label="Location: SCU">
              <span class="sl-location-icon"><LocationPin /></span
              ><span class="sl-about-text">SCU</span>
            </div>
          </div>
        </div>
      </div>
    </section>
    <div v-show="debug" class="sl-controls">
      <label class="sl-sr-only" for="sailing-progress">Voyage progress</label
      ><input
        id="sailing-progress"
        type="range"
        min="0"
        max="1000"
        value="0"
        aria-label="Voyage progress"
      /><output for="sailing-progress">0%</output>
    </div>
  </main>
</template>
