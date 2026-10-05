import { createRouter, createWebHashHistory } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import CapturePage from '@/pages/CapturePage.vue'
import DetailPage from '@/pages/DetailPage.vue'
import ReviewPage from '@/pages/ReviewPage.vue'
import MinePage from '@/pages/MinePage.vue'
import AISettingsPage from '@/pages/AISettingsPage.vue'
import QuizPage from '@/pages/QuizPage.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage,
    meta: { title: '错题本' },
  },
  {
    path: '/capture',
    name: 'capture',
    component: CapturePage,
    meta: { title: '录入错题' },
  },
  {
    path: '/detail/:id',
    name: 'detail',
    component: DetailPage,
    meta: { title: '错题详情' },
  },
  {
    path: '/review',
    name: 'review',
    component: ReviewPage,
    meta: { title: '复习' },
  },
  {
    path: '/mine',
    name: 'mine',
    component: MinePage,
    meta: { title: '我的' },
  },
  {
    path: '/settings/ai',
    name: 'ai-settings',
    component: AISettingsPage,
    meta: { title: 'AI 设置' },
  },
  {
    path: '/quiz',
    name: 'quiz',
    component: QuizPage,
    meta: { title: '刷题练习' },
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  document.title = (to.meta.title as string) || '智能错题本'
  next()
})

export default router
