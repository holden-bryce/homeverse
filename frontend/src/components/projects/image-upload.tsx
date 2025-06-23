'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toast'
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Loader2,
  Star,
  StarOff
} from 'lucide-react'

interface ProjectImage {
  id: string
  url: string
  caption?: string
  is_primary: boolean
  uploaded_at: string
}

interface ImageUploadProps {
  projectId: string
  images: ProjectImage[]
  onImagesUpdate: (images: ProjectImage[]) => void
  canEdit: boolean
}

export function ImageUpload({ projectId, images, onImagesUpdate, canEdit }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPEG, PNG, or WebP image',
        variant: 'destructive'
      })
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB',
        variant: 'destructive'
      })
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('is_primary', images.length === 0 ? 'true' : 'false')

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/projects/${projectId}/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const newImage = await response.json()
      
      // Refresh images
      await fetchImages()
      
      toast({
        title: 'Image uploaded',
        description: 'Your image has been uploaded successfully'
      })
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Upload failed',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const fetchImages = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/projects/${projectId}/images`)
      if (response.ok) {
        const data = await response.json()
        onImagesUpdate(data)
      }
    } catch (error) {
      console.error('Error fetching images:', error)
    }
  }

  const handleDelete = async (imageId: string) => {
    setIsDeletingId(imageId)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/projects/${projectId}/images/${imageId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Delete failed')
      }

      await fetchImages()
      
      toast({
        title: 'Image deleted',
        description: 'The image has been removed'
      })
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: 'Delete failed',
        description: 'Failed to delete image. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsDeletingId(null)
    }
  }

  const handleSetPrimary = async (imageId: string) => {
    // For now, we'd need to update this through a separate endpoint
    // or handle it client-side and update via project update
    toast({
      title: 'Feature coming soon',
      description: 'Setting primary image will be available soon'
    })
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
          <ImageIcon className="mr-2 h-5 w-5 text-sage-600" />
          Project Images
        </CardTitle>
        <CardDescription>
          Upload images to showcase your project
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Upload button */}
        {canEdit && (
          <div className="mb-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              variant="outline"
              className="w-full border-dashed border-2 border-sage-300 hover:border-sage-400"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Image
                </>
              )}
            </Button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              JPEG, PNG, or WebP • Max 5MB
            </p>
          </div>
        )}

        {/* Image grid */}
        {images.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className="relative group rounded-lg overflow-hidden border border-gray-200"
              >
                <img
                  src={image.url}
                  alt={image.caption || 'Project image'}
                  className="w-full h-48 object-cover"
                />
                
                {/* Primary badge */}
                {image.is_primary && (
                  <div className="absolute top-2 left-2 bg-sage-600 text-white px-2 py-1 rounded-full text-xs flex items-center">
                    <Star className="h-3 w-3 mr-1" />
                    Primary
                  </div>
                )}

                {/* Actions overlay */}
                {canEdit && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleSetPrimary(image.id)}
                      disabled={image.is_primary}
                    >
                      <StarOff className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(image.id)}
                      disabled={isDeletingId === image.id}
                    >
                      {isDeletingId === image.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <ImageIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No images uploaded yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}