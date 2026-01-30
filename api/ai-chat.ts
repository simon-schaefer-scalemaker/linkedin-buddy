// Vercel Serverless Function for AI Chat
// API Key is stored in Vercel Environment Variables (not in frontend)

import type { VercelRequest, VercelResponse } from '@vercel/node'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { system_prompt, messages } = req.body

    if (!system_prompt || !messages) {
      return res.status(400).json({ error: 'Missing required fields: system_prompt, messages' })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'ANTHROPIC_API_KEY not configured. Add it in Vercel → Settings → Environment Variables' 
      })
    }

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: system_prompt,
        messages: messages
      }),
    })

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}))
      return res.status(response.status).json({ 
        error: `Claude API error: ${response.status} - ${errorBody?.error?.message || 'Unknown error'}` 
      })
    }

    const claudeResponse = await response.json()
    const assistantMessage = claudeResponse.content[0]?.text || ''

    return res.status(200).json({ 
      success: true, 
      message: assistantMessage,
      usage: claudeResponse.usage
    })

  } catch (error) {
    console.error('AI Chat Error:', error)
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}
