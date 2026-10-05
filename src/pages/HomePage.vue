<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMistakeStore } from '@/stores/mistake'
import { getSubjectColor } from '@/lib/utils'
import MistakeCard from '@/components/MistakeCard.vue'
import {
  BookMarked,
  Clock,
  Plus,
  TrendingUp,
  Calendar,
  Search,
  X,
  Pencil,
} from 'lucide-vue-next'
import { PullRefresh, showToast } from 'vant'

const router = useRouter()
const mistakeStore = useMistakeStore()
const activeSubject = ref('all')
const refreshing = ref(false)
const longPressTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const showSearch = ref(false)
const searchKeyword = ref('')

// 搜索结果
const searchResults = computed(() => {
  if (!searchKeyword.value.trim()) return []
  const kw = searchKeyword.value.toLowerCase().trim()
  return mistakeStore.mistakes.filter(m =>
    m.question.toLowerCase().includes(kw) ||
    m.answer.toLowerCase().includes(kw) ||
    m.analysis.toLowerCase().includes(kw) ||
    m.tags.some(t => t.toLowerCase().includes(kw))
  )
})

// 显示的列表：搜索时显示搜索结果，否则显示学科筛选结果
const displayList = computed(() => {
  if (showSearch.value && searchKeyword.value.trim()) {
    return searchResults.value
  }
  return mistakeStore.filteredMistakes
})

// 从已有错题中动态提取学科列表
const allSubjects = computed(() => {
  const subjectSet = new Set<string>()
  mistakeStore.mistakes.forEach(m => {
    if (m.subject) subjectSet.add(m.subject)
  })
  const subjects = Array.from(subjectSet).map(name => ({
    id: name,
    name,
    color: getSubjectColor(name),
  }))
  return [
    { id: 'all', name: '全部', color: '#1e3a8a' },
    ...subjects,
  ]
})

function handleSubjectClick(subjectId: string) {
  if (longPressTriggered.value) {
    longPressTriggered.value = false
    return
  }
  activeSubject.value = subjectId
  mistakeStore.loadBySubject(subjectId)
}

const longPressTriggered = ref(false)

async function renameSubject(subjectId: string) {
  if (subjectId === 'all') return
  const oldName = subjectId
  const newName = window.prompt(`将"${oldName}"改为：`, oldName)
  if (!newName || newName.trim() === oldName || !newName.trim()) return

  const mistakes = mistakeStore.mistakes.filter(m => m.subject === oldName)
  for (const m of mistakes) {
    if (m.id) {
      await mistakeStore.updateMistake(m.id, { subject: newName.trim() })
    }
  }
  await mistakeStore.loadAll()
  activeSubject.value = 'all'
  showToast('学科名称已修改')
}

function startLongPress(subjectId: string) {
  longPressTimer.value = setTimeout(() => {
    longPressTriggered.value = true
    renameSubject(subjectId)
  }, 600)
}

function clearLongPress() {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
}

function goCapture() {
  router.push('/capture')
}

function goDetail(id: number | undefined) {
  if (id) {
    router.push(`/detail/${id}`)
  }
}

function goSearch() {
  showSearch.value = !showSearch.value
  if (!showSearch.value) {
    searchKeyword.value = ''
  }
}

function closeSearch() {
  showSearch.value = false
  searchKeyword.value = ''
}

async function onRefresh() {
  refreshing.value = true
  await mistakeStore.loadAll()
  activeSubject.value = 'all'
  refreshing.value = false
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 12) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

function getTodayDate() {
  const today = new Date()
  const month = today.getMonth() + 1
  const day = today.getDate()
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${month}月${day}日 ${weekdays[today.getDay()]}`
}
</script>

<template>
  <div class="home-page">
    <div class="header bg-gradient-to-br from-primary-600 to-primary-800 text-white px-5 pt-4 pb-20 rounded-b-[32px]">
      <!-- 搜索栏 -->
      <div v-if="showSearch" class="mb-4">
        <div class="flex items-center gap-2 bg-white/15 backdrop-blur rounded-xl px-3 py-2">
          <Search :size="18" class="text-white/70 flex-shrink-0" />
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜索题目、答案、解析..."
            class="flex-1 bg-transparent outline-none text-white placeholder-white/50 text-sm"
            autofocus
          />
          <button
            v-if="searchKeyword"
            class="text-white/70"
            @click="searchKeyword = ''"
          >
            <X :size="16" />
          </button>
          <button class="text-white/70 ml-1" @click="closeSearch">
            <X :size="20" />
          </button>
        </div>
      </div>

      <div v-else class="flex items-center justify-between mb-4">
        <div>
          <p class="text-white/80 text-sm">{{ getGreeting() }}</p>
          <p class="text-xl font-bold mt-1">智能错题本</p>
        </div>
        <div class="flex items-center gap-3">
          <button
            class="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center backdrop-blur"
            @click="goSearch"
          >
            <Search :size="20" />
          </button>
        </div>
      </div>

      <div class="flex items-center gap-2 text-white/70 text-sm mb-6">
        <Calendar :size="16" />
        <span>{{ getTodayDate() }}</span>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div class="bg-white/15 backdrop-blur rounded-2xl p-4">
          <div class="flex items-center gap-2 mb-2">
            <BookMarked :size="20" />
            <span class="text-sm text-white/80">错题总数</span>
          </div>
          <p class="text-3xl font-bold">{{ mistakeStore.stats.total }}</p>
        </div>
        <div class="bg-white/15 backdrop-blur rounded-2xl p-4">
          <div class="flex items-center gap-2 mb-2">
            <Clock :size="20" />
            <span class="text-sm text-white/80">待复习</span>
          </div>
          <p class="text-3xl font-bold">{{ mistakeStore.stats.toReview }}</p>
        </div>
        <div class="bg-white/15 backdrop-blur rounded-2xl p-4">
          <div class="flex items-center gap-2 mb-2">
            <Plus :size="20" />
            <span class="text-sm text-white/80">今日新增</span>
          </div>
          <p class="text-3xl font-bold">{{ mistakeStore.stats.todayNew }}</p>
        </div>
        <div class="bg-white/15 backdrop-blur rounded-2xl p-4">
          <div class="flex items-center gap-2 mb-2">
            <TrendingUp :size="20" />
            <span class="text-sm text-white/80">掌握率</span>
          </div>
          <p class="text-3xl font-bold">{{ mistakeStore.stats.masteryRate }}%</p>
        </div>
      </div>
    </div>

    <div class="px-4 -mt-12 relative z-10">
      <!-- 刷题入口 -->
      <button
        v-if="!showSearch"
        class="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl p-4 mb-4 flex items-center justify-between active:scale-[0.98] transition-transform"
        @click="router.push('/quiz')"
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Pencil :size="20" />
          </div>
          <div class="text-left">
            <p class="font-bold text-sm">刷题练习</p>
            <p class="text-xs text-white/80">从错题中随机抽题，自我检测</p>
          </div>
        </div>
        <Plus :size="20" class="text-white/80" />
      </button>

      <!-- 搜索结果计数 -->
      <div v-if="showSearch && searchKeyword.trim()" class="mb-3 text-sm text-gray-500">
        找到 {{ searchResults.length }} 条相关错题
      </div>

      <!-- 学科分类（搜索时隐藏） -->
      <div v-if="!showSearch" class="bg-white rounded-2xl card-shadow p-4 mb-4">
        <div class="flex items-center justify-between mb-3">
          <p class="text-sm font-medium text-gray-700">学科分类</p>
          <span class="text-xs text-gray-400">长按可改名</span>
        </div>
        <div class="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <button
            v-for="subject in allSubjects"
            :key="subject.id"
            class="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all"
            :class="activeSubject === subject.id
              ? 'text-white'
              : 'bg-gray-100 text-gray-600'"
            :style="activeSubject === subject.id ? { backgroundColor: subject.color } : {}"
            @click="handleSubjectClick(subject.id)"
            @touchstart="subject.id !== 'all' && startLongPress(subject.id)"
            @touchend="clearLongPress"
            @contextmenu.prevent="renameSubject(subject.id)"
          >
            {{ subject.name }}
          </button>
        </div>
      </div>

      <PullRefresh v-model="refreshing" @refresh="onRefresh">
        <div class="mistake-list space-y-3 pb-4">
          <template v-if="displayList.length > 0">
            <MistakeCard
              v-for="mistake in displayList"
              :key="mistake.id"
              :mistake="mistake"
              @click="goDetail(mistake.id)"
            />
          </template>
          <div
            v-else-if="!mistakeStore.loading"
            class="text-center py-16"
          >
            <div class="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Search :size="36" class="text-gray-300" v-if="showSearch" />
              <BookMarked :size="36" class="text-gray-300" v-else />
            </div>
            <p class="text-gray-400 text-sm">
              {{ showSearch ? '没有找到相关错题' : '还没有错题，点击下方按钮添加吧' }}
            </p>
          </div>
        </div>
      </PullRefresh>
    </div>

    <button
      class="fixed right-5 bottom-[80px] w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-lg flex items-center justify-center z-40 active:scale-95 transition-transform"
      @click="goCapture"
    >
      <div class="absolute inset-0 rounded-full bg-primary-500 pulse-ring"></div>
      <Plus :size="28" stroke-width="2.5" class="relative z-10" />
    </button>
  </div>
</template>
