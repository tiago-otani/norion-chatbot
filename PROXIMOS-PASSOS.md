# Retomar: publicar o Norion Chatbot no Railway

> Ponto onde paramos em 2026-07-14. Retomar a partir daqui na próxima sessão.

## Já feito
- [x] Repositório Git local inicializado em `C:\Users\Samsung\Documents\norion-chatbot`
- [x] Commit inicial (`Initial commit`) criado
- [x] Repositório criado no GitHub via GitHub Desktop: `https://github.com/tiago-otani/norion-chatbot`
- [x] Push feito — branch `master` sincronizado com `origin/master`

## Falta fazer — Deploy no Railway (opção escolhida)

Passo a passo (também documentado em `README.md` deste projeto):

1. **Conta na API do Claude** (se ainda não tiver a chave `sk-ant-...`)
   - Acessar https://platform.claude.com/, criar/entrar na conta
   - Em **API Keys**, gerar uma chave
   - Adicionar créditos se necessário
   - Guardar a chave — ela vai **direto no Railway**, nunca no código

2. **Criar o projeto no Railway**
   - Acessar https://railway.app
   - **New Project** → **Deploy from GitHub repo** → selecionar `norion-chatbot`
   - Railway detecta Node.js automaticamente (usa `npm start`)

3. **Configurar variáveis de ambiente** (Railway → Variables)
   - `ANTHROPIC_API_KEY` = a chave `sk-ant-...` (obrigatória)
   - `ALLOWED_ORIGINS` = `https://www.norion.ind.br,https://norion.ind.br`
   - Opcionais: `MODEL` (padrão `claude-sonnet-4-6`), `MAX_TOKENS` (padrão `700`), `RATE_LIMIT` (padrão `20`)

4. **Gerar domínio público**
   - Railway → **Settings → Networking** → **Generate Domain**
   - Vai gerar algo como `norion-chatbot-production.up.railway.app`

5. **Testar**
   - Abrir `https://SEU-DOMINIO.up.railway.app/` no navegador
   - A página de teste deve carregar com o widget de chat — conversar para validar

6. **Instalar no site norion.ind.br** (depois de validado)
   - Editor Duda → **Configurações → HTML do cabeçalho (Head HTML)**
   - Colar: `<script src="https://SEU-DOMINIO.up.railway.app/widget.js" defer></script>`
   - Remover/desativar o script antigo do Landbot
   - Republicar o site

## Observações
- Node.js/npm **não estão instalados** nesta máquina — não é necessário para o deploy no Railway (ele builda na nuvem), só seria preciso para rodar/testar localmente.
- `git` e `gh` (GitHub CLI) também não estão instalados no PATH; usamos o Git embutido do GitHub Desktop para o commit/push inicial.
- Repositório: `https://github.com/tiago-otani/norion-chatbot`
