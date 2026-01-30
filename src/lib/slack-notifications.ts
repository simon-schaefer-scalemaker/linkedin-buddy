// Slack Notification Settings

const SLACK_WEBHOOK_KEY = 'slack_webhook_url'
const LAST_NOTIFICATION_KEY = 'slack_last_notification'

export function getSlackWebhookUrl(): string | null {
  return localStorage.getItem(SLACK_WEBHOOK_KEY)
}

export function setSlackWebhookUrl(url: string): void {
  localStorage.setItem(SLACK_WEBHOOK_KEY, url)
}

export function getLastNotificationTime(): Date | null {
  const stored = localStorage.getItem(LAST_NOTIFICATION_KEY)
  return stored ? new Date(stored) : null
}

export function setLastNotificationTime(date: Date): void {
  localStorage.setItem(LAST_NOTIFICATION_KEY, date.toISOString())
}

export function shouldSendNotification(): boolean {
  const lastNotification = getLastNotificationTime()
  if (!lastNotification) return true
  
  // Only send once per 24 hours
  const hoursSinceLastNotification = (Date.now() - lastNotification.getTime()) / (1000 * 60 * 60)
  return hoursSinceLastNotification >= 24
}

interface PostNeedingMetrics {
  id: string
  platform: string
  title?: string
  publishedAt: string
  daysAgo: number
}

export async function sendSlackNotification(
  postsNeedingMetrics: PostNeedingMetrics[],
  appUrl?: string
): Promise<{ success: boolean; error?: string }> {
  const webhookUrl = getSlackWebhookUrl()
  
  if (!webhookUrl) {
    return { success: false, error: 'Keine Slack Webhook URL konfiguriert' }
  }
  
  if (postsNeedingMetrics.length === 0) {
    return { success: true } // Nothing to notify
  }
  
  if (!shouldSendNotification()) {
    return { success: true } // Already notified today
  }
  
  // Build the Slack message
  const postList = postsNeedingMetrics.slice(0, 5).map(post => {
    const title = post.title || `${post.platform} Post`
    return `• *${title}* (${post.platform}) - vor ${post.daysAgo} Tagen veröffentlicht`
  }).join('\n')
  
  const moreText = postsNeedingMetrics.length > 5 
    ? `\n_...und ${postsNeedingMetrics.length - 5} weitere_` 
    : ''
  
  const message = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '📊 Content OS: Metriken eintragen',
          emoji: true
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Hey! ${postsNeedingMetrics.length} Post${postsNeedingMetrics.length > 1 ? 's' : ''} warten auf Performance-Daten:\n\n${postList}${moreText}`
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '_Trage die Metriken ein, damit die AI aus deinen Posts lernen kann!_'
        }
      },
      ...(appUrl ? [{
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '📈 Jetzt eintragen',
              emoji: true
            },
            url: appUrl,
            style: 'primary'
          }
        ]
      }] : [])
    ]
  }
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message)
    })
    
    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status}`)
    }
    
    setLastNotificationTime(new Date())
    return { success: true }
    
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler'
    }
  }
}

export async function testSlackWebhook(webhookUrl: string): Promise<{ success: boolean; error?: string }> {
  const testMessage = {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '✅ *Content OS* ist erfolgreich mit Slack verbunden!\n\nDu erhältst hier Benachrichtigungen wenn Posts auf Metriken warten.'
        }
      }
    ]
  }
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMessage)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    return { success: true }
    
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Verbindung fehlgeschlagen'
    }
  }
}

// Cutter Video Completion Notification
export interface CutterCompletionInfo {
  postTitle: string
  postId: string
  finalVideoUrl: string
  cutterNotes?: string
}

export async function sendCutterCompletionNotification(
  info: CutterCompletionInfo,
  appUrl?: string
): Promise<{ success: boolean; error?: string }> {
  const webhookUrl = getSlackWebhookUrl()
  
  if (!webhookUrl) {
    return { success: false, error: 'Keine Slack Webhook URL konfiguriert' }
  }
  
  const notesText = info.cutterNotes 
    ? `\n\n📝 *Notizen vom Cutter:*\n${info.cutterNotes}` 
    : ''
  
  const message = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🎬 Video fertig!',
          emoji: true
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Dein Cutter hat ein Video fertiggestellt!\n\n*Post:* ${info.postTitle}${notesText}`
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '▶️ Video ansehen',
              emoji: true
            },
            url: info.finalVideoUrl,
            style: 'primary'
          },
          ...(appUrl ? [{
            type: 'button',
            text: {
              type: 'plain_text',
              text: '📝 Post öffnen',
              emoji: true
            },
            url: `${appUrl}/boards/linkedin/${info.postId}`
          }] : [])
        ]
      }
    ]
  }
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message)
    })
    
    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status}`)
    }
    
    return { success: true }
    
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler'
    }
  }
}
