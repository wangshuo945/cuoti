<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMistakeStore } from '@/stores/mistake'
import { getSubjectColor } from '@/lib/utils'
import { NavBar, Button, showConfirmDialog, showToast, showImagePreview } from 'vant'
import {
  CheckCircle,
  Edit3,
  Trash2,
  Calendar,
  Tag,
  RotateCcw,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const mistakeStore = useMistakeStore()

const mistakeId = computed(() => Number(route.params.id))
const mistake = computed(() => mistakeStore.getById(mistakeId.value))

const showAnswer = ref(false)

// 触摸滑动相关
const touchStartX = ref(0)
const touchStartY = ref(0)

function onTouchStart(e: TouchEvent) {
  touchStartX.value = e.touches[0].clientX
  touchStartY.value = e.touches[0].clientY
}

function onTouchEnd(e: TouchEvent) {
  const dx = e.changedTouches[0].clientX - touchStartX.value
  const dy = e.changedTouches[0].clientY - touchStartY.value
  // 水平滑动距离大于50px，且垂直滑动小于30px才触发
  if (Math.abs(dx) > 50 && Math.abs(dy) < 30) {
    if (dx > 0) {
      goPrev()
    } else {
      goNext()
    }
  }
}

// 当前题目在列表中的索引
const currentIndex = computed(() => {
  return mistakeStore.mistakes.findIndex(m => m.id === mistakeId.value)
})

const totalCount = computed(() => mistakeStore.mistakes.length)
const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value < totalCount.value - 1)

function goPrev() {
  if (!hasPrev.value) return
  const prev = mistakeStore.mistakes[currentIndex.value - 1]
  showAnswer.value = false
  router.replace(`/detail/${prev.id}`)
}

function goNext() {
  if (!hasNext.value) return
  const next = mistakeStore.mistakes[currentIndex.value + 1]
  showAnswer.value = false
  router.replace(`/detail/${next.id}`)
}

// 确保列表已加载
onMounted(async () => {
  if (mistakeStore.mistakes.length === 0) {
    await mistakeStore.loadAll()
  }
})

// 监听路由变化，重置答案显示状态
watch(() => route.params.id, () => {
  showAnswer.value = false
})

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
}

function handlePreview() {
  if (mistake.value?.imageData) {
    showImagePreview([mistake.value.imageData])
  }
}

async function handleMastered() {
  if (!mistakeId.value) return
  await mistakeStore.markMastered(mistakeId.value)
  showToast({ message: '已标记为掌握', type: 'success' })
}

async function handleDelete() {
  showConfirmDialog({
    title: '确认删除',
    message: '删除后无法恢复，确定要删除这道错题吗？',
    confirmButtonColor: '#ef4444',
  })
    .then(async () => {
      await mistakeStore.removeMistake(mistakeId.value)
      showToast({ message: '删除成功', type: 'success' })
      setTimeout(() => router.back(), 500)
    })
    .catch(() => {})
}

function getMasteryProgress(level: number) {
  return Math.min((level / 5) * 100, 100)
}

function getMasteryText(level: number) {
  if (level >= 5) return '已完全掌握'
  if (level >= 3) return '较为熟悉'
  if (level >= 1) return '学习中'
  return '刚开始学习'
}
</script>

<template>
  <div class="detail-page min-h-screen bg-bg-page pb-24">
    <NavBar title="错题详情" left-text="返回" left-arrow @click-left="router.back()" />

    <!-- 上一题/下一题导航栏 -->
    <div v-if="totalCount > 0" class="sticky top-0 z-10 bg-white border-b border-gray-100 flex items-center justify-between px-2 py-2">
      <button
        class="flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors"
        :class="hasPrev ? 'text-primary-600 active:bg-primary-50' : 'text-gray-300'"
        :disabled="!hasPrev"
        @click="goPrev"
      >
        <ChevronLeft :size="18" />
        <span>上一题</span>
      </button>
      <span class="text-xs text-gray-500">
        {{ currentIndex + 1 }} / {{ totalCount }}
      </span>
      <button
        class="flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors"
        :class="hasNext ? 'text-primary-600 active:bg-primary-50' : 'text-gray-300'"
        :disabled="!hasNext"
        @click="goNext"
      >
        <span>下一题</span>
        <ChevronRight :size="18" />
      </button>
    </div>

    <div
      v-if="mistake"
      class="p-4 fade-in-up"
      @touchstart="onTouchStart"
      @touchend="onTouchEnd"
    >
      <div
        v-if="mistake.imageData"
        class="bg-white rounded-2xl card-shadow overflow-hidden mb-4 cursor-pointer"
        @click="handlePreview"
      >
        <img :src="mistake.imageData" alt="原题图片" class="w-full max-h-64 object-contain bg-gray-50" />
        <div class="py-2 text-center text-xs text-gray-400">点击查看大图</div>
      </div>

      <div class="bg-white rounded-2xl card-shadow p-4 mb-4">
        <div class="flex items-center gap-2 mb-3">
          <span
            class="px-2.5 py-1 rounded-full text-xs font-medium"
            :style="{
              color: getSubjectColor(mistake.subject),
              backgroundColor: getSubjectColor(mistake.subject) + '15',
            }"
          >
            {{ mistake.subject }}
          </span>
          <span
            v-if="mistake.tags && mistake.tags.length > 0"
            v-for="tag in mistake.tags"
            :key="tag"
            class="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
          >
            {{ tag }}
          </span>
        </div>

        <div class="flex items-start gap-2 mb-4">
          <BookOpen :size="18" class="text-primary-600 mt-0.5 flex-shrink-0" />
          <div class="text-gray-800 leading-relaxed whitespace-pre-wrap">
            {{ mistake.question }}
          </div>
        </div>

        <div class="flex items-center gap-4 text-xs text-gray-400 pt-3 border-t border-gray-100">
          <span class="flex items-center gap-1">
            <Calendar :size="14" />
            {{ formatDate(mistake.createdAt) }}
          </span>
          <span class="flex items-center gap-1">
            <RotateCcw :size="14" />
            复习 {{ mistake.reviewCount }} 次
          </span>
        </div>
      </div>

      <div class="bg-white rounded-2xl card-shadow p-4 mb-4">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-medium text-gray-700">掌握程度</span>
          <span class="text-xs text-gray-500">{{ getMasteryText(mistake.masteryLevel) }}</span>
        </div>
        <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-primary-500 to-success transition-all duration-500"
            :style="{ width: getMasteryProgress(mistake.masteryLevel) + '%' }"
          ></div>
        </div>
        <div class="flex justify-between mt-2 text-xs text-gray-400">
          <span>Lv.{{ mistake.masteryLevel }}</span>
          <span>Lv.5 已掌握</span>
        </div>
        <div class="mt-3 text-xs text-gray-500">
          下次复习：{{ mistake.masteryLevel >= 5 ? '已掌握，无需复习' : formatDate(mistake.nextReviewDate) }}
        </div>
      </div>

      <div class="bg-white rounded-2xl card-shadow overflow-hidden mb-4">
        <button
          class="w-full p-4 flex items-center justify-between"
          @click="showAnswer = !showAnswer"
        >
          <span class="text-sm font-medium text-gray-700 flex items-center gap-2">
            <CheckCircle :size="18" class="text-success" />
            答案与解析
          </span>
          <span
            class="text-xs text-primary-600 transition-transform"
            :class="{ 'rotate-180': showAnswer }"
          >
            ▼
          </span>
        </button>

        <div v-show="showAnswer" class="px-4 pb-4 border-t border-gray-100 pt-4">
          <div class="mb-4">
            <p class="text-xs text-success font-medium mb-2">参考答案</p>
            <p class="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {{ mistake.answer || '暂无答案' }}
            </p>
          </div>
          <div>
            <p class="text-xs text-primary-600 font-medium mb-2">详细解析</p>
            <p class="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {{ mistake.analysis || '暂无解析' }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 safe-bottom flex gap-3">
      <Button
        v-if="mistake && mistake.masteryLevel < 5"
        type="success"
        block
        round
        @click="handleMastered"
        icon="success"
      >
        标记掌握
      </Button>
      <Button
        v-else
        type="warning"
        block
        round
        @click="showAnswer = !showAnswer"
      >
        {{ showAnswer ? '隐藏答案' : '查看答案' }}
      </Button>
      <Button
        type="danger"
        round
        icon="delete"
        @click="handleDelete"
      >
        删除
      </Button>
    </div>
  </div>
</template>
