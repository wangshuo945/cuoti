import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 学科配色板（用于自由文本学科的颜色分配）
const SUBJECT_COLOR_PALETTE = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
  '#14b8a6', '#f97316', '#06b6d4', '#ef4444', '#6b7280',
  '#84cc16', '#a855f7', '#0ea5e9', '#eab308', '#f43f5e',
]

/**
 * 根据学科名称生成一致的颜色（同一名称始终返回同一颜色）
 */
export function getSubjectColor(name: string): string {
  if (!name) return '#6b7280'
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i)
    hash |= 0
  }
  const index = Math.abs(hash) % SUBJECT_COLOR_PALETTE.length
  return SUBJECT_COLOR_PALETTE[index]
}
