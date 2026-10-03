import axios from 'axios'
import { getSetting } from '@/db'

// 开发环境走 Vite 代理 /api/baidu，生产环境走 Vercel Serverless Function /api/baidu
const BAIDU_PROXY = '/api/baidu'

export async function recognizeText(imageBase64: string): Promise<string> {
  const provider = await getSetting('ocrProvider')
  const apiKey = await getSetting('ocrApiKey')
  const secretKey = await getSetting('ocrSecretKey')

  if (!apiKey || !secretKey) {
    return mockOCRResult()
  }

  try {
    if (provider === 'baidu') {
      return await baiduOCR(imageBase64, apiKey, secretKey)
    }
    return mockOCRResult()
  } catch (error) {
    console.error('OCR recognition failed:', error)
    throw new Error('文字识别失败，请检查API配置')
  }
}

async function baiduOCR(imageBase64: string, apiKey: string, secretKey: string): Promise<string> {
  // 1. 获取 access_token
  const tokenRes = await axios.post(BAIDU_PROXY, {
    action: 'token',
    apiKey,
    secretKey,
  })
  const accessToken = tokenRes.data.access_token

  // 2. 调用 OCR
  const imageData = imageBase64.includes('base64,')
    ? imageBase64.split('base64,')[1]
    : imageBase64

  const ocrRes = await axios.post(BAIDU_PROXY, {
    action: 'ocr',
    image: imageData,
    accessToken,
  })

  if (ocrRes.data.text) {
    return ocrRes.data.text
  }

  throw new Error(ocrRes.data.error || '识别失败')
}

function mockOCRResult(): string {
  return `已知函数 f(x) = x² - 2x + 1，求：
（1）f(x)的最小值；
（2）f(x)在区间[0, 3]上的最大值和最小值。`
}
