# Xboxmania 2.0

Site de notícias, análises e artigos sobre o ecossistema Xbox. Feito com **Payload CMS 3** (painel de edição), **Next.js** (site) e **PostgreSQL**.

## O que já está pronto

- **Painel** em `/admin`: posts, análises (com nota, prós e contras), jogos, categorias, mídia, usuários e papéis. Rascunho, autosave, agendamento e histórico de versões.
- **Site**: home, listas por seção, páginas de notícia, artigo e análise, SEO (dados estruturados, sitemap, RSS, robots), tema claro/escuro e menu com submenus.
- **Busca** no topo do site (atalho `/`): procura em análises, notícias e artigos e ignora acentos. Depois de migrar conteúdo, rode `npm run reindex`.
- **Páginas fixas** editáveis no painel (Sobre, Contato, Política de privacidade), formulário de contato que grava no painel e avisa no Telegram, e aviso de cookies. Estatísticas e anúncios só carregam depois do aceite.
- **Pré-feed de notícias**: varredura de feeds RSS, filtro por relevância, agrupamento de duplicados, resumo curto em português, aviso no Telegram e aprovação com um toque.
- **Migração do WordPress**: análises e artigos, com imagens baixadas e links reescritos. URLs antigas redirecionam para as novas.

## Rodar localmente

Requisitos: Node 20.9+ e PostgreSQL.

```bash
cp .env.example .env        # ajuste DATABASE_URI e gere um PAYLOAD_SECRET
npm install
npm run seed                # usuário admin, categorias e fontes (anote a senha exibida)
npm run dev                 # http://localhost:3000  ·  painel em /admin
```

`npm run seed:demo` cria também conteúdo de exemplo.

## Migrar o conteúdo do WordPress

```bash
npm run migrate:wp                         # só mostra as contagens (não grava nada)
npm run migrate:wp -- --run --limit 3      # teste: 3 itens de cada grupo
npm run migrate:wp -- --run --all          # tudo (análises, artigos, colunas, Caixa Indie)
npm run migrate:wp -- --run --all --podcast
```

Os slugs são mantidos. O script pula o que já foi migrado, então pode ser repetido. As análises importadas vêm **sem nota**: preencha o campo Nota no painel.

## Pré-feed de notícias

1. Em **Pré-feed → Fontes**, confira e ative as fontes. Só as duas do Xbox Wire vêm ativas. As demais precisam ter a URL do feed confirmada antes de ativar.
2. Agende duas chamadas (veja o deploy abaixo):
   - a cada 20 minutos: `POST /api/cron/ingest`
   - todo dia às 08:00 (Brasília): `POST /api/cron/digest`
   Ambas exigem o cabeçalho `x-cron-secret` com o valor de `CRON_SECRET`.
3. **Telegram** (opcional): crie um bot com o @BotFather, coloque `TELEGRAM_BOT_TOKEN` e `TELEGRAM_CHAT_ID` no `.env` e registre o webhook:
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://SEU-SITE/api/telegram&secret_token=<TELEGRAM_WEBHOOK_SECRET>"
   ```
4. **Resumo com IA** (opcional): defina `ANTHROPIC_API_KEY`. Sem a chave, o resumo é um trecho do feed e a notícia vem marcada como "precisa de reescrita".

Regras: só entram notícias do tema Xbox com menos de 72 horas. Assuntos repetidos entre fontes são agrupados. Rumores são marcados. **Nada é publicado sem aprovação.**

## Deploy (VPS com Coolify)

1. Crie um banco PostgreSQL no Coolify e copie a URL de conexão para `DATABASE_URI`.
2. Crie a aplicação a partir deste repositório usando o `Dockerfile`. Defina as variáveis do `.env.example` (com `NEXT_PUBLIC_SITE_URL` apontando para o domínio final).
3. Monte um volume persistente em `/app/media`.
4. Em **Scheduled Tasks**, crie as duas chamadas do pré-feed, por exemplo:
   `curl -fsS -X POST -H "x-cron-secret: $CRON_SECRET" http://localhost:3000/api/cron/ingest`
5. Aponte o domínio e rode `npm run seed` uma vez (ou crie o primeiro usuário em `/admin`).

As migrações do banco rodam sozinhas na inicialização. Ao mudar coleções, gere uma nova migração com `npx payload migrate:create`.

## Estrutura

```
src/collections/   modelos de conteúdo (posts, análises, jogos, pré-feed...)
src/lib/           ingestão, relevância, resumo, Telegram, aprovação
src/app/(site)/    páginas públicas e rotas de cron/Telegram
src/app/(payload)/ painel administrativo
scripts/           seed, migração do WordPress, varredura manual
```

## Pendências conhecidas

- Imagens de notícias do pré-feed vêm da fonte e precisam de confirmação de licença antes de publicar.
- Google Analytics e AdSense são opcionais e ficam desligados até as variáveis `NEXT_PUBLIC_GA_ID` e `NEXT_PUBLIC_ADSENSE_CLIENT` serem definidas.
- Os textos de Sobre e da Política de privacidade são uma base e precisam ser revisados pela equipe.
- A imagem Docker e o deploy no Coolify ainda não foram testados.
