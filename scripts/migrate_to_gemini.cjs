const fs = require('fs');
const path = require('path');

const wfPath = path.resolve(__dirname, '../n8n/fabrica.workflow.json');
const wf = JSON.parse(fs.readFileSync(wfPath, 'utf8'));

console.log(`Carregando ${wfPath} com ${wf.nodes.length} nós...`);

// 1. Identificar e remover nós OpenAI restantes
const openAiNodeNames = [];
wf.nodes = wf.nodes.filter(n => {
  if (n.type === '@n8n/n8n-nodes-langchain.lmChatOpenAi' || n.name.toLowerCase().includes('gpt')) {
    openAiNodeNames.push(n.name);
    return false;
  }
  return true;
});

console.log('Nós OpenAI removidos:', openAiNodeNames);

// 2. Limpar conexões antigas dos nós OpenAI
for (const [src, conns] of Object.entries(wf.connections)) {
  if (openAiNodeNames.includes(src)) {
    delete wf.connections[src];
  }
}

// 3. Criar os nós do Google Gemini Flash
const geminiNodes = [
  {
    parameters: {
      modelName: "models/gemini-1.5-flash",
      options: {}
    },
    id: "gemini-router-agent-model",
    name: "Google Gemini Flash (Router)",
    type: "@n8n/n8n-nodes-langchain.lmChatGoogleGemini",
    typeVersion: 1,
    position: [-2496, 672],
    credentials: {
      googlePalmApi: {
        id: "gagKk4RBpEHmjetw",
        name: "Google Gemini(PaLM) Api account"
      }
    }
  },
  {
    parameters: {
      modelName: "models/gemini-1.5-flash",
      options: {}
    },
    id: "gemini-content-creator-model",
    name: "Google Gemini Flash (Content Creator)",
    type: "@n8n/n8n-nodes-langchain.lmChatGoogleGemini",
    typeVersion: 1,
    position: [-1120, 864],
    credentials: {
      googlePalmApi: {
        id: "gagKk4RBpEHmjetw",
        name: "Google Gemini(PaLM) Api account"
      }
    }
  },
  {
    parameters: {
      modelName: "models/gemini-1.5-flash",
      options: {}
    },
    id: "gemini-email-contents-model",
    name: "Google Gemini Flash (Email Contents)",
    type: "@n8n/n8n-nodes-langchain.lmChatGoogleGemini",
    typeVersion: 1,
    position: [352, 1680],
    credentials: {
      googlePalmApi: {
        id: "gagKk4RBpEHmjetw",
        name: "Google Gemini(PaLM) Api account"
      }
    }
  }
];

wf.nodes.push(...geminiNodes);

// 4. Conectar os modelos Gemini aos respectivos agentes
wf.connections["Google Gemini Flash (Router)"] = {
  ai_languageModel: [[{ node: "🤖Social Media Router Agent", type: "ai_languageModel", index: 0 }]]
};

wf.connections["Google Gemini Flash (Content Creator)"] = {
  ai_languageModel: [[{ node: "Social Media Content Creator", type: "ai_languageModel", index: 0 }]]
};

wf.connections["Google Gemini Flash (Email Contents)"] = {
  ai_languageModel: [[{ node: "Prepare Social Media Email Contents", type: "ai_languageModel", index: 0 }]]
};

// 5. Corrigir referências a pollinations.ai1 quebradas em nós dependentes
for (const n of wf.nodes) {
  if (n.name === 'Prepare Social Media Email Contents' && n.parameters && n.parameters.text) {
    n.parameters.text = n.parameters.text.replace(
      /\$\('pollinations\.ai1'\)\.item\.json\.output\.toJsonString\(\)/g,
      "$('Conteúdo Social').item.json.output ? JSON.stringify($('Conteúdo Social').item.json.output) : ''"
    );
    console.log('✅ Corrigida referência em Prepare Social Media Email Contents');
  }
  if (n.name === 'Callback: conteúdo gerado' && n.parameters && n.parameters.jsonBody) {
    n.parameters.jsonBody = "={{ { event: 'content_generated', post_id: $('Quando executado por outro fluxo de trabalho').item.json.post_id, demand_id: $('Quando executado por outro fluxo de trabalho').item.json.demand_id, route: $('Quando executado por outro fluxo de trabalho').item.json.route, social_content: $('Conteúdo Social').item.json.output, image_url: $('Salvar imagem em imgbb.com').item.json.data?.url ?? null } }}";
  }
}

// 6. Atualizar a API Key do ImgBB para ler do ambiente com fallback para a chave fornecida em fabrica01.json
const imgbbNode = wf.nodes.find(n => n.name === 'Salvar imagem em imgbb.com');
if (imgbbNode && imgbbNode.parameters && imgbbNode.parameters.queryParameters) {
  imgbbNode.parameters.queryParameters.parameters = [
    { name: "expiration", value: "0" },
    { name: "key", value: "={{ $env.IMGBB_API_KEY || '9224a4253a3fb37cb3aa6808f9e4d508' }}" }
  ];
  console.log('✅ Atualizada chave do ImgBB com fallback automático');
}

// 7. Atualizar nome e metadados do workflow
wf.name = "Fábrica de Conteúdo com Google Gemini Flash (Integrada)";
fs.writeFileSync(wfPath, JSON.stringify(wf, null, 2), 'utf8');

console.log('🎉 Migração para o Google Gemini Flash concluída em fabrica.workflow.json!');
