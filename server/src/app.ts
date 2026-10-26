import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'path'
import fs from 'fs'
import { ENV } from './config/env'
import { authRouter } from './modules/auth/auth.controller'
import { mediaRouter } from './modules/media/media.controller'
import { demandsRouter } from './modules/demands/demands.controller'
import { postsRouter } from './modules/posts/posts.controller'
import { n8nRouter } from './modules/n8n/n8n.controller'
import { webhooksRouter } from './modules/webhooks/webhooks.controller'
import { isDbConnected } from './db/prisma'

export const app = express()

// Middlewares
app.use(cors({
  origin: true,
  credentials: true,
}))
app.use(cookieParser())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Servir uploads de mídia publicamente (necessário para nós do N8N consumirem)
const publicUploads = path.resolve(__dirname, '../../public/uploads')
if (!fs.existsSync(publicUploads)) {
  fs.mkdirSync(publicUploads, { recursive: true })
}
if (!fs.existsSync(ENV.UPLOAD_DIR)) {
  fs.mkdirSync(ENV.UPLOAD_DIR, { recursive: true })
}
app.use('/uploads', express.static(publicUploads))
app.use('/uploads', express.static(ENV.UPLOAD_DIR))

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    database: isDbConnected() ? 'connected' : 'memory-fallback',
    timestamp: new Date().toISOString(),
    environment: ENV.NODE_ENV,
  })
})

// Módulos da API
app.use('/api/auth', authRouter)
app.use('/api/media', mediaRouter)
app.use('/api/demands', demandsRouter)
app.use('/api/posts', postsRouter)
app.use('/api/n8n', n8nRouter)
app.use('/api/webhooks', webhooksRouter)

// Em produção: serve o build do Front-end SPA
const frontendDist = path.resolve(__dirname, '../../dist')
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'))
  })
}
