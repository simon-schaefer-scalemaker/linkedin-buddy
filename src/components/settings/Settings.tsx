import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { User, Palette, Bell, Database, Key } from 'lucide-react'

export function Settings() {
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

      {/* Notifications Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <Bell className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <CardTitle className="text-[14px]">Benachrichtigungen</CardTitle>
              <CardDescription className="text-[12px]">Verwalte deine Benachrichtigungen</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-[13px] text-gray-400">Benachrichtigungen sind derzeit deaktiviert</p>
        </CardContent>
      </Card>

      {/* API Keys Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <Key className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <CardTitle className="text-[14px]">API-Schlüssel</CardTitle>
              <CardDescription className="text-[12px]">Verwalte deine API-Verbindungen</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-[12px]">Claude API Key</Label>
            <Input type="password" defaultValue="sk-ant-..." className="mt-1.5" />
          </div>
          <Button size="sm">Aktualisieren</Button>
        </CardContent>
      </Card>

      {/* Data Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <Database className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <CardTitle className="text-[14px]">Daten</CardTitle>
              <CardDescription className="text-[12px]">Exportiere oder lösche deine Daten</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-gray-900">Daten exportieren</p>
              <p className="text-[12px] text-gray-400">Lade alle deine Daten als JSON herunter</p>
            </div>
            <Button variant="outline" size="sm">
              Exportieren
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-red-600">Alle Daten löschen</p>
              <p className="text-[12px] text-gray-400">Diese Aktion kann nicht rückgängig gemacht werden</p>
            </div>
            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
              Löschen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
