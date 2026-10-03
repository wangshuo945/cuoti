<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Tabbar, TabbarItem } from 'vant'
import {
  BookOpen,
  Camera,
  RotateCcw,
  User,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const active = ref(0)

const tabs = [
  { name: 'home', path: '/', label: '错题本', icon: BookOpen },
  { name: 'capture', path: '/capture', label: '录入', icon: Camera },
  { name: 'review', path: '/review', label: '复习', icon: RotateCcw },
  { name: 'mine', path: '/mine', label: '我的', icon: User },
]

watch(
  () => route.name,
  (name) => {
    const idx = tabs.findIndex(t => t.name === name)
    if (idx !== -1) {
      active.value = idx
    }
  },
  { immediate: true }
)

function onChange(index: number) {
  router.push(tabs[index].path)
}

const showTabbar = () => {
  return !route.path.includes('/detail') && !route.path.includes('/settings')
}
</script>

<template>
  <div class="app-container min-h-screen bg-bg-page pb-[60px]">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>

    <Tabbar
      v-if="showTabbar()"
      v-model="active"
      :border="false"
      class="fixed bottom-0 left-0 right-0 z-50"
      active-color="#1e3a8a"
      inactive-color="#94a3b8"
      @change="onChange"
    >
      <TabbarItem v-for="tab in tabs" :key="tab.name">
        <template #icon="props">
          <component
            :is="tab.icon"
            :size="22"
            :stroke-width="props.active ? 2.5 : 1.8"
          />
        </template>
        {{ tab.label }}
      </TabbarItem>
    </Tabbar>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
