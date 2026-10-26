import { app } from './app'
import { ENV } from './config/env'
import { checkDatabaseConnection } from './db/prisma'

async function bootstrap() {
  const dbOk = await checkDatabaseConnection()
  if (dbOk) {
    console.log('✅ [Prisma] Conexão com o PostgreSQL estabelecida com sucesso!')
  } else {
    console.log('⚠️ [Prisma] PostgreSQL não detectado ou indisponível. Operando em modo tolerante à falhas com persistência em memória/JSON.')
  }

  app.listen(ENV.PORT, () => {
    console.log(`🚀 [API Fábrica de Conteúdo] Servidor rodando na porta ${ENV.PORT}`)
    console.log(`📡 URL Pública da API: ${ENV.APP_URL}`)
    console.log(`🌐 Callback N8N: ${ENV.PLATFORM_CALLBACK_URL}`)
    console.log(`📁 Diretório de Uploads: ${ENV.UPLOAD_DIR}`)
  })
}

bootstrap().catch((err) => {
  console.error('❌ Erro fatal ao iniciar o servidor:', err)
  process.exit(1)
})
