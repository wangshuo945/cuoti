<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '@/stores/settings'
import { NavBar, CellGroup, Field, Button, Picker, Popup, showToast } from 'vant'
import {
  ChevronRight,
  Key,
  Brain,
  Eye,
} from 'lucide-vue-next'

const router = useRouter()
const settingsStore = useSettingsStore()

const ocrProvider = computed({
  get: () => settingsStore.ocrProvider,
  set: (val: string) => { settingsStore.ocrProvider = val }
})
const ocrApiKey = computed({
  get: () => settingsStore.ocrApiKey,
  set: (val: string) => { settingsStore.ocrApiKey = val }
})
const ocrSecretKey = computed({
  get: () => settingsStore.ocrSecretKey,
  set: (val: string) => { settingsStore.ocrSecretKey = val }
})
const aiProvider = computed({
  get: () => settingsStore.aiProvider,
  set: (val: string) => { settingsStore.aiProvider = val; updateModelList() }
})
const aiApiKey = computed({
  get: () => settingsStore.aiApiKey,
  set: (val: string) => { settingsStore.aiApiKey = val }
})
const aiModel = computed({
  get: () => settingsStore.aiModel,
  set: (val: string) => { settingsStore.aiModel = val }
})

const showOcrPicker = ref(false)
const showAiPicker = ref(false)
const showModelPicker = ref(false)

const ocrProviders = [
  { text: '百度 OCR', value: 'baidu' },
]

const aiProviders = [
  { text: '字节豆包', value: 'doubao' },
  { text: '阿里通义千问', value: 'qwen' },
  { text: 'DeepSeek', value: 'deepseek' },
]

const doubaoModels = [
  { text: 'doubao-lite-4k（免费）', value: 'doubao-lite-4k' },
  { text: 'doubao-pro-4k', value: 'doubao-pro-4k' },
  { text: 'doubao-pro-32k', value: 'doubao-pro-32k' },
]

const qwenModels = [
  { text: 'qwen-turbo', value: 'qwen-turbo' },
  { text: 'qwen-plus', value: 'qwen-plus' },
  { text: 'qwen-max', value: 'qwen-max' },
]

const deepseekModels = [
  { text: 'deepseek-chat（V3）', value: 'deepseek-chat' },
  { text: 'deepseek-v4-pro', value: 'deepseek-v4-pro' },
  { text: 'deepseek-reasoner（R1）', value: 'deepseek-reasoner' },
]

const currentModels = ref(doubaoModels)

watch(() => settingsStore.initialized, (val) => {
  if (val) {
    updateModelList()
  }
}, { immediate: true })

function updateModelList() {
  if (aiProvider.value === 'doubao') {
    currentModels.value = doubaoModels
  } else if (aiProvider.value === 'qwen') {
    currentModels.value = qwenModels
  } else if (aiProvider.value === 'deepseek') {
    currentModels.value = deepseekModels
  }
}

function getOcrProviderName(val: string) {
  return ocrProviders.find(p => p.value === val)?.text || val
}

function getAiProviderName(val: string) {
  return aiProviders.find(p => p.value === val)?.text || val
}

function getModelName(val: string) {
  return currentModels.value.find(m => m.value === val)?.text || val
}

function onOcrProviderConfirm({ selectedValues }: { selectedValues: string[] }) {
  ocrProvider.value = selectedValues[0]
  showOcrPicker.value = false
}

function onAiProviderConfirm({ selectedValues }: { selectedValues: string[] }) {
  aiProvider.value = selectedValues[0]
  updateModelList()
  if (currentModels.value.length > 0) {
    aiModel.value = currentModels.value[0].value
  }
  showAiPicker.value = false
}

function onModelConfirm({ selectedValues }: { selectedValues: string[] }) {
  aiModel.value = selectedValues[0]
  showModelPicker.value = false
}

async function handleSave() {
  try {
    console.log('保存配置:', {
      ocrProvider: ocrProvider.value,
      ocrApiKey: ocrApiKey.value,
      ocrSecretKey: ocrSecretKey.value,
      aiProvider: aiProvider.value,
      aiApiKey: aiApiKey.value,
      aiModel: aiModel.value,
    })
    await settingsStore.updateOcrConfig(ocrProvider.value, ocrApiKey.value, ocrSecretKey.value)
    await settingsStore.updateAiConfig(aiProvider.value, aiApiKey.value, aiModel.value)
    console.log('保存成功')
    showToast({ message: '保存成功', type: 'success' })
    setTimeout(() => router.replace('/mine'), 800)
  } catch (error: any) {
    console.error('保存失败:', error)
    showToast({ message: error.message || '保存失败', type: 'fail' })
  }
}
</script>

<template>
  <div class="ai-settings-page min-h-screen bg-bg-page pb-24">
    <NavBar title="AI 设置" left-text="返回" left-arrow @click-left="router.replace('/mine')" />

    <div class="p-4 space-y-4">
      <div class="bg-white rounded-2xl card-shadow overflow-hidden">
        <div class="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <Eye :size="18" class="text-primary-600" />
          <span class="font-medium text-gray-700">OCR 文字识别</span>
        </div>
        
        <CellGroup inset>
          <div
            class="flex items-center justify-between p-4 border-b border-gray-50 cursor-pointer"
            @click="showOcrPicker = true"
          >
            <span class="text-sm text-gray-700">服务提供商</span>
            <div class="flex items-center gap-1 text-gray-500">
              <span class="text-sm">{{ getOcrProviderName(ocrProvider) }}</span>
              <ChevronRight :size="18" />
            </div>
          </div>
          
          <div class="p-4 border-b border-gray-50">
            <label class="text-sm text-gray-700 mb-2 block">API Key</label>
            <Field
              v-model="ocrApiKey"
              type="password"
              placeholder="请输入 API Key"
              :border="false"
              class="!bg-gray-50 !rounded-xl !px-3"
            />
          </div>
          
          <div class="p-4">
            <label class="text-sm text-gray-700 mb-2 block">Secret Key</label>
            <Field
              v-model="ocrSecretKey"
              type="password"
              placeholder="请输入 Secret Key"
              :border="false"
              class="!bg-gray-50 !rounded-xl !px-3"
            />
          </div>
        </CellGroup>
      </div>

      <div class="bg-white rounded-2xl card-shadow overflow-hidden">
        <div class="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <Brain :size="18" class="text-primary-600" />
          <span class="font-medium text-gray-700">AI 大模型</span>
        </div>
        
        <CellGroup inset>
          <div
            class="flex items-center justify-between p-4 border-b border-gray-50 cursor-pointer"
            @click="showAiPicker = true"
          >
            <span class="text-sm text-gray-700">服务提供商</span>
            <div class="flex items-center gap-1 text-gray-500">
              <span class="text-sm">{{ getAiProviderName(aiProvider) }}</span>
              <ChevronRight :size="18" />
            </div>
          </div>
          
          <div
            class="flex items-center justify-between p-4 border-b border-gray-50 cursor-pointer"
            @click="showModelPicker = true"
          >
            <span class="text-sm text-gray-700">模型</span>
            <div class="flex items-center gap-1 text-gray-500">
              <span class="text-sm">{{ getModelName(aiModel) }}</span>
              <ChevronRight :size="18" />
            </div>
          </div>
          
          <div class="p-4">
            <label class="text-sm text-gray-700 mb-2 block">API Key</label>
            <Field
              v-model="aiApiKey"
              type="password"
              placeholder="请输入 API Key"
              :border="false"
              class="!bg-gray-50 !rounded-xl !px-3"
            />
          </div>
        </CellGroup>
      </div>

      <div class="bg-primary-50 rounded-2xl p-4">
        <p class="text-sm font-medium text-primary-700 mb-2">💡 如何获取 API Key？</p>
        <ul class="space-y-2 text-xs text-primary-600/80">
          <li>1. 访问对应服务商官网注册账号</li>
          <li>2. 进入控制台创建应用获取 API Key</li>
          <li>3. 新用户通常有免费额度可用</li>
        </ul>
      </div>
    </div>

    <div class="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 safe-bottom">
      <Button type="primary" block round size="large" @click="handleSave">
        保存设置
      </Button>
    </div>

    <Popup v-model:show="showOcrPicker" position="bottom" round>
      <Picker
        :columns="ocrProviders"
        :model-value="[ocrProvider]"
        @confirm="onOcrProviderConfirm"
        @cancel="showOcrPicker = false"
      />
    </Popup>

    <Popup v-model:show="showAiPicker" position="bottom" round>
      <Picker
        :columns="aiProviders"
        :model-value="[aiProvider]"
        @confirm="onAiProviderConfirm"
        @cancel="showAiPicker = false"
      />
    </Popup>

    <Popup v-model:show="showModelPicker" position="bottom" round>
      <Picker
        :columns="currentModels"
        :model-value="[aiModel]"
        @confirm="onModelConfirm"
        @cancel="showModelPicker = false"
      />
    </Popup>
  </div>
</template>
