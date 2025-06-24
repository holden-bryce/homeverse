'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/toast'
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Loader2,
  Star
} from 'lucide-react'
import { uploadProjectImage, deleteProjectImage } from '@/app/dashboard/projects/actions'

interface ProjectImage {
  id: string
  url: string
  caption?: string | null
  is_primary: boolean
  uploaded_at: string
}

interface ProjectImagesProps {
  projectId: string
  images: ProjectImage[]
  canEdit: boolean
}

export function ProjectImages({ projectId, images = [], canEdit }: ProjectImagesProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      
      await uploadProjectImage(projectId, formData)
      
      toast({
        title: 'Success',
        description: 'Image uploaded successfully'
      })
      
      // Reset input
      e.target.value = ''
      
      // Refresh the page to show new image
      router.refresh()
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload image',
        variant: 'destructive'
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (imageId: string) => {
    setDeletingId(imageId)

    try {
      await deleteProjectImage(projectId, imageId)
      
      toast({
        title: 'Success',
        description: 'Image deleted successfully'
      })
      
      // Refresh the page
      router.refresh()
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: 'Delete failed',
        description: 'Failed to delete image',
        variant: 'destructive'
      })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center">
          <ImageIcon className="mr-2 h-5 w-5 text-sage-600" />
          Project Images
        </CardTitle>
        <CardDescription>
          {canEdit ? 'Upload images to showcase your project' : 'Project gallery'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Upload button */}
        {canEdit && (
          <div className="mb-6">
            <label htmlFor="image-upload" className="block">
              <input
                id="image-upload"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleUpload}
                disabled={isUploading}
                className="hidden"
              />
              <Button
                type="button"
                onClick={() => document.getElementById('image-upload')?.click()}
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
            </label>
            <p className="text-xs text-gray-500 mt-2 text-center">
              JPEG, PNG, or WebP • Max 5MB
            </p>
          </div>
        )}

        {/* Image grid */}
        {images.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className="relative group rounded-lg overflow-hidden border border-gray-200 hover:border-sage-300 transition-colors"
              >
                <Image
                  src={image.url}
                  alt={image.caption || 'Project image'}
                  width={400}
                  height={192}
                  className="w-full h-48 object-cover"
                />
                
                {/* Primary badge */}
                {image.is_primary && (
                  <div className="absolute top-2 left-2 bg-sage-600 text-white px-2 py-1 rounded-full text-xs flex items-center">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Primary
                  </div>
                )}

                {/* Delete button */}
                {canEdit && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDelete(image.id)}
                    disabled={deletingId === image.id}
                  >
                    {deletingId === image.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                )}

                {/* Caption */}
                {image.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
                    {image.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <ImageIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No images uploaded yet</p>
            {canEdit && <p className="text-sm mt-1">Click the button above to add images</p>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}