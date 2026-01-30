import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { User, Palette, Bell, Database, CheckCircle, XCircle, Loader2, Bot, Download, Upload, Trash2, RotateCcw, Shield, FileJson, Cloud, RefreshCw, LogOut, Sun, Moon } from 'lucide-react'
// AI settings are now configured via Supabase Secrets (server-side)
import { getSlackWebhookUrl, setSlackWebhookUrl, testSlackWebhook } from '@/lib/slack-notifications'
import { 
  downloadBackup, 
  importBackupData, 
  validateBackupData, 
  clearAllData, 
  getDataStatistics,
  getAutoBackupDate,
  restoreFromAutoBackup,
  type BackupData 
} from '@/lib/data-backup'
import { usePostsStore } from '@/lib/store'
import { logout } from '@/components/auth/PasswordGate'
import { useThemeStore } from '@/stores/themeStore'

export function Settings() {
  // Slack settings
  const [slackWebhook, setSlackWebhook] = useState('')
  const [slackTestStatus, setSlackTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [slackTestMessage, setSlackTestMessage] = useState('')

  // Data backup settings
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [importMessage, setImportMessage] = useState('')
  const [dataStats, setDataStats] = useState(getDataStatistics())
  const [autoBackupDate, setAutoBackupDate] = useState<string | null>(null)

  // Supabase sync
  const isSupabaseLoaded = usePostsStore((state) => state.isSupabaseLoaded)
  const syncAllToSupabase = usePostsStore((state) => state.syncAllToSupabase)
  const loadFromSupabase = usePostsStore((state) => state.loadFromSupabase)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')

  // Check if Supabase is configured
  const isSupabaseConfigured = !!(
    import.meta.env.VITE_SUPABASE_URL && 
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')
  )

  useEffect(() => {
    setSlackWebhook(getSlackWebhookUrl() || '')
    setAutoBackupDate(getAutoBackupDate())
    setDataStats(getDataStatistics())
  }, [])

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white tracking-tight">Einstellungen</h1>
        <p className="text-sm text-neutral-500 mt-1">Verwalte deine App-Einstellungen</p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
              <User className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
            </div>
            <div>
              <CardTitle className="text-sm">Profil</CardTitle>
              <CardDescription className="text-xs">Deine persönlichen Informationen</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Name</Label>
              <Input defaultValue="Simon Schaefer" className="mt-1.5" />
            </div>
            <div>
              <Label className="text-xs">E-Mail</Label>
              <Input defaultValue="simon@scalemaker.com" className="mt-1.5" />
            </div>
          </div>
          <Button size="sm">Speichern</Button>
        </CardContent>
      </Card>

      {/* Appearance Section */}
      <AppearanceSection />

      {/* Slack Notifications Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Bell className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <CardTitle className="text-sm">Slack Benachrichtigungen</CardTitle>
              <CardDescription className="text-xs">Erhalte Erinnerungen wenn Posts Metriken brauchen</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs">Slack Webhook URL</Label>
            <Input 
              type="url" 
              value={slackWebhook}
              onChange={(e) => setSlackWebhook(e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
              className="mt-1.5" 
            />
            <p className="text-xs text-neutral-500 mt-1">
              Erstelle einen{' '}
              <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noopener noreferrer" className="text-amber-500 hover:underline">
                Incoming Webhook
              </a>
              {' '}in deinem Slack Workspace
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              onClick={() => {
                setSlackWebhookUrl(slackWebhook)
                setSlackTestStatus('idle')
              }}
            >
              Speichern
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={async () => {
                if (!slackWebhook) {
                  setSlackTestStatus('error')
                  setSlackTestMessage('Bitte zuerst eine Webhook URL eingeben')
                  return
                }
                setSlackTestStatus('testing')
                const result = await testSlackWebhook(slackWebhook)
                if (result.success) {
                  setSlackTestStatus('success')
                  setSlackTestMessage('Test-Nachricht gesendet!')
                  setSlackWebhookUrl(slackWebhook) // Save on success
                } else {
                  setSlackTestStatus('error')
                  setSlackTestMessage(result.error || 'Verbindung fehlgeschlagen')
                }
              }}
              disabled={slackTestStatus === 'testing'}
            >
              {slackTestStatus === 'testing' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sende...
                </>
              ) : (
                'Test senden'
              )}
            </Button>
          </div>

          {slackTestStatus === 'success' && (
            <div className="flex items-center gap-2 text-green-500 text-xs">
              <CheckCircle className="h-4 w-4" />
              {slackTestMessage}
            </div>
          )}
          {slackTestStatus === 'error' && (
            <div className="flex items-center gap-2 text-red-500 text-xs">
              <XCircle className="h-4 w-4" />
              {slackTestMessage}
            </div>
          )}
          
          <div className="pt-2 border-t border-neutral-800">
            <p className="text-xs text-neutral-500">
              Du erhältst eine Benachrichtigung wenn Posts älter als 7 Tage sind und noch keine Metriken haben. 
              Die Benachrichtigung wird max. 1x pro Tag gesendet.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Cloud Sync Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${isSupabaseConfigured ? 'bg-green-500/20' : 'bg-neutral-100 dark:bg-neutral-800'}`}>
              <Cloud className={`h-5 w-5 ${isSupabaseConfigured ? 'text-green-500' : 'text-neutral-500'}`} />
            </div>
            <div>
              <CardTitle className="text-sm">Cloud Sync (Supabase)</CardTitle>
              <CardDescription className="text-xs">
                {isSupabaseConfigured 
                  ? 'Deine Daten werden automatisch in der Cloud gespeichert'
                  : 'Nicht konfiguriert - Daten werden nur lokal gespeichert'
                }
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isSupabaseConfigured ? (
            <>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/30">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-green-400 font-medium">Verbunden mit Supabase</p>
                  <p className="text-xs text-green-500/80">
                    {isSupabaseLoaded 
                      ? 'Daten wurden von der Cloud geladen' 
                      : 'Lokale Daten werden verwendet'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    setIsSyncing(true)
                    setSyncMessage('')
                    try {
                      await syncAllToSupabase()
                      setSyncMessage('Alle Daten wurden zur Cloud hochgeladen')
                      setDataStats(getDataStatistics())
                    } catch {
                      setSyncMessage('Fehler beim Hochladen')
                    }
                    setIsSyncing(false)
                  }}
                  disabled={isSyncing}
                  className="gap-2"
                >
                  {isSyncing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Zur Cloud hochladen
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    setIsSyncing(true)
                    setSyncMessage('')
                    try {
                      await loadFromSupabase()
                      setSyncMessage('Daten wurden von der Cloud geladen')
                      setDataStats(getDataStatistics())
                    } catch {
                      setSyncMessage('Fehler beim Laden')
                    }
                    setIsSyncing(false)
                  }}
                  disabled={isSyncing}
                  className="gap-2"
                >
                  {isSyncing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Von Cloud laden
                </Button>
              </div>
              
              {syncMessage && (
                <p className="text-xs text-neutral-400">{syncMessage}</p>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <XCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <p className="text-xs text-amber-400">
                  Supabase ist nicht konfiguriert. Daten werden nur im Browser gespeichert.
                </p>
              </div>
              <p className="text-xs text-neutral-500">
                Um Cloud Sync zu aktivieren, füge <code className="bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-700 dark:text-neutral-300">VITE_SUPABASE_URL</code> und{' '}
                <code className="bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-700 dark:text-neutral-300">VITE_SUPABASE_ANON_KEY</code> zu deiner <code className="bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-700 dark:text-neutral-300">.env.local</code> Datei hinzu.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Assistant Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Bot className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <CardTitle className="text-sm">AI Assistent</CardTitle>
              <CardDescription className="text-xs">Claude AI für Hypothesen, Learning-Analyse und Chat</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isSupabaseConfigured ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-purple-500/10 border border-purple-500/30">
                <CheckCircle className="h-4 w-4 text-purple-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-purple-400">AI ist bereit</p>
                  <p className="text-xs text-purple-500/80">Der API Key wird sicher auf dem Server gespeichert</p>
                </div>
              </div>
              
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
                <p className="text-xs font-medium text-neutral-300 mb-2">API Key konfigurieren:</p>
                <ol className="text-xs text-neutral-400 space-y-1 list-decimal list-inside">
                  <li>Gehe zu <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">Supabase Dashboard</a></li>
                  <li>Wähle dein Projekt → Settings → Edge Functions</li>
                  <li>Klicke auf "Manage Secrets"</li>
                  <li>Füge hinzu: <code className="bg-neutral-700 px-1 rounded">ANTHROPIC_API_KEY</code></li>
                  <li>Wert: Dein API Key von <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">Anthropic Console</a></li>
                </ol>
              </div>
              
              <p className="text-xs text-neutral-500">
                Der API Key wird nie im Browser gespeichert oder übertragen - alle AI-Anfragen laufen über sichere Supabase Edge Functions.
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <p className="text-xs font-medium text-amber-400">Supabase nicht konfiguriert</p>
              <p className="text-xs text-amber-500/80 mt-1">
                Konfiguriere zuerst Supabase in deiner .env.local Datei, um die AI-Funktionen zu nutzen.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Database className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-sm">Daten & Backup</CardTitle>
              <CardDescription className="text-xs">Sichere deine Daten und stelle sie bei Bedarf wieder her</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Data Statistics */}
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">Aktuelle Daten</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xl font-semibold text-neutral-900 dark:text-white tabular-nums">{dataStats.postsCount}</p>
                <p className="text-xs text-neutral-500">Posts</p>
              </div>
              <div>
                <p className="text-xl font-semibold text-neutral-900 dark:text-white tabular-nums">{dataStats.templatesCount}</p>
                <p className="text-xs text-neutral-500">Templates</p>
              </div>
              <div>
                <p className="text-xl font-semibold text-neutral-900 dark:text-white tabular-nums">{dataStats.metricsWeeksCount}</p>
                <p className="text-xs text-neutral-500">Wochen Metriken</p>
              </div>
            </div>
          </div>

          {/* Export */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Download className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">Backup erstellen</p>
                <p className="text-xs text-neutral-500">Lade alle deine Daten als JSON herunter</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                downloadBackup()
                setDataStats(getDataStatistics())
              }}
              className="gap-2"
            >
              <FileJson className="h-4 w-4" />
              Exportieren
            </Button>
          </div>

          <Separator />

          {/* Import */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Upload className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">Backup wiederherstellen</p>
                  <p className="text-xs text-neutral-500">Importiere eine zuvor exportierte Backup-Datei</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Importieren
              </Button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return

                try {
                  const text = await file.text()
                  const data = JSON.parse(text) as BackupData

                  const validation = validateBackupData(data)
                  if (!validation.valid) {
                    setImportStatus('error')
                    setImportMessage(validation.error || 'Ungültige Datei')
                    return
                  }

                  const result = importBackupData(data)
                  if (result.success) {
                    setImportStatus('success')
                    setImportMessage(`Backup vom ${new Date(data.exportedAt).toLocaleDateString('de-DE')} erfolgreich importiert. Bitte Seite neu laden.`)
                    setAutoBackupDate(getAutoBackupDate())
                    setDataStats(getDataStatistics())
                  } else {
                    setImportStatus('error')
                    setImportMessage(result.error || 'Import fehlgeschlagen')
                  }
                } catch {
                  setImportStatus('error')
                  setImportMessage('Fehler beim Lesen der Datei')
                }

                // Reset file input
                e.target.value = ''
              }}
            />

            {importStatus === 'success' && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/30">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <p className="text-xs text-green-400">{importMessage}</p>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="ml-auto text-green-400 hover:text-green-300 h-7"
                  onClick={() => window.location.reload()}
                >
                  Neu laden
                </Button>
              </div>
            )}
            {importStatus === 'error' && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-400">{importMessage}</p>
              </div>
            )}

            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <Shield className="h-4 w-4 text-amber-500 flex-shrink-0" />
              <p className="text-xs text-amber-400">
                Vor jedem Import wird automatisch ein Backup erstellt.
              </p>
            </div>
          </div>

          <Separator />

          {/* Auto Backup Restore */}
          {autoBackupDate && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <RotateCcw className="h-4 w-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">Automatisches Backup</p>
                    <p className="text-xs text-neutral-500">
                      Vom {new Date(autoBackupDate).toLocaleDateString('de-DE', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <RotateCcw className="h-4 w-4" />
                      Wiederherstellen
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Auto-Backup wiederherstellen?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Möchtest du den Zustand vor dem letzten Import wiederherstellen? 
                        Aktuelle Daten werden durch das Backup ersetzt.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          const result = restoreFromAutoBackup()
                          if (result.success) {
                            setImportStatus('success')
                            setImportMessage('Auto-Backup wiederhergestellt. Bitte Seite neu laden.')
                          } else {
                            setImportStatus('error')
                            setImportMessage(result.error || 'Wiederherstellung fehlgeschlagen')
                          }
                        }}
                      >
                        Wiederherstellen
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <Separator />
            </>
          )}

          {/* Delete All */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-500/20 flex items-center justify-center">
                <Trash2 className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-400">Alle Daten löschen</p>
                <p className="text-xs text-neutral-500">Ein Backup wird automatisch erstellt</p>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/30 gap-2">
                  <Trash2 className="h-4 w-4" />
                  Löschen
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Alle Daten löschen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Diese Aktion löscht alle deine Posts, Templates, Metriken und Einstellungen. 
                    Ein automatisches Backup wird vorher erstellt, das du wiederherstellen kannst.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => {
                      clearAllData()
                      setAutoBackupDate(getAutoBackupDate())
                      setDataStats(getDataStatistics())
                      setImportStatus('success')
                      setImportMessage('Alle Daten gelöscht. Bitte Seite neu laden.')
                    }}
                  >
                    Endgültig löschen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Logout Section */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                <LogOut className="h-4 w-4 text-neutral-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">Abmelden</p>
                <p className="text-xs text-neutral-500">Passwort wird zurückgesetzt</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={logout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Abmelden
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Appearance Section Component
function AppearanceSection() {
  const { theme, setTheme } = useThemeStore()
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Palette className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <CardTitle className="text-sm">Erscheinungsbild</CardTitle>
            <CardDescription className="text-xs">Passe das Design an</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label className="text-xs mb-3 block">Theme</Label>
            <div className="flex gap-3">
              <button
                onClick={() => setTheme('light')}
                className={`
                  flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all
                  ${theme === 'light' 
                    ? 'border-blue-500 bg-blue-500/10 text-blue-500' 
                    : 'border-neutral-700 hover:border-neutral-600 text-neutral-400 hover:text-neutral-300'
                  }
                `}
              >
                <Sun className="h-5 w-5" />
                <span className="text-sm font-medium">Light</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`
                  flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all
                  ${theme === 'dark' 
                    ? 'border-blue-500 bg-blue-500/10 text-blue-500' 
                    : 'border-neutral-700 hover:border-neutral-600 text-neutral-400 hover:text-neutral-300'
                  }
                `}
              >
                <Moon className="h-5 w-5" />
                <span className="text-sm font-medium">Dark</span>
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
