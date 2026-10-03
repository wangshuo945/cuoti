// Cloudflare Pages Function: /api/baidu
const BAIDU_BASE = 'https://aip.baidubce.com'

export async function onRequestPost(context) {
  const { request } = context
  const { action, apiKey, secretKey, image, accessToken } = await request.json()

  try {
    if (action === 'token') {
      const url = `${BAIDU_BASE}/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`
      const res = await fetch(url, { method: 'POST' })
      const data = await res.json()

      if (data.access_token) {
        return json({ access_token: data.access_token })
      }
      return json({ error: data.error_description || '获取token失败' }, 400)
    }

    if (action === 'ocr') {
      const url = `${BAIDU_BASE}/rest/2.0/ocr/v1/general_basic?access_token=${accessToken}`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `image=${encodeURIComponent(image)}`,
      })
      const data = await res.json()

      if (data.words_result) {
        const text = data.words_result.map(w => w.words).join('\n')
        return json({ text })
      }
      return json({ error: data.error_msg || '识别失败' }, 400)
    }

    return json({ error: '未知操作' }, 400)
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
