'use client'

import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { X, File, Image, Video, Paperclip } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface FileUploadProps {
    files: File[]
    onFilesChange: (files: File[]) => void
}

export function FileUpload({ files, onFilesChange }: FileUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || [])
        const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

        const oversized = selectedFiles.find(file => file.size > MAX_SIZE)
        if (oversized) {
            toast.error(`File "${oversized.name}" is larger than 10MB.`)
            return
        }
        onFilesChange([...files, ...selectedFiles])
    }


    const removeFile = (index: number) => {
        onFilesChange(files.filter((_, i) => i !== index))
    }

    const getFileIcon = (file: File) => {
        const type = file.type.split('/')[0]
        switch (type) {
            case 'image':
                return <Image className="w-4 h-4" />
            case 'video':
                return <Video className="w-4 h-4" />
            default:
                return <File className="w-4 h-4" />
        }
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    return (
        <div className="space-y-2 relative">
            <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,video/*,.pdf,.doc,.docx,.txt"
            />

            {files.length > 0 && (
                <div className="flex flex-wrap">
                    {files.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center space-x-2 bg-white px-3 py-2 rounded-md border absolute -top-12 left-0"
                        >
                            {getFileIcon(file)}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                                className="p-1 h-auto"
                            >
                                <X className="w-3 h-3" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
            <Button
                type="button"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs bg-transparent hover:bg-transparent text-gray-500 hover:text-gray-600"
            >
                <Paperclip className="w-4 h-4" />
            </Button>
        </div >
    )
}
