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
