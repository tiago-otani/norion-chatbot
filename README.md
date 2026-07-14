# Norion Chatbot 🤖

Chatbot inteligente do site [norion.ind.br](https://www.norion.ind.br), usando a **API do Claude** (Anthropic). Substitui o bot de botões do Landbot por um assistente em linguagem natural que conhece produtos, garantia, fretes, financeiro, fiscal e parcerias da Norion — e sempre encaminha o visitante para o canal certo (WhatsApp comercial por região, abertura de chamado, downloads etc.).

## Arquitetura

```
Site norion.ind.br
   └── <script src=".../widget.js">  ← widget de chat (frontend)
             │  POST /api/chat
             ▼
   Servidor Node/Express (Railway)   ← guarda a ANTHROPIC_API_KEY
             │
             ▼
   API do Claude (api.anthropic.com) ← prompt/system-prompt.md = base de conhecimento
```

A chave da API **nunca** vai ao navegador do visitante — só existe como variável de ambiente no Railway.

## Estrutura

| Arquivo | Função |
|---|---|
| `server.js` | Servidor Express: serve o widget e faz proxy seguro para a API do Claude (com CORS e rate limit) |
| `prompt/system-prompt.md` | Persona + regras + base de conhecimento da Norion (edite aqui para mudar o comportamento do bot) |
| `public/widget.js` | Widget de chat embutível (balão flutuante azul Norion) |
| `public/index.html` | Página de teste local/produção |

## Passo a passo de publicação

### 1. Obter a chave da API do Claude
1. Acesse https://platform.claude.com/ e crie uma conta (ou entre).
2. Em **API Keys**, gere uma chave (`sk-ant-...`). Adicione créditos se necessário.
3. Guarde a chave — você vai colá-la **direto no Railway** (nunca no código).

### 2. Subir o código no GitHub
```bash
cd norion-chatbot
git init
git add .
git commit -m "Norion chatbot com API do Claude"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/norion-chatbot.git
git push -u origin main
```
(Ou crie o repositório em github.com/new e faça upload dos arquivos pela interface web.)

### 3. Publicar no Railway
1. Acesse https://railway.app → **New Project** → **Deploy from GitHub repo** → selecione `norion-chatbot`.
2. O Railway detecta Node.js automaticamente (`npm start`).
3. Em **Variables**, adicione:
   - `ANTHROPIC_API_KEY` = sua chave `sk-ant-...`
   - `ALLOWED_ORIGINS` = `https://www.norion.ind.br,https://norion.ind.br`
   - (opcionais) `MODEL` = `claude-sonnet-4-6` · `MAX_TOKENS` = `700` · `RATE_LIMIT` = `20`
4. Em **Settings → Networking**, clique em **Generate Domain**. Você receberá algo como `norion-chatbot-production.up.railway.app`.
5. Abra `https://SEU-DOMINIO.up.railway.app/` — a página de teste carrega com o widget. Converse para validar.

### 4. Instalar no site norion.ind.br
O site roda no editor Duda. Adicione o script globalmente:
1. No editor do site: **Configurações → HTML do cabeçalho (Head HTML)** — ou um widget de "HTML personalizado" presente em todas as páginas.
2. Cole:
```html
<script src="https://SEU-DOMINIO.up.railway.app/widget.js" defer></script>
```
3. **Importante:** remova (ou desative) o script do Landbot antigo para os dois chats não aparecerem juntos.
4. Republique o site.

## Configurações (variáveis de ambiente)

| Variável | Padrão | Descrição |
|---|---|---|
| `ANTHROPIC_API_KEY` | — (obrigatória) | Chave da API do Claude |
| `MODEL` | `claude-sonnet-4-6` | Modelo usado. Para reduzir custo: `claude-haiku-4-5-20251001` |
| `MAX_TOKENS` | `700` | Tamanho máximo de cada resposta |
| `ALLOWED_ORIGINS` | `*` | Domínios autorizados (defina em produção!) |
| `RATE_LIMIT` | `20` | Mensagens por IP a cada 10 minutos |

## Editar o comportamento do bot

Todo o conhecimento e as regras estão em **`prompt/system-prompt.md`** — texto puro, fácil de editar. Mudou um telefone, link ou política? Edite o arquivo, faça commit e o Railway redeploya sozinho.

## Custos (referência)

Cada mensagem consome tokens do prompt (base de conhecimento ≈ fixa) + conversa. Com `claude-sonnet-4-6` o custo por conversa típica é de centavos de dólar; com `claude-haiku-4-5-20251001` é vários vezes menor. Consulte preços atuais em https://docs.claude.com/en/docs/about-claude/pricing. O rate limit por IP protege contra abuso.

## Teste local

```bash
npm install
ANTHROPIC_API_KEY=sk-ant-... npm start
# abra http://localhost:3000
```
