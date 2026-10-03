<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMistakeStore } from '@/stores/mistake'
import { getSubjectColor } from '@/lib/utils'
import { showToast } from 'vant'
import {
  RotateCcw,
  Check,
  X,
  BookOpen,
  Trophy,
  Target,
} from 'lucide-vue-next'

const router = useRouter()
const mistakeStore = useMistakeStore()

const currentIndex = ref(0)
const showAnswer = ref(false)
const isFlipped = ref(false)
const completedCount = ref(0)
const masteredCount = ref(0)

const reviewList = computed(() => mistakeStore.todayReviewList)
const totalCount = computed(() => reviewList.value.length)

const currentMistake = computed(() => {
  if (currentIndex.value < reviewList.value.length) {
    return reviewList.value[currentIndex.value]
  }
  return null
})

const progress = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((completedCount.value / totalCount.value) * 100)
})

function flipCard() {
  isFlipped.value = !isFlipped.value
  showAnswer.value = !showAnswer.value
}

async function handleMastered() {
  if (!currentMistake.value?.id) return
  
  await mistakeStore.markMastered(currentMistake.value.id)
  masteredCount.value++
  completedCount.value++
  
  if (currentIndex.value < reviewList.value.length - 1) {
    isFlipped.value = false
    showAnswer.value = false
    currentIndex.value++
  } else {
    showToast({ message: '复习完成！', type: 'success' })
  }
}

async function handleNotMastered() {
  if (!currentMistake.value?.id) return
  
  await mistakeStore.markNotMastered(currentMistake.value.id)
  completedCount.value++
  
  if (currentIndex.value < reviewList.value.length - 1) {
    isFlipped.value = false
    showAnswer.value = false
    currentIndex.value++
  } else {
    showToast({ message: '复习完成！', type: 'success' })
  }
}

function goDetail() {
  if (currentMistake.value?.id) {
    router.push(`/detail/${currentMistake.value.id}`)
  }
}
</script>

<template>
  <div class="review-page min-h-screen bg-bg-page">
    <div class="bg-gradient-to-br from-primary-600 to-primary-800 text-white px-5 pt-4 pb-8">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-xl font-bold">复习模式</h1>
        <span class="text-white/80 text-sm">{{ completedCount }}/{{ totalCount }}</span>
      </div>
      
      <div class="bg-white/15 backdrop-blur rounded-xl p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-white/80">今日复习进度</span>
          <span class="text-sm font-medium">{{ progress }}%</span>
        </div>
        <div class="h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            class="h-full bg-white transition-all duration-500"
            :style="{ width: progress + '%' }"
          ></div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 mt-4">
        <div class="flex items-center gap-2">
          <div class="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
            <Target :size="20" />
          </div>
          <div>
            <p class="text-lg font-bold">{{ totalCount }}</p>
            <p class="text-xs text-white/70">待复习</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
            <Trophy :size="20" />
          </div>
          <div>
            <p class="text-lg font-bold">{{ masteredCount }}</p>
            <p class="text-xs text-white/70">已掌握</p>
          </div>
        </div>
      </div>
    </div>

    <div class="px-4 -mt-4 relative z-10">
      <div v-if="totalCount === 0" class="text-center py-20">
        <div class="w-24 h-24 mx-auto mb-6 bg-success/10 rounded-full flex items-center justify-center">
          <Trophy :size="48" class="text-success" />
        </div>
        <h3 class="text-xl font-bold text-gray-800 mb-2">太棒了！</h3>
        <p class="text-gray-500">今日没有需要复习的题目</p>
        <button
          class="mt-6 px-6 py-2.5 bg-primary-600 text-white rounded-full text-sm font-medium"
          @click="router.push('/')"
        >
          返回首页
        </button>
      </div>

      <div v-else-if="currentIndex >= totalCount" class="text-center py-20">
        <div class="w-24 h-24 mx-auto mb-6 bg-success/10 rounded-full flex items-center justify-center">
          <Check :size="48" class="text-success" />
        </div>
        <h3 class="text-xl font-bold text-gray-800 mb-2">复习完成！</h3>
        <p class="text-gray-500 mb-2">今日复习已全部完成</p>
        <p class="text-sm text-success">掌握 {{ masteredCount }} 道</p>
        <button
          class="mt-6 px-6 py-2.5 bg-primary-600 text-white rounded-full text-sm font-medium"
          @click="router.push('/')"
        >
          返回首页
        </button>
      </div>

      <div v-else class="perspective-1000">
        <div
          class="relative w-full h-[400px] transition-transform duration-500 transform-style-3d cursor-pointer"
          :class="{ 'rotate-y-180': isFlipped }"
          @click="flipCard"
        >
          <div class="absolute inset-0 backface-hidden">
            <div class="bg-white rounded-2xl card-shadow p-5 h-full flex flex-col">
              <div class="flex items-center justify-between mb-4">
                <span
                  class="px-3 py-1 rounded-full text-xs font-medium"
                  :style="{
                    color: getSubjectColor(currentMistake.subject),
                    backgroundColor: getSubjectColor(currentMistake.subject) + '15',
                  }"
                >
                  {{ currentMistake.subject }}
                </span>
                <span class="text-xs text-gray-400">第 {{ currentIndex + 1 }}/{{ totalCount }} 题</span>
              </div>
              
              <div class="flex-1 overflow-auto">
                <p class="text-xs text-gray-400 mb-2">题目</p>
                <p class="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {{ currentMistake.question }}
                </p>
              </div>

              <div class="pt-4 text-center">
                <p class="text-sm text-primary-600">点击卡片查看答案</p>
              </div>
            </div>
          </div>

          <div class="absolute inset-0 backface-hidden rotate-y-180">
            <div class="bg-white rounded-2xl card-shadow p-5 h-full flex flex-col">
              <div class="flex items-center justify-between mb-3">
                <span class="text-sm font-medium text-success flex items-center gap-1">
                  <Check :size="16" />
                  参考答案
                </span>
                <button
                  class="text-xs text-primary-600"
                  @click.stop="goDetail"
                >
                  查看详情
                </button>
              </div>
              
              <div class="flex-1 overflow-auto">
                <p class="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-4">
                  {{ currentMistake.answer || '暂无答案' }}
                </p>
                <div v-if="currentMistake.analysis" class="border-t border-gray-100 pt-4">
                  <p class="text-xs text-primary-600 font-medium mb-2">解析</p>
                  <p class="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {{ currentMistake.analysis }}
                  </p>
                </div>
              </div>

              <div class="pt-4 text-center">
                <p class="text-sm text-gray-400">点击卡片返回题目</p>
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-4 mt-6">
          <button
            class="flex-1 py-3.5 bg-white border-2 border-danger text-danger rounded-xl font-medium flex items-center justify-center gap-2 active:bg-danger/5 transition-colors"
            @click="handleNotMastered"
          >
            <X :size="20" />
            还不会
          </button>
          <button
            class="flex-1 py-3.5 bg-success text-white rounded-xl font-medium flex items-center justify-center gap-2 active:bg-green-600 transition-colors"
            @click="handleMastered"
          >
            <Check :size="20" />
            已掌握
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.perspective-1000 {
  perspective: 1000px;
}

.transform-style-3d {
  transform-style: preserve-3d;
}

.backface-hidden {
  backface-visibility: hidden;
}

.rotate-y-180 {
  transform: rotateY(180deg);
}
</style>
