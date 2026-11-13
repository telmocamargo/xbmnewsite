# Checklist de instalação do Xboxmania 2.0

Guia para colocar o novo site no ar em um VPS com Coolify. Os itens marcados com ☐ são para você ir conferindo.

Regra de ouro: **o site atual (WordPress) só sai do ar no último passo**, quando o domínio for apontado para o VPS. Até lá, o novo site fica em um endereço de teste.

---

## A. Antes de segunda-feira (sem custo, pode fazer no fim de semana)

- ☐ **Backup do WordPress atual:** no painel, Ferramentas → Exportar → "Todo o conteúdo". Guarde o arquivo e também faça o backup de arquivos e banco pela Hostinger. Isso é seu plano B.
- ☐ **Descobrir onde está o DNS do domínio** `xboxmania.com.br` (registro.br, Hostinger ou outro). Você vai precisar de acesso a essa tela na virada.
- ☐ **Criar o bot do Telegram:** no Telegram, converse com o `@BotFather`, envie `/newbot` e siga os passos. Ele entrega um **token**. Guarde em local seguro e não envie em chat ou e-mail.
- ☐ **Descobrir o seu chat id:** envie qualquer mensagem ao seu bot e abra `https://api.telegram.org/bot<TOKEN>/getUpdates` no navegador. O número em `"chat":{"id":...}` é o `TELEGRAM_CHAT_ID`.
- ☐ **(Opcional) Chave da API da Anthropic**, para os resumos do pré-feed saírem em palavras próprias. Sem ela, o pré-feed funciona, mas o resumo vem como um trecho do feed e marcado "precisa de reescrita".
- ☐ **Gerar 3 segredos** (um para cada variável). Em qualquer computador com terminal: `openssl rand -hex 32`. Use um valor diferente para `PAYLOAD_SECRET`, `CRON_SECRET` e `TELEGRAM_WEBHOOK_SECRET`.
- ☐ **Revisar o pull request** [#1](https://github.com/telmocamargo/xbmnewsite/pull/1) e fazer o merge na `main`.
- ☐ **Abaixar o TTL do DNS** do domínio para 300 segundos (5 minutos), se o seu provedor permitir. Isso deixa a virada rápida e a volta (se precisar) também.

## B. Contratar o VPS

- ☐ Plano com **2 vCPU e 8 GB de RAM** (na Hostinger, o KVM 2). Confira o preço e a renovação na tela antes de pagar.
- ☐ **Sistema operacional:** Ubuntu 24.04 LTS.
- ☐ **Painel/aplicativo:** se aparecer um modelo **Coolify**, escolha. Se não, escolha só o sistema (sem painel) e instale o Coolify no passo C.
- ☐ **Datacenter:** o mais próximo do Brasil que o plano oferecer.
- ☐ **Acesso:** prefira chave SSH. Se usar senha, use uma forte e única.
- ☐ **Backups:** ligue o backup semanal (gratuito). Anote se o diário é cobrado à parte.
- ☐ Anote o **endereço IP** do VPS.

## C. Coolify

1. ☐ Se o modelo Coolify não veio pronto, conecte no VPS por SSH e instale seguindo as instruções do site oficial do Coolify (confira o comando atual lá, ele muda).
2. ☐ Abra o painel do Coolify (endereço e porta aparecem ao final da instalação) e crie o usuário administrador. Use senha forte.
3. ☐ **Firewall:** libere só as portas 22 (SSH), 80 e 443. Se possível, restrinja o acesso ao painel do Coolify ao seu IP.
4. ☐ **Conectar o GitHub:** em Sources, conecte o repositório `telmocamargo/xbmnewsite` (como é privado, use o GitHub App do Coolify ou uma deploy key).

## D. Banco de dados

1. ☐ No Coolify, crie um recurso **PostgreSQL** (versão 16 ou superior).
2. ☐ Copie a **URL de conexão interna**. Ela será o valor de `DATABASE_URI`.

## E. Aplicação

1. ☐ Crie a aplicação a partir do repositório, branch `main`, usando o **Dockerfile** (build pack "Dockerfile").
2. ☐ **Domínio de teste** primeiro (por exemplo `novo.xboxmania.com.br`). Crie o registro DNS apontando para o IP do VPS. O Coolify emite o certificado HTTPS sozinho.
3. ☐ **Variáveis de ambiente** (veja `.env.example`):

   | Variável | Valor |
   |---|---|
   | `DATABASE_URI` | URL do PostgreSQL do passo D |
   | `PAYLOAD_SECRET` | segredo gerado |
   | `NEXT_PUBLIC_SITE_URL` | endereço do site, com https (marque como variável de **build**) |
   | `CRON_SECRET` | segredo gerado |
   | `TELEGRAM_BOT_TOKEN` | token do bot |
   | `TELEGRAM_CHAT_ID` | seu chat id |
   | `TELEGRAM_WEBHOOK_SECRET` | segredo gerado |
   | `NOTIFY_MIN_RELEVANCE` | `80` |
   | `ANTHROPIC_API_KEY` | opcional |
   | `NEXT_PUBLIC_ADSENSE_CLIENT` | deixe vazio até ter a conta do AdSense (variável de **build**) |
   | `NEXT_PUBLIC_ADSENSE_SLOT_LB`, `_RECT`, `_INLINE` | opcional, IDs dos blocos de anúncio; sem eles, o AdSense usa anúncios automáticos |
   | `YOUTUBE_API_KEY` | só para importar o podcast (passo G2); pode ser removida depois |
   | `NEXT_PUBLIC_GA_ID` | opcional, ID do Google Analytics (`G-XXXXXXX`), variável de **build** |

4. ☐ **Volume persistente:** monte um volume em `/app/media`. Sem isso, as imagens somem a cada novo deploy.
5. ☐ Faça o primeiro deploy e espere terminar. As migrações do banco rodam sozinhas na inicialização.
6. ☐ Abra o endereço de teste. A home deve abrir (vazia, sem conteúdo ainda).

## F. Primeiro acesso

1. ☐ No terminal da aplicação (Coolify → aplicação → Terminal), rode:
   `SEED_ADMIN_EMAIL=seu@email.com SEED_ADMIN_PASSWORD='uma-senha-forte' npm run seed`
   Isso cria o seu usuário, as categorias, as fontes do pré-feed e as páginas **Sobre**, **Contato** e **Política de privacidade**.
2. ☐ Entre em `/admin` e **troque a senha**.
3. ☐ Crie os usuários da equipe (papel Editor ou Colaborador).

## G. Migrar o conteúdo

No mesmo terminal da aplicação:

1. ☐ `npm run migrate:wp` mostra as contagens, sem gravar nada.
2. ☐ `npm run migrate:wp -- --run --limit 3` migra 3 itens de cada grupo, como teste. Abra o site e confira.
3. ☐ `npm run migrate:wp -- --run --all` migra tudo (análises, artigos, colunas e Caixa Indie). Pode levar um bom tempo por causa das imagens. O script pode ser repetido sem duplicar.
4. ☐ (Opcional) `npm run migrate:wp -- --run --all --podcast` inclui o acervo do podcast.
5. ☐ **Recalcular a busca** depois de migrar: `npm run reindex`. Sem isso, os itens migrados não aparecem nos resultados da busca.
6. ☐ **Preencher as notas das análises** no painel (elas chegam sem nota).

## G2. Importar o podcast do YouTube

1. ☐ **Criar a chave da API do YouTube** (gratuita): no Google Cloud Console, crie um projeto, ative a **YouTube Data API v3** e crie uma **chave de API**. Restrinja a chave a essa API (e, se quiser, ao IP do servidor). Guarde a chave com cuidado.
2. ☐ No Coolify, adicione a variável `YOUTUBE_API_KEY` com essa chave e faça um deploy (ou use `export YOUTUBE_API_KEY=...` só na sessão do terminal).
3. ☐ **Consultar** o que será importado (nada é gravado): `npx tsx scripts/import-youtube.ts --only-live --min-seconds 1200 --exclude-title REPRISE`
4. ☐ **Teste pequeno:** `npx tsx scripts/import-youtube.ts --only-live --min-seconds 1200 --exclude-title REPRISE --run --limit 5`
5. ☐ **Importar tudo:** `npx tsx scripts/import-youtube.ts --only-live --min-seconds 1200 --exclude-title REPRISE --run` (pode ser repetido, pula o que já existe)
6. ☐ **Ligar os endereços antigos do podcast** aos novos episódios: `npx tsx scripts/link-podcast-redirects.ts` (consulta) e depois com `--run`. Rode **antes** da virada do domínio, porque ele lê o site antigo.
7. ☐ No painel, em **Podcast e vídeos**, marque **Destaque na home** em dois episódios.

Com `--only-live`, só entram as transmissões ao vivo (o que está na aba **Ao vivo** do canal), todas como **Podcast**. `--min-seconds 1200` ignora as de menos de 20 minutos, `--exclude-title REPRISE` ignora as reprises, e `--list` mostra todos os vídeos que serão importados. As hashtags do fim dos títulos são removidas. Sem essa opção, vídeos de até 60 s (Shorts) são ignorados, episódios com 20 minutos ou mais entram como **Podcast** e os mais curtos como **Vídeo**. O tipo pode ser ajustado episódio a episódio no painel.

## H. Conferir antes da virada

- ☐ Home, listas, uma análise, um artigo e uma notícia abrem sem erro e com imagens.
- ☐ Menu e submenus funcionam no computador e no celular.
- ☐ `/sitemap.xml`, `/robots.txt` e `/feed.xml` respondem.
- ☐ Uma URL antiga (por exemplo `/analise-drive-rally`) redireciona para a nova.
- ☐ Criar, agendar e publicar um post de teste pelo painel funciona. Apague depois.
- ☐ Enviar uma mensagem de teste pelo formulário de Contato e ver se ela aparece no painel. Apague depois.
- ☐ O aviso de cookies aparece na primeira visita e some depois da escolha.
- ☐ O site abre rápido (meta: carregar a home em poucos segundos mesmo no celular).
- ☐ O backup do VPS e do banco está configurado (veja a seção K).

## I. Pré-feed e Telegram

1. ☐ Em **Pré-feed → Fontes**, confira as URLs e ative as fontes desejadas. As duas do Xbox Wire já vêm ativas. As outras três (Pure Xbox, Windows Central, YouTube) vêm desligadas até a URL do feed ser conferida.
2. ☐ **Registrar o webhook do Telegram** (uma vez):
   `curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://SEU-SITE/api/telegram&secret_token=<TELEGRAM_WEBHOOK_SECRET>"`
3. ☐ **Tarefas agendadas** (Coolify → aplicação → Scheduled Tasks):
   - A cada 20 minutos: `curl -fsS -X POST -H "x-cron-secret: $CRON_SECRET" http://localhost:3000/api/cron/ingest`
   - Todo dia às 08:00 de Brasília (11:00 UTC, confira o fuso do servidor): `curl -fsS -X POST -H "x-cron-secret: $CRON_SECRET" http://localhost:3000/api/cron/digest`
4. ☐ **Testar:** rode a primeira chamada à mão e veja chegarem notícias em Pré-feed e um aviso no Telegram. Toque em Aprovar no celular e confira se a notícia foi publicada.

## I2. Notícia com a sua opinião (rascunho assistido por IA)

1. ☐ No Coolify, adicione a variável `ANTHROPIC_API_KEY` (chave da API da Anthropic, criada em console.anthropic.com) e faça um deploy. Sem a chave, o botão **Escrever com a minha opinião** não aparece e o pré-feed continua como antes.
2. ☐ Variáveis opcionais: `NEWS_OPINION_DAILY_LIMIT` (padrão 4), `AI_DISCLOSURE` (a linha de transparência no fim do texto), `WRITER_MODEL` (padrão `claude-opus-5-5`) e `SUMMARY_MODEL` (padrão `claude-haiku-5-5`, usado nos resumos em massa).
3. ☐ O webhook do Telegram do passo I serve para tudo: botões e respostas de texto.
4. ☐ **Como usar:** na notícia que chegar ao Telegram, toque em **Escrever com a minha opinião**, responda à mensagem do bot com uma ou duas frases (o microfone do teclado do celular escreve por você) e revise o rascunho. **Publicar**, **Agendar** (amanhã, 09:00), **Editar** (abre o painel), **Refazer** ou **Descartar**. Envie `/cancelar` para desistir.
5. ☐ O texto sai com a linha "Texto produzido com apoio de IA e revisado por…" e sempre com crédito e link da fonte.
6. ☐ **Ajustar o tom:** o guia de estilo está em `src/content/style-guide.ts`. Se os primeiros rascunhos não soarem como você, anote o que mudaria e ajustamos o guia.

Custo (estimativa a partir dos preços de tabela, confira os valores atuais na Anthropic): cerca de US$ 0,03 a 0,05 por rascunho com o modelo padrão do redator, o que dá poucos dólares por mês no limite de 4 por dia. Os resumos em massa usam um modelo bem mais barato.

## J. A virada (o único momento com risco)

Faça em um horário de pouco acesso.

1. ☐ Adicione o domínio `xboxmania.com.br` (e `www`) na aplicação do Coolify e defina `NEXT_PUBLIC_SITE_URL` com o endereço final. **Faça um novo deploy**, porque essa variável é gravada no build.
2. ☐ No DNS, aponte `xboxmania.com.br` e `www` para o IP do VPS.
3. ☐ Espere o DNS atualizar e o certificado HTTPS ser emitido. Confira o site pelo endereço final.
4. ☐ **Plano B (voltar atrás):** se algo der errado, devolva o DNS para o IP da hospedagem antiga. Como o TTL está baixo, a volta leva poucos minutos. Por isso a hospedagem antiga **não deve ser cancelada** nesta etapa.
5. ☐ No **Google Search Console**, envie o `sitemap.xml` do novo site. Se o site já estiver cadastrado, só reenvie.
6. ☐ Reconfigure o **Google Analytics** (hoje o Site Kit do WordPress cuida disso). Isso ainda não está feito no novo site.

## K. Depois da virada

- ☐ **Backups:** além do backup semanal do VPS, agende um backup diário do PostgreSQL pelo Coolify e guarde uma cópia fora do VPS. Inclua a pasta de mídia (`/app/media`).
- ☐ **Manter a hospedagem antiga por cerca de 30 dias**, sem mexer, e só cancelar quando tudo estiver estável. Atenção: o preço promocional pode subir na renovação.
- ☐ **AdSense:** pedir a aprovação quando o site já tiver conteúdo novo regular e uma página de política de privacidade. Depois, colocar o código em `NEXT_PUBLIC_ADSENSE_CLIENT` e fazer novo deploy.
- ☐ **Revisar os textos das páginas** em Conteúdo → Páginas: Sobre (inclui a seção "Como trabalhamos", que deve refletir o que vocês realmente praticam) e Política de privacidade (confira prazo de guarda das mensagens e, se tiver CNPJ ou nome do responsável, inclua).
- ☐ **Mensagens de contato:** chegam em Pré-feed → Mensagens de contato (e no Telegram, se configurado). Apague as com mais de 12 meses, como diz a política.
- ☐ **Atualizações:** acompanhe as atualizações de segurança do Payload e do Next.js (o Dependabot do GitHub pode avisar).

## Se algo der errado

| Sintoma | O que verificar |
|---|---|
| Site não abre após o deploy | Logs da aplicação no Coolify; confira `DATABASE_URI` e `PAYLOAD_SECRET` |
| Imagens somem depois de um deploy | O volume em `/app/media` não foi montado |
| Links e canonical com `localhost` | `NEXT_PUBLIC_SITE_URL` não estava definida no build; defina e faça novo deploy |
| Telegram não avisa | Token e chat id; abra `/api/cron/ingest` e veja o campo `errors`; confira o webhook com `getWebhookInfo` |
| Pré-feed vazio | Fontes ativas? Alguma com erro na lista de Fontes? As notícias com mais de 72 horas e fora do tema são descartadas por regra |
| Migração do WordPress falha | Rode de novo, ela pula o que já foi migrado; veja a mensagem do item com erro |
