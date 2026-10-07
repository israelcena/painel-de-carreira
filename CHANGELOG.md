# Histórico de mudanças

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [Não publicado] — 2026-09-15

### Alterado (quebra compatibilidade)

- **Fim da divisão Nacional / Internacional.** O quadro agora é único, em `/board`.
  As URLs antigas `/board/nacional` e `/board/internacional` redirecionam para `/board`.
- **País obrigatório em toda vaga.** As vagas que estavam na seção Nacional passaram a ter
  país `BR` (Brasil). O campo País aparece sempre nos formulários de criar e editar, com o
  Brasil no topo da lista e pré-selecionado ao criar (exceto quando a visão "Exterior" está ativa).
- **Bandeira em todos os cards**, inclusive nas vagas do Brasil.
- **Dashboard só por país.** Saíram as pills Tudo / Nacional / Internacional, o parâmetro
  `?secao=` e a tabela comparativa "Nacional × Internacional". O gráfico "Aplicações por mês"
  passou a ter uma série única, e a tabela "Por país" agora inclui o Brasil.
- **Histórico** filtra por origem (Brasil e exterior / Brasil / Exterior) em vez de seção, e cada
  linha mostra o nome do país no lugar do rótulo da seção.
- **Desarquivar** recoloca a vaga no topo da raia com posição nova, em vez de reutilizar a antiga.
- O item de navegação "Quadros" virou "Quadro".
- **Build na Vercel** (`vercel.json`): `next build` roda antes de `prisma migrate deploy` + seed,
  para que uma migration só entre no banco quando o deploy novo já está pronto para ser promovido.
- **The first deploy moves every idle Application to Rejeitado.** Automatic rejection (see
  Adicionado) is on by default with a 10-day limit and is retroactive: the first time the Quadro,
  Dashboard or Histórico renders after the deploy, every Application that is not archived, not in
  Interesse, and has gone 10 days or more without moving (counted from the latest of entering its Stage, its Next
  action date and its last unarchive) goes to Rejeitado, dated the day it reached 10 days.
  **Opening a Vercel preview of this branch does the same on the production database**, because
  previews share it. To keep everything where it is, run
  `INSERT INTO settings (key, value) VALUES ('autoRejectionEnabled', 'false');` before the first
  load, and switch it on from the Dashboard when ready.
- **The rejection modal no longer pre-selects a reason.** It used to open on "Sem retorno
  (ghosting)", so a quick confirm recorded a reason nobody chose. The select now starts on
  "Selecione o motivo", and **Confirmar rejeição** stays disabled until a reason is picked. This
  applies wherever the modal opens, dragging a card into Rejeitado included.
- **Cancelling a rejection started from an Application returns to its view.** "Mover para etapa"
  → Rejeitado used to close the Application modal, so cancelling left you on the board. Now the
  Application modal is hidden while the rejection modal is open (as with the Arquivar
  confirmation) and comes back in its read view when you cancel. Confirming closes it with the
  toast "Vaga movida para Rejeitado". Dragging a card into Rejeitado keeps its behaviour:
  cancelling puts the card back.

### Adicionado

- **Visão da vaga ao clicar no card.** O clique não abre mais direto o formulário: abre uma visão
  de leitura com tudo da vaga — etapa e dias nela, próxima ação (em vermelho se atrasada), dados,
  links, currículo, descrição, observações, análise SWOT e histórico. No desktop fica em duas
  colunas (textos longos à esquerda, dados curtos na lateral); no mobile, uma coluna com os dados
  no topo. **Editar**, no cabeçalho, abre as abas de edição de antes, e o lápis de cada seção abre
  direto na aba certa. **Salvar alterações** volta para a visão já atualizada (antes fechava o
  modal), e **Voltar** sai da edição sem salvar. Arquivar, excluir e mover de etapa continuam
  fechando o modal.
- **Avançar de fase e Arquivar no cabeçalho da visão da vaga**, ao lado do Editar. **Avançar de
  fase** move a vaga para a próxima etapa do funil (topo da raia) e mostra o nome da etapa no
  tooltip; some na última etapa (Oferta) e em Rejeitado, que volta pelo "Retornar ao funil".
  **Arquivar** usa a mesma confirmação do ícone do card: o modal some enquanto ela está aberta e
  volta se você cancelar. No celular os dois viram só ícone, para não espremer o título. Ao mover
  pelo modal (avançar, "Mover para etapa" ou "Retornar ao funil"), um aviso diz para qual etapa a
  vaga foi.
- **Rejeitar in the Application view header**, next to Arquivar and Avançar de fase, and icon-only
  on mobile like them ("Rejeitar vaga" in the tooltip). It opens the rejection modal for that
  Application and is hidden once the Application is in Rejeitado.
- **Editar motivo in the rejection banner**, both in the read view and in the Detalhes edit tab. It
  opens the rejection modal as "Editar rejeição", filled with the current reason, details and date;
  **Salvar** updates the Rejection, keeps the card where it is in Rejeitado, adds a line to the
  History and returns to the read view. The line is an edit, not a second Rejection: it reads
  e.g. "Rejeição editada: motivo de sem retorno (ghosting) para perfil não aderente à vaga" (or
  names the date and details when those changed), and the card keeps its days in Rejeitado, its
  place in "Ordenar por mais recentes" and the board's date filters. The Response rate uses the
  corrected reason, so changing a reason to "Sem retorno (ghosting)" stops counting it as a reply.
  Saving without changes records nothing. The read-view banner also gets **Retornar ao funil**, so
  both banners offer the same two actions.
- **Automatic rejection of idle Applications.** An Application that is not archived and has gone
  a set number of days without moving is moved to Rejeitado by the app, from any Stage from
  Aplicado to Oferta; Interesse, the user's queue, is never touched. The limit is one number for
  every Stage: 10 days by default, from 1 to 90. The count
  starts at the latest of entering the current Stage, the Next action date and the last unarchive,
  so a Next action dated today or later holds it off, and restoring or unarchiving starts it over.
  The reason is "Sem retorno (ghosting)", or "Outro" from Oferta, and the details
  read e.g. "Movida automaticamente após 10 dias sem movimentação em Aplicado.". The Rejection is
  dated the day the limit was reached, not the day the app was opened (so time per Stage, the date
  shown in Histórico, the days in Rejeitado and the "Ordenar por mais recentes" order do not depend
  on when the app was opened), the card goes to the top of Rejeitado, and the History shows
  "Rejeitada automaticamente: …". There is no warning beforehand. It runs when the Quadro,
  Dashboard or Histórico page loads, with no scheduler (ADR-0004), and is retroactive: switching it
  on or lowering the limit moves every Application already past it on the next load. A new
  **Rejeição automática** card on the Dashboard, next to the weekly goal, switches it on and off
  and sets the number of days. The first version, deployed on 2026-10-01, also covered Interesse;
  the Applications it moved from there stay in Rejeitado ("Retornar ao funil" brings one back).
- **Currículo em cada vaga.** Nova aba **Currículo** no modal da vaga: vincule uma versão já salva
  em Documentos ou envie um arquivo novo (ex.: CV adaptado para a vaga), que entra na biblioteca e
  já fica vinculado. Um currículo por vaga; trocar substitui o vínculo e "Remover vínculo" mantém o
  arquivo em Documentos.
- **Currículo pelo card**: o ícone ao lado dos dias na etapa abre o currículo vinculado num
  visualizador, sem abrir o modal da vaga nem iniciar o arraste; o botão **Baixar** fica no
  visualizador. PDF aparece no leitor do navegador em telas com mouse ou trackpad; no celular (o
  iPhone desenharia só a 1ª página) e em navegadores sem leitor embutido, o visualizador oferece
  **Abrir em nova aba**. TXT e MD aparecem como texto (UTF-8, UTF-16 com BOM ou Windows-1252); DOC,
  DOCX, ODT e RTF, que o navegador não abre, mostram só o nome e o tamanho. A rota de download aceita
  `?inline=1` para exibir PDF e texto, com o tipo decidido pela extensão, e responde com `nosniff` e
  `Cache-Control: private, no-store`.
- **"Usado em" em Documentos**: cada currículo lista as vagas que o usam (arquivadas marcadas), e a
  confirmação de exclusão avisa quantas vagas ficarão sem currículo.
- **Histórico registra o currículo**: "Currículo vinculado: …" e "Currículo desvinculado: …",
  inclusive quando o documento é excluído em Documentos.
- **Vagas novas entram no topo da raia** ao criar, ao rejeitar (topo de Rejeitado) e ao usar
  "Mover para etapa" no modal. O arraste manual continua livre.
- **Ordenar por mais recentes**, por raia e para o quadro inteiro, pela data de entrada na etapa.
- **Filtro geral do quadro**: pills **Tudo / Brasil / Exterior**, país multi-seleção (os países
  presentes no quadro, com bandeira e contagem; um país selecionado que ficou sem cards continua
  listado com contagem 0 para poder ser desmarcado) e intervalo de datas de entrada na etapa. Chips
  resumem o filtro ativo e a contagem vira "X de Y vagas". "Limpar filtros" limpa país e datas; a
  origem das pills fica como está.
- **Filtro por raia**, no cabeçalho de cada coluna, com os mesmos critérios e contador
  "visíveis/total".
- **Arquivar rápido** pelo ícone no canto do card, com diálogo de confirmação no visual do sistema
  (`ConfirmDialog`, construído sobre o `Modal`; o foco inicial fica em "Cancelar").
- Arraste desativado enquanto busca, país ou data estiverem ativos (a origem não desativa). Um
  filtro de raia desativa o arraste só dentro daquela raia.
- **Telas grandes aproveitam a largura.** Histórico, Documentos e Planejamento vão até 1800px, como
  o Dashboard (antes 1024px). No Histórico, a partir de 1280px cada evento vira uma linha em colunas
  alinhadas (vaga · evento · data). Em Documentos, a lista de currículos fica em duas colunas a
  partir de 1280px. O modal da vaga acompanha a tela: 896px a partir de 1024px e, de 1280px em
  diante, 75% da largura (até 1792px). Nova vaga e o visualizador de currículo seguem em 768px
  (1280px+) e 896px (1536px+). No modal da vaga, a lateral de dados passa a 288px em 1536px+ e a
  aba Detalhes mostra quatro campos por linha em 1920px+.
- **Telas gigantes (1920px+, novo breakpoint `3xl`) usam a largura toda**, sem o limite de 1800px,
  com colunas adaptativas (o número de colunas acompanha a largura): cards do Dashboard e a lista de
  "Atividade recente", eventos do Histórico (em cartões), currículos e rascunhos em Documentos. O
  SWOT do Planejamento mostra os quatro quadrantes lado a lado e as colunas do Quadro deixam de
  parar em 384px, preenchendo a tela. Na visão da vaga, descrição e observações ficam numa coluna e
  SWOT e histórico noutra, para as linhas de texto não passarem de ~100 caracteres.

### Corrigido

- **Dashboard contava vagas arquivadas nos indicadores.** A consulta base nunca filtrava o
  arquivamento, e só "Ativas", as próximas ações e a coluna de ativas em "Por país" o respeitavam.
  Agora os KPIs (aplicações, ativas, entrevistas, ofertas, rejeições, taxa de resposta), a meta da
  semana, as próximas ações e a tabela "Por país" consideram só vagas não arquivadas, e uma nota
  abaixo dos KPIs avisa isso. Os cards históricos — aplicações por mês, funil de conversão, motivos
  de rejeição e tempo médio por etapa — continuam incluindo as arquivadas e dizem isso no rodapé; a
  atividade recente também segue mostrando eventos de vagas arquivadas. O botão **Arquivar** e a
  confirmação de exclusão agora dizem que a vaga sai do quadro "sem perder o histórico", em vez de
  prometer que ela "mantém as métricas".
- **Funil e indicadores zerados em vagas sem histórico.** A etapa alcançada por cada vaga vinha só
  dos eventos, e vagas inseridas direto no banco (sem evento de criação) apareciam apenas em
  Interesse, zerando Entrevistas, Ofertas e Taxa de resposta. Agora a etapa atual do card conta como
  alcançada, assim como, para as rejeitadas, a etapa de onde saíram; e um motivo de rejeição
  diferente de "Sem retorno" já conta como resposta, mesmo sem o evento de rejeição.
- **Data de aplicação ao criar uma vaga** só vem preenchida com hoje quando a etapa escolhida é
  Aplicado ou posterior (antes vinha preenchida também em Interesse, gravando uma data de aplicação
  em vaga que ainda não foi aplicada). Enquanto a data não for editada à mão, ela acompanha a troca
  de etapa no formulário. Vale só para vagas novas.
- **Interesse fora da meta da semana e de "Aplicações por mês".** Com a data de aplicação vazia,
  os dois indicadores usavam a data de cadastro, então a vaga nova em Interesse continuava contando
  mesmo sem a data pré-preenchida. Agora só conta a vaga que chegou a Aplicado ou além (a mesma
  régua do funil), inclusive as antigas sem data de aplicação e as rejeitadas depois de aplicar. A
  data usada é a de aplicação do card; vazia, vale o dia em que a vaga entrou em Aplicado pelo
  histórico (caso de quem arrasta o card de Interesse para Aplicado) e, sem esse registro, a de
  cadastro. Interesses antigos que ficaram com a data pré-preenchida também saem da conta enquanto
  estiverem em Interesse. Os rodapés dos dois cards explicam a regra.
- A lista de currículos em duas colunas (1280px+) e a "Atividade recente" em colunas (1920px+) não
  deixam mais uma linha divisória sobrando sob a última linha — visível sobretudo com um currículo
  só.
- **Dashboard no mobile:** tocar em Dashboard deixava a página mais larga que a tela, o navegador
  afastava o zoom e o menu de baixo esticava junto. A grade de cards não tinha colunas definidas
  abaixo de 1024px, e textos de uma linha (empresa/cargo, notas) alargavam a coluna. Mesma correção
  nas grades do SWOT e dos rascunhos, quebra de linha para textos longos sem espaço (URLs em notas) e
  `overflow-x-clip` no conteúdo, para que nenhum estouro futuro desloque o menu fixo.
- Filtros do Histórico ficam na linha do título, com largura automática (o `w-full` do campo
  vencia o `w-auto` e cada select ocupava a linha inteira).
- Rodapé do card quebra linha quando todos os indicadores aparecem, em vez de sair da borda nas
  raias estreitas de telas largas.
- Upload de currículo acima do limite (ou com falha de rede) mostra erro no formulário em vez de
  derrubar a página.
- Aviso de hidratação do dnd-kit (`aria-describedby` divergente entre servidor e cliente) com um
  `id` estável no `DndContext`.
- Popover de filtros: reposiciona ao redimensionar, rolar ou quando a toolbar muda de linha;
  limita a altura ao espaço disponível (abre para cima quando não cabe embaixo) em vez de deixar o
  rodapé fora da tela; fecha quando o gatilho sai da tela em vez de flutuar sobre outra coluna.
- Arquivar e mover: falha de rede agora desfaz a alteração otimista, avisa e recarrega o estado do
  servidor (antes a promise rejeitada deixava o card sumido sob um toast de sucesso). O rollback usa
  o snapshot da própria mutação, e um card arquivado em voo não volta ao quadro quando o payload de
  uma action anterior (ex.: "Ordenar tudo") chega antes.
- Botões "Ordenar por mais recentes" ficam desabilitados enquanto qualquer ordenação estiver em
  andamento (antes só o botão da própria raia bloqueava, e um segundo clique apagava o spinner).
- `Modal` devolve o foco ao elemento que o abriu quando fecha.
- Validação de país aceita somente os códigos alpha-2 oferecidos no select (a checagem anterior
  também aceitava alpha-3 e numéricos, que bandeira e filtros não tratam).
- Mensagem de raia vazia por filtro não atribui mais a causa ao filtro da raia quando o filtro
  geral ou a busca é o responsável.

### Desenvolvimento

- `bun run lint` ignora `.claude/worktrees/**`. Os worktrees do Claude Code são checkouts de outras
  branches, e o lint os percorria junto, reportando milhares de problemas que não vinham do código
  da branch atual.
- **Vercel previews no longer migrate the database.** `scripts/vercel-build.sh` runs `prisma migrate deploy`
  and seed only in production, or in previews with `MIGRATE_ON_BUILD=1` (for when each preview has its own
  Neon branch). Before, a pull request with a migration changed the production database as soon as its
  preview was built.
- **CI on every pull request** (GitHub Actions): migrations and seed against an empty Postgres, then lint,
  typecheck, tests when present, and build.
- `npm run typecheck` (`next typegen && tsc --noEmit`).
- **Issue workflow for agents:** `ready-for-agent` issues are implemented in a session the user starts,
  following `docs/agents/issue-runbook.md`. There is no unattended runner.
  The skills it uses (implement, tdd, pr, code-review, domain-modeling) are now installed in the repo.
- From now on, everything except UI text (code, commits, issues, pull requests, docs and new changelog
  entries) is written in English.
- **`npm test`** runs `node --test 'src/**/*.test.ts'`: Node's built-in test runner with its
  built-in TypeScript type stripping (on by default since Node 22.18; CI uses Node 24), so there is
  no test dependency, and the CI step `npm run test --if-present` now runs it. Tests import the
  module under test with its `.ts` extension, which `tsconfig.json` now allows
  (`allowImportingTsExtensions`, alongside the existing `noEmit`). The suites cover the
  Automatic rejection rules in `src/lib/autoRejection.ts` and the Rejection correction and
  Response rate rules in `src/lib/rejectionHistory.ts`.

### Migração de banco

Três migrations, aplicadas em sequência pelo `prisma migrate deploy` do build (Vercel) e da
inicialização do container (Docker):

1. `20260915150000_remove_section_country_required` — `countryCode = 'BR'` em toda vaga da seção
   Nacional (e em qualquer resíduo nulo); remove o índice `(section, stageId)`, a coluna `section`
   e o enum `Section`; `countryCode` passa a `NOT NULL`; novo índice em `stageId`.
2. `20260915160000_renumber_positions_per_stage` — renumera `position` por etapa
   (`ROW_NUMBER() OVER (PARTITION BY "stageId" ORDER BY position, "createdAt")`), porque os dois
   quadros antigos tinham sequências independentes e a união gerava empates. Preserva a ordem
   manual; nenhum passo pós-deploy é necessário.
3. `20260923120000_application_resume` — coluna opcional `applications.resumeId` com índice e FK
   para `documents` (`ON DELETE SET NULL`). Aditiva: o deploy antigo continua funcionando enquanto o
   novo é promovido.

A primeira remove uma coluna e é irreversível: faça um snapshot ou branch no Neon antes do deploy.

**Janela de deploy:** o build da Vercel agora roda `next build` antes de `prisma migrate deploy`,
então a migration entra no banco segundos antes de o deploy novo ser promovido, e não minutos. Nesse
intervalo o deploy antigo ainda consulta a coluna `section` e retorna erro. Faça o deploy num
momento tranquilo. Se os deploys de preview compartilharem o banco de produção (sem preview
branching no Neon), um build de preview também aplicaria a migration — confirme a configuração da
integração antes de abrir PRs.

## 2026-08-30

Registrado depois, a partir do histórico do git: este arquivo só começou em 2026-09-15.

### Alterado

- **bun no lugar do npm.** `bun.lock` substitui o `package-lock.json`, e o Dockerfile instala as
  dependências com `bun install --frozen-lockfile` (e o Prisma do estágio de migração com `bun add`).
  O build da imagem continua em `npm run build`.
- **Arraste pela alça.** Cada card ganhou uma alça (⋮⋮) na lateral direita, e o arraste começa só
  por ela; tocar ou clicar no resto do card abre a vaga. Um movimento de mais de 8px entre apertar e
  soltar conta como rolagem, e não abre nada. No celular, continua sendo preciso segurar ~0,2s
  (agora na alça) para arrastar.

### Adicionado

- Botão de **mostrar/ocultar senha** (ícone de olho) no login.
- `allowedDevOrigins` para `*.trycloudflare.com` e `*.cloudflared.com` no `next.config.ts`: o
  `next dev` aberto por um Cloudflare Tunnel carrega os recursos de desenvolvimento (chunks, fontes,
  HMR) e hidrata, em vez de ficar sem responder a toques no celular.

## 2026-08-10 — primeira versão

Registrado depois, a partir do histórico do git.

### Adicionado

- **Painel de carreira**: kanban com as 7 etapas, então dividido em quadros Nacional e
  Internacional, com arrastar e soltar, pills de prioridade e bandeira nas vagas internacionais.
  Rejeição com motivo, data e etapa de origem; histórico detalhado por eventos; dashboard com KPIs,
  aplicações por mês, funil, motivos de rejeição, tempo por etapa e comparativos por seção e por
  país. Login simples com iron-session (`APP_USER` / `APP_PASSWORD`). Layout responsivo, do celular
  (navegação inferior, colunas com scroll-snap) a telas ultrawide. Docker Compose (app standalone +
  Postgres 17) com `migrate deploy` e seed idempotente na inicialização do container.
- **SWOT, documentos e planejamento**: análise SWOT por vaga (aba no modal) e geral (página
  Planejar); página Documentos com upload de currículos (até 8 MB, salvos no banco), download e
  exclusão, e rascunhos de texto com um pitch inicial; descrição da vaga em aba própria, link da
  candidatura e próxima ação com data (chip vermelho quando vence); meta semanal de aplicações com
  progresso e edição no próprio card, e lista de próximas ações no Dashboard; itens Planejar e Docs
  na navegação.
- **Deploy na Vercel com Neon**: `vercel.json` com `prisma generate`, `migrate deploy` e seed no
  build; o Prisma lê `POSTGRES_PRISMA_URL` (pooled) e `POSTGRES_URL_NON_POOLING` (direta), os nomes
  que a integração do Neon injeta, e o compose e o `.env` local usam os mesmos nomes. Cookie de
  sessão `secure` na Vercel (segue sem `secure` no Docker, servido em http); `output: standalone`
  só fora da Vercel; `.vercelignore` impede subir `.env` e arquivos do Docker.
- Nome **ProMove** ("movimento profissional") na topbar, no login e nos metadados; licença MIT.

### Removido

- Dica na tela de login que citava as variáveis `APP_USER` e `APP_PASSWORD`, informação
  desnecessária numa URL pública.
