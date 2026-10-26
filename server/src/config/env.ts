import dotenv from 'dotenv'
import path from 'path'

// Carrega .env do diretório do servidor ou raiz
dotenv.config({ path: path.resolve(__dirname, '../../.env') })
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 4000,
  APP_URL: process.env.APP_URL || 'http://localhost:4000',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fabrica?schema=public',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'fabrica_jwt_secret_production_key_change_in_prod',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'fabrica_jwt_refresh_secret_production_key',
  JWT_EXPIRES_IN: '2h',
  JWT_REFRESH_EXPIRES_IN: '7d',

  // N8N
  N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/fabrica-publish',
  N8N_SHARED_SECRET: process.env.N8N_SHARED_SECRET || 'fabrica_n8n_secret_token_secure_123',
  PLATFORM_CALLBACK_URL: process.env.PLATFORM_CALLBACK_URL || 'http://localhost:4000/api/webhooks/n8n/callback',

  // E-mail Transacional (SMTP / Resend / Nodemailer)
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || 'Fabrica de Conteudo <noreply@fabrica.com>',
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',

  // Storage / Uploads
  UPLOAD_DIR: process.env.UPLOAD_DIR || path.resolve(__dirname, '../../../public/uploads'),
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
}
