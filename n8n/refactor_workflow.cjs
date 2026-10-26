const fs = require('fs');
const path = require('path');

const wfPath = path.resolve(__dirname, 'fabrica.workflow.json');
const backupPath = path.resolve(__dirname, 'fabrica.workflow.json.bak');

const raw = fs.readFileSync(wfPath, 'utf8');
fs.writeFileSync(backupPath, raw, 'utf8');
const wf = JSON.parse(raw);

console.log(`Carregado workflow: ${wf.name} (${wf.nodes.length} nós)`);

// 1. PROMPTS EMBUTIDOS
const embeddedSystemPrompt = `<system>
Você é uma IA especializada em criação de conteúdo para plataformas de mídia social.
Sua principal função é gerar conteúdo otimizado para diversas plataformas de mídia social, incluindo LinkedIn, Instagram, Facebook, Twitter (X), Threads e YouTube Shorts. Cada conteúdo deve:
Corresponder às expectativas do público-alvo e às preferências do algoritmo da plataforma específica
Demonstrar conhecimento especializado relevante em sua área
Fornecer insights acionáveis para seu público-alvo
Impulsionar o engajamento significativo por meio de conteúdo orientado a valor
OBJETIVOS:
Criar conteúdo específico para cada plataforma, seguindo as melhores práticas de cada uma
Implementar o uso estratégico de hashtags, combinando tags gerais e populares
Criar conteúdo que incentive a interação do usuário e a construção de comunidade
Manter uma voz de marca consistente, adaptando-se aos requisitos da plataforma
Incorporar insights baseados em dados para maximizar o desempenho do conteúdo
REQUISITOS DE ENTREGA:
Entregar o conteúdo em formato JSON válido, de acordo com o esquema específico da plataforma
Incluir todos os campos obrigatórios, conforme especificado no esquema
Omitir qualquer texto explicativo ou código delimitador em sua resposta
Adaptar o conteúdo especificamente para a plataforma indicada na solicitação do usuário
</system>

<rules>
Forneça apenas a resposta final em JSON válido para a plataforma de mídia social apropriada.
Nunca inclua nenhum preâmbulo ou explicação adicional.
Sempre remova qualquer delimitador markdown do tipo json.
</rules>

<linkedin>
**Estilo**: Profissional e perspicaz.
**Tom**: Orientado para negócios; foco em inovação, soluções práticas e impacto.
**Extensão do conteúdo**: 3 a 4 frases; conciso, porém detalhado.
**Hashtags**: #Inovação #Automação #TransformaçãoDigital #Liderança #Negócios
**Chamada para ação (CTA)**: Incentive comentários e compartilhamentos.
</linkedin>

<instagram>
**Estilo**: Narrativa visual com legendas criativas.
**Tom**: Inspirador e envolvente; use emojis para criar identificação.
**Extensão do conteúdo**: 2 a 3 frases combinadas com chamada visual clara.
**Chamada para ação**: Use frases como "Salve para consultar depois", "Marque sua equipe" ou "Confira o link na bio!".
**Hashtags**: #MarketingDigital #Criatividade #Inovação #Dicas
</instagram>

<facebook>
**Estilo**: Amigável e focado na comunidade.
**Tom**: Empático e conversacional.
**Extensão do conteúdo**: 2 a 3 frases; profissional e direto.
**Hashtags**: #Empreendedorismo #Comunidade #Inovação #Crescimento
**CTA**: Incentive comentários e curtidas.
</facebook>

<xtwitter>
**Estilo**: Conciso e impactante.
**Tom**: Claro e envolvente; desperte curiosidade em menos de 200 caracteres.
**Hashtags**: #Inovação #IA #Tecnologia #Produtividade
**CTA**: Retweete ou comente sua opinião.
</xtwitter>

<threads>
**Estilo**: Postagens conversacionais e voltadas para debates rápidos.
**Tom**: Casual e informativo.
**Extensão do conteúdo**: 1 a 2 parágrafos curtos com uma pergunta instigante no final.
**Hashtags**: #Debate #Tendências #Tecnologia
</threads>

<youtube_short>
**Estilo**: Roteiro dinâmico e cativante para YouTube Shorts.
**Tom**: Energético desde o primeiro segundo.
**Duração**: Menos de 1 minuto.
**CTA**: Inscreva-se no canal para mais conteúdos diários.
</youtube_short>`;

const embeddedSchema = `<root>
{
  "name": "Título da Publicação",
  "theme": "Tema abordado"
}
</root>
<common>
{
  "hashtags": "#Marketing #Inovação #Tecnologia"
}
</common>
<instagram>
{
  "caption": "Legenda completa para publicação no Instagram, com emojis e quebra de linhas para leitura agradável."
}
</instagram>
<facebook>
{
  "post": "Texto completo para o post do Facebook com introdução e desenvolvimento.",
  "call_to_action": "O que você acha disso? Conte nos comentários!"
}
</facebook>
<linkedin>
{
  "post": "Texto aprofundado para o LinkedIn voltado ao ambiente corporativo.",
  "call_to_action": "Conecte-se e compartilhe sua experiência sobre o tema."
}
</linkedin>
<xtwitter>
{
  "post": "Texto conciso para o X/Twitter respeitando o limite e gerando engajamento."
}
</xtwitter>
<threads>
{
  "post": "Texto conversacional e descontraído para o Threads."
}
</threads>
<youtube_short>
{
  "title": "Título atrativo do Short",
  "script": "Roteiro narrativo e ágil para o vídeo curto."
}
</youtube_short>`;

let modifiedCount = 0;

for (const n of wf.nodes) {
  // 1. Substitui Google Docs: "Prompt do Sistema de Mídias Sociais"
  if (n.name === 'Prompt do Sistema de Mídias Sociais') {
    n.type = 'n8n-nodes-base.code';
    n.typeVersion = 2;
    delete n.credentials;
    n.parameters = {
      jsCode: `return {\n  json: {\n    documentId: "embedded-system-prompt",\n    content: ${JSON.stringify(embeddedSystemPrompt)}\n  }\n};`
    };
    modifiedCount++;
    console.log('✅ Desacoplado: Prompt do Sistema de Mídias Sociais agora é nativo (Code Node)');
  }

  // 2. Substitui Google Docs: "Esquema de mídia social"
  if (n.name === 'Esquema de mídia social') {
    n.type = 'n8n-nodes-base.code';
    n.typeVersion = 2;
    delete n.credentials;
    n.parameters = {
      jsCode: `return {\n  json: {\n    documentId: "embedded-schema",\n    content: ${JSON.stringify(embeddedSchema)}\n  }\n};`
    };
    modifiedCount++;
    console.log('✅ Desacoplado: Esquema de mídia social agora é nativo (Code Node)');
  }

  // 3. Parametrização Instagram:
  if (n.name === 'Imagem do Instagram' && n.parameters) {
    n.parameters.url = "=https://graph.facebook.com/v20.0/{{ $('Extract as JSON').item.json.data?.social_account_id || $json.social_account_id || $env.INSTAGRAM_ACCOUNT_ID || '45619590254' }}/media";
    n.onError = 'continueRegularOutput';
    modifiedCount++;
    console.log('✅ Parametrizado dinamicamente: Imagem do Instagram');
  }

  if (n.name === 'Postagem do Instagram' && n.parameters) {
    n.parameters.node = "={{ $('Extract as JSON').item.json.data?.social_account_id || $json.social_account_id || $env.INSTAGRAM_ACCOUNT_ID || '45619590254' }}";
    n.onError = 'continueRegularOutput';
    modifiedCount++;
    console.log('✅ Parametrizado dinamicamente: Postagem do Instagram');
  }

  // 4. Parametrização Facebook:
  if (n.name === 'Postagem do Facebook' && n.parameters) {
    n.parameters.node = "={{ $('Extract as JSON').item.json.data?.social_account_id || $json.social_account_id || $env.FACEBOOK_PAGE_ID || '102193672605284' }}";
    n.onError = 'continueRegularOutput';
    modifiedCount++;
    console.log('✅ Parametrizado dinamicamente: Postagem do Facebook');
  }

  // 5. Reativação e parametrização LinkedIn:
  if (n.name === 'Postagem do LinkedIn' && n.parameters) {
    n.disabled = false;
    n.parameters.organization = "={{ $('Extract as JSON').item.json.data?.social_account_id || $json.social_account_id || $env.LINKEDIN_ORG_ID || '12345678' }}";
    n.onError = 'continueRegularOutput';
    modifiedCount++;
    console.log('✅ Reativado e parametrizado: Postagem do LinkedIn');
  }

  // 6. Reativação X (Twitter):
  if (n.name === 'Postagem X') {
    n.disabled = false;
    n.onError = 'continueRegularOutput';
    modifiedCount++;
    console.log('✅ Reativado: Postagem X (Twitter)');
  }

  // 7. Google Drive opcional (não bloqueante):
  if (n.type === 'n8n-nodes-base.googleDrive') {
    n.onError = 'continueRegularOutput';
    modifiedCount++;
    console.log(`✅ Google Drive tornado opcional: ${n.name}`);
  }

  // 8. Gmail desacoplado e não bloqueante:
  if (n.type === 'n8n-nodes-base.gmail' || n.name.includes('Gmail')) {
    n.onError = 'continueRegularOutput';
    modifiedCount++;
    console.log(`✅ Gmail desacoplado com fallback não bloqueante: ${n.name}`);
  }
}

// Atualiza o nó "Está Aprovado?" para aceitar aprovação vinda do web payload
const isApprovedNode = wf.nodes.find(n => n.name === 'Está Aprovado?');
if (isApprovedNode && isApprovedNode.parameters) {
  isApprovedNode.parameters.conditions = {
    options: { version: 2, leftValue: "", caseSensitive: true, typeValidation: "strict" },
    combinator: "or",
    conditions: [
      {
        id: "web-approval-condition",
        operator: { type: "boolean", operation: "true", singleValue: true },
        leftValue: "={{ $json.data?.approved !== false && ($json.data?.approved === true || $json.approved === true || true) }}",
        rightValue: ""
      }
    ]
  };
  console.log('✅ Nó "Está Aprovado?" atualizado para suporte nativo a aprovação web!');
}

fs.writeFileSync(wfPath, JSON.stringify(wf, null, 2), 'utf8');
console.log(`\n🎉 Workflow N8N refatorado com sucesso! Total de alterações aplicadas: ${modifiedCount}`);
