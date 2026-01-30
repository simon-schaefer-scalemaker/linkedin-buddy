import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Plus, ExternalLink, RefreshCw, Users, Eye, Heart, MessageSquare, Linkedin, Youtube, Instagram, ArrowLeft, LayoutGrid, List, Search } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MOCK_TRACKED_PROFILES, getTrackedProfilesByPlatform, getTrackedContentByProfile } from '@/lib/mock-data'
import { PLATFORMS, TRACKED_CONTENT_STATUSES } from '@/lib/constants'
import type { PlatformId } from '@/lib/types'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { cn } from '@/lib/utils'

const platformIcons = {
  linkedin: Linkedin,
  youtube: Youtube,
  instagram: Instagram
}

const platformLabels: Record<string, { singular: string; plural: string }> = {
  youtube: { singular: 'Channel', plural: 'Channels' },
  instagram: { singular: 'Creator', plural: 'Creators' },
  linkedin: { singular: 'Profil', plural: 'Profile' }
}

const trackingPlatforms: PlatformId[] = ['linkedin', 'youtube', 'instagram']

export function BrainstormingPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentPlatform = (searchParams.get('platform') as PlatformId) || 'youtube'
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newUrl, setNewUrl] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')

  const allProfiles = getTrackedProfilesByPlatform(currentPlatform)
  const platformData = PLATFORMS[currentPlatform]
  const labels = platformLabels[currentPlatform]
  
  // Filter profiles by search query
  const profiles = allProfiles.filter(profile => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      profile.name.toLowerCase().includes(query) ||
      profile.handle.toLowerCase().includes(query)
    )
  })

  const handlePlatformChange = (platform: PlatformId) => {
    setSearchParams({ platform })
  }

  const handleAddProfile = () => {
    console.log('Adding profile:', newUrl)
    setAddDialogOpen(false)
    setNewUrl('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-medium text-gray-900">Brainstorming</h1>
          <p className="text-[13px] text-gray-400 mt-1">Tracke Content von anderen Creators für Inspiration</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center border border-gray-200 rounded-lg p-0.5 bg-gray-50">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === 'grid' 
                  ? "bg-white shadow-sm text-gray-900" 
                  : "text-gray-400 hover:text-gray-600"
              )}
              title="Kartenansicht"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === 'list' 
                  ? "bg-white shadow-sm text-gray-900" 
                  : "text-gray-400 hover:text-gray-600"
              )}
              title="Listenansicht"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          
          <Button variant="outline" size="sm" asChild>
            <Link to={`/boards?platform=${currentPlatform}`}>
              <LayoutGrid className="h-4 w-4 mr-2" />
              Board
            </Link>
          </Button>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {labels.singular} hinzufügen
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{labels.singular} hinzufügen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-[13px] font-medium text-gray-700 mb-1.5 block">
                  {platformData.name} URL
                </label>
                <Input
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder={`https://${currentPlatform}.com/...`}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button onClick={handleAddProfile} disabled={!newUrl}>
                  Hinzufügen
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Platform Selector + Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          {trackingPlatforms.map((platform) => {
            const PlatformIconComponent = platformIcons[platform as keyof typeof platformIcons]
            const isActive = platform === currentPlatform
            const pData = PLATFORMS[platform]
            
            return (
              <button
                key={platform}
                onClick={() => handlePlatformChange(platform)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all",
                  isActive 
                    ? "text-white shadow-sm" 
                    : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900"
                )}
                style={isActive ? { backgroundColor: pData.color } : undefined}
              >
                <PlatformIconComponent className="h-4 w-4" />
                {pData.name}
              </button>
            )
          })}
        </div>
        
        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Creator suchen..."
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Profiles Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map(profile => {
            const content = getTrackedContentByProfile(profile.id)
            const newContent = content.filter(c => c.status === 'new').length
            
            return (
              <Card key={profile.id} className="hover:border-gray-200 hover:shadow-sm transition-all h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-lg font-medium">
                        {profile.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link to={`/brainstorming/${currentPlatform}/${profile.id}`}>
                          <h3 className="text-[14px] font-medium text-gray-900 truncate hover:text-gray-600">{profile.name}</h3>
                        </Link>
                        <p className="text-[12px] text-gray-400 truncate">{profile.handle}</p>
                      </div>
                      <a
                        href={profile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Profil öffnen"
                      >
                        <ExternalLink className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      </a>
                    </div>
                    
                    {newContent > 0 && (
                      <Badge variant="secondary" className="mb-3">
                        {newContent} neu
                      </Badge>
                    )}
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-2 rounded-lg bg-gray-50">
                        <p className="text-[18px] font-light text-gray-900">
                          {profile.followers > 1000000 
                            ? `${(profile.followers / 1000000).toFixed(1)}M`
                            : profile.followers > 1000
                              ? `${(profile.followers / 1000).toFixed(0)}K`
                              : profile.followers
                          }
                        </p>
                        <p className="text-[11px] text-gray-400">Followers</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-gray-50">
                        <p className="text-[18px] font-light text-gray-900">{content.length}</p>
                        <p className="text-[11px] text-gray-400">Content</p>
                      </div>
                    </div>

                    {/* URL */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <a 
                        href={profile.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[11px] text-gray-400 hover:text-gray-600 truncate block"
                      >
                        {profile.url}
                      </a>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400">
                      <span>Zuletzt: {profile.lastScrapedAt ? format(new Date(profile.lastScrapedAt), "d. MMM", { locale: de }) : 'Nie'}</span>
                      <Link to={`/brainstorming/${currentPlatform}/${profile.id}`} className="text-gray-400 hover:text-gray-600">
                        Details →
                      </Link>
                    </div>
                  </CardContent>
                </Card>
            )
          })}
        </div>
      )}
      
      {/* Profiles List View */}
      {viewMode === 'list' && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Creator</TableHead>
                <TableHead className="text-right">Followers</TableHead>
                <TableHead className="text-right">Content</TableHead>
                <TableHead>Zuletzt gescraped</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map(profile => {
                const content = getTrackedContentByProfile(profile.id)
                const newContent = content.filter(c => c.status === 'new').length
                
                return (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm font-medium shrink-0">
                          {profile.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <Link to={`/brainstorming/${currentPlatform}/${profile.id}`}>
                            <p className="text-[13px] font-medium text-gray-900 hover:text-gray-600 truncate">{profile.name}</p>
                          </Link>
                          <p className="text-[11px] text-gray-400 truncate">{profile.handle}</p>
                        </div>
                        {newContent > 0 && (
                          <Badge variant="secondary" className="ml-2 shrink-0">
                            {newContent} neu
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-[13px] text-gray-700">
                        {profile.followers > 1000000 
                          ? `${(profile.followers / 1000000).toFixed(1)}M`
                          : profile.followers > 1000
                            ? `${(profile.followers / 1000).toFixed(0)}K`
                            : profile.followers
                        }
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-[13px] text-gray-700">{content.length}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-[12px] text-gray-500">
                        {profile.lastScrapedAt ? format(new Date(profile.lastScrapedAt), "d. MMM yyyy", { locale: de }) : 'Nie'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/brainstorming/${currentPlatform}/${profile.id}`}>
                            Details
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={profile.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              {profiles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                    {searchQuery 
                      ? `Keine Ergebnisse für "${searchQuery}"`
                      : `Keine ${labels.plural} getrackt`
                    }
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {profiles.length === 0 && viewMode === 'grid' && (
        <Card>
          <CardContent className="p-12 text-center">
            {searchQuery ? (
              <>
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-[15px] font-medium text-gray-900 mb-1">Keine Ergebnisse für "{searchQuery}"</h3>
                <p className="text-[13px] text-gray-400 mb-4">
                  Versuche einen anderen Suchbegriff
                </p>
                <Button variant="outline" onClick={() => setSearchQuery('')}>
                  Suche zurücksetzen
                </Button>
              </>
            ) : (
              <>
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-[15px] font-medium text-gray-900 mb-1">Keine {labels.plural} getrackt</h3>
                <p className="text-[13px] text-gray-400 mb-4">
                  Füge {labels.plural} hinzu um deren Content zu verfolgen
                </p>
                <Button onClick={() => setAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ersten {labels.singular} hinzufügen
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Profile Detail Page Component
export function BrainstormingProfileDetail() {  
  const navigate = useNavigate()
  
  // Get ID and platform from URL path
  const pathParts = window.location.pathname.split('/')
  const id = pathParts[pathParts.length - 1]
  const platform = pathParts[pathParts.length - 2] as PlatformId
  
  const profile = MOCK_TRACKED_PROFILES.find(p => p.id === id)
  const content = profile ? getTrackedContentByProfile(profile.id) : []
  const [activeTab, setActiveTab] = useState('new')

  if (!profile) {
    return <div>Profil nicht gefunden</div>
  }
  
  const handleBack = () => {
    navigate(`/brainstorming?platform=${platform}`)
  }

  const filteredContent = activeTab === 'all' 
    ? content 
    : content.filter(c => c.status === activeTab)

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button 
        onClick={handleBack}
        className="flex items-center gap-2 text-[13px] text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zur Übersicht
      </button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-2xl font-medium">
            {profile.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-[22px] font-medium text-gray-900">{profile.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[13px] text-gray-400">{profile.handle}</span>
              <Badge variant="secondary">
                {profile.followers > 1000000 
                  ? `${(profile.followers / 1000000).toFixed(1)}M`
                  : profile.followers > 1000
                    ? `${(profile.followers / 1000).toFixed(0)}K`
                    : profile.followers
                } Followers
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={profile.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Öffnen
            </a>
          </Button>
          <Button size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Scrapen
          </Button>
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="new">
            Neu ({content.filter(c => c.status === 'new').length})
          </TabsTrigger>
          <TabsTrigger value="backlog">
            Backlog ({content.filter(c => c.status === 'backlog').length})
          </TabsTrigger>
          <TabsTrigger value="repurpose">
            Repurpose ({content.filter(c => c.status === 'repurpose').length})
          </TabsTrigger>
          <TabsTrigger value="all">
            Alle ({content.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Content</TableHead>
                  <TableHead>Metriken</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContent.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="max-w-md">
                        {item.title && (
                          <p className="text-[13px] font-medium text-gray-900 truncate">{item.title}</p>
                        )}
                        <p className="text-[12px] text-gray-500 truncate">{item.content.slice(0, 100)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 text-[12px] text-gray-500">
                        {item.metrics?.views && (
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {item.metrics.views > 1000 ? `${(item.metrics.views / 1000).toFixed(1)}k` : item.metrics.views}
                          </span>
                        )}
                        {item.metrics?.likes && (
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {item.metrics.likes > 1000 ? `${(item.metrics.likes / 1000).toFixed(1)}k` : item.metrics.likes}
                          </span>
                        )}
                        {item.metrics?.comments && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {item.metrics.comments}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[12px] text-gray-500">
                        {format(new Date(item.publishedAt), "d. MMM yyyy", { locale: de })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary"
                        className={cn(
                          TRACKED_CONTENT_STATUSES[item.status].bgColor,
                          TRACKED_CONTENT_STATUSES[item.status].color
                        )}
                      >
                        {TRACKED_CONTENT_STATUSES[item.status].name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={item.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredContent.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                      Kein Content in dieser Kategorie
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
