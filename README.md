# ProMove — movimento profissional

Gerenciador pessoal de candidaturas a vagas de emprego, em estilo kanban (como o Trello), com duas seções — **Nacional** e **Internacional** (com bandeira do país em cada vaga) — registro de datas e motivos de rejeição, análise **SWOT**, espaço para currículos e pitch, histórico detalhado de cada movimentação e um dashboard de métricas.

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
- **Duas seções**: Nacional e Internacional — vagas internacionais exibem a **bandeira do país**
- **Busca** por empresa/cargo na barra superior e **arquivamento** (sai do quadro, continua nas métricas)

### Em cada vaga
- **Detalhes**: plataforma, salário, modelo de trabalho, cidade, link do anúncio, link da candidatura, prioridade
- **Descrição da vaga**: o texto completo de requisitos e responsabilidades
- **SWOT da candidatura**: forças e fraquezas do seu perfil para aquela vaga, oportunidades e ameaças do processo
- **Histórico**: timeline com tudo o que aconteceu, mais notas livres
- **Próxima ação com data** — o card destaca em vermelho quando vence

### Planejamento e documentos
- **SWOT geral de carreira** na página Planejar
- **Currículos**: upload de PDF/DOC/DOCX (até 8 MB) com várias versões nomeadas, download e exclusão
- **Pitch e rascunhos**: textos livres para reaproveitar nas candidaturas

### Dashboard
- KPIs: aplicações, ativas, entrevistas, ofertas, rejeições e taxa de resposta
- **Meta semanal** de aplicações com barra de progresso
- **Próximas ações** pendentes, com as vencidas em destaque
- Aplicações por mês, **funil de conversão** (derivado do histórico), motivos de rejeição, tempo médio por etapa, comparativo Nacional × Internacional e tabela por país

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

O `vercel.json` executa `prisma migrate deploy` + seed a cada build (idempotente). Os uploads de currículo ficam no próprio Postgres, então funcionam igualmente na Vercel e no Docker.

## Desenvolvimento local (sem Docker para o app)

```bash
# sobe apenas o banco
docker compose up -d db

npm install
npx prisma migrate dev   # aplica migrations + seed
npm run dev              # http://localhost:3000
```

## Stack

Next.js 16 (App Router, Server Actions) · React 19 · TypeScript · Tailwind CSS v4 · Prisma 6 + PostgreSQL 17 (Neon na Vercel) · dnd-kit · Recharts · iron-session · Docker Compose

## Estrutura

```
src/
  app/(app)/board/[section]  → kanban (nacional | internacional)
  app/(app)/dashboard        → métricas
  app/(app)/planejamento     → SWOT geral de carreira
  app/(app)/documentos       → currículos e rascunhos de pitch
  app/(app)/historico        → log de eventos com filtros
  app/login                  → autenticação
  app/actions/               → server actions (vagas, SWOT, documentos, auth)
  app/api/documentos/[id]    → download dos currículos
  components/                → board, modais, swot, documents, dashboard, layout, ui
  lib/                       → prisma, sessão, métricas, domínio, países
prisma/                      → schema, migrations, seed das etapas
compose.yml · Dockerfile     → orquestração (db + web)
vercel.json                  → build com migrate + seed na Vercel
```

## Licença

[MIT](LICENSE) © Israel Maicena Neves
