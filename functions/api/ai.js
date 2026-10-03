// Cloudflare Pages Function: /api/ai
const PROVIDER_ENDPOINTS = {
  doubao: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
  qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
  deepseek: 'https://api.deepseek.com/v1/chat/completions',
}

export async function onRequestPost(context) {
  const { request } = context
  const { provider, apiKey, model, question } = await request.json()

  if (!provider || !apiKey || !question) {
    return json({ error: '缺少必要参数' }, 400)
  }

  const endpoint = PROVIDER_ENDPOINTS[provider]
  if (!endpoint) {
    return json({ error: `不支持的服务商: ${provider}` }, 400)
  }

  const prompt = `你是一位专业的老师，请解答下面这道题。
请严格按照以下JSON格式返回结果（不要包含其他文字）：
{
  "answer": "参考答案",
  "analysis": "详细解析，分步骤说明解题思路和过程"
}

题目：
${question}`

  try {
    const res = await fetch(endpoint, {
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
    const data = await res.json()

    if (data.choices && data.choices[0]) {
      return json({ content: data.choices[0].message.content })
    }
    return json({ error: data.error?.message || 'AI返回格式异常' }, 400)
  } catch (e) {
    return json({ error: e.message || '服务器错误' }, 500)
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export function onRequestOptions() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
