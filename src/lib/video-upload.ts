import { supabase } from './supabase'

export type VideoType = 'raw' | 'final'

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
  path?: string
}

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  
  return !!(
    url && 
    key && 
    url !== 'https://placeholder.supabase.co' && 
    key !== 'placeholder-key'
  )
}

/**
 * Generate a unique file path for video storage
 */
function generateFilePath(postId: string, type: VideoType, fileName: string): string {
  const timestamp = Date.now()
  const extension = fileName.split('.').pop() || 'mp4'
  return `${type}/${postId}/${timestamp}.${extension}`
}

/**
 * Upload a video file to Supabase Storage
 */
export async function uploadVideo(
  file: File, 
  type: VideoType, 
  postId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: 'Supabase ist nicht konfiguriert. Bitte VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY in der .env Datei setzen.'
    }
  }

  const filePath = generateFilePath(postId, type, file.name)

  try {
    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('videos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return {
        success: false,
        error: error.message
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('videos')
      .getPublicUrl(filePath)

    return {
      success: true,
      url: urlData.publicUrl,
      path: filePath
    }
  } catch (err) {
    console.error('Upload exception:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unbekannter Fehler beim Upload'
    }
  }
}

/**
 * Delete a video from Supabase Storage
 */
export async function deleteVideo(path: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase ist nicht konfiguriert' }
  }

  try {
    const { error } = await supabase.storage
      .from('videos')
      .remove([path])

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unbekannter Fehler beim Löschen'
    }
  }
}

/**
 * Get public URL for a video
 */
export function getVideoUrl(path: string): string | null {
  if (!isSupabaseConfigured() || !path) {
    return null
  }

  const { data } = supabase.storage
    .from('videos')
    .getPublicUrl(path)

  return data.publicUrl
}

/**
 * Validate video file
 */
export function validateVideoFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 500 * 1024 * 1024 // 500MB
  const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo']

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Ungültiges Format. Erlaubt: MP4, MOV, WebM, AVI`
    }
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Datei zu groß. Maximum: 500MB (aktuell: ${Math.round(file.size / 1024 / 1024)}MB)`
    }
  }

  return { valid: true }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
