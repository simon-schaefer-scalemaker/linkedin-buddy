// AI Settings management - stored in localStorage

const API_KEY_STORAGE_KEY = 'claude-api-key'
const AI_MODEL_STORAGE_KEY = 'ai-model'

export type AiModel = 
  | 'claude-sonnet-4-20250514'
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-opus-20240229'
  | 'claude-3-haiku-20240307'

export function getApiKey(): string | null {
  return localStorage.getItem(API_KEY_STORAGE_KEY)
}

export function setApiKey(key: string): void {
  if (key) {
    localStorage.setItem(API_KEY_STORAGE_KEY, key)
  } else {
    localStorage.removeItem(API_KEY_STORAGE_KEY)
  }
}

export function getAiModel(): AiModel {
  const stored = localStorage.getItem(AI_MODEL_STORAGE_KEY)
  if (stored && isValidModel(stored)) {
    return stored as AiModel
  }
  return 'claude-sonnet-4-20250514'
}

export function setAiModel(model: AiModel): void {
  localStorage.setItem(AI_MODEL_STORAGE_KEY, model)
}

function isValidModel(model: string): model is AiModel {
  return [
    'claude-sonnet-4-20250514',
    'claude-3-5-sonnet-20241022',
    'claude-3-opus-20240229',
    'claude-3-haiku-20240307'
  ].includes(model)
}

export interface TestConnectionResult {
  success: boolean
  message: string
}

export async function testClaudeConnection(
  apiKey: string,
  model: AiModel
): Promise<TestConnectionResult> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model,
        max_tokens: 10,
        messages: [
          { role: 'user', content: 'Say "connected" in one word.' }
        ]
      })
    })

    if (response.ok) {
      return {
        success: true,
        message: `Verbindung erfolgreich! Modell: ${model}`
      }
    }

    const error = await response.json()
    
    if (response.status === 401) {
      return {
        success: false,
        message: 'Ungültiger API-Key. Bitte überprüfe deinen Schlüssel.'
      }
    }
    
    if (response.status === 429) {
      return {
        success: false,
        message: 'Rate Limit erreicht. Bitte warte einen Moment.'
      }
    }

    return {
      success: false,
      message: error.error?.message || 'Unbekannter Fehler'
    }
  } catch (error) {
    return {
      success: false,
      message: 'Netzwerkfehler. Bitte überprüfe deine Internetverbindung.'
    }
  }
}
