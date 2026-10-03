import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getSetting, setSetting, initDefaultSettings } from '@/db'

export const useSettingsStore = defineStore('settings', () => {
  const ocrProvider = ref('baidu')
  const ocrApiKey = ref('')
  const ocrSecretKey = ref('')
  const aiProvider = ref('doubao')
  const aiApiKey = ref('')
  const aiModel = ref('doubao-lite-4k')
  const initialized = ref(false)

  async function init() {
    await initDefaultSettings()
    
    ocrProvider.value = await getSetting('ocrProvider') || 'baidu'
    ocrApiKey.value = await getSetting('ocrApiKey') || ''
    ocrSecretKey.value = await getSetting('ocrSecretKey') || ''
    aiProvider.value = await getSetting('aiProvider') || 'doubao'
    aiApiKey.value = await getSetting('aiApiKey') || ''
    aiModel.value = await getSetting('aiModel') || 'doubao-lite-4k'
    
    initialized.value = true
  }

  async function updateOcrConfig(provider: string, apiKey: string, secretKey: string) {
    ocrProvider.value = provider
    ocrApiKey.value = apiKey
    ocrSecretKey.value = secretKey
    await setSetting('ocrProvider', provider)
    await setSetting('ocrApiKey', apiKey)
    await setSetting('ocrSecretKey', secretKey)
  }

  async function updateAiConfig(provider: string, apiKey: string, model: string) {
    aiProvider.value = provider
    aiApiKey.value = apiKey
    aiModel.value = model
    await setSetting('aiProvider', provider)
    await setSetting('aiApiKey', apiKey)
    await setSetting('aiModel', model)
  }

  const hasOCRConfigured = () => {
    return ocrApiKey.value && ocrSecretKey.value
  }

  const hasAIConfigured = () => {
    return aiApiKey.value
  }

  return {
    ocrProvider,
    ocrApiKey,
    ocrSecretKey,
    aiProvider,
    aiApiKey,
    aiModel,
    initialized,
    init,
    updateOcrConfig,
    updateAiConfig,
    hasOCRConfigured,
    hasAIConfigured,
  }
})
