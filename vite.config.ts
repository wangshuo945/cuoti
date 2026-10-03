import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

// 开发环境 API 中间件，模拟 Vercel Serverless Functions
function devApiMiddleware(): Plugin {
  return {
    name: 'dev-api-middleware',
    configureServer(server) {
      server.middlewares.use('/api/baidu', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
          res.statusCode = 200
          res.end()
          return
        }

        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        let body = ''
        req.on('data', (chunk) => { body += chunk })
        req.on('end', async () => {
          try {
            const { action, apiKey, secretKey, image, accessToken } = JSON.parse(body)
            const BAIDU_BASE = 'https://aip.baidubce.com'

            if (action === 'token') {
              const url = `${BAIDU_BASE}/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`
              const r = await fetch(url, { method: 'POST' })
              const data = await r.json()
              res.setHeader('Content-Type', 'application/json')
              if (data.access_token) {
                res.end(JSON.stringify({ access_token: data.access_token }))
              } else {
                res.statusCode = 400
                res.end(JSON.stringify({ error: data.error_description || '获取token失败' }))
              }
            } else if (action === 'ocr') {
              const url = `${BAIDU_BASE}/rest/2.0/ocr/v1/general_basic?access_token=${accessToken}`
              const r = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `image=${encodeURIComponent(image)}`,
              })
              const data = await r.json()
              res.setHeader('Content-Type', 'application/json')
              if (data.words_result) {
                const text = data.words_result.map((w: { words: string }) => w.words).join('\n')
                res.end(JSON.stringify({ text }))
              } else {
                res.statusCode = 400
                res.end(JSON.stringify({ error: data.error_msg || '识别失败' }))
              }
            } else {
              res.statusCode = 400
              res.end(JSON.stringify({ error: '未知操作' }))
            }
          } catch (e: any) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: e.message || '服务器错误' }))
          }
        })
      })

      server.middlewares.use('/api/ai', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
          res.statusCode = 200
          res.end()
          return
        }

        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        let body = ''
        req.on('data', (chunk) => { body += chunk })
        req.on('end', async () => {
          try {
            const { provider, apiKey, model, question } = JSON.parse(body)
            const endpoints: Record<string, string> = {
              doubao: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
              qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
              deepseek: 'https://api.deepseek.com/v1/chat/completions',
            }
            const endpoint = endpoints[provider]
            if (!endpoint) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: `不支持的服务商: ${provider}` }))
              return
            }

            const prompt = `你是一位专业的老师，请解答下面这道题。
请严格按照以下JSON格式返回结果（不要包含其他文字）：
{
  "answer": "参考答案",
  "analysis": "详细解析，分步骤说明解题思路和过程"
}

题目：
${question}`

            const r = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: model || 'deepseek-chat',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
              }),
            })
            const data = await r.json()
            res.setHeader('Content-Type', 'application/json')
            if (data.choices && data.choices[0]) {
              res.end(JSON.stringify({ content: data.choices[0].message.content }))
            } else {
              res.statusCode = 400
              res.end(JSON.stringify({ error: data.error?.message || 'AI返回格式异常' }))
            }
          } catch (e: any) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: e.message || '服务器错误' }))
          }
        })
      })
    },
  }
}

export default defineConfig({
  build: {
    sourcemap: 'hidden',
  },
  plugins: [
    vue(),
    devApiMiddleware(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,woff2}'],
      },
      manifest: {
        name: '智能错题本',
        short_name: '错题本',
        description: '拍照录题，AI智能解析，科学复习',
        theme_color: '#1e3a8a',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
