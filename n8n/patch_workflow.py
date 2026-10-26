#!/usr/bin/env python3
"""Gera n8n/fabrica.workflow.json a partir do workflow original (fabrica.json / fabrica.txt).

Alterações (o original NÃO é modificado):
  1. Entrada HTTP: Webhook POST /webhook/fabrica-publish, validado por X-Fabrica-Secret.
  2. Nó "Normaliza payload": unifica chat e webhook; propaga demand_id, post_id, scheduled_at etc.
  3. Ferramentas (toolWorkflow) e sub-fluxo passam a carregar os novos campos.
  4. Espera até scheduled_at antes de publicar.
  5. Callbacks para a plataforma: conteúdo gerado, publicado, erro, reprovado.
  6. Segredos hardcoded movidos para variáveis de ambiente do N8N.
"""
import json, sys, uuid, copy

src = sys.argv[1] if len(sys.argv) > 1 else '../fabrica.json'
dst = sys.argv[2] if len(sys.argv) > 2 else 'fabrica.workflow.json'
wf = json.load(open(src, encoding='utf-8'))
nodes = wf['nodes']
conns = wf['connections']
by_name = {n['name']: n for n in nodes}

def find(prefix):
    m = [k for k in by_name if k.strip().startswith(prefix)]
    assert len(m) == 1, (prefix, m)
    return m[0]

def add_node(name, type_, version, pos, params, **extra):
    n = {'parameters': params, 'id': str(uuid.uuid4()), 'name': name, 'type': type_, 'typeVersion': version, 'position': pos}
    n.update(extra)
    nodes.append(n); by_name[name] = n
    return n

def connect(src_name, dst_name, out=0):
    outs = conns.setdefault(src_name, {}).setdefault('main', [])
    while len(outs) <= out: outs.append([])
    outs[out].append({'node': dst_name, 'type': 'main', 'index': 0})

def disconnect(src_name, dst_name, out=0):
    outs = conns[src_name]['main'][out]
    conns[src_name]['main'][out] = [c for c in outs if c['node'] != dst_name]

CHAT = find('Quando a mensagem do chat')
TRIG = find('Quando executado por outro fluxo')
ROUTER = find('🤖Social Media Router Agent')
SWITCH = find('Roteador de publicação')
APPROVED = find('Está Aprovado')
GET_IMG = find('Obter a imagem da publicação')
EXTRACT = find('Extract as JSON')
JSON_PUB = find('JSON de publicação social')
POLL = find('pollinations.ai1')
NORM = 'Normaliza payload'

# 1) Webhook + validação de segredo ---------------------------------------------------------
add_node('Webhook Fábrica', 'n8n-nodes-base.webhook', 2, [-2992, -96],
         {'httpMethod': 'POST', 'path': 'fabrica-publish', 'responseMode': 'responseNode', 'options': {}},
         webhookId=str(uuid.uuid4()))
add_node('Segredo válido?', 'n8n-nodes-base.if', 2.2, [-2800, -96], {
    'conditions': {'options': {'version': 2, 'leftValue': '', 'caseSensitive': True, 'typeValidation': 'strict'},
                   'combinator': 'and',
                   'conditions': [{'id': str(uuid.uuid4()),
                                   'operator': {'type': 'string', 'operation': 'equals'},
                                   'leftValue': "={{ $json.headers['x-fabrica-secret'] }}",
                                   'rightValue': '={{ $env.N8N_SHARED_SECRET }}'}]},
    'options': {}})
add_node('Responde 202', 'n8n-nodes-base.respondToWebhook', 1.1, [-2608, -192], {
    'respondWith': 'json',
    'responseBody': "={{ { accepted: true, post_id: $json.body.post_id, demand_id: $json.body.demand_id } }}",
    'options': {'responseCode': 202}})
add_node('Responde 401', 'n8n-nodes-base.respondToWebhook', 1.1, [-2608, 0], {
    'respondWith': 'json', 'responseBody': '={{ { accepted: false, error: "invalid secret" } }}',
    'options': {'responseCode': 401}})
connect('Webhook Fábrica', 'Segredo válido?')
connect('Segredo válido?', 'Responde 202', 0)
connect('Segredo válido?', NORM, 0)
connect('Segredo válido?', 'Responde 401', 1)

# 2) Normaliza payload (chat OU webhook) -----------------------------------------------------
def a(name, value, type_='string'):
    return {'id': str(uuid.uuid4()), 'name': name, 'type': type_, 'value': value}
body = lambda f: "={{ $json.body ? ($json.body.%s ?? '') : '' }}" % f
add_node(NORM, 'n8n-nodes-base.set', 3.4, [-2496, -16], {'assignments': {'assignments': [
    a('chatInput', "={{ $json.body ? 'Crie uma publicação para a rede social \"' + $json.body.route + '\" (route=' + $json.body.route + '). Briefing: ' + $json.body.user_prompt + ($json.body.title ? ' | Título sugerido: ' + $json.body.title : '') + ($json.body.cta ? ' | CTA: ' + $json.body.cta : '') : $json.chatInput }}"),
    a('route', body('route')), a('user_prompt', body('user_prompt')), a('title', body('title')),
    a('caption', body('caption')), a('cta', body('cta')), a('media_url', body('media_url')),
    a('scheduled_at', body('scheduled_at')), a('demand_id', body('demand_id')), a('post_id', body('post_id')),
]}, 'options': {}})
disconnect(CHAT, ROUTER)
connect(CHAT, NORM)
connect(NORM, ROUTER)

# 3) Ferramentas e sub-fluxo ------------------------------------------------------------------
EXTRA = ['demand_id', 'post_id', 'title', 'cta', 'caption', 'media_url', 'scheduled_at']
for n in nodes:
    if n['type'].endswith('toolWorkflow'):
        vals = n['parameters']['fields']['values']
        for v in vals:
            v['stringValue'] = v['stringValue'].replace("$('%s').item.json.chatInput" % CHAT, "$('%s').item.json.chatInput" % NORM)
        for f in EXTRA:
            vals.append({'name': f, 'stringValue': "={{ $('%s').item.json.%s }}" % (NORM, f)})
by_name[TRIG]['parameters']['workflowInputs']['values'] += [{'name': f} for f in EXTRA]

# JSON salvo no Drive passa a carregar os identificadores da plataforma
pv = by_name[JSON_PUB]['parameters']['assignments']['assignments'][0]
t = "$('%s').item.json" % TRIG
pv['value'] = pv['value'].replace('"route": %s.route,' % t,
    '"route": %s.route,\n  "demand_id": %s.demand_id,\n  "post_id": %s.post_id,\n  "scheduled_at": %s.scheduled_at,\n  "title": %s.title,\n  "cta": %s.cta,' % ((t,) * 6))
assert 'post_id' in pv['value']

# 4) Espera até o horário agendado ------------------------------------------------------------
add_node('Aguarda horário agendado', 'n8n-nodes-base.wait', 1.1, [-480, 944], {
    'resume': 'specificTime',
    'dateTime': "={{ $('%s').item.json.data.scheduled_at || $now.toISO() }}" % EXTRACT}, webhookId=str(uuid.uuid4()))
disconnect(APPROVED, GET_IMG, 0)
connect(APPROVED, 'Aguarda horário agendado', 0)
connect('Aguarda horário agendado', GET_IMG)

# 5) Callbacks -------------------------------------------------------------------------------
def callback(name, pos, body_expr):
    add_node(name, 'n8n-nodes-base.httpRequest', 4.2, pos, {
        'method': 'POST', 'url': '={{ $env.PLATFORM_CALLBACK_URL }}',
        'sendHeaders': True, 'headerParameters': {'parameters': [{'name': 'x-fabrica-secret', 'value': '={{ $env.N8N_SHARED_SECRET }}'}]},
        'sendBody': True, 'specifyBody': 'json', 'jsonBody': body_expr, 'options': {'timeout': 15000}},
        retryOnFail=True, maxTries=3, waitBetweenTries=3000, onError='continueRegularOutput')

D = "$('%s').item.json.data" % EXTRACT
ids = lambda src: "post_id: %s.post_id, demand_id: %s.demand_id, route: %s.route" % (src, src, src)
callback('Callback: conteúdo gerado', [624, 1952], "={{ { event: 'content_generated', %s, social_content: $('Conteúdo Social').item.json.output, image_url: $('Salvar imagem em imgbb.com').item.json.data?.url ?? null } }}" % ids(t))
connect(JSON_PUB, 'Callback: conteúdo gerado')
callback('Callback: erro de imagem', [-16, 2208], "={{ { event: 'error', %s, error: 'Falha ao gerar a imagem (Pollinations.ai)' } }}" % ids(t))
connect(POLL, 'Callback: erro de imagem', 1)
callback('Callback: publicado', [1120, 384], "={{ { event: 'published', %s, raw_response: $json.output } }}" % ids(D))
for r in ['Resposta X', 'Resposta Instagram', 'Resposta do Facebook', 'Resposta do LinkedIn']:
    connect(find(r), 'Callback: publicado')
callback('Callback: não implementado', [976, 944], "={{ { event: 'error', %s, error: 'Publicação nesta rede ainda não implementada no workflow N8N' } }}" % ids(D))
connect(find('Implemente Threads'), 'Callback: não implementado')
connect(find('Implemente o YouTube'), 'Callback: não implementado')
callback('Callback: reprovado', [-336, 1120], "={{ { event: 'approval_rejected', %s, error: 'Reprovado ou sem resposta na aprovação humana (Gmail)' } }}" % ids(D))
connect(APPROVED, 'Callback: reprovado', 1)

# 6) Segredos -> variáveis de ambiente ----------------------------------------------------------
for p in by_name[find('Salvar imagem em imgbb')]['parameters']['queryParameters']['parameters']:
    if p['name'] == 'key': p['value'] = '={{ $env.IMGBB_API_KEY }}'
by_name[find('Usuário do Gmail')]['parameters']['sendTo'] = '={{ $env.APPROVAL_EMAIL }}'
for n in nodes:
    if n['type'].endswith('evolutionApi'):
        n['parameters']['instanceName'] = '={{ $env.EVOLUTION_INSTANCE }}'
        n['parameters']['remoteJid'] = '={{ $env.EVOLUTION_NOTIFY_JID }}'

wf['name'] = wf['name'] + ' (integrado à plataforma)'
wf['active'] = False
json.dump(wf, open(dst, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('OK ->', dst, len(nodes), 'nós')
