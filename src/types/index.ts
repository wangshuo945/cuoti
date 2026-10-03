export interface Mistake {
  id?: number
  question: string
  answer: string
  analysis: string
  subject: string
  tags: string[]
  imageData: string
  masteryLevel: number
  reviewCount: number
  nextReviewDate: string
  lastReviewDate: string
  createdAt: string
  updatedAt: string
}

export interface AppSetting {
  key: string
  value: string
}

export interface OCRConfig {
  provider: 'baidu' | 'tencent'
  apiKey: string
  secretKey: string
}

export interface AIConfig {
  provider: 'doubao' | 'qwen' | 'zhipu' | 'deepseek'
  apiKey: string
  model: string
  baseUrl?: string
}

export type Subject = {
  id: string
  name: string
  icon: string
  color: string
}

export const SUBJECTS: Subject[] = [
  { id: 'math', name: '数学', icon: 'Calculator', color: '#3b82f6' },
  { id: 'chinese', name: '语文', icon: 'BookOpen', color: '#10b981' },
  { id: 'english', name: '英语', icon: 'Languages', color: '#f59e0b' },
  { id: 'physics', name: '物理', icon: 'Atom', color: '#8b5cf6' },
  { id: 'chemistry', name: '化学', icon: 'FlaskConical', color: '#ec4899' },
  { id: 'biology', name: '生物', icon: 'Leaf', color: '#14b8a6' },
  { id: 'history', name: '历史', color: '#f97316', icon: 'Landmark' },
  { id: 'geography', name: '地理', icon: 'Globe', color: '#06b6d4' },
  { id: 'politics', name: '政治', icon: 'Scale', color: '#ef4444' },
  { id: 'other', name: '其他', icon: 'MoreHorizontal', color: '#6b7280' },
]

export const REVIEW_INTERVALS = [1, 2, 4, 7, 15]
