<script setup lang="ts">
import { ref, computed } from 'vue'
import { cropImage } from '@/utils/image'

const props = defineProps<{ imageSrc: string }>()
const emit = defineEmits<{
  crop: [dataUrl: string]
  cancel: []
}>()

const containerRef = ref<HTMLDivElement>()
const imgRef = ref<HTMLImageElement>()

const displaySize = ref({ width: 0, height: 0 })
const naturalSize = ref({ width: 0, height: 0 })

const crop = ref({ x: 0, y: 0, w: 0, h: 0 })
const initialized = ref(false)

type DragMode = 'none' | 'create' | 'move' | 'tl' | 'tr' | 'bl' | 'br'
const dragMode = ref<DragMode>('none')
const dragStart = ref({ px: 0, py: 0, x: 0, y: 0, w: 0, h: 0 })

const HANDLE = 28

function onImgLoad() {
  const img = imgRef.value!
  naturalSize.value = { width: img.naturalWidth, height: img.naturalHeight }
  const rect = containerRef.value!.getBoundingClientRect()
  displaySize.value = { width: rect.width, height: rect.height }
  if (!initialized.value) {
    initCrop()
    initialized.value = true
  }
}

function initCrop() {
  const p = 0.08
  crop.value = {
    x: displaySize.value.width * p,
    y: displaySize.value.height * p,
    w: displaySize.value.width * (1 - 2 * p),
    h: displaySize.value.height * (1 - 2 * p),
  }
}

function getPointer(e: PointerEvent) {
  const rect = containerRef.value!.getBoundingClientRect()
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  }
}

function hitTest(p: { x: number; y: number }): DragMode {
  const { x, y, w, h } = crop.value
  if (w < 10 || h < 10) return 'create'

  const near = (a: number, b: number) => Math.abs(a - b) < HANDLE

  if (near(p.x, x) && near(p.y, y)) return 'tl'
  if (near(p.x, x + w) && near(p.y, y)) return 'tr'
  if (near(p.x, x) && near(p.y, y + h)) return 'bl'
  if (near(p.x, x + w) && near(p.y, y + h)) return 'br'
  if (p.x >= x && p.x <= x + w && p.y >= y && p.y <= y + h) return 'move'
  return 'create'
}

function onPointerDown(e: PointerEvent) {
  e.preventDefault()
  const p = getPointer(e)
  const mode = hitTest(p)
  dragMode.value = mode

  if (mode === 'create') {
    crop.value = { x: p.x, y: p.y, w: 0, h: 0 }
  }

  dragStart.value = {
    px: p.x,
    py: p.y,
    x: crop.value.x,
    y: crop.value.y,
    w: crop.value.w,
    h: crop.value.h,
  }

  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  if (dragMode.value === 'none') return
  e.preventDefault()
  const p = getPointer(e)
  const dx = p.x - dragStart.value.px
  const dy = p.y - dragStart.value.py
  const { x: sx, y: sy, w: sw, h: sh } = dragStart.value

  const maxW = displaySize.value.width
  const maxH = displaySize.value.height

  if (dragMode.value === 'create') {
    const nx = Math.min(dragStart.value.px, p.x)
    const ny = Math.min(dragStart.value.py, p.y)
    crop.value = {
      x: Math.max(0, nx),
      y: Math.max(0, ny),
      w: Math.min(Math.abs(dx), maxW - nx),
      h: Math.min(Math.abs(dy), maxH - ny),
    }
  } else if (dragMode.value === 'move') {
    crop.value.x = Math.max(0, Math.min(sx + dx, maxW - sw))
    crop.value.y = Math.max(0, Math.min(sy + dy, maxH - sh))
  } else if (dragMode.value === 'tl') {
    const nx = Math.max(0, Math.min(sx + dx, sx + sw - 50))
    const ny = Math.max(0, Math.min(sy + dy, sy + sh - 50))
    crop.value.x = nx
    crop.value.y = ny
    crop.value.w = sw + (sx - nx)
    crop.value.h = sh + (sy - ny)
  } else if (dragMode.value === 'tr') {
    const ny = Math.max(0, Math.min(sy + dy, sy + sh - 50))
    crop.value.y = ny
    crop.value.h = sh + (sy - ny)
    crop.value.w = Math.max(50, Math.min(sw + dx, maxW - sx))
  } else if (dragMode.value === 'bl') {
    const nx = Math.max(0, Math.min(sx + dx, sx + sw - 50))
    crop.value.x = nx
    crop.value.w = sw + (sx - nx)
    crop.value.h = Math.max(50, Math.min(sh + dy, maxH - sy))
  } else if (dragMode.value === 'br') {
    crop.value.w = Math.max(50, Math.min(sw + dx, maxW - sx))
    crop.value.h = Math.max(50, Math.min(sh + dy, maxH - sy))
  }
}

function onPointerUp() {
  dragMode.value = 'none'
}

async function confirmCrop() {
  if (crop.value.w < 20 || crop.value.h < 20) {
    emit('crop', props.imageSrc)
    return
  }

  const scaleX = naturalSize.value.width / displaySize.value.width
  const scaleY = naturalSize.value.height / displaySize.value.height

  const cropArea = {
    x: crop.value.x * scaleX,
    y: crop.value.y * scaleY,
    width: crop.value.w * scaleX,
    height: crop.value.h * scaleY,
  }

  const result = await cropImage(props.imageSrc, cropArea)
  emit('crop', result)
}

const cropStyle = computed(() => ({
  left: crop.value.x + 'px',
  top: crop.value.y + 'px',
  width: crop.value.w + 'px',
  height: crop.value.h + 'px',
}))

const hasCrop = computed(() => crop.value.w > 10 && crop.value.h > 10)
</script>

<template>
  <div class="cropper">
    <div
      ref="containerRef"
      class="crop-container"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <img
        ref="imgRef"
        :src="imageSrc"
        class="crop-img"
        @load="onImgLoad"
      />
      <div v-if="hasCrop" class="crop-box" :style="cropStyle">
        <div class="crop-grid">
          <div class="grid-line h1"></div>
          <div class="grid-line h2"></div>
          <div class="grid-line v1"></div>
          <div class="grid-line v2"></div>
        </div>
        <div class="handle handle-tl"></div>
        <div class="handle handle-tr"></div>
        <div class="handle handle-bl"></div>
        <div class="handle handle-br"></div>
      </div>
    </div>

    <div class="cropper-actions">
      <button class="btn-secondary" @click="emit('cancel')">取消</button>
      <button class="btn-secondary" @click="initCrop">重置</button>
      <button class="btn-primary" @click="confirmCrop">确认裁剪</button>
    </div>
  </div>
</template>

<style scoped>
.cropper {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.crop-container {
  position: relative;
  flex: 1;
  overflow: hidden;
  touch-action: none;
  background: #000;
}

.crop-img {
  width: 100%;
  height: auto;
  display: block;
}

.crop-box {
  position: absolute;
  border: 2px solid #fff;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
  cursor: move;
}

.crop-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.grid-line {
  position: absolute;
  background: rgba(255, 255, 255, 0.3);
}

.grid-line.h1 { top: 33.33%; left: 0; right: 0; height: 1px; }
.grid-line.h2 { top: 66.66%; left: 0; right: 0; height: 1px; }
.grid-line.v1 { top: 0; bottom: 0; left: 33.33%; width: 1px; }
.grid-line.v2 { top: 0; bottom: 0; left: 66.66%; width: 1px; }

.handle {
  position: absolute;
  width: 24px;
  height: 24px;
}

.handle::before {
  content: '';
  position: absolute;
  inset: 0;
  border: 3px solid #fff;
  background: #1e3a8a;
  border-radius: 2px;
}

.handle-tl { top: -12px; left: -12px; }
.handle-tl::before { border-right: none; border-bottom: none; }

.handle-tr { top: -12px; right: -12px; }
.handle-tr::before { border-left: none; border-bottom: none; }

.handle-bl { bottom: -12px; left: -12px; }
.handle-bl::before { border-right: none; border-top: none; }

.handle-br { bottom: -12px; right: -12px; }
.handle-br::before { border-left: none; border-top: none; }

.cropper-actions {
  display: flex;
  gap: 10px;
  padding: 16px;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
}

.cropper-actions button {
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}

.btn-secondary {
  background: #f3f4f6;
  color: #4b5563;
}

.btn-primary {
  flex: 2;
  background: #1e3a8a;
  color: #fff;
}
</style>
