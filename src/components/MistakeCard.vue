<script setup lang="ts">
import type { Mistake } from '@/types'
import { getSubjectColor } from '@/lib/utils'
import { CheckCircle, Clock } from 'lucide-vue-next'

const props = defineProps<{
  mistake: Mistake
}>()

defineEmits<{
  (e: 'click'): void
}>()

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function getMasteryText(level: number) {
  if (level >= 5) return '已掌握'
  if (level >= 3) return '较熟悉'
  if (level >= 1) return '学习中'
  return '新题'
}

function getMasteryColor(level: number) {
  if (level >= 5) return 'text-success bg-success/10'
  if (level >= 3) return 'text-primary-600 bg-primary-50'
  if (level >= 1) return 'text-warning bg-warning/10'
  return 'text-danger bg-danger/10'
}
</script>

<template>
  <div
    class="mistake-card bg-white rounded-2xl card-shadow p-4 active:scale-[0.98] transition-transform cursor-pointer"
    @click="$emit('click')"
  >
    <div class="flex gap-3">
      <div
        v-if="mistake.imageData"
        class="w-20 h-20 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden"
      >
        <img
          :src="mistake.imageData"
          alt="题目图片"
          class="w-full h-full object-cover"
        />
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-2">
          <span
            class="px-2 py-0.5 rounded-full text-xs font-medium"
            :style="{
              color: getSubjectColor(mistake.subject),
              backgroundColor: getSubjectColor(mistake.subject) + '15',
            }"
          >
            {{ mistake.subject }}
          </span>
          <span
            class="px-2 py-0.5 rounded-full text-xs font-medium"
            :class="getMasteryColor(mistake.masteryLevel)"
          >
            {{ getMasteryText(mistake.masteryLevel) }}
          </span>
        </div>
        <p class="text-sm text-gray-800 text-ellipsis-2 leading-relaxed mb-2">
          {{ mistake.question }}
        </p>
        <div class="flex items-center justify-between text-xs text-gray-400">
          <span class="flex items-center gap-1">
            <Clock :size="12" />
            {{ formatDate(mistake.createdAt) }}
          </span>
          <span v-if="mistake.masteryLevel >= 5" class="flex items-center gap-1 text-success">
            <CheckCircle :size="12" />
            已掌握
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
