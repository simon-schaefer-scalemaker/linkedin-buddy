import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { User, Palette, Bell, Database, CheckCircle, XCircle, Loader2, Bot, Download, Upload, Trash2, RotateCcw, Shield, FileJson, Cloud, RefreshCw, LogOut } from 'lucide-react'
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
        <h1 className="text-[22px] font-medium text-gray-900">Einstellungen</h1>
        <p className="text-[13px] text-gray-400 mt-1">Verwalte deine App-Einstellungen</p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <User className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <CardTitle className="text-[14px]">Profil</CardTitle>
              <CardDescription className="text-[12px]">Deine persönlichen Informationen</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[12px]">Name</Label>
              <Input defaultValue="Simon Schaefer" className="mt-1.5" />
            </div>
            <div>
              <Label className="text-[12px]">E-Mail</Label>
              <Input defaultValue="simon@scalemaker.com" className="mt-1.5" />
            </div>
          </div>
          <Button size="sm">Speichern</Button>
        </CardContent>
      </Card>

      {/* Appearance Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <Palette className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <CardTitle className="text-[14px]">Erscheinungsbild</CardTitle>
              <CardDescription className="text-[12px]">Passe das Design an</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-gray-900">Theme</p>
              <p className="text-[12px] text-gray-400">Aktuell: Light Mode</p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Dark Mode (bald)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Slack Notifications Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Bell className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-[14px]">Slack Benachrichtigungen</CardTitle>
              <CardDescription className="text-[12px]">Erhalte Erinnerungen wenn Posts Metriken brauchen</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-[12px]">Slack Webhook URL</Label>
            <Input 
              type="url" 
              value={slackWebhook}
              onChange={(e) => setSlackWebhook(e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
              className="mt-1.5" 
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Erstelle einen{' '}
              <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">
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
            <div className="flex items-center gap-2 text-green-600 text-[12px]">
              <CheckCircle className="h-4 w-4" />
              {slackTestMessage}
            </div>
          )}
          {slackTestStatus === 'error' && (
            <div className="flex items-center gap-2 text-red-600 text-[12px]">
              <XCircle className="h-4 w-4" />
              {slackTestMessage}
            </div>
          )}
          
          <div className="pt-2 border-t">
            <p className="text-[11px] text-gray-500">
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
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSupabaseConfigured ? 'bg-green-100' : 'bg-gray-100'}`}>
              <Cloud className={`h-5 w-5 ${isSupabaseConfigured ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <CardTitle className="text-[14px]">Cloud Sync (Supabase)</CardTitle>
              <CardDescription className="text-[12px]">
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
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-[12px] text-green-700 font-medium">Verbunden mit Supabase</p>
                  <p className="text-[11px] text-green-600">
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
                <p className="text-[12px] text-gray-600">{syncMessage}</p>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <XCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <p className="text-[12px] text-amber-700">
                  Supabase ist nicht konfiguriert. Daten werden nur im Browser gespeichert.
                </p>
              </div>
              <p className="text-[11px] text-gray-500">
                Um Cloud Sync zu aktivieren, füge <code className="bg-gray-100 px-1 rounded">VITE_SUPABASE_URL</code> und{' '}
                <code className="bg-gray-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> zu deiner <code className="bg-gray-100 px-1 rounded">.env.local</code> Datei hinzu.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Assistant Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Bot className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-[14px]">AI Assistent</CardTitle>
              <CardDescription className="text-[12px]">Claude AI für Hypothesen, Learning-Analyse und Chat</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isSupabaseConfigured ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-50 border border-purple-200">
                <CheckCircle className="h-4 w-4 text-purple-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-[12px] font-medium text-purple-900">AI ist bereit</p>
                  <p className="text-[11px] text-purple-600">Der API Key wird sicher auf dem Server gespeichert</p>
                </div>
              </div>
              
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                <p className="text-[12px] font-medium text-gray-700 mb-2">API Key konfigurieren:</p>
                <ol className="text-[11px] text-gray-600 space-y-1 list-decimal list-inside">
                  <li>Gehe zu <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">Supabase Dashboard</a></li>
                  <li>Wähle dein Projekt → Settings → Edge Functions</li>
                  <li>Klicke auf "Manage Secrets"</li>
                  <li>Füge hinzu: <code className="bg-gray-100 px-1 rounded">ANTHROPIC_API_KEY</code></li>
                  <li>Wert: Dein API Key von <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">Anthropic Console</a></li>
                </ol>
              </div>
              
              <p className="text-[11px] text-gray-500">
                Der API Key wird nie im Browser gespeichert oder übertragen - alle AI-Anfragen laufen über sichere Supabase Edge Functions.
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-[12px] font-medium text-amber-800">Supabase nicht konfiguriert</p>
              <p className="text-[11px] text-amber-700 mt-1">
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
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Database className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-[14px]">Daten & Backup</CardTitle>
              <CardDescription className="text-[12px]">Sichere deine Daten und stelle sie bei Bedarf wieder her</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Data Statistics */}
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
            <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-2">Aktuelle Daten</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-[18px] font-semibold text-gray-900">{dataStats.postsCount}</p>
                <p className="text-[11px] text-gray-500">Posts</p>
              </div>
              <div>
                <p className="text-[18px] font-semibold text-gray-900">{dataStats.templatesCount}</p>
                <p className="text-[11px] text-gray-500">Templates</p>
              </div>
              <div>
                <p className="text-[18px] font-semibold text-gray-900">{dataStats.metricsWeeksCount}</p>
                <p className="text-[11px] text-gray-500">Wochen Metriken</p>
              </div>
            </div>
          </div>

          {/* Export */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                <Download className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-gray-900">Backup erstellen</p>
                <p className="text-[12px] text-gray-400">Lade alle deine Daten als JSON herunter</p>
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
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Upload className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-gray-900">Backup wiederherstellen</p>
                  <p className="text-[12px] text-gray-400">Importiere eine zuvor exportierte Backup-Datei</p>
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
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <p className="text-[12px] text-green-700">{importMessage}</p>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="ml-auto text-green-700 hover:text-green-800 h-7"
                  onClick={() => window.location.reload()}
                >
                  Neu laden
                </Button>
              </div>
            )}
            {importStatus === 'error' && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <p className="text-[12px] text-red-700">{importMessage}</p>
              </div>
            )}

            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
              <Shield className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <p className="text-[11px] text-amber-700">
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
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                    <RotateCcw className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-gray-900">Automatisches Backup</p>
                    <p className="text-[12px] text-gray-400">
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
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                <Trash2 className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-red-600">Alle Daten löschen</p>
                <p className="text-[12px] text-gray-400">Ein Backup wird automatisch erstellt</p>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2">
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
                    className="bg-red-600 hover:bg-red-700"
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
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <LogOut className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-gray-900">Abmelden</p>
                <p className="text-[12px] text-gray-400">Passwort wird zurückgesetzt</p>
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
