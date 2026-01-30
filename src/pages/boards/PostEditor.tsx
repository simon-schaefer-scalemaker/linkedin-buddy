import { useParams } from 'react-router-dom'
import { Component, ErrorInfo, ReactNode } from 'react'
import { LinkedInPostForm } from '@/components/posts/linkedin-post-form'
import { YouTubePostForm } from '@/components/posts/youtube-post-form'
import { InstagramPostForm } from '@/components/posts/instagram-post-form'
import { SkoolPostForm } from '@/components/posts/skool-post-form'
import type { PlatformId } from '@/lib/types'

// Error Boundary to catch and display errors
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('PostEditor Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl m-4">
          <h2 className="text-xl font-bold mb-4 text-red-300">Fehler beim Laden des Formulars</h2>
          <p className="mb-2"><strong className="text-red-300">Fehler:</strong> {this.state.error?.message}</p>
          <pre className="bg-red-500/10 p-4 rounded-lg text-sm overflow-auto max-h-64 border border-red-500/20">
            {this.state.error?.stack}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500"
          >
            Seite neu laden
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export function PostEditor() {
  const { platform } = useParams<{ platform: PlatformId; id: string }>()

  const getForm = () => {
    switch (platform) {
      case 'linkedin':
        return <LinkedInPostForm />
      case 'youtube':
        return <YouTubePostForm />
      case 'instagram':
        return <InstagramPostForm />
      case 'skool':
        return <SkoolPostForm />
      default:
        return <div>Plattform nicht gefunden</div>
    }
  }

  return (
    <ErrorBoundary>
      {getForm()}
    </ErrorBoundary>
  )
}
