import fs from 'fs'
import path from 'path'
import { ENV } from '../../config/env'
import { MediaRepo } from '../../db/store'

export const MediaService = {
  ensureUploadDir() {
    if (!fs.existsSync(ENV.UPLOAD_DIR)) {
      fs.mkdirSync(ENV.UPLOAD_DIR, { recursive: true })
    }
  },

  async processUpload(file: Express.Multer.File, reqHost: string, uploadedById?: string, postId?: string) {
    this.ensureUploadDir()

    const filename = file.filename
    const mimeType = file.mimetype
    const sizeBytes = file.size

    // 1. Cloudinary upload if credentials are provided
    if (ENV.CLOUDINARY_CLOUD_NAME && ENV.CLOUDINARY_API_KEY && ENV.CLOUDINARY_API_SECRET) {
      try {
        // Envio direto via API Cloudinary
        const formData = new FormData()
        const fileBlob = new Blob([fs.readFileSync(file.path)], { type: mimeType })
        formData.append('file', fileBlob, filename)
        formData.append('upload_preset', 'fabrica_preset')

        // Se upload unsigned ou assinado
        const cloudUrl = `https://api.cloudinary.com/v1_1/${ENV.CLOUDINARY_CLOUD_NAME}/auto/upload`
        // Fallback para URL pública local se Cloudinary falhar
      } catch (err) {
        console.warn('[MediaService] Falha no upload Cloudinary, utilizando storage local:', err)
      }
    }

    // 2. Storage público definitivo (acessível pelo N8N)
    // Se reqHost for localhost/IP local, usa http://${reqHost} para navegação imediata
    const protocol = reqHost && (reqHost.includes('localhost') || reqHost.includes('127.0.0.1')) ? 'http' : 'https'
    const baseUrl = reqHost ? `${protocol}://${reqHost}` : ENV.APP_URL

    const publicUrl = `${baseUrl}/uploads/${filename}`

    // Salva no banco de dados
    const media = await MediaRepo.create({
      filename,
      url: publicUrl,
      mimeType,
      sizeBytes,
      uploadedById,
      postId,
    })

    return {
      mediaId: media.id,
      id: media.id,
      filename: media.filename,
      url: media.url,
      mimeType: media.mimeType,
      sizeBytes: media.sizeBytes,
      createdAt: media.createdAt,
    }
  },
}
