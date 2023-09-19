// #vercel-disable-blocks
import { fetch } from 'undici'
// #vercel-end
import { verifySignature } from '@/utils/auth'
import type { APIRoute } from 'astro'

const sitePassword = import.meta.env.SITE_PASSWORD || ''
const passList = sitePassword.split(',') || []

export const post: APIRoute = async(context) => {
  const body = await context.request.json()
  const { sign, time, messages, pass } = body
  if (!messages) {
    return new Response(JSON.stringify({
      error: {
        message: 'No input text.',
      },
    }), { status: 400 })
  }
  if (sitePassword && !(sitePassword === pass || passList.includes(pass))) {
    return new Response(JSON.stringify({
      error: {
        message: 'Invalid password.',
      },
    }), { status: 401 })
  }
  if (import.meta.env.PROD && !await verifySignature({ t: time, m: messages?.[messages.length - 1]?.content || '' }, sign)) {
    return new Response(JSON.stringify({
      error: {
        message: 'Invalid signature.',
      },
    }), { status: 401 })
  }

  const initOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  }

  try {
    const response = await fetch('http://127.0.0.1:5000/get-response', initOptions)

    if (!response.ok)
      throw new Error(`Server responded with status: ${response.status}`)

    interface ResponseData {
      answer: string
    }

    const responseData = await response.json() as ResponseData
    return new Response(responseData.answer, { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({
      error: {
        code: err.name,
        message: err.message,
      },
    }), { status: 500 })
  }
}
