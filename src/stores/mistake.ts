import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Mistake } from '@/types'
import {
  getAllMistakes,
  getMistakesBySubject,
  getTodayReviewMistakes,
  getMistakeStats,
  addMistake as dbAddMistake,
  updateMistake as dbUpdateMistake,
  deleteMistake as dbDeleteMistake,
  markMastered as dbMarkMastered,
  markNotMastered as dbMarkNotMastered,
  calculateNextReview,
} from '@/utils/mistake'

export const useMistakeStore = defineStore('mistake', () => {
  const mistakes = ref<Mistake[]>([])
  const currentSubject = ref('all')
  const stats = ref({
    total: 0,
    todayNew: 0,
    toReview: 0,
    masteryRate: 0,
  })
  const todayReviewList = ref<Mistake[]>([])
  const loading = ref(false)

  const filteredMistakes = computed(() => {
    if (currentSubject.value === 'all') {
      return mistakes.value
    }
    return mistakes.value.filter(m => m.subject === currentSubject.value)
  })

  async function loadAll() {
    loading.value = true
    try {
      mistakes.value = await getAllMistakes()
      stats.value = await getMistakeStats()
      todayReviewList.value = await getTodayReviewMistakes()
    } finally {
      loading.value = false
    }
  }

  async function loadBySubject(subject: string) {
    currentSubject.value = subject
    mistakes.value = await getMistakesBySubject(subject)
  }

  async function addMistake(mistake: Omit<Mistake, 'id' | 'createdAt' | 'updatedAt'>) {
    const id = await dbAddMistake({
      ...mistake,
      nextReviewDate: calculateNextReview(0),
    })
    await loadAll()
    return id
  }

  async function updateMistake(id: number, updates: Partial<Mistake>) {
    await dbUpdateMistake(id, updates)
    await loadAll()
  }

  async function removeMistake(id: number) {
    await dbDeleteMistake(id)
    await loadAll()
  }

  async function markMastered(id: number) {
    await dbMarkMastered(id)
    await loadAll()
  }

  async function markNotMastered(id: number) {
    await dbMarkNotMastered(id)
    await loadAll()
  }

  async function refreshStats() {
    stats.value = await getMistakeStats()
    todayReviewList.value = await getTodayReviewMistakes()
  }

  function getById(id: number) {
    return mistakes.value.find(m => m.id === id)
  }

  return {
    mistakes,
    filteredMistakes,
    currentSubject,
    stats,
    todayReviewList,
    loading,
    loadAll,
    loadBySubject,
    addMistake,
    updateMistake,
    removeMistake,
    markMastered,
    markNotMastered,
    refreshStats,
    getById,
  }
})
