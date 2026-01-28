import { useParams } from 'react-router-dom'
import { LinkedInPostForm } from '@/components/posts/linkedin-post-form'
import { YouTubePostForm } from '@/components/posts/youtube-post-form'
import { InstagramPostForm } from '@/components/posts/instagram-post-form'
import { SkoolPostForm } from '@/components/posts/skool-post-form'
import type { PlatformId } from '@/lib/types'

export function PostEditor() {
  const { platform } = useParams<{ platform: PlatformId; id: string }>()

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
