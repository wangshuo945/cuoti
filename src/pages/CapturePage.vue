<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMistakeStore } from '@/stores/mistake'
import { recognizeText } from '@/services/ocr'
import { generateAnswer } from '@/services/ai'
import { compressImage } from '@/utils/image'
import ImageCropper from '@/components/ImageCropper.vue'
import { SUBJECTS } from '@/types'
import { NavBar, Button, Loading, showToast } from 'vant'
import {
  Camera,
  Image,
  RotateCw,
  Check,
  X,
  Pencil,
} from 'lucide-vue-next'

const router = useRouter()
const mistakeStore = useMistakeStore()

const step = ref<'upload' | 'crop' | 'ocr' | 'ai' | 'confirm'>('upload')
const imageData = ref('')
const questionText = ref('')
const answerText = ref('')
const analysisText = ref('')
const subjectText = ref('')
const loadingOcr = ref(false)
const loadingAi = ref(false)
const editingSubject = ref(false)
const customSubject = ref('')

const fileInputRef = ref<HTMLInputElement | null>(null)
const cameraInputRef = ref<HTMLInputElement | null>(null)

function selectSubject(name: string) {
  subjectText.value = name
  editingSubject.value = false
}

function toggleEditSubject() {
  customSubject.value = subjectText.value
  editingSubject.value = true
}

function confirmCustomSubject() {
  if (customSubject.value.trim()) {
    subjectText.value = customSubject.value.trim()
  }
  editingSubject.value = false
}

function openCamera() {
  cameraInputRef.value?.click()
}

function openAlbum() {
  fileInputRef.value?.click()
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  try {
    const compressed = await compressImage(file, 1080, 0.8)
    imageData.value = compressed
    step.value = 'crop'
  } catch {
    showToast({ message: '图片处理失败', type: 'fail' })
  }

  input.value = ''
}

function onCrop(dataUrl: string) {
  imageData.value = dataUrl
  step.value = 'ocr'
  startOCR()
}

function onCropCancel() {
  step.value = 'upload'
  imageData.value = ''
}

async function startOCR() {
  loadingOcr.value = true
  try {
    const text = await recognizeText(imageData.value)
    questionText.value = text
    step.value = 'ai'
    loadingOcr.value = false
    await startAI()
  } catch (error: any) {
    loadingOcr.value = false
    showToast({ message: error.message || '识别失败', type: 'fail' })
  }
}

async function startAI() {
  if (!questionText.value.trim()) {
    showToast({ message: '请先输入题目内容', type: 'fail' })
    return
  }
  
  loadingAi.value = true
  try {
    const result = await generateAnswer(questionText.value)
    answerText.value = result.answer
    analysisText.value = result.analysis
    step.value = 'confirm'
  } catch (error: any) {
    showToast({ message: error.message || 'AI解析失败', type: 'fail' })
  } finally {
    loadingAi.value = false
  }
}

function goBack() {
  if (step.value === 'confirm') {
    step.value = 'ai'
  } else if (step.value === 'ai') {
    step.value = 'ocr'
  } else if (step.value === 'ocr') {
    step.value = 'crop'
  } else if (step.value === 'crop') {
    step.value = 'upload'
    imageData.value = ''
  } else {
    router.back()
  }
}

async function saveMistake() {
  if (!questionText.value.trim()) {
    showToast({ message: '题目内容不能为空', type: 'fail' })
    return
  }
  if (!subjectText.value.trim()) {
    showToast({ message: '请填写学科', type: 'fail' })
    return
  }

  try {
    await mistakeStore.addMistake({
      question: questionText.value,
      answer: answerText.value,
      analysis: analysisText.value,
      subject: subjectText.value.trim(),
      tags: [],
      imageData: imageData.value,
      masteryLevel: 0,
      reviewCount: 0,
      nextReviewDate: new Date().toISOString(),
      lastReviewDate: '',
    })
    showToast({ message: '保存成功', type: 'success' })
    setTimeout(() => {
      router.push('/')
    }, 800)
  } catch {
    showToast({ message: '保存失败', type: 'fail' })
  }
}
</script>

<template>
  <div class="capture-page min-h-screen bg-bg-page">
    <NavBar
      v-if="step !== 'crop'"
      :title="step === 'upload' ? '录入错题' : step === 'ocr' ? '文字识别' : step === 'ai' ? 'AI解析' : '确认保存'"
      left-text="返回"
      left-arrow
      @click-left="goBack"
    />

    <!-- 裁剪步骤：全屏组件 -->
    <div v-if="step === 'crop'" class="crop-screen">
      <ImageCropper
        :image-src="imageData"
        @crop="onCrop"
        @cancel="onCropCancel"
      />
    </div>

    <div v-else class="p-4">
      <div v-if="step === 'upload'" class="fade-in-up">
        <div class="text-center mb-6 mt-8">
          <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center">
            <Camera :size="36" class="text-primary-600" />
          </div>
          <h2 class="text-xl font-bold text-gray-800 mb-2">拍照录入错题</h2>
          <p class="text-sm text-gray-500">对准题目拍照，AI 自动识别并生成解析</p>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-6">
          <button
            class="bg-white rounded-2xl card-shadow p-6 flex flex-col items-center gap-3 active:scale-95 transition-transform"
            @click="openCamera"
          >
            <div class="w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white">
              <Camera :size="28" />
            </div>
            <span class="font-medium text-gray-700">拍照</span>
          </button>
          <button
            class="bg-white rounded-2xl card-shadow p-6 flex flex-col items-center gap-3 active:scale-95 transition-transform"
            @click="openAlbum"
          >
            <div class="w-14 h-14 rounded-full bg-gradient-to-br from-success to-emerald-600 flex items-center justify-center text-white">
              <Image :size="28" />
            </div>
            <span class="font-medium text-gray-700">相册选择</span>
          </button>
        </div>

        <div class="bg-white rounded-2xl card-shadow p-4">
          <p class="text-sm font-medium text-gray-700 mb-3">拍照小贴士</p>
          <ul class="space-y-2 text-sm text-gray-500">
            <li class="flex items-start gap-2">
              <Check :size="16" class="text-success mt-0.5 flex-shrink-0" />
              <span>保持光线充足，题目清晰可见</span>
            </li>
            <li class="flex items-start gap-2">
              <Check :size="16" class="text-success mt-0.5 flex-shrink-0" />
              <span>尽量对准一道题，避免过多干扰</span>
            </li>
            <li class="flex items-start gap-2">
              <Check :size="16" class="text-success mt-0.5 flex-shrink-0" />
              <span>支持手写和印刷体题目识别</span>
            </li>
          </ul>
        </div>
      </div>

      <div v-else-if="step === 'ocr'" class="fade-in-up">
        <div class="bg-white rounded-2xl card-shadow overflow-hidden mb-4">
          <img :src="imageData" alt="题目图片" class="w-full" />
        </div>

        <div class="text-center py-8">
          <Loading size="32px" color="#1e3a8a" />
          <p class="text-gray-600 mt-4">正在识别题目文字...</p>
        </div>
      </div>

      <div v-else-if="step === 'ai'" class="fade-in-up">
        <div class="bg-white rounded-2xl card-shadow p-4 mb-4">
          <div class="flex items-center justify-between mb-3">
            <p class="text-sm font-medium text-gray-700">题目内容</p>
            <span class="text-xs text-primary-600">可编辑</span>
          </div>
          <textarea
            v-model="questionText"
            class="w-full min-h-[120px] p-3 bg-gray-50 rounded-xl text-sm text-gray-700 resize-none outline-none border border-transparent focus:border-primary-300"
            placeholder="题目内容"
          />
        </div>

        <div class="text-center py-8">
          <Loading size="32px" color="#1e3a8a" />
          <p class="text-gray-600 mt-4">AI 正在生成答案和解析...</p>
        </div>

        <Button
          type="primary"
          block
          round
          size="large"
          :disabled="!questionText.trim()"
          @click="startAI"
        >
          重新生成
        </Button>
      </div>

      <div v-else-if="step === 'confirm'" class="fade-in-up pb-36">
        <div class="bg-white rounded-2xl card-shadow p-4 mb-4">
          <p class="text-sm font-medium text-gray-700 mb-2">题目</p>
          <textarea
            v-model="questionText"
            class="w-full min-h-[80px] p-3 bg-gray-50 rounded-xl text-sm text-gray-700 resize-none outline-none border border-transparent focus:border-primary-300"
          />
        </div>

        <div class="bg-white rounded-2xl card-shadow p-4 mb-4">
          <p class="text-sm font-medium text-gray-700 mb-2">参考答案</p>
          <textarea
            v-model="answerText"
            class="w-full min-h-[60px] p-3 bg-success/5 rounded-xl text-sm text-gray-700 resize-none outline-none border border-transparent focus:border-success"
          />
        </div>

        <div class="bg-white rounded-2xl card-shadow p-4 mb-4">
          <p class="text-sm font-medium text-gray-700 mb-2">详细解析</p>
          <textarea
            v-model="analysisText"
            class="w-full min-h-[120px] p-3 bg-primary-50/50 rounded-xl text-sm text-gray-700 resize-none outline-none border border-transparent focus:border-primary-300"
          />
        </div>

        <div class="bg-white rounded-2xl card-shadow p-4 mb-4">
          <div class="flex items-center justify-between mb-3">
            <p class="text-sm font-medium text-gray-700">学科</p>
            <button
              v-if="!editingSubject"
              class="text-xs text-primary-600 flex items-center gap-1"
              @click="toggleEditSubject"
            >
              <Pencil :size="12" />自定义
            </button>
          </div>

          <!-- 预设分类按钮 -->
          <div v-if="!editingSubject" class="flex flex-wrap gap-2">
            <button
              v-for="s in SUBJECTS"
              :key="s.id"
              class="px-4 py-2 rounded-full text-sm font-medium transition-all"
              :class="subjectText === s.name
                ? 'text-white'
                : 'bg-gray-100 text-gray-600'"
              :style="subjectText === s.name ? { backgroundColor: s.color } : {}"
              @click="selectSubject(s.name)"
            >
              {{ s.name }}
            </button>
          </div>

          <!-- 自定义输入 -->
          <div v-else class="flex gap-2">
            <input
              v-model="customSubject"
              type="text"
              placeholder="输入自定义学科名称"
              class="flex-1 p-3 bg-gray-50 rounded-xl text-sm text-gray-700 outline-none border border-transparent focus:border-primary-300"
              maxlength="20"
              autofocus
            />
            <button
              class="px-4 py-3 rounded-xl bg-primary-600 text-white text-sm font-medium"
              @click="confirmCustomSubject"
            >
              确定
            </button>
          </div>

          <!-- 当前选中提示 -->
          <p v-if="!editingSubject && subjectText" class="text-xs text-gray-400 mt-2">
            已选：{{ subjectText }}
          </p>
        </div>
      </div>
    </div>

    <div v-if="step === 'confirm'" class="fixed bottom-[50px] left-0 right-0 p-4 bg-white border-t border-gray-100 safe-bottom z-[60]">
      <Button type="primary" block round size="large" @click="saveMistake">
        保存到错题本
      </Button>
    </div>

    <input
      ref="cameraInputRef"
      type="file"
      accept="image/*"
      capture="environment"
      class="hidden"
      @change="handleFileChange"
    />
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleFileChange"
    />
  </div>
</template>

<style scoped>
.crop-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  background: #000;
  display: flex;
  flex-direction: column;
}
</style>
