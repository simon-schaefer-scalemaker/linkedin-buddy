/**
 * Data Backup & Restore Utilities
 * 
 * Handles export and import of all application data stored in LocalStorage.
 * All Zustand stores with persist middleware are included.
 */

// LocalStorage keys used by the application
const STORAGE_KEYS = {
  posts: 'content-os-posts',
  goals: 'content-os-goals',
  templates: 'content-os-templates',
  cutterShares: 'content-os-cutter-shares',
  globalSettings: 'content-os-global-settings',
  metrics: 'metrics-storage',
  chat: 'ai-chat-storage',
  // Settings stored separately (not in Zustand)
  aiApiKey: 'claude-api-key',
  aiModel: 'claude-model',
  slackWebhook: 'slack-webhook-url',
} as const

export interface BackupData {
  version: number
  exportedAt: string
  data: {
    posts: unknown
    goals: unknown
    templates: unknown
    cutterShares: unknown
    globalSettings: unknown
    metrics: unknown
    chat: unknown
    settings: {
      aiApiKey: string | null
      aiModel: string | null
      slackWebhook: string | null
    }
  }
}

/**
 * Export all application data as a JSON object
 */
export function exportAllData(): BackupData {
  const getData = (key: string) => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      posts: getData(STORAGE_KEYS.posts),
      goals: getData(STORAGE_KEYS.goals),
      templates: getData(STORAGE_KEYS.templates),
      cutterShares: getData(STORAGE_KEYS.cutterShares),
      globalSettings: getData(STORAGE_KEYS.globalSettings),
      metrics: getData(STORAGE_KEYS.metrics),
      chat: getData(STORAGE_KEYS.chat),
      settings: {
        aiApiKey: localStorage.getItem(STORAGE_KEYS.aiApiKey),
        aiModel: localStorage.getItem(STORAGE_KEYS.aiModel),
        slackWebhook: localStorage.getItem(STORAGE_KEYS.slackWebhook),
      }
    }
  }
}

/**
 * Download the backup data as a JSON file
 */
export function downloadBackup(): void {
  const data = exportAllData()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const date = new Date().toISOString().split('T')[0]
  const filename = `linkedin-buddy-backup-${date}.json`
  
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Validate backup data structure
 */
export function validateBackupData(data: unknown): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Ungültiges Backup-Format' }
  }

  const backup = data as BackupData
  
  if (!backup.version || typeof backup.version !== 'number') {
    return { valid: false, error: 'Backup-Version fehlt' }
  }

  if (!backup.exportedAt || typeof backup.exportedAt !== 'string') {
    return { valid: false, error: 'Export-Datum fehlt' }
  }

  if (!backup.data || typeof backup.data !== 'object') {
    return { valid: false, error: 'Backup-Daten fehlen' }
  }

  return { valid: true }
}

/**
 * Create an automatic backup before import (stored in localStorage)
 */
export function createAutoBackup(): void {
  const backup = exportAllData()
  localStorage.setItem('content-os-auto-backup', JSON.stringify(backup))
  localStorage.setItem('content-os-auto-backup-date', new Date().toISOString())
}

/**
 * Get the last auto backup
 */
export function getAutoBackup(): BackupData | null {
  try {
    const raw = localStorage.getItem('content-os-auto-backup')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * Get the date of the last auto backup
 */
export function getAutoBackupDate(): string | null {
  return localStorage.getItem('content-os-auto-backup-date')
}

/**
 * Import backup data, replacing all current data
 * Creates an auto-backup before importing
 */
export function importBackupData(backup: BackupData): { success: boolean; error?: string } {
  // Validate first
  const validation = validateBackupData(backup)
  if (!validation.valid) {
    return { success: false, error: validation.error }
  }

  try {
    // Create auto backup before import
    createAutoBackup()

    // Import each store
    const { data } = backup

    if (data.posts) {
      localStorage.setItem(STORAGE_KEYS.posts, JSON.stringify(data.posts))
    }
    if (data.goals) {
      localStorage.setItem(STORAGE_KEYS.goals, JSON.stringify(data.goals))
    }
    if (data.templates) {
      localStorage.setItem(STORAGE_KEYS.templates, JSON.stringify(data.templates))
    }
    if (data.cutterShares) {
      localStorage.setItem(STORAGE_KEYS.cutterShares, JSON.stringify(data.cutterShares))
    }
    if (data.globalSettings) {
      localStorage.setItem(STORAGE_KEYS.globalSettings, JSON.stringify(data.globalSettings))
    }
    if (data.metrics) {
      localStorage.setItem(STORAGE_KEYS.metrics, JSON.stringify(data.metrics))
    }
    if (data.chat) {
      localStorage.setItem(STORAGE_KEYS.chat, JSON.stringify(data.chat))
    }

    // Import simple settings
    if (data.settings) {
      if (data.settings.aiApiKey) {
        localStorage.setItem(STORAGE_KEYS.aiApiKey, data.settings.aiApiKey)
      }
      if (data.settings.aiModel) {
        localStorage.setItem(STORAGE_KEYS.aiModel, data.settings.aiModel)
      }
      if (data.settings.slackWebhook) {
        localStorage.setItem(STORAGE_KEYS.slackWebhook, data.settings.slackWebhook)
      }
    }

    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Import' 
    }
  }
}

/**
 * Restore from auto backup
 */
export function restoreFromAutoBackup(): { success: boolean; error?: string } {
  const backup = getAutoBackup()
  if (!backup) {
    return { success: false, error: 'Kein automatisches Backup vorhanden' }
  }

  return importBackupData(backup)
}

/**
 * Clear all application data
 */
export function clearAllData(): void {
  // Create backup first
  createAutoBackup()
  
  // Clear all stores
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key)
  })
}

/**
 * Get statistics about current data
 */
export function getDataStatistics(): {
  postsCount: number
  metricsWeeksCount: number
  templatesCount: number
  cutterSharesCount: number
  chatMessagesCount: number
} {
  const getData = (key: string) => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  const posts = getData(STORAGE_KEYS.posts)
  const metrics = getData(STORAGE_KEYS.metrics)
  const templates = getData(STORAGE_KEYS.templates)
  const cutterShares = getData(STORAGE_KEYS.cutterShares)
  const chat = getData(STORAGE_KEYS.chat)

  // Count posts
  const postsCount = posts?.state?.posts?.length ?? 0

  // Count metrics weeks (sum of all platforms)
  const metricsWeeksCount = metrics?.state 
    ? (metrics.state.linkedinMetrics?.length ?? 0) +
      (metrics.state.youtubeMetrics?.length ?? 0) +
      (metrics.state.instagramMetrics?.length ?? 0) +
      (metrics.state.skoolMetrics?.length ?? 0)
    : 0

  // Count templates
  const templatesCount = templates?.state?.templates?.length ?? 0

  // Count cutter shares
  const cutterSharesCount = cutterShares?.state?.shares?.length ?? 0

  // Count chat messages
  let chatMessagesCount = 0
  if (chat?.state?.chats) {
    Object.values(chat.state.chats).forEach((messages: unknown) => {
      if (Array.isArray(messages)) {
        chatMessagesCount += messages.length
      }
    })
  }

  return {
    postsCount,
    metricsWeeksCount,
    templatesCount,
    cutterSharesCount,
    chatMessagesCount,
  }
}
