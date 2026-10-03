import { db } from '@/db'
import type { Mistake } from '@/types'
import { REVIEW_INTERVALS } from '@/types'

export async function addMistake(mistake: Omit<Mistake, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
  await db.ensureOpen()
  const now = new Date().toISOString()
  const id = await db.mistakes.add({
    ...mistake,
    createdAt: now,
    updatedAt: now,
  })
  return id
}

export async function updateMistake(id: number, updates: Partial<Mistake>): Promise<void> {
  await db.ensureOpen()
  await db.mistakes.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  })
}

export async function deleteMistake(id: number): Promise<void> {
  await db.ensureOpen()
  await db.mistakes.delete(id)
}

export async function getMistake(id: number): Promise<Mistake | undefined> {
  await db.ensureOpen()
  return db.mistakes.get(id)
}

export async function getAllMistakes(): Promise<Mistake[]> {
  await db.ensureOpen()
  return db.mistakes.orderBy('createdAt').reverse().toArray()
}

export async function getMistakesBySubject(subject: string): Promise<Mistake[]> {
  await db.ensureOpen()
  if (subject === 'all') {
    return getAllMistakes()
  }
  return db.mistakes.where('subject').equals(subject).reverse().sortBy('createdAt')
}

export async function getTodayReviewMistakes(): Promise<Mistake[]> {
  await db.ensureOpen()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString()
  
  return db.mistakes
    .where('nextReviewDate')
    .belowOrEqual(todayStr)
    .and(m => m.masteryLevel < 5)
    .toArray()
}

export async function getMistakeStats() {
  await db.ensureOpen()
  const all = await db.mistakes.toArray()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString()
  
  const todayNew = all.filter(m => m.createdAt >= todayStr).length
  const toReview = all.filter(m => m.nextReviewDate <= todayStr && m.masteryLevel < 5).length
  const mastered = all.filter(m => m.masteryLevel >= 5).length
  const masteryRate = all.length > 0 ? Math.round((mastered / all.length) * 100) : 0
  
  return {
    total: all.length,
    todayNew,
    toReview,
    masteryRate,
  }
}

export function calculateNextReview(masteryLevel: number): string {
  const intervals = REVIEW_INTERVALS
  const level = Math.min(masteryLevel, intervals.length - 1)
  const days = intervals[level] || 30
  
  const nextDate = new Date()
  nextDate.setDate(nextDate.getDate() + days)
  nextDate.setHours(0, 0, 0, 0)
  return nextDate.toISOString()
}

export async function markMastered(id: number): Promise<void> {
  await db.ensureOpen()
  const mistake = await db.mistakes.get(id)
  if (!mistake) return
  
  const newLevel = Math.min(mistake.masteryLevel + 1, 5)
  const nextReviewDate = calculateNextReview(newLevel)
  
  await db.mistakes.update(id, {
    masteryLevel: newLevel,
    reviewCount: mistake.reviewCount + 1,
    lastReviewDate: new Date().toISOString(),
    nextReviewDate,
    updatedAt: new Date().toISOString(),
  })
}

export async function markNotMastered(id: number): Promise<void> {
  await db.ensureOpen()
  const mistake = await db.mistakes.get(id)
  if (!mistake) return
  
  const nextReviewDate = calculateNextReview(0)
  
  await db.mistakes.update(id, {
    masteryLevel: 0,
    reviewCount: mistake.reviewCount + 1,
    lastReviewDate: new Date().toISOString(),
    nextReviewDate,
    updatedAt: new Date().toISOString(),
  })
}

export async function searchMistakes(keyword: string): Promise<Mistake[]> {
  const all = await getAllMistakes()
  const kw = keyword.toLowerCase()
  return all.filter(m => 
    m.question.toLowerCase().includes(kw) ||
    m.answer.toLowerCase().includes(kw) ||
    m.analysis.toLowerCase().includes(kw) ||
    m.tags.some(t => t.toLowerCase().includes(kw))
  )
}

export async function exportData(): Promise<string> {
  const mistakes = await getAllMistakes()
  const settings = await db.settings.toArray()
  return JSON.stringify({ mistakes, settings, version: 1 }, null, 2)
}

export async function importData(jsonStr: string): Promise<boolean> {
  try {
    const data = JSON.parse(jsonStr)
    if (!data.mistakes || !Array.isArray(data.mistakes)) {
      return false
    }
    
    await db.transaction('rw', db.mistakes, db.settings, async () => {
      await db.mistakes.clear()
      if (data.mistakes.length > 0) {
        await db.mistakes.bulkAdd(data.mistakes)
      }
    })
    
    return true
  } catch {
    return false
  }
}
