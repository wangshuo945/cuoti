import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Vant from 'vant'
import 'vant/lib/index.css'
import './style.css'
import App from './App.vue'
import router from './router'
import { useSettingsStore } from '@/stores/settings'
import { useMistakeStore } from '@/stores/mistake'

// 请求浏览器持久化存储，防止数据被自动清理
async function requestPersistentStorage() {
  try {
    if (navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persist()
      console.log('持久化存储:', isPersisted ? '已开启' : '未开启')
    }
  } catch (e) {
    console.warn('持久化存储请求失败:', e)
  }
}

requestPersistentStorage()

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(Vant)

app.mount('#app')

const settingsStore = useSettingsStore()
const mistakeStore = useMistakeStore()

settingsStore.init().then(() => {
  mistakeStore.loadAll()
})
