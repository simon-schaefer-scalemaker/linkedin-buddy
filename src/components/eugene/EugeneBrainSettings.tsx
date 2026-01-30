/**
 * Eugene Brain Settings
 * 
 * Allows users to:
 * - Sync existing posts to Eugene's memory
 * - View memory statistics
 * - Clear/reset Eugene's memory
 */

import { useState } from 'react'
import { Brain, Upload, Trash2, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { usePostsStore } from '@/lib/store'
import { useLearningsStore } from '@/stores/learningsStore'
import { syncPostsToMemory, storeLearningMemory, isMemorySystemAvailable } from '@/lib/eugene-memory'
import { supabase, SINGLE_USER_ID } from '@/lib/supabase'

export function EugeneBrainSettings() {
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ total: number; synced: number; failed: number } | null>(null)
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)
  const [memoryStatus, setMemoryStatus] = useState<{
    available: boolean
    postCount: number
    learningCount: number
    conversationCount: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const posts = usePostsStore((state) => state.posts)
  const learnings = useLearningsStore((state) => state.learnings)
  
  // Check memory system status
  const checkMemoryStatus = async () => {
    setIsCheckingStatus(true)
    setError(null)
    
    try {
      const available = await isMemorySystemAvailable()
      
      if (!available) {
        setMemoryStatus({ available: false, postCount: 0, learningCount: 0, conversationCount: 0 })
        return
      }
      
      // Get counts
      const [postsResult, learningsResult, conversationsResult] = await Promise.all([
        supabase.from('eugene_memory').select('id', { count: 'exact', head: true }).eq('content_type', 'post'),
        supabase.from('eugene_memory').select('id', { count: 'exact', head: true }).eq('content_type', 'learning'),
        supabase.from('eugene_conversations').select('id', { count: 'exact', head: true })
      ])
      
      setMemoryStatus({
        available: true,
        postCount: postsResult.count || 0,
        learningCount: learningsResult.count || 0,
        conversationCount: conversationsResult.count || 0
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Prüfen des Memory-Status')
    } finally {
      setIsCheckingStatus(false)
    }
  }
  
  // Sync all posts to memory
  const handleSyncPosts = async () => {
    setIsSyncing(true)
    setSyncResult(null)
    setError(null)
    
    try {
      // Sync posts
      const publishedPosts = posts.filter(p => p.status === 'published')
      const result = await syncPostsToMemory(publishedPosts)
      
      // Also sync learnings
      let learningsSynced = 0
      for (const learning of learnings) {
        if (learning.keyInsight) {
          const success = await storeLearningMemory({
            id: learning.id,
            postId: learning.postId,
            platform: learning.platform,
            keyInsight: learning.keyInsight,
            whatWorked: learning.whatWorked,
            whatDidntWork: learning.whatDidntWork,
            applyToFuture: learning.applyToFuture,
            outcome: learning.outcome
          })
          if (success) learningsSynced++
        }
      }
      
      setSyncResult({
        total: result.total + learnings.length,
        synced: result.synced + learningsSynced,
        failed: result.failed + (learnings.length - learningsSynced)
      })
      
      // Refresh status
      await checkMemoryStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Synchronisieren')
    } finally {
      setIsSyncing(false)
    }
  }
  
  // Clear Eugene's memory
  const handleClearMemory = async () => {
    if (!confirm('Bist du sicher? Dies löscht alle Erinnerungen von Eugene.')) {
      return
    }
    
    setError(null)
    
    try {
      await Promise.all([
        supabase.from('eugene_memory').delete().eq('user_id', SINGLE_USER_ID),
        supabase.from('eugene_conversations').delete().eq('user_id', SINGLE_USER_ID),
        supabase.from('eugene_insights').delete().eq('user_id', SINGLE_USER_ID)
      ])
      
      setSyncResult(null)
      await checkMemoryStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Löschen')
    }
  }
  
  return (
    <Card className="border-neutral-800 bg-neutral-900">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-white">Eugene's Gehirn</CardTitle>
            <CardDescription className="text-neutral-500">
              Vektor-Datenbank für semantische Suche & Langzeit-Gedächtnis
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Check */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-400">Memory System Status</span>
            <Button
              variant="outline"
              size="sm"
              onClick={checkMemoryStatus}
              disabled={isCheckingStatus}
              className="border-neutral-700"
            >
              {isCheckingStatus ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">Status prüfen</span>
            </Button>
          </div>
          
          {memoryStatus && (
            <div className="rounded-lg border border-neutral-800 p-4 space-y-3">
              <div className="flex items-center gap-2">
                {memoryStatus.available ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-500">Verbunden</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <span className="text-sm text-amber-500">Nicht konfiguriert</span>
                  </>
                )}
              </div>
              
              {memoryStatus.available && (
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{memoryStatus.postCount}</div>
                    <div className="text-xs text-neutral-500">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{memoryStatus.learningCount}</div>
                    <div className="text-xs text-neutral-500">Learnings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{memoryStatus.conversationCount}</div>
                    <div className="text-xs text-neutral-500">Gespräche</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Sync Button */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-400">Daten synchronisieren</p>
              <p className="text-xs text-neutral-600">
                {posts.filter(p => p.status === 'published').length} Posts, {learnings.length} Learnings
              </p>
            </div>
            <Button
              onClick={handleSyncPosts}
              disabled={isSyncing}
              className="bg-white text-black hover:bg-neutral-200"
            >
              {isSyncing ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Sync starten
            </Button>
          </div>
          
          {syncResult && (
            <div className="rounded-lg border border-neutral-800 p-3 bg-neutral-800/50">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-neutral-300">
                  {syncResult.synced} von {syncResult.total} synchronisiert
                </span>
                {syncResult.failed > 0 && (
                  <span className="text-amber-500">({syncResult.failed} fehlgeschlagen)</span>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Clear Memory */}
        <div className="pt-4 border-t border-neutral-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-400">Gedächtnis zurücksetzen</p>
              <p className="text-xs text-neutral-600">Alle Erinnerungen löschen</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearMemory}
              className="border-red-900 text-red-500 hover:bg-red-950"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Löschen
            </Button>
          </div>
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="rounded-lg border border-red-900 bg-red-950/50 p-3">
            <div className="flex items-center gap-2 text-sm text-red-400">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          </div>
        )}
        
        {/* Setup Instructions */}
        {memoryStatus && !memoryStatus.available && (
          <div className="rounded-lg border border-amber-900/50 bg-amber-950/20 p-4 space-y-2">
            <h4 className="text-sm font-medium text-amber-500">Setup erforderlich</h4>
            <ol className="text-xs text-neutral-400 space-y-1 list-decimal list-inside">
              <li>Öffne das Supabase Dashboard</li>
              <li>Führe das SQL-Script <code className="text-amber-400">eugene-brain.sql</code> aus</li>
              <li>Füge <code className="text-amber-400">OPENAI_API_KEY</code> zu den Secrets hinzu</li>
              <li>Deploye die Edge Function oder Vercel API Route</li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
