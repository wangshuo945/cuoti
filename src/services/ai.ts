import axios from 'axios'
import { getSetting } from '@/db'

export interface AIAnswer {
  answer: string
  analysis: string
}

export interface AICheckResult {
  correct: boolean
  feedback: string
}

// 统一通过 /api/ai 代理调用，开发和生产环境一致
const AI_PROXY = '/api/ai'

export async function checkAnswer(question: string, userAnswer: string, correctAnswer: string): Promise<AICheckResult> {
  const provider = await getSetting('aiProvider')
  const apiKey = await getSetting('aiApiKey')
  const model = await getSetting('aiModel') || 'doubao-lite-4k'

  if (!apiKey) {
    // 无API时简单匹配
    const correct = userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
    return { correct, feedback: correct ? '回答正确！' : '回答不正确，请参考标准答案。' }
  }

  const prompt = `你是一位专业的批改老师。请判断学生的答案是否正确。

题目：${question}

标准答案：${correctAnswer}

学生答案：${userAnswer}

请严格按照以下JSON格式返回（不要包含其他文字）：
{
  "correct": true或false,
  "feedback": "简短点评，指出对错原因，不超过100字"
}

判断标准：答案意思相近即算正确，不要求文字完全一致。`

  try {
    const res = await axios.post(AI_PROXY, {
      provider,
      apiKey,
      model,
      question: prompt,
    })

    if (res.data.content) {
      const jsonStr = res.data.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed = JSON.parse(jsonStr)
      return {
        correct: !!parsed.correct,
        feedback: parsed.feedback || '',
      }
    }
    throw new Error('AI返回为空')
  } catch {
    // 降级为简单匹配
    const correct = userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
    return { correct, feedback: correct ? '回答正确！' : '回答不正确，请参考标准答案。' }
  }
}

export async function generateAnswer(question: string): Promise<AIAnswer> {
  const provider = await getSetting('aiProvider')
  const apiKey = await getSetting('aiApiKey')
  const model = await getSetting('aiModel') || 'doubao-lite-4k'

  if (!apiKey) {
    return mockAIResult(question)
  }

  try {
    const res = await axios.post(AI_PROXY, {
      provider,
      apiKey,
      model,
      question,
    })

    if (res.data.content) {
      return parseAIResponse(res.data.content)
    }
    throw new Error(res.data.error || 'AI返回为空')
  } catch (error) {
    console.error('AI generation failed:', error)
    throw new Error('AI解析失败，请检查API配置')
  }
}

function parseAIResponse(content: string): AIAnswer {
  try {
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(jsonStr)
    return {
      answer: parsed.answer || '',
      analysis: parsed.analysis || '',
    }
  } catch {
    return {
      answer: '',
      analysis: content,
    }
  }
}

function mockAIResult(question: string): AIAnswer {
  if (question.includes('二次函数') || question.includes('x²')) {
    return {
      answer: '（1）最小值为 0；（2）最大值为 4，最小值为 0。',
      analysis: `### 解题过程

**（1）求 f(x) 的最小值**

f(x) = x² - 2x + 1 = (x - 1)²

这是一个开口向上的抛物线，顶点坐标为 (1, 0)。

因为 (x - 1)² ≥ 0 对所有实数 x 成立，当且仅当 x = 1 时取等号。

所以 f(x) 的最小值为 **0**，在 x = 1 时取得。

---

**（2）求 f(x) 在 [0, 3] 上的最值**

函数在 [0, 1] 上单调递减，在 [1, 3] 上单调递增。

计算端点和顶点的函数值：
- f(0) = 0² - 2×0 + 1 = 1
- f(1) = 0（最小值）
- f(3) = 3² - 2×3 + 1 = 9 - 6 + 1 = 4（最大值）

所以在区间 [0, 3] 上：
- 最大值为 **4**（在 x = 3 处）
- 最小值为 **0**（在 x = 1 处）`,
    }
  }
  
  return {
    answer: '请配置AI API以获取真实答案',
    analysis: `这是一个示例解析。

请在"我的 → AI设置"中配置你的大模型API Key，即可获得真实的AI解析结果。

支持的AI服务商：
- 字节跳动豆包
- 阿里通义千问
- DeepSeek
- 智谱AI`,
  }
}
