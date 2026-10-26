import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados PostgreSQL...')

  const passwordHash = await bcrypt.hash('123456', 10)

  // 1. Usuários padrão
  const solicitante = await prisma.user.upsert({
    where: { email: 'solicitante@fabrica.com' },
    update: { emailVerified: true, status: 'ACTIVE' },
    create: {
      name: 'Ana Solicitante',
      email: 'solicitante@fabrica.com',
      passwordHash,
      role: 'SOLICITANTE',
      status: 'ACTIVE',
      emailVerified: true,
    },
  })

  const editor = await prisma.user.upsert({
    where: { email: 'editor@fabrica.com' },
    update: { emailVerified: true, status: 'ACTIVE' },
    create: {
      name: 'Carlos Editor',
      email: 'editor@fabrica.com',
      passwordHash,
      role: 'EDITOR',
      status: 'ACTIVE',
      emailVerified: true,
    },
  })

  const devops = await prisma.user.upsert({
    where: { email: 'devops@fabrica.com' },
    update: { emailVerified: true, status: 'ACTIVE' },
    create: {
      name: 'Beatriz DevOps',
      email: 'devops@fabrica.com',
      passwordHash,
      role: 'DEVOPS',
      status: 'ACTIVE',
      emailVerified: true,
    },
  })

  // 2. Demandas
  const d1 = await prisma.publicationDemand.upsert({
    where: { id: 'd-seed-1' },
    update: {},
    create: {
      id: 'd-seed-1',
      title: '5 Tendências de IA no Marketing para 2027',
      briefing: 'Carrossel educativo explorando agentes autônomos, personalização em tempo real e automação editorial.',
      targetNetwork: 'LinkedIn',
      desiredDate: '2026-11-05',
      routeTarget: 'EQUIPE_MARKETING',
      status: 'EM_PRODUCAO',
      requestedById: solicitante.id,
      assignedEditorId: editor.id,
    },
  })

  const d2 = await prisma.publicationDemand.upsert({
    where: { id: 'd-seed-2' },
    update: {},
    create: {
      id: 'd-seed-2',
      title: 'Lançamento do Webinar Fábrica de Conteúdo',
      briefing: 'Post chamativo convidando a comunidade para assistir a demonstração ao vivo da esteira automatizada.',
      targetNetwork: 'Instagram',
      desiredDate: '2026-11-10',
      routeTarget: 'IA_N8N',
      status: 'ENVIADO_IA',
      requestedById: solicitante.id,
    },
  })

  // 3. Posts
  await prisma.post.upsert({
    where: { id: 'p-seed-1' },
    update: {},
    create: {
      id: 'p-seed-1',
      demandId: d1.id,
      title: '5 Tendências de IA no Marketing para 2027',
      caption: 'A inteligência artificial não substitui a criatividade humana; ela a potencializa. Conheça as 5 principais tendências que transformarão o marketing nos próximos meses.',
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      cta: 'Comente "TENDENCIAS" para receber o material completo.',
      socialNetwork: 'LinkedIn',
      scheduledDate: '2026-11-05',
      scheduledTime: '10:00',
      editorId: editor.id,
      status: 'Em revisão',
      theme: 'Inteligência Artificial',
      hashtags: '#Marketing #IA #Inovacao',
      campaign: 'Tendências 2027',
      history: {
        create: [
          {
            statusFrom: null,
            statusTo: 'Rascunho',
            changedBy: 'Carlos Editor',
            notes: 'Criação do rascunho inicial.',
          },
          {
            statusFrom: 'Rascunho',
            statusTo: 'Em revisão',
            changedBy: 'Carlos Editor',
            notes: 'Texto revisado e enviado para validação.',
          },
        ],
      },
    },
  })

  await prisma.post.upsert({
    where: { id: 'p-seed-2' },
    update: {},
    create: {
      id: 'p-seed-2',
      demandId: d2.id,
      title: 'Lançamento do Webinar Fábrica de Conteúdo',
      caption: 'Descubra como integrar IA, N8N e redes sociais em uma esteira editorial moderna e infalível. Link na bio!',
      imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80',
      cta: 'Inscreva-se gratuitamente no link da bio.',
      socialNetwork: 'Instagram',
      scheduledDate: '2026-11-10',
      scheduledTime: '14:30',
      editorId: 'n8n',
      status: 'Agendado',
      theme: 'Webinar',
      hashtags: '#Webinar #N8N #Automacao',
      campaign: 'Lançamento Q4',
      history: {
        create: [
          {
            statusFrom: null,
            statusTo: 'Agendado',
            changedBy: 'N8N (automação)',
            notes: 'Gerado e agendado pelo workflow N8N.',
          },
        ],
      },
    },
  })

  console.log('✅ Seed finalizado com sucesso!')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
