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

### Adicionado

- **Visão da vaga ao clicar no card.** O clique não abre mais direto o formulário: abre uma visão
  de leitura com tudo da vaga — etapa e dias nela, próxima ação (em vermelho se atrasada), dados,
  links, currículo, descrição, observações, análise SWOT e histórico. No desktop fica em duas
  colunas (textos longos à esquerda, dados curtos na lateral); no mobile, uma coluna com os dados
  no topo. **Editar**, no cabeçalho, abre as abas de edição de antes, e o lápis de cada seção abre
  direto na aba certa. **Salvar alterações** volta para a visão já atualizada (antes fechava o
  modal), e **Voltar** sai da edição sem salvar. Arquivar, excluir e mover de etapa continuam
  fechando o modal.
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
  partir de 1280px. O modal da vaga cresce para 768px (1280px+) e 896px (1536px+).
- **Telas gigantes (1920px+, novo breakpoint `3xl`) usam a largura toda**, sem o limite de 1800px,
  com colunas adaptativas (o número de colunas acompanha a largura): cards do Dashboard e a lista de
  "Atividade recente", eventos do Histórico (em cartões), currículos e rascunhos em Documentos. O
  SWOT do Planejamento mostra os quatro quadrantes lado a lado e as colunas do Quadro deixam de
  parar em 384px, preenchendo a tela.

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
