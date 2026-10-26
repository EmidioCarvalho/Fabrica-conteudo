import { Router, Response } from 'express'
import multer from 'multer'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { ENV } from '../../config/env'
import { MediaService } from './media.service'
import { authGuard, AuthRequest } from '../auth/auth.middleware'

export const mediaRouter = Router()

MediaService.ensureUploadDir()

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, ENV.UPLOAD_DIR)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const unique = `${Date.now()}-${uuidv4().slice(0, 8)}${ext}`
    cb(null, unique)
  },
})

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const allowed = ['.png', '.jpg', '.jpeg', '.webp', '.mp4']
  const ext = path.extname(file.originalname).toLowerCase()
  if (allowed.includes(ext)) {
    cb(null, true)
  } else {
    cb(new Error('Formato inválido. Apenas imagens (.png, .jpg, .jpeg, .webp) e vídeos (.mp4) são permitidos.'))
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
})

// POST /api/media/upload
mediaRouter.post('/upload', authGuard, upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Nenhum arquivo enviado.' })
      return
    }

    const host = req.get('host') || ''
    const uploadedById = req.user?.id
    const postId = (req.body.postId as string) || undefined

    const media = await MediaService.processUpload(req.file, host, uploadedById, postId)
    res.status(201).json(media)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Falha ao processar upload' })
  }
})
