<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMistakeStore } from '@/stores/mistake'
import { useSettingsStore } from '@/stores/settings'
import { exportData, importData } from '@/utils/mistake'
import { showConfirmDialog, showDialog, showToast } from 'vant'
import {
  User,
  Settings,
  Database,
  Download,
  Upload,
  Trash2,
  ChevronRight,
  Cpu,
  Info,
  FileText,
} from 'lucide-vue-next'

const router = useRouter()
const mistakeStore = useMistakeStore()
const settingsStore = useSettingsStore()

const fileInputRef = ref<HTMLInputElement | null>(null)

const menuItems = [
  {
    title: 'AI 设置',
    desc: '配置 OCR 和大模型 API',
    icon: Cpu,
    color: '#1e3a8a',
    action: () => router.push('/settings/ai'),
  },
  {
    title: '数据导出',
    desc: '导出错题数据为 JSON 备份',
    icon: Download,
    color: '#10b981',
    action: handleExport,
  },
  {
    title: '数据导入',
    desc: '从备份文件恢复数据',
    icon: Upload,
    color: '#f59e0b',
    action: () => fileInputRef.value?.click(),
  },
  {
    title: '清空数据',
    desc: '删除所有错题数据',
    icon: Trash2,
    color: '#ef4444',
    action: handleClear,
  },
  {
    title: '关于',
    desc: '应用信息与版本',
    icon: Info,
    color: '#6b7280',
    action: showAbout,
  },
]

async function handleExport() {
  try {
    const data = await exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `错题本备份_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showToast({ message: '导出成功', type: 'success' })
  } catch {
    showToast({ message: '导出失败', type: 'fail' })
  }
}

function handleImport() {
  fileInputRef.value?.click()
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  try {
    const text = await file.text()
    const success = await importData(text)
    if (success) {
      showToast({ message: '导入成功', type: 'success' })
      await mistakeStore.loadAll()
    } else {
      showToast({ message: '导入失败，文件格式不正确', type: 'fail' })
    }
  } catch {
    showToast({ message: '导入失败', type: 'fail' })
  }

  input.value = ''
}

function handleClear() {
  showConfirmDialog({
    title: '确认清空',
    message: '此操作将删除所有错题数据，且无法恢复。确定要继续吗？',
    confirmButtonColor: '#ef4444',
  })
    .then(async () => {
      const { db } = await import('@/db')
      await db.mistakes.clear()
      await mistakeStore.loadAll()
      showToast({ message: '已清空', type: 'success' })
    })
    .catch(() => {})
}

function showAbout() {
  showDialog({
    title: '智能错题本',
    message: '版本 1.0.0\n\n一款基于 AI 的智能错题本应用\n拍照录题，AI 解析，科学复习',
    confirmButtonColor: '#1e3a8a',
  })
}
</script>

<template>
  <div class="mine-page min-h-screen bg-bg-page">
    <div class="bg-gradient-to-br from-primary-600 to-primary-800 text-white px-5 pt-6 pb-20">
      <div class="flex items-center gap-4">
        <div class="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
          <User :size="32" />
        </div>
        <div>
          <h2 class="text-xl font-bold">学习达人</h2>
          <p class="text-sm text-white/70 mt-1">
            已积累 {{ mistakeStore.stats.total }} 道错题
          </p>
        </div>
      </div>
    </div>

    <div class="px-4 -mt-12 relative z-10">
      <div class="bg-white rounded-2xl card-shadow overflow-hidden">
        <div
          v-for="(item, index) in menuItems"
          :key="index"
          class="flex items-center gap-4 p-4 border-b border-gray-50 last:border-b-0 active:bg-gray-50 cursor-pointer transition-colors"
          @click="item.action"
        >
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center text-white"
            :style="{ backgroundColor: item.color }"
          >
            <component :is="item.icon" :size="20" />
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium text-gray-800">{{ item.title }}</p>
            <p class="text-xs text-gray-400 mt-0.5">{{ item.desc }}</p>
          </div>
          <ChevronRight :size="20" class="text-gray-300" />
        </div>
      </div>

      <div class="mt-4 bg-white rounded-2xl card-shadow p-4">
        <div class="flex items-center gap-2 mb-3">
          <FileText :size="18" class="text-primary-600" />
          <span class="text-sm font-medium text-gray-700">AI 配置状态</span>
        </div>
        <div class="space-y-2">
          <div class="flex items-center justify-between py-2">
            <span class="text-sm text-gray-500">OCR 文字识别</span>
            <span
              class="text-xs px-2 py-0.5 rounded-full"
              :class="settingsStore.ocrApiKey && settingsStore.ocrSecretKey
                ? 'bg-success/10 text-success'
                : 'bg-warning/10 text-warning'"
            >
              {{ settingsStore.ocrApiKey && settingsStore.ocrSecretKey ? '已配置' : '未配置' }}
            </span>
          </div>
          <div class="flex items-center justify-between py-2">
            <span class="text-sm text-gray-500">AI 答题解析</span>
            <span
              class="text-xs px-2 py-0.5 rounded-full"
              :class="settingsStore.aiApiKey
                ? 'bg-success/10 text-success'
                : 'bg-warning/10 text-warning'"
            >
              {{ settingsStore.aiApiKey ? '已配置' : '未配置' }}
            </span>
          </div>
        </div>
        <button
          class="w-full mt-3 py-2.5 text-sm text-primary-600 bg-primary-50 rounded-xl font-medium"
          @click="router.push('/settings/ai')"
        >
          去配置
        </button>
      </div>

      <p class="text-center text-xs text-gray-400 mt-8 mb-4">
        智能错题本 v1.0.0
      </p>
    </div>

    <input
      ref="fileInputRef"
      type="file"
      accept=".json"
      class="hidden"
      @change="onFileChange"
    />
  </div>
</template>
