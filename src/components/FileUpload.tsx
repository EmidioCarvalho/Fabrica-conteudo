import { useState, useRef } from 'react'
import { Upload, X, Loader2, Image as ImageIcon, Video, CheckCircle2 } from 'lucide-react'
import { uploadMedia } from '../services/api'
import { useStore } from '../store/useStore'

interface FileUploadProps {
  value?: string
  onChange: (url: string) => void
  label?: string
  postId?: string
  accept?: string
}

export function FileUpload({
  value,
  onChange,
  label = 'Mídia / Imagem ou Vídeo',
  postId,
  accept = 'image/png,image/jpeg,image/webp,video/mp4',
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toast = useStore((s) => s.toast)

  const isVideo = value?.match(/\.(mp4|webm|ogg)$/i) || value?.includes('video')

  const handleUpload = async (file: File) => {
    // Validação de tipo
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'video/mp4']
    if (!allowed.includes(file.type)) {
      toast('Formato inválido. Envie imagens (.png, .jpg, .webp) ou vídeos curtos (.mp4).', 'error')
      return
    }

    // Limite de 50MB
    if (file.size > 50 * 1024 * 1024) {
      toast('Arquivo muito pesado. O limite máximo é de 50MB.', 'error')
      return
    }

    setUploading(true)
    try {
      const res = await uploadMedia(file, postId)
      const finalUrl = res.url
      onChange(finalUrl)
      toast('Mídia carregada com sucesso!', 'success')
    } catch (err: any) {
      toast(err.message || 'Falha ao fazer upload da mídia', 'error')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleUpload(file)
  }

  return (
    <div className="space-y-1.5">
      {label && <p className="label">{label}</p>}

      {value ? (
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 transition hover:shadow-md">
          <div className="aspect-video w-full max-h-56 overflow-hidden bg-slate-900/5">
            {isVideo ? (
              <video src={value} controls className="h-full w-full object-contain" />
            ) : (
              <img
                src={value}
                alt="Upload preview"
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                onError={(e) => {
                  // Fallback se imagem não carregar
                  ;(e.target as HTMLElement).style.display = 'none'
                }}
              />
            )}
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 bg-white p-2.5 text-xs">
            <span className="flex items-center gap-1.5 font-medium text-slate-700 truncate max-w-[220px]">
              <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
              <span className="truncate">{value.split('/').pop()}</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="btn-ghost btn-sm text-[11px] !py-1"
              >
                Trocar
              </button>
              <button
                type="button"
                onClick={() => onChange('')}
                className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                title="Remover mídia"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${
            dragOver
              ? 'border-brand-500 bg-brand-50/50'
              : 'border-slate-200 bg-slate-50/50 hover:border-brand-300 hover:bg-slate-50'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2 py-3 text-brand-600">
              <Loader2 size={24} className="animate-spin" />
              <p className="text-xs font-semibold">Enviando mídia para o servidor...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-brand-600 shadow-sm ring-1 ring-slate-200">
                <Upload size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700">
                  Clique para upload ou arraste o arquivo
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  PNG, JPG, WebP ou MP4 até 50MB (Gera URL pública para o N8N)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={onFileChange}
      />
    </div>
  )
}
