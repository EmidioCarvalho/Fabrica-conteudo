import nodemailer from 'nodemailer'
import { ENV } from '../../config/env'

export interface EmailLog {
  to: string
  subject: string
  code?: string
  sentAt: string
  previewUrl?: string
}

const emailLogs: EmailLog[] = []

export function getRecentEmails(): EmailLog[] {
  return [...emailLogs].reverse()
}

export async function sendVerificationEmail(email: string, name: string, code: string): Promise<boolean> {
  const subject = `Código de Verificação: ${code} - Fábrica de Conteúdo`
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
        .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
        .header { text-align: center; margin-bottom: 24px; }
        .brand { font-size: 20px; font-weight: 800; color: #4f46e5; letter-spacing: -0.5px; }
        .code-box { background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
        .code { font-size: 34px; font-weight: 800; letter-spacing: 6px; color: #4338ca; font-family: monospace; }
        .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="brand">🏭 FÁBRICA DE CONTEÚDO</div>
          <h2 style="margin: 8px 0 0 0; font-size: 22px;">Verifique seu E-mail</h2>
        </div>
        <p>Olá, <strong>${name}</strong>!</p>
        <p>Seja bem-vindo(a) à <strong>Fábrica de Conteúdo</strong>. Para ativar seu acesso e garantir a segurança da plataforma, utilize o código de 6 dígitos abaixo:</p>
        <div class="code-box">
          <div class="code">${code}</div>
          <p style="margin: 8px 0 0 0; font-size: 13px; color: #64748b;">Válido por <strong>15 minutos</strong></p>
        </div>
        <p style="font-size: 13px; color: #64748b;">Se você não realizou este cadastro, desconsidere esta mensagem com segurança.</p>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Fábrica de Conteúdo. Todos os direitos reservados.
        </div>
      </div>
    </body>
    </html>
  `

  const logEntry: EmailLog = {
    to: email,
    subject,
    code,
    sentAt: new Date().toISOString(),
  }

  // 1. Caso RESEND_API_KEY esteja presente
  if (ENV.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ENV.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: ENV.SMTP_FROM,
          to: email,
          subject,
          html,
        }),
      })
      if (res.ok) {
        emailLogs.push(logEntry)
        return true
      }
    } catch (err) {
      console.error('[EmailService] Falha ao enviar via Resend:', err)
    }
  }

  // 2. Caso SMTP esteja configurado
  if (ENV.SMTP_HOST && ENV.SMTP_USER) {
    try {
      const transporter = nodemailer.createTransport({
        host: ENV.SMTP_HOST,
        port: ENV.SMTP_PORT,
        secure: ENV.SMTP_PORT === 465,
        auth: {
          user: ENV.SMTP_USER,
          pass: ENV.SMTP_PASS,
        },
      })
      await transporter.sendMail({
        from: ENV.SMTP_FROM,
        to: email,
        subject,
        html,
      })
      emailLogs.push(logEntry)
      return true
    } catch (err) {
      console.error('[EmailService] Falha ao enviar via SMTP:', err)
    }
  }

  // 3. Fallback para Desenvolvimento / Sandbox
  console.log('----------------------------------------------------')
  console.log(`[EMAIL DISPARADO] Para: ${email}`)
  console.log(`[CÓDIGO DE VERIFICAÇÃO 15 MIN]: >>> ${code} <<<`)
  console.log('----------------------------------------------------')
  emailLogs.push(logEntry)
  return true
}
