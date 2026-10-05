<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMistakeStore } from '@/stores/mistake'
import type { Mistake } from '@/types'
import { NavBar, Button, showToast } from 'vant'
import { Check, X, Trophy, RotateCw, ChevronRight } from 'lucide-vue-next'

const router = useRouter()
const mistakeStore = useMistakeStore()

const quizList = ref<Mistake[]>([])
const currentIndex = ref(0)
const userAnswer = ref('')
const showResult = ref(false)
const score = ref(0)
const results = ref<{ question: string; correct: boolean }[]>([])
const finished = ref(false)

const currentQuestion = computed(() => quizList.value[currentIndex.value])
const totalQuestions = computed(() => quizList.value.length)
const progress = computed(() => {
  if (totalQuestions.value === 0) return 0
  return Math.round(((currentIndex.value) / totalQuestions.value) * 100)
})

onMounted(async () => {
  await mistakeStore.loadAll()
  startQuiz()
})

function startQuiz() {
  const all = [...mistakeStore.mistakes]
  if (all.length === 0) {
    showToast('请先录入错题')
    setTimeout(() => router.push('/capture'), 1000)
    return
  }
  // 打乱顺序，最多取10题
  quizList.value = all.sort(() => Math.random() - 0.5).slice(0, 10)
  currentIndex.value = 0
  userAnswer.value = ''
  showResult.value = false
  score.value = 0
  results.value = []
  finished.value = false
}

function submitAnswer() {
  if (!userAnswer.value.trim()) {
    showToast('请输入你的答案')
    return
  }
  showResult.value = true
}

function markCorrect() {
  score.value++
  results.value.push({ question: currentQuestion.value.question, correct: true })
  nextQuestion()
}

function markWrong() {
  results.value.push({ question: currentQuestion.value.question, correct: false })
  nextQuestion()
}

function nextQuestion() {
  if (currentIndex.value < quizList.value.length - 1) {
    currentIndex.value++
    userAnswer.value = ''
    showResult.value = false
  } else {
    finished.value = true
  }
}

function restart() {
  startQuiz()
}

function goHome() {
  router.push('/')
}
</script>

<template>
  <div class="quiz-page min-h-screen bg-bg-page">
    <NavBar
      title="刷题练习"
      left-text="返回"
      left-arrow
      @click-left="goHome"
    />

    <!-- 结果页 -->
    <div v-if="finished" class="p-4 fade-in-up">
      <div class="bg-white rounded-2xl card-shadow p-8 text-center mb-4">
        <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center">
          <Trophy :size="40" class="text-primary-600" />
        </div>
        <p class="text-3xl font-bold text-gray-800 mb-2">
          {{ score }} / {{ totalQuestions }}
        </p>
        <p class="text-sm text-gray-500">
          正确率 {{ totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0 }}%
        </p>
      </div>

      <div class="bg-white rounded-2xl card-shadow p-4 mb-4">
        <p class="text-sm font-medium text-gray-700 mb-3">答题详情</p>
        <div v-for="(r, i) in results" :key="i" class="flex items-start gap-2 py-2 border-b border-gray-100 last:border-0">
          <component :is="r.correct ? Check : X" :size="18" :class="r.correct ? 'text-success' : 'text-red-500'" class="mt-0.5 flex-shrink-0" />
          <span class="text-sm text-gray-600 line-clamp-2">{{ r.question }}</span>
        </div>
      </div>

      <div class="flex gap-3">
        <Button block round class="flex-1" @click="restart">
          <template #icon><RotateCw :size="16" /></template>
          再来一轮
        </Button>
        <Button type="primary" block round class="flex-1" @click="goHome">
          返回首页
        </Button>
      </div>
    </div>

    <!-- 答题页 -->
    <div v-else-if="currentQuestion" class="p-4 pb-32">
      <!-- 进度条 -->
      <div class="flex items-center gap-3 mb-4">
        <span class="text-sm text-gray-500 whitespace-nowrap">
          {{ currentIndex + 1 }} / {{ totalQuestions }}
        </span>
        <div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div class="h-full bg-primary-600 rounded-full transition-all" :style="{ width: progress + '%' }"></div>
        </div>
      </div>

      <!-- 题目 -->
      <div class="bg-white rounded-2xl card-shadow p-4 mb-4">
        <p class="text-xs text-primary-600 font-medium mb-2">{{ currentQuestion.subject || '未分类' }}</p>
        <div v-if="currentQuestion.imageData" class="mb-3 rounded-xl overflow-hidden">
          <img :src="currentQuestion.imageData" alt="题目图片" class="w-full" />
        </div>
        <p class="text-base text-gray-800 leading-relaxed whitespace-pre-wrap">{{ currentQuestion.question }}</p>
      </div>

      <!-- 答题区 -->
      <div class="bg-white rounded-2xl card-shadow p-4 mb-4">
        <p class="text-sm font-medium text-gray-700 mb-3">你的答案</p>
        <textarea
          v-model="userAnswer"
          :disabled="showResult"
          class="w-full min-h-[120px] p-3 bg-gray-50 rounded-xl text-sm text-gray-700 resize-none outline-none border border-transparent focus:border-primary-300 disabled:opacity-60"
          placeholder="请输入你的答案..."
        />
      </div>

      <!-- 结果展示 -->
      <div v-if="showResult" class="fade-in-up">
        <div class="bg-white rounded-2xl card-shadow p-4 mb-4 border-l-4 border-success">
          <p class="text-sm font-medium text-success mb-2">参考答案</p>
          <p class="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{{ currentQuestion.answer }}</p>
        </div>
        <div v-if="currentQuestion.analysis" class="bg-white rounded-2xl card-shadow p-4 mb-4">
          <p class="text-sm font-medium text-gray-700 mb-2">解析</p>
          <p class="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{{ currentQuestion.analysis }}</p>
        </div>

        <div class="bg-gray-50 rounded-2xl p-4 text-center">
          <p class="text-sm text-gray-600 mb-3">你答对了吗？</p>
          <div class="flex gap-3">
            <button
              class="flex-1 py-3 rounded-xl bg-red-50 text-red-600 font-medium active:scale-95 transition-transform"
              @click="markWrong"
            >
              <X :size="20" class="inline mr-1" />答错了
            </button>
            <button
              class="flex-1 py-3 rounded-xl bg-green-50 text-green-600 font-medium active:scale-95 transition-transform"
              @click="markCorrect"
            >
              <Check :size="20" class="inline mr-1" />答对了
            </button>
          </div>
        </div>
      </div>

      <!-- 提交按钮 -->
      <div v-else class="fixed bottom-[50px] left-0 right-0 p-4 bg-white border-t border-gray-100 z-[60]">
        <Button type="primary" block round size="large" @click="submitAnswer">
          提交答案
        </Button>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="flex flex-col items-center justify-center py-20">
      <p class="text-gray-400 text-sm">加载中...</p>
    </div>
  </div>
</template>
