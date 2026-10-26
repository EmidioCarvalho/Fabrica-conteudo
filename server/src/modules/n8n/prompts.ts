/**
 * Diretrizes e Templates de Prompts de IA por Rede Social para o Orquestrador N8N
 */

export interface NetworkPromptRule {
  network: string
  route: string
  maxLength: number
  tone: string
  structure: string
  systemPrompt: string
}

export const NETWORK_PROMPT_RULES: Record<string, NetworkPromptRule> = {
  linkedin: {
    network: 'LinkedIn',
    route: 'linkedin',
    maxLength: 3000,
    tone: 'Executivo, analítico e orientado a liderança, inovação e negócios.',
    structure: '1. Gancho forte nas duas primeiras linhas (sem clichês);\n2. Contextualização de mercado/desafio corporativo;\n3. Lições ou passos acionáveis em tópicos (bullet points);\n4. Call to Action (CTA) profissional convidando a comentários.',
    systemPrompt: `Você é um redator sênior especialista em LinkedIn. Crie publicações que transmitam autoridade, com gancho impactante nos primeiros 150 caracteres, quebras de linha frequentes para leitura dinâmica e término com a CTA informada. Limite máximo: 3.000 caracteres.`,
  },
  instagram: {
    network: 'Instagram',
    route: 'instagram',
    maxLength: 2200,
    tone: 'Visual, empático, envolvente e focado na comunidade.',
    structure: '1. Frase marcante de abertura;\n2. Roteiro ou conteúdo dividido em slides (slide 1 a 6) para carrossel;\n3. CTA solicitando salvamento ou envio no direct;\n4. Bloco com 5 a 10 hashtags temáticas relevantes.',
    systemPrompt: `Você é um especialista em conteúdo para Instagram. Crie uma legenda envolvente estruturada para formato carrossel (slide a slide), com tom humano e empático. Finalize com chamada para salvar o post e 5 a 10 hashtags qualificadas. Limite: 2.200 caracteres.`,
  },
  xtwitter: {
    network: 'X (Twitter)',
    route: 'xtwitter',
    maxLength: 280,
    tone: 'Conciso, direto, opinativo ou instigante.',
    structure: 'Máximo de 240 caracteres (para permitir retweets com comentário), uma reflexão afiada e no máximo 1 ou 2 hashtags.',
    systemPrompt: `Você é um mestre da síntese no X/Twitter. Produza um post com no máximo 240 caracteres, conciso, instigante e sem rodeios. Use no máximo 2 hashtags essenciais.`,
  },
  youtube_shorts: {
    network: 'YouTube Shorts',
    route: 'youtube_shorts',
    maxLength: 1000,
    tone: 'Enérgico, dinâmico e direto ao ponto.',
    structure: 'Roteiro falado de 60 segundos:\n- [00:00 - 00:03] Gancho de retenção;\n- [00:03 - 00:45] Entrega rápida de valor;\n- [00:45 - 00:60] CTA clara de inscrição/curtida.',
    systemPrompt: `Você é roteirista especializado em vídeos curtos e verticais (Shorts/Reels). Entregue um script falado cronometrado de até 60 segundos com indicação clara de fala e sugestão de texto na tela.`,
  },
  threads: {
    network: 'Threads',
    route: 'threads',
    maxLength: 500,
    tone: 'Conversacional, espontâneo e reflexivo.',
    structure: 'Abertura rápida com pergunta ou insight + convite à discussão aberta.',
    systemPrompt: `Você é um criador de conteúdo no Threads. Foque em tom de conversa autêntica, sem formalismos excessivos, estimulando respostas.`,
  },
  facebook: {
    network: 'Facebook',
    route: 'facebook',
    maxLength: 5000,
    tone: 'Comunitário, narrativo e informativo.',
    structure: 'Storytelling leve + detalhes da novidade + links e chamada para ação.',
    systemPrompt: `Você é redator para páginas do Facebook. Elabore um texto informativo e caloroso, valorizando a história por trás da mensagem.`,
  },
}

/**
 * Gera o prompt de imagem em inglês para o Pollinations.ai / ImgBB
 */
export function buildPollinationsImagePrompt(briefing: string, theme?: string): string {
  const subject = theme || briefing.slice(0, 80).replace(/[^a-zA-Z0-9 ]/g, '')
  return `minimalist modern 3d render of ${subject}, clean composition, soft studio cinematic lighting, corporate technology aesthetic, 8k resolution, octane render, vivid colors, photorealistic, no text, no watermark`
}
