# ProMove — movimento profissional

Gerenciador pessoal de candidaturas a vagas de emprego, em estilo kanban (como o Trello): um quadro único com **país e bandeira em cada vaga**, filtros por origem (Brasil / exterior), país e data, registro de datas e motivos de rejeição, análise **SWOT**, espaço para currículos e pitch, histórico detalhado de cada movimentação e um dashboard de métricas.

Histórico de mudanças: [CHANGELOG.md](CHANGELOG.md).

## Como rodar (Docker)

Pré-requisito: Docker Desktop (ou engine + compose).

```bash
# 1. (opcional) copie e ajuste as variáveis de ambiente
cp .env.example .env

# 2. suba tudo (Postgres + aplicação)
docker compose up --build -d
```

Abra **http://localhost:3000** e entre com as credenciais do `.env` (padrão: `admin` / `admin123`).

As migrations e o seed das etapas rodam automaticamente na inicialização do container. Os dados ficam no volume `pgdata` e sobrevivem a restarts (`docker compose down` preserva; `docker compose down -v` apaga tudo).

## Funcionalidades

### Kanban de candidaturas
- 7 etapas: Interesse → Aplicado → Contato/Screening → Entrevista → Teste Técnico → Oferta → Rejeitado
- **Arrastar e soltar** entre colunas (mouse e touch — segure ~0,2s no celular)
- Ao soltar uma vaga em **Rejeitado**, um modal pede o **motivo** (10 categorias + detalhes) e a **data**
- **País obrigatório** em toda vaga, com a **bandeira** no card (Brasil incluído)
- Vaga nova **entra no topo da raia**; o arraste manual continua livre, e **Ordenar por mais recentes** (por raia ou no quadro todo) reorganiza pela data de entrada na etapa
- **Filtros**: pills **Tudo / Brasil / Exterior**, país multi-seleção e intervalo de entrada na etapa — no quadro todo ou só em uma raia (contador "visíveis/total"). Com busca, país ou data ativos o arraste fica desativado (um filtro de raia só desativa naquela raia); a origem não desativa
- **Busca** por empresa/cargo na barra superior
- **Arquivar rápido** pelo ícone do card, com confirmação — a vaga sai do quadro e continua no histórico e nas métricas

### Em cada vaga
- **Detalhes**: plataforma, salário, modelo de trabalho, cidade, link do anúncio, link da candidatura, prioridade
- **Descrição da vaga**: o texto completo de requisitos e responsabilidades
- **Currículo**: a versão enviada para aquela vaga — escolha uma já salva em Documentos ou envie um arquivo novo; um ícone no card (ao lado dos dias na etapa) abre o currículo num visualizador com botão de download
- **SWOT da candidatura**: forças e fraquezas do seu perfil para aquela vaga, oportunidades e ameaças do processo
- **Histórico**: timeline com tudo o que aconteceu, mais notas livres
- **Próxima ação com data** — o card destaca em vermelho quando vence

### Planejamento e documentos
- **SWOT geral de carreira** na página Planejar
- **Currículos**: upload de PDF/DOC/DOCX (até 8 MB) com várias versões nomeadas, download e exclusão; cada versão mostra em quais vagas foi usada
- **Pitch e rascunhos**: textos livres para reaproveitar nas candidaturas

### Dashboard
- KPIs: aplicações, ativas, entrevistas, ofertas, rejeições e taxa de resposta
- **Meta semanal** de aplicações com barra de progresso
- **Próximas ações** pendentes, com as vencidas em destaque
- Aplicações por mês, **funil de conversão** (derivado do histórico), motivos de rejeição, tempo médio por etapa e tabela **por país** (Brasil incluído)

### Interface
- Visual claro em tons de lavanda, cards com pills de prioridade e colunas coloridas
- **Responsivo**: do celular (navegação inferior, uma coluna por vez com swipe) a telas ultrawide (as 7 colunas visíveis de uma vez)

## Variáveis de ambiente (`.env`)

| Variável | Padrão | Descrição |
|---|---|---|
| `APP_USER` / `APP_PASSWORD` | `admin` / `admin123` | Credenciais de login da aplicação |
| `SESSION_SECRET` | — | Segredo da sessão (mínimo 32 caracteres — troque!) |
| `APP_PORT` | `3000` | Porta da aplicação no host |
| `POSTGRES_USER/PASSWORD/DB` | `painel` | Credenciais do banco |
| `POSTGRES_PORT` | `5432` | Porta do Postgres exposta no host |
| `POSTGRES_PRISMA_URL` / `POSTGRES_URL_NON_POOLING` | localhost | Conexões do Prisma — usadas apenas no desenvolvimento local |

## Deploy na Vercel (com banco Neon)

O projeto também roda na Vercel usando Postgres do Neon via Marketplace:

```bash
vercel link
vercel integration add neon      # injeta POSTGRES_PRISMA_URL / POSTGRES_URL_NON_POOLING
vercel env add APP_USER production
vercel env add APP_PASSWORD production
vercel env add SESSION_SECRET production
vercel deploy --prod
```

O `vercel.json` roda `next build` e só então `prisma migrate deploy` + seed (idempotente): uma migration entra no banco apenas quando o deploy novo já está pronto, encurtando para segundos a janela em que o deploy antigo roda contra o schema novo. Os uploads de currículo ficam no próprio Postgres, então funcionam igualmente na Vercel e no Docker.

## Desenvolvimento local (sem Docker para o app)

```bash
# sobe apenas o banco
docker compose up -d db

bun install
bunx prisma migrate dev   # aplica migrations + seed
bun run dev               # http://localhost:3000
```

### Atualizando uma instalação existente

As migrations rodam sozinhas no build da Vercel e na inicialização do container. A migration
`remove_section_country_required` remove a antiga divisão Nacional/Internacional e grava país `BR`
nas vagas nacionais — ela apaga uma coluna, então faça um snapshot/branch no Neon antes do deploy.
A migration seguinte, `renumber_positions_per_stage`, renumera as posições das raias unidas
preservando a ordem manual; não há passo pós-deploy. A migration `application_resume` só acrescenta a coluna
opcional do currículo por vaga e não afeta o deploy antigo. Durante os segundos entre a migration e a
promoção do deploy novo, o deploy antigo retorna erro — publique num momento tranquilo. Detalhes e
observações sobre previews em [CHANGELOG.md](CHANGELOG.md).

## Stack

Next.js 16 (App Router, Server Actions) · React 19 · TypeScript · Tailwind CSS v4 · Prisma 6 + PostgreSQL 17 (Neon na Vercel) · dnd-kit · Recharts · iron-session · bun · Docker Compose

## Estrutura

```
src/
  app/(app)/board            → kanban único (filtros por origem, país e data)
  app/(app)/dashboard        → métricas
  app/(app)/planejamento     → SWOT geral de carreira
  app/(app)/documentos       → currículos e rascunhos de pitch
  app/(app)/historico        → log de eventos com filtros
  app/login                  → autenticação
  app/actions/               → server actions (vagas, SWOT, documentos, auth)
  app/api/documentos/[id]    → download dos currículos (`?inline=1` exibe PDF e texto no navegador)
  components/                → board (Board, Column, FilterPopover), modais, swot, documents,
                               dashboard, layout, ui (Modal, ConfirmDialog, CountrySelect, Flag)
  lib/                       → prisma, sessão, métricas, domínio, países, filtros do quadro (boardFilters)
prisma/                      → schema, migrations, seed das etapas
compose.yml · Dockerfile     → orquestração (db + web)
vercel.json                  → build com migrate + seed na Vercel
```

## Licença

[MIT](LICENSE) © Israel Maicena Neves
