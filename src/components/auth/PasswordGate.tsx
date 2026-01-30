import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Lock, Loader2, AlertCircle } from 'lucide-react'

// The password is stored as an environment variable
// Set VITE_APP_PASSWORD in your .env.local file
const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD || 'linkedin2024'

const STORAGE_KEY = 'linkedin-buddy-auth'

interface PasswordGateProps {
  children: React.ReactNode
}

export function PasswordGate({ children }: PasswordGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Check if already authenticated
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === APP_PASSWORD) {
      setIsAuthenticated(true)
    } else {
      setIsAuthenticated(false)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Small delay for UX
    await new Promise(resolve => setTimeout(resolve, 300))

    if (password === APP_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, password)
      setIsAuthenticated(true)
    } else {
      setError('Falsches Passwort')
      setPassword('')
    }

    setIsLoading(false)
  }

  // Still checking auth status
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
      </div>
    )
  }

  // Not authenticated - show password screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-950 to-neutral-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-white flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-xl">LinkedIn Buddy</CardTitle>
            <CardDescription className="text-[13px]">
              Bitte gib dein Passwort ein
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="Passwort"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 text-center text-lg tracking-wider"
                  autoFocus
                  disabled={isLoading}
                />
              </div>
              
              {error && (
                <div className="flex items-center justify-center gap-2 text-red-600 text-[13px]">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full h-11"
                disabled={!password || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Entsperren'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Authenticated - render children
  return <>{children}</>
}

// Utility to logout (can be called from settings)
export function logout() {
  localStorage.removeItem(STORAGE_KEY)
  window.location.reload()
}
