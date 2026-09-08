# Site institucional — IEADESPA

Site oficial da **Igreja Evangélica Assembleia de Deus Ministério do Seta em Parauapebas/PA**
(IEADESPA), construído com [Astro](https://astro.build/) e Tailwind CSS 4. O site em si é
estático (gerado em build), mas o conteúdo (mensagens, relatórios, ministérios, eventos, galeria,
congregações) vem de um [Directus](https://directus.io/) — um CMS auto-hospedado com banco de
dados próprio, onde qualquer pessoa da igreja edita com login por e-mail e senha, sem precisar de
conta no GitHub nem entender de código.

## Arquitetura em duas partes

- **O site público** (`www.ieadespa.org.br`) — este repositório, hospedado no Azure Static Web
  Apps. A cada `git push`, o GitHub Actions gera uma nova versão estática buscando o conteúdo mais
  recente do Directus e publica em 1-2 minutos.
- **O painel administrativo** (Directus) — um App Service + banco PostgreSQL separados no Azure,
  em `https://ieadespa-directus-gae4hfarf4a4ffcf.brazilsouth-01.azurewebsites.net/admin`. É onde
  o conteúdo é editado. Trocar o domínio ou mexer no Static Web App não afeta o Directus, e
  vice-versa.

## Progresso da migração para Directus

Histórico das fases já concluídas (a decisão e o motivo de cada uma estão registrados no
histórico de commits do Git, se precisar relembrar os detalhes):

- [x] **Fase 1** — Provisionar os recursos no Azure (App Service + PostgreSQL Flexible Server,
      Brazil South)
- [x] **Fase 2** — Subir o Directus no App Service, conectado ao banco e ao Azure Blob Storage
- [x] **Fase 3** — Criar as coleções no Directus (Mensagens, Relatórios, Ministérios, Eventos,
      Galeria, Congregações)
- [x] **Fase 4** — Migrar o conteúdo que já existia nos arquivos locais para dentro do Directus
- [x] **Fase 5** — Reescrever todas as páginas do site em Astro para buscar do Directus (nada mais
      lê arquivo local de conteúdo; painel do Sveltia removido)
- [x] **Automação de deploy** — Publicar no Directus dispara sozinho um novo build do site (ver
      [Integração com Azure](#integração-com-azure))

**Pendências em aberto** (não bloqueiam o uso, mas valem atenção — lista completa em
[Pendências antes de publicar](#pendências-antes-de-publicar)):

- Trocar as 4 congregações fictícias pelos dados reais
- Preencher os nomes reais da diretoria em `/transparencia/`
- Aplicar para o Open Innovation Grant do Directus antes de passar de 3 contas de usuário
- Ligar o botão "Meu Painel" a um sistema de verdade (hoje aponta pra `app.ieadespa.org.br`, ainda
  em desenvolvimento à parte)

## Requisitos

- Node.js `22.12.0` ou mais recente
- npm

## Como rodar

```bash
npm install
npm run dev
```

Gerar a versão de produção e pré-visualizar o resultado (busca o conteúdo do Directus em tempo de
build, então precisa de conexão com a internet):

```bash
npm run build
npm run preview
```

## Estrutura do conteúdo

Todo o conteúdo abaixo é editado no [painel do Directus](#painel-administrativo-directus), não em
arquivos deste repositório. O site busca os dados de lá em tempo de build, através de
[src/lib/directus.ts](./src/lib/directus.ts).

| Coleção no Directus | Onde aparece no site | Lida em |
| --- | --- | --- |
| `mensagens` | `/mensagem/<slug>/`, `/mensagens/`, `/temas/`, `/pregadores/`, home | [src/lib/posts.ts](./src/lib/posts.ts) |
| `relatorios` | `/transparencia/` | [src/pages/transparencia.astro](./src/pages/transparencia.astro) |
| `ministerios` | `/ministerios/` | [src/pages/ministerios.astro](./src/pages/ministerios.astro) |
| `eventos` | `/eventos/` | [src/pages/eventos.astro](./src/pages/eventos.astro) |
| `galeria` | `/galeria/` | [src/pages/galeria.astro](./src/pages/galeria.astro) |
| `congregacoes` | `/congregacoes/` | [src/pages/congregacoes.astro](./src/pages/congregacoes.astro) |

O que continua fixo no código (não muda com frequência, editado aqui no VS Code):

- **Dados da igreja** (nome, endereço, horários de culto, e-mail, redes sociais, textos da home e
  navegação): [src/config/site.ts](./src/config/site.ts)
- **Temas das mensagens** (lista fixa usada no campo "Tema" do Directus):
  [src/config/categories.ts](./src/config/categories.ts)

## Páginas do site

| Rota                 | Conteúdo                                          |
| -------------------- | -------------------------------------------------- |
| `/`                  | Página inicial: horários, mensagens recentes, temas |
| `/sobre/`            | História, missão, visão e liderança                 |
| `/ministerios/`      | Ministérios e departamentos                         |
| `/eventos/`          | Agenda de cultos e eventos                          |
| `/congregacoes/`     | Congregações e pontos de pregação vinculados         |
| `/mensagens/`        | Arquivo de mensagens (paginado)                     |
| `/mensagem/<slug>/`  | Uma mensagem                                        |
| `/temas/`, `/tema/<tema>/` | Mensagens por tema                            |
| `/pregadores/`, `/pregador/<nome>/` | Mensagens por pregador                |
| `/doacoes/`          | Dízimos, ofertas e chave Pix                        |
| `/galeria/`          | Fotos de cultos e eventos                           |
| `/transparencia/`    | Diretoria e prestação de contas                     |
| `/contato/`          | Formulário, endereço e mapa                         |
| `/busca/`            | Busca por título, tema ou pregador                  |
| `/privacidade/`      | Política de privacidade                             |

## Painel administrativo (Directus)

Quem não mexe em código publica notícias, relatórios, ministérios, eventos, fotos e congregações
pelo painel visual do Directus, sem precisar do VS Code nem de conta no GitHub — só um login de
e-mail e senha criado para cada pessoa.

- **Acesso**: `https://ieadespa-directus-gae4hfarf4a4ffcf.brazilsouth-01.azurewebsites.net/admin`
- **Coleções disponíveis**: Mensagens, Relatórios, Ministérios, Eventos, Galeria, Congregações —
  todas com leitura pública liberada (política "Public"), para o site conseguir buscar os dados
  sem precisar de nenhum token secreto.
- **Mídia**: fotos e PDFs enviados no Directus vão direto para o Azure Blob Storage (conta
  `storageigrejaportal`, contêiner `imagens`), não para o repositório do GitHub.
- **Limitação conhecida do plano gratuito ("Core") do Directus**: não permite regras de permissão
  com filtro condicional (ex.: "mostrar só o que não é rascunho"). Por isso, mensagens marcadas
  como rascunho (`draft: true`) são filtradas no próprio código do site
  ([src/lib/posts.ts](./src/lib/posts.ts)), não no Directus. O plano gratuito também tem um limite
  de **3 contas de usuário** — para mais colaboradores, é preciso aplicar para o
  [Open Innovation Grant](https://directus.com/pricing) (gratuito para organizações com menos de
  US$ 5 milhões de receita anual e menos de 50 funcionários — uma igreja se qualifica
  tranquilamente).

## Pendências antes de publicar

- Trocar a chave Pix de exemplo em [src/pages/doacoes.astro](./src/pages/doacoes.astro)
- Preencher os nomes reais da diretoria em
  [src/pages/transparencia.astro](./src/pages/transparencia.astro)
- Trocar as 4 congregações fictícias (Cidade Nova, Rio Verde, Beira Rio, Novo Horizonte) pelos
  dados reais — editar a coleção "Congregações" no Directus
- Trocar `og-image.png` em `public/` pela imagem social oficial
- Aplicar para o Open Innovation Grant do Directus quando for preciso mais de 3 contas de usuário
- Ligar o botão "Meu Painel" (hoje aponta para `app.ieadespa.org.br`, um sistema à parte, em
  desenvolvimento)

## Segurança e usuários

- **VS Code / repositório GitHub**: para quem mexe em código e layout. Cada colaborador técnico
  deve ter sua própria conta no GitHub e ser adicionado como colaborador do repositório
  `IEADESPA/site` (Settings → Collaborators). Antes de editar, rode sempre `git pull` primeiro,
  para não perder nenhuma configuração feita por outra pessoa.
- **Painel do Directus**: para quem publica conteúdo (secretaria, diretoria). Cada pessoa tem seu
  próprio login de e-mail e senha, criado por um administrador do Directus (Configurações →
  Usuários → Criar usuário). Contas podem ser desativadas individualmente a qualquer momento, sem
  afetar as demais.
- **Token de administrador da API**: usado só para configuração inicial das coleções (feita via
  script, não faz parte do dia a dia). Fica salvo no perfil do usuário administrador no Directus —
  pode ser revogado e gerado de novo a qualquer momento em Account Settings → Token.

## Azure Blob Storage (mídia)

Fotos e PDFs publicados no Directus não vão para o repositório do GitHub — vão direto para o Azure
Blob Storage, para não pesar o histórico do Git com arquivos binários. Isso é um recurso nativo do
Directus (driver `azure` de armazenamento, configurado como variáveis de ambiente no App Service:
`STORAGE_LOCATIONS`, `STORAGE_AZURE_DRIVER`, `STORAGE_AZURE_CONTAINER_NAME`,
`STORAGE_AZURE_ACCOUNT_NAME`, `STORAGE_AZURE_ACCOUNT_KEY`), sem nenhum código customizado nosso.

**Configuração já feita, uma única vez, na conta de armazenamento `storageigrejaportal`:**

1. CORS liberado no contêiner `imagens`.
2. Acesso público de leitura no contêiner `imagens` (senão o upload funciona mas as fotos não
   aparecem no site).
3. As variáveis `STORAGE_AZURE_*` cadastradas nas Variáveis de ambiente do App Service do
   Directus.

## Integração com Azure

O site atualiza sozinho, automaticamente, nos dois casos abaixo — ninguém precisa disparar nada
manualmente:

1. Um `git push` no repositório (edição feita no VS Code).
2. Uma publicação, edição ou exclusão de item em qualquer coleção do Directus (Mensagens,
   Relatórios, Ministérios, Eventos, Galeria, Congregações).

Em ambos os casos, o workflow do GitHub Actions
(`.github/workflows/azure-static-web-apps-*.yml`) roda, busca o conteúdo mais recente do Directus,
gera a versão de produção do site e atualiza o Azure Static Web Apps. O site no ar reflete a
alteração em cerca de 1 a 2 minutos.

**Como o caso 2 funciona**: um Flow no Directus ("Publicar site (avisar GitHub)", ativo nas 6
coleções do site) chama a API do GitHub (`repository_dispatch`, evento `directus-publish`) sempre
que um item é criado, editado ou apagado. O workflow do GitHub Actions escuta esse evento além do
`push` normal. O token usado nessa chamada fica guardado como variável de ambiente no App Service
do Directus (`GITHUB_DISPATCH_TOKEN`, exposta ao Flow via `FLOWS_ENV_ALLOW_LIST`) — nunca aparece
em texto puro em nenhuma tela de configuração do Directus.

## Ideias futuras (roadmap de inovações)

Lista aberta de funcionalidades ainda não construídas, para avaliar e priorizar quando fizer
sentido. Marque com `[x]` o que decidir construir, ou adicione novos itens livremente — esta
seção é justamente para isso.

### Plano de fases — melhorias página por página (aguardando decisão)

Depois de concluída a aba de eventos, o usuário pediu uma pesquisa ampla (9 rodadas, cobrindo
todas as páginas do site) e um plano em fases pra adaptar o site com base nela. O detalhe de cada
achado está nas seções de pesquisa logo abaixo ("Mais personalizações pesquisadas", pesquisa de
SEO, pesquisa de melhorias página por página) — isto aqui é só o resumo organizado em ordem de
execução. **Fase 0 já foi construída e testada** (ver detalhe abaixo); o restante do plano ainda
não foi construído.

- [x] **Fase 0 — bugs reais encontrados durante as pesquisas** — os três resolvidos:
  - **Contador "orando por você" manipulável** — o clique agora trava permanentemente por
    navegador (`localStorage`, chave `ieadespa-mural-orados`), não só durante a própria requisição:
    depois de orar por um pedido, o botão fica desabilitado (`🙏 Você orou por este pedido`) e
    continua desabilitado mesmo voltando à página depois — testado de ponta a ponta com Playwright
    contra o preview real (clique único, botão trava, estado persiste após `reload()`).
  - ⚠️ **O mais grave dos três, achado pela pesquisa de LGPD — mitigado, não eliminado por
    completo**: confirmado direto no Directus (via API de administração) que a permissão pública de
    leitura de `inscricoes_eventos` realmente não tinha filtro nenhum (`{}`) — qualquer pessoa podia
    chamar a API do Directus diretamente (sem nunca abrir o site) e baixar `id`, `nome`, `codigo`,
    `presente`, `aguardando_vaga` e `pago` de **todos os inscritos de todos os eventos desde
    sempre**. Boa notícia confirmada: `telefone` nunca esteve nesses campos públicos. Correção
    aplicada nas permissões de leitura **e** de atualização dessa coleção: agora só ficam visíveis/
    editáveis publicamente as inscrições de eventos com `event_date` dentro dos últimos 90 dias (ou
    sem data cadastrada) — mesmo prazo já usado pro mural de oração. Testado de ponta a ponta contra
    o Directus real (criei uma inscrição de teste num evento de janeiro/2026 e outra num evento de
    hoje, confirmei sem token que a antiga não aparece mais nem por busca exata de código, e a atual
    continua funcionando normalmente, depois apaguei os dois registros de teste). **Trade-off aceito
    conscientemente**: check-in, crachá e certificado de um evento páram de funcionar 90 dias depois
    dele — dado o risco de expor a base inteira de inscritos pra sempre, vale mais que a alternativa.
    **Isto reduz drasticamente o problema, mas não fecha 100%**: eventos dentro dessa janela de 90
    dias continuam listáveis por completo por quem chamar a API direto (é a mesma limitação de fundo
    que já torna o `codigo` um "modelo de senha por posse", aceito no restante do site) — o fechamento
    completo exigiria mover a consulta de lista (usada pelo check-in offline) para trás de login,
    diferente da consulta de código único (usada por certificado/crachá/check-in online), que já é seguro
    por natureza. Registrado como possível Fase futura se o risco residual for considerado alto
    demais.
  - **Labels quebrados no formulário de pesquisa de satisfação** — cada campo (`pesquisa/[slug].astro`)
    agora recebe um `id` único e o `<label>` correspondente aponta pra ele via `for`; pro campo de
    seleção múltipla (que não é um único controle), o rótulo virou um `<p id>` referenciado via
    `aria-labelledby` no grupo (`role="group"`), sem usar `<label for>` incorretamente. Testado com
    verificação isolada da lógica de template cobrindo os 6 tipos de campo existentes — todos com
    associação correta.

- **Fase 1 — mudança de modelo de dado que o resto depende**: hoje só existe campo pra **um**
  líder por órgão (`leader_name`/`leader_role`/`leader_photo`), mais um caso especial fixo só pra
  "diretoria executiva" sem foto/bio. Órgãos colegiados (assembleia, conselho fiscal) não têm como
  listar vários membros — isso precisa ser resolvido no Directus antes de melhorar a exibição de
  Órgãos (fases seguintes dependem disso).

- **Fase 2 — reaproveita dado que já existe, zero conteúdo novo necessário da igreja** (a fase com
  mais itens, e a mais rápida de entregar):
  - Congregações: mapa embutido em cada página individual (mesma técnica grátis já usada em
    Contato — só falta reaproveitar).
  - Início: botão "Assista ao vivo" (o link já existe no código, só não aparece em lugar nenhum);
    endereço mais perto do topo; reduzir os 8 itens de "Acesso rápido" pra 3-4 essenciais.
  - Notícias: filtro por categoria na listagem; "mais notícias" relacionado por categoria (hoje é
    só cronológico).
  - Doações: QR code Pix gerado a partir da chave já cadastrada (mesmo princípio dos QR codes do
    check-in de eventos); avisos de segurança em texto (conferir nome do recebedor, sugerir
    finalidade na descrição do Pix).
  - Transparência: CNPJ também nesta página; resumo de "último relatório publicado" no topo.
  - Busca: fallback de "0 resultados" com sugestões/links úteis; navegação por teclado igual ao
    atalho Ctrl+K.
  - Galeria: lightbox (clique pra ampliar a foto).
  - Mensagens: marcação `VideoObject` nos itens que já têm `videoUrl` cadastrado (rich result de
    vídeo na busca — só funciona pros itens que já têm essa informação).
  - Sobre: linkar explicitamente pra `/orgaos/` (hoje "Liderança" mistura pregador com governança
    e não linka pra lá), pra `/visitante/` (próximo passo natural) e pra `/transparencia/`
    (hoje só linka pra `/historia/`) — três links novos, zero conteúdo novo.

- **Fase 3 — melhorias de UX que exigem mais decisão de desenho, ainda sem conteúdo novo**:
  - Órgãos: separar visualmente Governança de Departamentos/Serviços; CTA diferente pra órgão
    deliberativo/eleito vs. equipe de voluntariado.
  - Congregações: unificar a tecnologia de mapa (hoje a listagem usa Leaflet, Contato usa Google
    Maps — dois sistemas diferentes); estado "localização em cadastro" pra quem não tem lat/lng,
    em vez de simplesmente sumir do mapa.
  - Galeria: agrupamento por evento/álbum, imagem responsiva (`srcset`), paginação.
  - Mural de oração: proteção básica contra spam (honeypot), caminho "confidencial" separado do
    público, prazo de moderação no aviso pós-envio.
  - Visitante: horário/endereço logo no topo (não só nos "próximos passos"); FAQ revisado pra
    cobrir dúvidas específicas de quem nunca foi a um culto pentecostal.
  - Sobre: quebrar o texto único (`configuracoes.sobre_corpo`) em seções fixas (história curta →
    missão/valores → liderança → próximos passos), em vez de um bloco corrido.
  - Mensagens: combinar filtro por tema + pregador na mesma tela de listagem; conceito de "série
    de mensagens" (esse exige campo novo no Directus, não só front-end).

- **Fase 4 — depende de conteúdo/decisão que só a igreja pode gerar** (a página/funcionalidade já
  poderia ser construída, mas ficaria vazia sem isso primeiro): fotos reais de culto/comunidade
  (hero da home, Sobre, Congregações, Ministérios), bios e mandato dos membros de cada órgão,
  texto da declaração de fé, descrição de cada ministério, vídeo de boas-vindas, prova social
  (depoimento de membro, tempo de história, nº de congregações — dado já existe em parte em
  `/historia/`/`/transparencia/`, mas precisa virar destaque também no Sobre).

- **Fase 5 — páginas inteiramente novas** (maior escopo cada uma, avaliar prioridade só depois das
  fases anteriores): Crenças/O que Cremos, Ministérios, página de Kids dedicada, Ao vivo/Assista
  online. Avaliadas e não recomendadas por ora: FAQ separada (melhor virar seção de
  `/visitante/`), batismo (precisa de processo definido antes), servir/seja voluntário (precisa de
  vagas reais primeiro), podcast/vagas de trabalho (perfil de igreja grande, ficaria vazio agora).

Depois destas 6 primeiras (0 a 5, todas página-por-página), o usuário pediu uma segunda rodada,
bem mais ampla, cobrindo o que um "site de verdade" precisa além do conteúdo de cada página —
temas transversais que atingem o site inteiro de uma vez. São 5 fases novas, cada uma com achados
concretos, detalhados na seção "Pesquisa detalhada — temas transversais" mais abaixo:

- **Fase 6 — segurança e resiliência técnica** (custo zero, maior parte é configuração, não
  código — vale adiantar antes das fases de conteúdo, apesar do número): criar
  `staticwebapp.config.json` com headers de segurança (hoje o site não define nenhum: sem CSP, sem
  `X-Content-Type-Options`, sem `X-Frame-Options`, sem `Permissions-Policy`); criar
  `.github/dependabot.yml` (hoje nenhuma dependência é auditada automaticamente); confirmar/
  aumentar a retenção de backup do PostgreSQL Flexible Server (padrão é só 7 dias, grátis até 35) e
  fazer um teste real de restauração pelo menos uma vez; ativar soft delete e versionamento no
  container do Blob Storage (protege contra exclusão acidental de fotos/relatórios, sem custo
  relevante); confirmar `SECRET` forte e rate limiter ativado no Directus.

- **Fase 7 — LGPD e privacidade** (a política de privacidade hoje é literalmente um rascunho —
  `privacidade.astro` ainda tem o comentário "Substitua pelo texto definitivo... antes de publicar
  oficialmente"): reescrever a política cobrindo de fato cada coleção que trata dado pessoal
  (mural de oração, contato, inscrições de evento — incluindo o campo de resposta livre, que pode
  captar dado sensível dependendo da pergunta do evento), a base legal de cada uma, prazo de
  retenção (hoje indefinido por design — o código deixa dado de evento "para sempre") e um canal
  claro pro titular pedir acesso/exclusão; adicionar checkbox de consentimento específico nos
  formulários que coletam dado sensível (mural de oração e pedido de oração no contato — hoje
  nenhum formulário do site tem isso); documentar como processo manual uma rotina periódica de
  arquivamento/exclusão de dado de evento encerrado.

- **Fase 8 — acessibilidade (WCAG)**: no PDF de certificado/crachá (`jsPDF`), nenhuma biblioteca
  gratuita gera tagging completo — o realista é definir idioma do documento e aceitar que o
  check-in físico já cobre a necessidade prática; o ponto que dá pra corrigir de verdade é o QR
  code do check-in, que não tem `alt` nem alternativa textual pensada para quem não consegue
  escanear sozinho; atualizações dinâmicas sem `aria-live` (vagas restantes, status de cupom,
  contador do mural de oração — inconsistente com o resto do site, que já faz isso certo em vários
  outros lugares); `role="tab"` nos filtros de busca sem o padrão de teclado que essa role promete
  (pior que não ter role nenhuma); calendário mensal marcando "hoje"/"tem evento" só por cor, sem
  texto acessível.

- **Fase 9 — performance e Core Web Vitals**: `fetchpriority="high"` nas imagens de capa de
  evento/mensagem/notícia (já usam `loading="eager"` certo, só falta esse atributo — maior retorno
  pelo menor esforço disponível hoje); gerar 2-3 larguras (`srcset`) para essas mesmas capas, hoje
  servidas numa única largura de 1600px pra qualquer dispositivo; `staticwebapp.config.json` (mesmo
  arquivo da Fase 6) também define `Cache-Control` de longo prazo pros assets versionados do build;
  `<link rel="preconnect">` pro domínio do Directus, evitando gastar uma rodada de DNS+TLS antes da
  primeira imagem carregar.

- **Fase 10 — analytics e promoção de conteúdo**: o gap real não é "falta newsletter", é que o RSS
  já existe (`/rss.xml`, mensagens + notícias) mas é tecnicamente descoberto e invisível pra quem
  não sabe o que é RSS — nenhuma página tem uma frase explicando isso; a correção de maior valor e
  menor esforço é só esse texto explicativo perto do link, sem nenhuma mudança técnica; considerar
  depois um serviço gratuito que transforma esse RSS em e-mail automático pra quem preferir (sem
  a igreja precisar curar uma newsletter manualmente, que historicamente para de sair em poucos
  meses em organizações pequenas); analytics sem cookies só se alguém for de fato revisar, medindo
  2-3 perguntas reais (de onde vêm as pessoas, quais páginas usam) — não pageview bruto, que é
  métrica de vaidade sem decisão nenhuma do outro lado.

O usuário pediu ainda mais uma rodada — comparando referências de sites de igreja no Brasil e no
exterior, pra deixar este "o melhor site de igreja". Mais 5 fases, detalhadas na mesma seção de
pesquisa transversal mais abaixo:

- **Fase 11 — design/UX de referência (Brasil e exterior)**: o maior gap visual comparado a
  qualquer site de igreja de referência é o hero 100% textual (sem foto/vídeo nenhum) — a correção
  possível já agora, mesmo sem foto real disponível ainda (essa depende da igreja, já registrado na
  Fase 4), é preparar o layout em duas colunas (texto + área de imagem) e decidir a técnica de
  tratamento (overlay em degradê ou duotone nas cores da marca) para a foto encaixar sem redesenho
  quando chegar; ativar a fonte serifada já prevista no próprio CSS (`--font-display`) em títulos,
  hoje só sans-serif em tudo; formalizar uma escala de tipografia em tokens (hoje cada componente
  define seu próprio tamanho solto, risco real de inconsistência conforme o site cresce); variar o
  tratamento visual dos cards de destaque (sombra em vez de borda uniforme em todo elemento);
  transição simples de página (crossfade via `ClientRouter` do Astro, sem o `transition:persist` do
  áudio, que segue bloqueado por falta de conteúdo); agrupar o rodapé por seção (ministérios,
  visite, institucional) em vez de lista única, à medida que a Fase 5 adicionar mais páginas.

- **Fase 12 — Libras e acessibilidade específica do Brasil**: nenhuma exigência legal clara e
  específica pra igreja privada, mas recomendado por inclusão genuína — a legenda em português nos
  vídeos de mensagem (quando existirem de fato, já é pré-requisito da Fase 4/`videoUrl`) é a
  melhoria de maior retorno (o YouTube já gera legenda automática grátis, só precisa revisão de
  termos religiosos); um widget gratuito de tradução automática pra Libras existe e é fácil de
  instalar, mas só traduz texto sob demanda, não vídeo/áudio, e não deve ser tratado como "site
  acessível em Libras" — só ajuda como complemento parcial em páginas institucionais (Sobre,
  Visitante, horários); se um dia a igreja gravar um vídeo de mensagem com intérprete de verdade,
  isso vale muito mais que qualquer tradução automática.

- **Fase 13 — app instalável (PWA)**: ⚠️ **já construído e testado, ao contrário do que a pesquisa
  poderia sugerir** — manifest, ícones, service worker com cache de 3 páginas essenciais, botão
  "Instalar app" no cabeçalho (Android/desktop via `beforeinstallprompt`, instrução manual no iOS) e
  o check-in offline-capable já existem e passaram por teste de ponta a ponta (ver histórico de
  commits). Só sobraram dois retoques pequenos: um ícone com variante "maskable" (pra não cortar em
  launcher Android que recorta em círculo) e `shortcuts` no manifest espelhando as mesmas 3 páginas
  já privilegiadas no cache offline. Expandir o cache pra mais páginas foi avaliado e **não é
  recomendado** — a pesquisa confirma que cache pequeno e deliberado é a prática certa pra esse
  porte, e cache demais é o erro clássico de PWA mal feita.

- **Fase 14 — WhatsApp e automação de FAQ**: o link `wa.me` institucional já existe em `/contato/`
  (usa o telefone cadastrado no Directus, não um número fixo no código) mas está enterrado como
  texto simples entre "Outros contatos" — destacar mais e usar mensagem pré-preenchida por contexto
  (`?text=`, como o `?assunto=` já faz no formulário interno) resolve a maior parte do valor sem
  nenhuma automação de verdade. Botão flutuante de WhatsApp é melhoria menor, só em páginas de
  contato/institucionais (não em conteúdo devocional, onde seria ruído). Chatbot de FAQ automatizado
  (regras ou IA) **avaliado e não recomendado** — exige volume de perguntas que uma igreja pequena
  sem equipe técnica não tem, e a API paga por conversa não cabe no orçamento; o FAQ estático já
  existente na página Visitante, reforçado pelo link de WhatsApp, já cobre a necessidade real.
  Ponto de atenção de LGPD (liga com a Fase 7): confirmar que o número cadastrado é uma linha
  institucional, não o celular pessoal de um líder específico.

- **Fase 15 — comunidade (pequenos grupos e voluntariado)**: "servir/seja voluntário" já havia sido
  avaliado e rejeitado (Fase 5) por precisar de vagas reais primeiro — a pesquisa aprofunda o
  motivo: o formato "lista de vagas abertas" tem uma causa estrutural de ficar desatualizado numa
  operação pequena e voluntária, e isso não desaparece só porque surgem vagas reais no futuro,
  precisa trocar de formato. Alternativa de baixíssimo risco e esforço mínimo: uma opção "Quero
  servir" dentro de `/contato/`, no mesmo molde já construído e testado do "Pedido de oração" —
  formulário de interesse que a liderança direciona manualmente, sem lista pública de vagas que
  possa envelhecer. Pequenos grupos/células: modelo de dado existiria (nome/tema, líder, dia,
  bairro aproximado — não endereço exato, por privacidade), mas **depende de confirmar com a
  liderança se existe de fato um programa formal de grupos pequenos** (a estrutura visível hoje é
  por congregação/ponto de pregação, não célula doméstica) — sem essa confirmação, não construir,
  pelo mesmo motivo que já levou a não inventar dado na Fase 4 (história).

Última leva pedida pelo usuário, focada em painéis/sistemas de **gestão interna** (não página
pública). Depois de revisar essa leva, o usuário esclareceu um limite importante que vale registrar
aqui pra orientar toda pesquisa futura: **o site não deve propor recursos de "gestão de igreja"
que dependam de conectar a outro sistema/banco de dados que já existe fora deste projeto** (outros
apps do Azure, com seu próprio servidor) — isso exigiria integração via API com uma plataforma que
"não tem nada a ver" com este site, e o esforço não compensa quando esse outro sistema já existe ou
já está sendo construído à parte. Eventos são a exceção que confirma a regra: eventos **não**
existem em nenhum sistema de gestão de igreja que a igreja já usa/está construindo, por isso fez
sentido concentrar tanto esforço ali. Com esse limite mais claro, restou 1 fase nova (a outra —
painel financeiro — foi retirada e move para "Ideias rejeitadas" abaixo, já que o usuário está
construindo um sistema financeiro separado pra isso) e mais 3 assuntos pesquisados a fundo que já
resultaram em "não construir" antes mesmo desse esclarecimento (achados incorporados às entradas
correspondentes de "Ideias rejeitadas": diretório de membros, módulo de EBD e reserva de espaço/
salão):

- **Fase 16 — agendamento (visita pastoral)**: hoje "Visita pastoral" é só mais uma opção do
  `<select>` de assunto em `/contato/`, sem nenhum campo de preferência de horário — a pesquisa
  mostra que sites de referência não usam calendário de disponibilidade em tempo real pra isso
  (sessão pastoral sempre passa por triagem humana antes de confirmar), então o valor real está em
  melhorar o formulário existente, não em construir um sistema de agenda: acrescentar um campo de
  "melhores dias/turnos pra contato" e "prefere presencial ou por telefone/vídeo", no mesmo molde
  já construído pro "Pedido de oração", reaproveitando a mesma coleção `contato_mensagens` (sem
  coleção nova). Aproveitar pra adicionar também o consentimento específico de dado sensível
  planejado na Fase 7 (LGPD), já que o motivo de uma visita pastoral pode revelar informação
  sensível sem a pessoa perceber que está compartilhando algo delicado num campo de texto livre.

Última leva pedida pelo usuário, agora de volta ao que é puramente conteúdo/função do próprio site
(sem depender de nenhum sistema/banco de dado externo — o mesmo critério da leva anterior), depois
de esclarecido que "gestão de igreja" não é o objetivo aqui: vídeo, formato editorial de entrevista,
depoimentos, e materiais compartilháveis. Mais 3 fases:

- **Fase 17 — vídeo institucional**: trocar o link de saída do `videoUrl` de mensagem por um
  "facade" (thumbnail estática do próprio YouTube + botão de play, só carregando o player pesado no
  clique) é o item de maior retorno — mantém o visitante no site e evita ~500KB de JS carregado à
  toa em toda página de mensagem com vídeo. Criar uma coleção `videos` no Directus, clonando 100% o
  padrão já testado da Galeria (grid, campo `sort`, estado vazio) mas só com URL/ID do YouTube (sem
  upload nem custo de Blob Storage), permite categorizar por tipo (documentário, bastidores, louvor,
  infantil) reaproveitando o mesmo padrão de filtro já planejado nas Fases 2/3. Um **hub/página
  dedicada de vídeo foi avaliado e adiado** — com o volume de conteúdo de hoje (só o `videoUrl` de
  mensagem), uma página de categorias ficaria com aparência vazia; só construir quando houver
  produção regular de vídeo variado, mesmo critério já usado pra não antecipar a Fase 4.

- **Fase 18 — formato editorial: testemunho e depoimentos curtos**: dois formatos distintos, dois
  tamanhos de esforço. **Testemunho/entrevista mais longa**: a categoria `testemunho` já existe no
  campo `category` de Notícias (`src/lib/noticias.ts`), sem uso real hoje — não precisa de coleção
  nova, só um campo opcional de "entrevistado" (nome + papel, mesmo padrão de `author_name`/
  `author_role` já usado em Mensagens) e convenção editorial de perguntas em destaque no corpo
  markdown. ⚠️ **Só lançar depois de definir quem é o dono da pauta** (quem convida e agenda a
  entrevista, não quem escreve) — sem isso, risco de abandono real, mesmo padrão já visto em EBD/
  newsletter/escala. **Depoimento curto (mural de depoimentos)**: formato bem menor — citação +
  nome + foto opcional, não uma reportagem — clona a arquitetura já testada do Mural de oração
  (coleção nova com moderação, criação pública restrita, leitura só do aprovado), mas **sem opção
  de anônimo** (depoimento sem nome prejudica credibilidade) e com checkbox de consentimento
  específico obrigatório (nome+foto+texto publicados permanentemente, mais sensível que o mural de
  oração) — liga direto com a Fase 7 (LGPD). Página própria (`/depoimentos/`), linkada a partir do
  Sobre, sem prazo de expiração automática (diferente do mural de oração, que expira sozinho).

- **Fase 19 — cartão de versículo compartilhável**: reaproveita 100% a técnica já construída e em
  produção do cartão de programação semanal (`programacao-semanal.png.ts`, SVG + `sharp`, sem
  serviço externo) pra gerar uma imagem do versículo do dia já existente, pronta pra Stories/feed,
  com botão "Compartilhar imagem" ao lado do "Ouvir" (`navigator.share()` com fallback pra
  download). É o item de maior alcance orgânico por menor esforço encontrado nesta leva — ao
  contrário de um kit de imprensa formal (avaliado e **descartado**: demanda real baixíssima pra
  esse porte de igreja, mesmo padrão de outras ideias já rejeitadas), uma imagem de versículo é algo
  que o próprio público usaria todo dia. Se um dia surgir pedido real de logo/foto em alta
  resolução por terceiro, resolver com 2-3 arquivos soltos em `public/`, não uma página de imprensa
  dedicada — e antes de disponibilizar qualquer foto real pra download livre, confirmar que o termo
  de consentimento de imagem cobre esse uso específico (mais amplo que só aparecer na Galeria).
  Devocional diário com reflexão original e plano de leitura bíblica anual construído do zero foram
  pesquisados e **descartados** (ver "Ideias rejeitadas") — o "versículo do dia" já existente
  cumpre esse papel sem risco de abandono.

**Nada deste plano foi construído ainda** (fases 1 a 19), com duas exceções: o app instalável da
Fase 13 (que já existia) e a **Fase 0, construída e testada** (correção do contador do mural de
oração, redução do vazamento de inscritos e conserto dos labels da pesquisa de satisfação — ver
detalhe na própria Fase 0, acima). O detalhe completo de cada achado (com a
lógica/pesquisa por trás de cada item) está registrado em "Mais personalizações pesquisadas" e em
"Pesquisa detalhada por página"/"Pesquisa detalhada — temas transversais" mais abaixo, junto com as
fontes consultadas.

- [x] **Atalho de busca rápida (Ctrl+K)** — melhorado: agora cobre eventos, temas, pregadores e
      páginas institucionais (10 tipos de conteúdo), com filtros por categoria e busca sem
      distinção de acento.
- [x] **Modo alto-contraste / leitura fácil** — botão "A+" no cabeçalho: aumenta a fonte em ~25%
      (16px → 20px, escala junto com todo o layout por ser baseado em `rem`), reforça o contraste
      dos textos secundários e o anel de foco, e sublinha links — pensado para idosos e pessoas
      com baixa visão. Persiste por navegador (`localStorage`), independente do tema claro/escuro.
- [x] **Pedido de oração** — não é uma página separada: é o próprio "Fale conosco" (`/contato/`)
      aprimorado. Escolher "Pedido de oração" no assunto muda o formulário (título, aviso de
      confidencialidade, rótulos) e libera a opção de enviar sem se identificar. Um link direto
      (`/contato/?assunto=oracao#fale-conosco`, já indexado na busca do site) chega com essa opção
      pré-selecionada. Confirmado que a coleção `contato_mensagens` não é lida publicamente — só
      aceita criar, ninguém de fora consegue ver os pedidos.
- [x] **Notificações push de eventos** — botão "Avisar quando um evento estiver chegando" em
      `/eventos/`. Quem ativa recebe uma notificação do navegador (mesmo com o site fechado) na
      véspera de qualquer evento especial. Arquitetura:
      - Coleção `push_subscriptions` no Directus (só aceita criar — ninguém lê a lista).
      - `public/sw.js`: service worker que recebe o push e mostra a notificação.
      - `.github/workflows/event-notifications.yml`: roda todo dia às 08h (Brasília), busca os
        eventos de amanhã e envia a notificação a quem estiver inscrito
        (`.github/scripts/send-event-reminders.mjs`, usa a biblioteca `web-push`).
      - **Exige 2 segredos no GitHub** (Settings → Secrets and variables → Actions → New
        repository secret, no repositório `IEADESPA/site`), sem os quais o envio diário falha:
        - `DIRECTUS_ADMIN_TOKEN` — o mesmo token de administrador do Directus.
        - `VAPID_PRIVATE_KEY` — chave privada gerada especificamente para o envio de push (pedir
          a quem configurou esta funcionalidade; nunca fica no código, só no GitHub).
      - **Preferência granular, pra não virar spam**: com muito evento cadastrado (praticamente
        todo fim de semana até novembro), avisar de absolutamente tudo cansaria rápido e a pessoa
        ia desativar de vez. O botão virou um painel: "Todos os eventos especiais" (padrão) ou
        "Só de responsáveis específicos" — marca só os ministérios/departamentos que interessam
        (lista vem do campo `responsavel` já cadastrado nos eventos), e o robô diário só avisa
        dos eventos daquele responsável. Tem também **"Cancelar notificações"**, sempre visível
        pra quem já ativou — chama `pushManager.unsubscribe()` no navegador e apaga a inscrição
        no Directus.
      - Sem permissão de leitura pra ninguém (mantém o "só cria" original), a preferência de cada
        pessoa fica também guardada em `localStorage` do próprio navegador (endpoint + escolha),
        só pra repopular o painel e permitir editar/cancelar depois — igualar/atualizar/apagar no
        servidor usa `filter[endpoint]` (o endpoint da inscrição push, uma string enorme e
        imprevisível gerada pelo navegador, funciona como uma senha de posse — mesmo modelo de
        confiança já usado no `codigo` de 6 caracteres do check-in/certificado/crachá).
- [x] **Lembrete automático só pra quem se inscreveu** — separado do aviso geral acima: depois de
      confirmar inscrição num evento (`/evento/<slug>/`), aparece "Ativar lembrete deste evento" —
      ativa notificação só daquele evento específico, pra aquela pessoa, guardando o endpoint de
      push direto na própria linha da inscrição (`push_endpoint`/`push_p256dh`/`push_auth` em
      `inscricoes_eventos`, atualizados por id, mesmo padrão de confiança do check-in público). Só
      aparece pra quem ficou confirmado (quem entrou na lista de espera não sabe ainda se vai
      participar). O robô diário (`send-event-reminders.mjs`) manda essa mensagem separadamente,
      personalizada com o nome da pessoa, só daquele evento.
      Testado de ponta a ponta com verificação real (sem token) contra o Directus: criar/atualizar
      preferência do aviso geral por `filter[endpoint]`, cancelar (apaga a linha), e o PATCH por
      id do lembrete de inscrição — todos batendo certo antes de ir pro navegador de verdade.
- [x] **Modo escuro (dark mode)** — já existia (botão no cabeçalho, ao lado da busca), com
      preferência do sistema por padrão e alternância manual persistida por navegador. Testado
      contraste de cor nas 15 páginas principais (axe-core) e confirmado 0 problemas nos dois
      temas — ver correções no histórico de commits.
- [ ] **Player de áudio persistente (mini-player)** — ao abrir uma mensagem, o áudio continua
      tocando enquanto se navega para outras páginas do site. **Pré-requisito real, ainda não
      atendido**: hoje não existe nenhum áudio/vídeo de mensagem cadastrado (o campo `video_url`
      é só um link de saída pro YouTube, sem player embutido) — precisa de gravações de verdade
      antes de fazer sentido construir isso. Também exige adotar as "transições de página" do
      Astro (`ClientRouter` + `transition:persist`) para o áudio sobreviver à navegação entre
      páginas, já que hoje cada página carrega do zero — uma mudança de infraestrutura maior que
      a maioria dos itens desta lista, vale planejar com calma quando o conteúdo existir.
- [x] **Feed RSS/Atom das mensagens e notícias** — `/rss.xml` já existia, mas só cobria mensagens;
      agora junta mensagens e notícias, ordenado por data, com `<category>` pra diferenciar.
- [ ] **QR code em cartazes físicos** — gerado automaticamente por evento, apontando direto para
      a página `/evento/<slug>/`.

### Módulo de eventos (3 camadas)

Tentativa nº 1 (inscrição própria com controle de pagamento manual no Directus, por pessoa) foi
construída, testada de ponta a ponta e **reprovada** na avaliação prática — comparado com uma
plataforma de eventos profissional de verdade, não se sustentava. Revisado depois de analisar
prints reais de um módulo de eventos completo: a lição principal foi que **controle financeiro
por pessoa não é o objetivo** — só interessa um total geral do evento, lançado manualmente no
sistema de membros (fora do site). E-mail também ficou fora — nunca é armazenado.

Para evento complexo de verdade (pago, com certificado, check-in) sem construir nada aqui, **usar
uma plataforma de eventos especializada de terceiros**, apontando o já existente campo
`registration_url` pra lá — não vale a pena reconstruir isso aqui.

- [x] **Evento semanal** (culto) — já existia (coleção `programacao`).
- [x] **Evento simples** (festa, aniversário) — coleção `eventos`:
      - `end_time`: horário de término real (ex. "8h às 17h"), além da data.
      - `congregacao` (relação com a coleção `congregacoes`): quando o evento acontece numa
        congregação cadastrada, o endereço é **puxado automaticamente** de lá (nome + endereço,
        via `congregacaoEndereco()` em `src/lib/directus.ts`). O campo `location` (texto livre)
        continua existindo pra endereço avulso.
      - `responsavel`: quem organiza o evento (nome ou ministério).
      - **Arquivamento automático de eventos passados** — com mais de 100 eventos cadastrados
        (a agenda anual inteira) e outros ~100 chegando a cada ano, a lista estava ficando
        impossível de navegar no Directus. Resolvido com o recurso nativo de arquivamento do
        próprio Directus (não é uma tela nova, é configuração): novo campo `arquivado` (marcado
        automaticamente, ninguém edita à mão) e um Flow agendado ("Arquivar eventos passados",
        todo dia às 3h da manhã) que marca como arquivado todo evento cuja data já passou.
        Eventos arquivados somem da lista principal (mas nunca são apagados — segue um filtro
        "Mostrar itens arquivados" no próprio Directus pra ver o histórico). Também mudou a
        ordenação padrão da lista de manual (campo `sort`, impraticável com 100+ itens) para
        automática por `event_date`. Testado de ponta a ponta: 85 eventos já passados foram
        arquivados na hora, e o Flow foi validado ao vivo (rodou a cada minuto por um teste
        curto com um evento fictício de data antiga, confirmado arquivado sozinho, depois
        restaurado pro agendamento diário normal).
- [x] **Evento com inscrição, perguntas 100% personalizadas por evento** — a lição principal,
      depois de ver na prática o processo real usado num seminário passado (planilha de
      respostas de formulário, lista de chamada, controle financeiro por pessoa, fechamento de
      caixa, ranking por congregação): **nada de campo fixo além de nome e telefone**. Cada
      evento define suas próprias perguntas — igual à ideia do "Perguntas" de um módulo de
      eventos completo, só que sem precisar de uma plataforma paga:
      - `eventos`: `aceita_inscricao`, `vagas_limite` (informativo), `inscricoes_ate` (prazo,
        fecha o formulário sozinho), `inscricoes_encerradas` (fechamento manual).
      - Nova coleção **`perguntas_evento`**: cada linha é uma pergunta de um evento específico —
        label, tipo (texto curto, texto longo, seleção única, seleção múltipla, número, data),
        opções (quando for seleção) e se é obrigatória. Público só **lê** (precisa pro
        formulário saber o que perguntar), nunca escreve.
      - Nova coleção **`respostas_inscricao`**: a resposta de uma inscrição a uma pergunta
        específica — vinculada por relação de verdade (aparece automaticamente no painel, dentro
        de cada inscrição, sem nenhuma tela customizada). Público só **cria**.
      - Nova coleção **`inscricoes_eventos`**: nome, telefone, e um campo `pago` (marcado
        manualmente pela secretaria/tesouraria — controle financeiro por pessoa é legítimo e
        necessário, só não pode ser *exportado* como se fosse a interface de gestão).
      - **Detalhe técnico resolvido**: pra vincular as respostas à inscrição certa, o formulário
        precisa saber o `id` gerado na hora de criar a inscrição — mas a coleção não tem leitura
        pública. Solução: uma permissão de leitura pública restrita a **só o campo `id`** (nunca
        nome/telefone) — testado e confirmado que a resposta de "criar" devolve o id, e que
        listar a coleção só mostra números, nenhum dado pessoal.
      - Testado de ponta a ponta com um evento fictício de 5 perguntas (baseado no seminário
        real mostrado): formulário renderiza os tipos certos, inscrição criada, duas respostas
        corretamente vinculadas a ela — confirmado via painel administrativo.
      - **Check-in por código, sem login de ninguém** — decidido depois de perceber que só 3
        contas existem no Directus, e a pessoa de plantão na portaria pode nem ser uma delas.
        Modelo: a inscrição gera um código curto (6 caracteres, sem letras ambíguas como 0/O),
        mostrado na hora da confirmação. Página pública `/checkin/<slug>/`: a pessoa digita o
        próprio código (ou busca pelo nome, se esquecer) numa tela pública — nenhum login
        necessário, qualquer voluntário pode tomar conta do tablet na porta.
        - Campo `codigo` (único) e `presente` (boolean) em `inscricoes_eventos`.
        - Permissão pública de leitura ampliada pra `id, nome, codigo, evento` (só o necessário
          pra buscar/confirmar — nunca telefone, pago ou valor).
        - Permissão pública de **atualização restrita ao campo `presente`** — testado e
          confirmado que tentar mudar qualquer outro campo (ex. `pago`) é bloqueado.
        - Testado de ponta a ponta com dados fictícios: busca por código, busca por nome
          (filtrada corretamente só ao evento certo), confirmação de presença — tudo validado via
          requisição direta (o CORS bloqueia só o teste local, não o domínio real).
      - **Painel gerencial ("Insights" do Directus)** — confirmado como disponível no plano atual
        (testado via API). Um painel de teste com dados fictícios (10 inscritos) foi montado com
        sucesso: contadores de inscritos/pagos/presentes, soma de valor confirmado, e um gráfico
        de ranking por congregação — tudo nativo do Directus, sem nenhum código customizado.
        Avaliado como alternativa ao Microsoft Power Apps (que teria custo real de licença e de
        armazenamento — Dataverse —, além de fragmentar o sistema em duas fontes de dados);
        Insights resolve o mesmo problema de graça, dentro do que já existe.
      - **Certificado** — construído em `/certificado/<slug-do-evento>/`: mesmo código do
        check-in, sem conta nem senha. Só emite pra quem já confirmou presença (`presente:
        true`) — precisou ampliar a permissão pública de leitura de `inscricoes_eventos` pra
        incluir esse campo (continua sem expor telefone, pago ou valor). PDF gerado inteiramente
        no navegador (`jsPDF`, paisagem, moldura dourada, logo, nome em destaque), sem exportação
        nenhuma — nome e evento vêm direto do banco. Linkado na página do evento, ao lado do
        check-in. Escopo decidido: só para eventos com inscrição (camada 3) — não para batismo,
        que exigiria cadastrar "Batismo nas Águas" como evento com inscrição própria, uma decisão
        separada, não tomada ainda.
      - **Lista de chamada impressa**: não construído ainda — com o check-in por código já
        resolvendo a presença digitalmente, avaliar se ainda faz sentido ter também uma versão
        em papel como reserva.

### Mais ideias (comunidade, crescimento e operação interna)

- [x] **Mural de oração público em tempo real** — diferente do "Pedido de oração" já existente em
      `/contato/` (esse continua privado, só a secretaria vê). Aqui a pessoa escolhe deixar o
      pedido **público**, com nome ou anônimo, e qualquer visitante pode ver e clicar em
      "🙏 Orando por você" — o contador sobe na hora pra todo mundo com a página aberta, via
      Directus Realtime (WebSocket, já incluso no plano gratuito), sem recarregar.
      - **Moderação obrigatória** — decidido que não tem como publicar sem revisão prévia (campo
        `aprovado`, só a secretaria muda): é conteúdo público de qualquer visitante, sem login. O
        "orando por você" continua em tempo real normalmente; só a publicação do pedido em si
        passa por aprovação antes de entrar no mural.
      - **Regras de publicação** (texto a exibir no formulário): "Este mural é um espaço de apoio
        espiritual. Os pedidos passam por uma breve moderação antes de aparecer aqui. Não serão
        publicados: mensagens ofensivas, discurso de ódio, conteúdo político-partidário,
        propaganda comercial, spam, ou dados sensíveis de terceiros (endereço, telefone, valores).
        A equipe se reserva o direito de não publicar pedidos fora desse propósito."
      - **Tempo de vida**: pedido some do mural público sozinho depois de **90 dias**, ficando
        arquivado só como histórico interno — evita acumular anos de pedidos já
        resolvidos/esquecidos numa lista sem fim. Se a pessoa quiser continuar orando depois
        disso, pode postar de novo — o prazo é só pra manter o mural atual, não é um limite de
        quanto tempo se pode orar por algo.
      - **Layout**: cards (texto, nome ou "Anônimo", tempo relativo, contador de "orando"), mais
        recentes aprovados primeiro, carregado por página (não rolagem infinita) para não pesar
        com milhares de itens de uma vez. Só o contador atualiza sozinho; a ordem da lista não
        muda em tempo real, para não confundir quem está lendo.
      - Construído em `/mural-de-oracao/`: coleção `mural_oracao` (`texto`, `nome`, `aprovado`,
        `orando_count`). Permissão pública de criação só em `texto`/`nome`; leitura pública restrita
        via filtro dinâmico (`aprovado = true` e `date_created >= $NOW(-90 days)`, resolvido pelo
        próprio Directus, sem cron de limpeza); atualização pública restrita ao campo
        `orando_count` — testado que tentar mudar `texto` ou `aprovado` é bloqueado. Tempo real via
        WebSocket nativo do Directus (`/websocket`, usa a mesma permissão pública — conexão anônima
        assume a policy Public), sem exigir nenhuma autenticação extra no navegador.
- [x] **Devocional em áudio** — versículo do dia narrado (Text-to-Speech do navegador,
      `SpeechSynthesis`, sem custo nem serviço externo). Botão "Ouvir" na home, ao lado do
      versículo do dia — lê o texto que já está na tela, na hora, com a voz já instalada no
      aparelho de quem visita; nenhum áudio é gravado ou armazenado.
- [x] **Linha do tempo/história interativa** — versão visual (scroll com marcos) da página
      "Nossa história": navegação sticky de anos ao lado (rola até o marco ao clicar, e destaca
      sozinha o ano visível na tela via `IntersectionObserver`), com a linha vertical e os
      marcadores da timeline. **Populado com 21 marcos inventados (2006, fundação, até 2026, 20
      anos)** como texto-placeholder plausível, pra já mostrar a timeline funcionando — precisa
      trocar pelos fatos verídicos da igreja (textos e fotos reais) antes de considerar definitivo.
- [x] **Estatísticas públicas de crescimento** — seção "Números da igreja" em `/transparencia/`:
      contagens agregadas (nº de congregações, nº de órgãos/departamentos, anos de história desde
      a fundação, calculado a partir de "Nossa história") — nunca dado individual de membro. Novo
      campo opcional `fundacao_ano` em `congregacoes`: o gráfico de crescimento (congregações
      acumuladas por ano) só aparece quando pelo menos duas congregações tiverem esse ano
      preenchido no Directus — hoje nenhuma tem, então mostra um aviso no lugar do gráfico até
      alguém preencher.
- [x] **Baixar PDF personalizado de eventos** — foi além da ideia original de "modo impressão":
      em `/eventos/exportar/`, escolhe-se o período (mês a mês, ou um preset — este mês, próximos
      3 meses, ano inteiro) e o(s) responsável(is) pelo evento (Diretoria, Conselho, Congregação,
      Departamento/Ministério, Área/Regional, ou sem categoria), com contagem ao vivo de quantos
      eventos batem com o filtro, e um título opcional pra personalizar o PDF. O PDF (agrupado por
      mês, com data, horário, local e responsável) é gerado inteiramente no navegador
      (`jsPDF`, sem serviço externo) — é "salvar", não "imprimir": quem quiser imprimir, imprime o
      PDF depois. Exige um novo campo `tipo_responsavel` (seleção) em `eventos` — os eventos já
      cadastrados ainda não têm esse campo preenchido, e precisam ser categorizados aos poucos
      pelo Directus pra aparecerem nos filtros por responsável.
- [x] **Progressive Web App (PWA)** — instalar o site na tela inicial do celular (ou na área de
      trabalho do computador), como se fosse um app, sem passar pela loja de aplicativos. O
      manifest (`site.webmanifest`) e os ícones já existiam; faltava o essencial pra instalação
      funcionar de verdade:
      - Service worker (`public/sw.js`, já existia só pra notificação push) agora é registrado em
        **todo o site**, não só quando a pessoa ativa o aviso de evento — sem isso o navegador não
        considera o site instalável na maioria dos casos.
      - Botão "Instalar app" no cabeçalho (ícone de download): no Android/desktop (Chrome, Edge),
        aparece sozinho quando o navegador sinaliza que o site pode ser instalado
        (`beforeinstallprompt`) e dispara o instalador nativo ao clicar. No iPhone/iPad (que não
        tem esse recurso), mostra uma instrução curta (Compartilhar → Adicionar à Tela de Início).
      - Metatags do iOS (`apple-mobile-web-app-capable` etc.) pra a instalação abrir em tela cheia,
        sem a barra do Safari.
      - Testado de ponta a ponta (Playwright): service worker ativo, manifest válido, botão
        aparece/funciona simulando o evento do Chrome, e a instrução correta aparece simulando um
        iPhone.
      - **Ainda não faz nada offline** — só habilita a instalação. Isso é o próximo item da lista
        ("Modo offline básico"), de propósito separado daqui.
- [x] **Modo offline básico** — cache enxuto e de propósito curto no service worker
      (`public/sw.js`): só a página inicial, `/eventos/` (programação) e `/contato/`, mais os
      arquivos de estilo/script/fonte necessários pra elas renderizarem — nada de fotos, PDFs,
      áudio ou outras páginas, exatamente pra não pesar no armazenamento do celular (testado:
      **~380 KB no total** depois de visitar as três páginas, nada perto de "1 giga de cache").
      Estratégia "rede primeiro, cache como reserva": online, sempre busca a versão mais nova
      (nenhum impacto de desempenho pra quem está conectado); só cai pro cache quando a rede
      falha. Qualquer outra página do site, se a internet cair, mostra uma tela amigável de "sem
      conexão" (`public/offline.html`) em vez do erro feio do navegador, mesmo sem estar na lista
      curta de páginas cacheadas. Testado de ponta a ponta com Playwright (simulando offline de
      verdade): página cacheada carrega inteira com cabeçalho, página não-cacheada cai no
      fallback, e o tamanho do cache medido bate com o esperado.
- [ ] **Busca por proximidade nas congregações** — usar a localização do navegador (com permissão
      do visitante) para ordenar as congregações da mais próxima para a mais distante.
- [x] **Painel "hoje na igreja"** — `/painel/sede/` e `/painel/congregacoes/` (duas telas, não uma
      por congregação: a programação semanal já é a mesma pra todas as congregações, só a sede
      tem itens próprios — reaproveita a mesma coleção `programacao` já usada em todo o site). Não
      é nada instalado — é a própria página aberta em tela cheia num navegador comum, num aparelho
      qualquer ligado no telão/TV (Smart TV, Chromecast, tablet, PC antigo), sem precisar de
      ninguém tocar nela depois de aberta. Conteúdo, tudo se atualizando sozinho sem recarregar a
      página: relógio e data, o culto de hoje (calculado no navegador a partir do dia da semana e,
      no caso de domingo à noite, de qual ocorrência do mês se aplica — 1º/2º/3º/4º-se-5º/último
      domingo, validado contra os 12 meses de 2026), o versículo do dia (mesmo mecanismo da home,
      troca a cada 6h) e a notícia mais recente como aviso, se publicada nos últimos 14 dias.
      Paleta própria (não usa o tema claro/escuro do resto do site): fundo azul-marinho, dourado
      como cor de destaque, texto branco — pensada pra ser lida de longe numa TV. Linkado em
      `/eventos/`, na seção de programação semanal.
- [ ] **Trocar pelo Google Maps Platform** — trocar o mapa de congregações (hoje Leaflet +
      OpenStreetMap) e o embed de `/contato/` pelo Google Maps, com rotas reais e Street View da
      sede. Depende de uma chave de API própria (nunca fica salva em nenhum arquivo do
      repositório) — avisar quando estiver disponível.
- [ ] **Aba dedicada de gestão de eventos (só camada 3)** — retomado. Escopo: uma área nova
      dentro do próprio site, autenticada, exclusiva para os eventos com inscrição (camada 3) — a
      programação semanal (camada 1) e o calendário de eventos simples (camada 2) continuam
      geridos no Directus normalmente, sem mudança nenhuma. Objetivo: gerenciar o ciclo inteiro do
      evento complexo num só lugar, com a tela do jeito que a igreja quer (não o formulário
      genérico do Directus), e resolver o problema real de **inscrições acumulando para sempre**
      depois que o evento termina.
      **Correção importante de arquitetura**: achava que precisaria transformar o site (hoje
      100% estático) em renderização sob demanda — não precisa. A autenticação reaproveita o
      próprio login do Directus (a mesma conta já usada no painel administrativo, nenhuma senha
      nova é criada nem guardada em lugar nenhum): o navegador chama `/auth/login` do Directus
      direto (modo `cookie` — o refresh token vira um cookie `httpOnly`, inacessível a
      JavaScript/XSS; só o access token de curta duração, 15 min, fica em `sessionStorage`, e é
      renovado sozinho via `/auth/refresh` usando o cookie). A proteção de verdade não é a
      página em si (que é só HTML estático, como qualquer outra) — é o próprio Directus, que só
      libera dado de verdade pra quem estiver autenticado com uma conta real.
      Ordem de construção:
      1. [x] **Autenticação da aba** — `/painel-eventos/entrar/` (login) e `/painel-eventos/`
         (verifica sessão, mostra e-mail autenticado, botão "Sair"). Testado de ponta a ponta:
         login, renovação silenciosa de sessão (aba nova, sem token em memória, cookie válido),
         sessão inexistente redirecionando pro login, e logout. De propósito, sem link nenhum na
         navegação nem na busca do site (não é área pra visitante) — só um link discreto no
         rodapé ("Gestão de eventos", ao lado do "Painel de conteúdo" que já existia), pra quem
         administra achar sem precisar decorar a URL.
      2. [x] **Criar evento + suas perguntas** — `/painel-eventos/` (painel principal): lista os
         eventos com inscrição em cards, mais um botão "+ Novo evento" que já cria o registro e
         abre o editor. `/painel-eventos/evento/?id=<id>` (um único editor, id via query string —
         continua site estático, sem página por evento): todos os campos do evento (data,
         horário, congregação ou local avulso, responsável e categoria, vagas, prazo de
         inscrição), botão "Gerar do título" pro endereço (slug) — o Directus não gera isso
         sozinho, agora o painel gera. Logo abaixo, gestão completa das perguntas do formulário de
         inscrição: adicionar, editar (texto, tipo, ordem, opções, obrigatória) e excluir, tudo
         inline, sem sair da página. Testado de ponta a ponta (Playwright, mockando as respostas
         do Directus): criar evento, carregar e editar campos, gerar slug, salvar, adicionar
         pergunta, editá-la, excluí-la.
         - **Reorganizado em abas** conforme o editor foi ganhando módulos (perguntas de
           inscrição, pesquisa pós-evento, encerrar, excluir) e a página ficou comprida demais
           pra rolar: "Dados do evento" / "Perguntas de inscrição" / "Pesquisa pós-evento" /
           "Encerrar / Excluir", com botões no topo — cada módulo isolado, só um visível por vez.
           Puramente visual (troca de aba não recarrega nada, cada aba já tinha seus próprios
           dados carregados); perguntas de inscrição e da pesquisa ganharam listas e formulários
           de "+ Nova pergunta" **separados**, cada um já fixando o momento certo (não precisa
           mais escolher "quando perguntar" ao criar — só ao mover uma pergunta existente de um
           módulo pro outro). Testado de ponta a ponta: troca de aba mostra o painel certo e
           esconde os outros, pergunta nova cai na lista do módulo certo sem afetar o outro.
      3. [x] **Inscritos, pagamento e check-in reunidos numa única tela** —
         `/painel-eventos/evento/inscritos/?id=<id>`, linkado por um botão "Ver inscritos" no
         editor. Pesquisado como plataformas de eventos profissionais organizam essa tela antes de desenhar
         (cartões de estatística no topo, filtros rápidos por status, badges de pago/presente,
         busca ao vivo — um padrão real do setor, não inventado). Ficou:
         - 4 cartões de estatística: inscritos, pagos, presentes, valor arrecadado (soma de quem
           pagou).
         - Busca por nome/telefone e filtros rápidos (Todos/Pagos/Não pagos/Presentes/Ausentes).
         - Cada linha: nome e telefone editáveis, valor (R$) editável, e dois selos clicáveis —
           **Pago** e **Presente** — que já salvam na hora do clique (o check-in também pode ser
           feito por aqui, não só pela página pública de check-in por código).
         - "Respostas": expande e mostra as respostas daquela pessoa às perguntas do evento — e
           **edita** também (não só visualiza), reaproveitando o mesmo gerador de campo por tipo
           de pergunta (texto, número, data, seleção) usado no formulário público.
         - "Excluir": remove a inscrição (e as respostas ligadas a ela) com confirmação.
         - **"+ Adicionar inscrito"**: cadastro manual (nome, telefone, respostas às perguntas do
           evento), pra quando alguém se inscreve por telefone/pessoalmente em vez de pelo
           formulário público — gera código de check-in igual ao de quem se inscreve sozinho.
         Testado de ponta a ponta (Playwright): estatísticas corretas, filtros, busca, alternar
         pago/presente, editar e salvar, ver e editar respostas, excluir, cadastro manual.
         - **Excluir evento** (no editor, `/painel-eventos/evento/`): remove o evento inteiro em
           cascata (respostas → inscrições → perguntas → evento), com confirmação — não existia
           antes, e sem isso um evento criado por engano ficava pra sempre.
         - **Faixas de valor (opcional)**: campo novo `faixas_valor` em `eventos` — uma lista
           configurável (descrição + valor) editável no evento, tipo "Individual" R$50, "Casal"
           R$80, "Grupo (3+, por pessoa)" R$40. Só informativo, aparece na página pública do
           evento como tabela de preços — continua sem processar pagamento nenhum, é só
           comunicar os valores de forma organizada quando o preço muda por tamanho de grupo.
      4. [x] **Certificado** — construído de forma independente desta aba, em
         `/certificado/<slug-do-evento>/` (ver acima), usando o mesmo código do check-in, sem
         conta nem senha, sem exportação. A pessoa consegue baixar o próprio certificado **a
         qualquer momento**, mesmo anos depois — a página não tem prazo de validade, só depende
         do evento continuar existindo. Também dá pra baixar **os certificados de todos os
         presentes de uma vez** (botão na tela de inscritos): um único PDF com uma página por
         pessoa, reaproveitando o mesmo desenho (`src/lib/certificado.ts`, compartilhado entre as
         duas telas). Testado de ponta a ponta: PDF em lote gerado só com quem está marcado
         presente, na ordem certa, com o nome de cada um.
      5. [x] **Encerrar evento** — **desenho corrigido depois de um erro real de planejamento**:
         a ideia original (apagar nome/telefone/respostas) quebraria o certificado pra sempre,
         já que ele depende de achar a pessoa pelo nome e pelo código. Corrigido: "Encerrar
         evento" agora só remove o **telefone** de cada inscrito (o único dado que realmente não
         serve mais pra nada depois do evento) — nome, código, presença, valores e respostas
         continuam guardados permanentemente, exatamente pra garantir que o certificado sempre
         funcione. Não é uma exclusão: o evento em si já é arquivado automaticamente (campo
         `arquivado`, ver acima) assim que a data passa, independente dessa ação. Testado: só o
         campo telefone é alterado, todo o resto permanece intacto.
      6. [x] **Relatório automático** — unificado com duas ideias que já estavam na lista de
         pesquisa (fechamento de caixa e relatório-resumo), tudo disparado junto ao clicar em
         "Encerrar evento": (1) baixa na hora um **PDF de encerramento** com resumo (total de
         inscritos, presentes, % de comparecimento) e fechamento de caixa (pagos, não pagos,
         valor total arrecadado, com linha de assinatura pra presidente/secretário(a)/
         tesoureiro(a) — o mesmo formato do "Movimento do Caixa" manual que inspirou este módulo);
         (2) cria um **rascunho de notícia** (`draft: true`, nunca publicado sozinho — sem valor
         em dinheiro, que fica só no PDF interno) pra revisar, adicionar fotos e publicar quando
         quiser. Testado de ponta a ponta: números batendo, rascunho criado com os dados certos.

#### Mais personalizações pesquisadas (aguardando revisão)

Pesquisado o que plataformas de eventos (incluindo algumas voltadas especificamente a eventos de
igreja) oferecem além do que já construímos — nada disso foi construído ainda, é só a lista pra
decidir o que vale a pena:

- [x] **Duplicar evento** — botão "Duplicar" em cada card do painel principal (funciona também
      com eventos arquivados, que continuam aparecendo na lista normalmente). Clona título
      (com "(cópia)" no final), descrição, corpo, local/congregação, responsável e categoria,
      horários, vagas, faixas de valor, e todas as perguntas do formulário — exatamente a
      configuração que dá trabalho de montar de novo. **Datas, inscrições encerradas e
      arquivamento voltam zerados** (é uma nova edição do evento, com data própria a definir).
      Testado de ponta a ponta: configuração completa e perguntas replicadas corretamente na
      nova cópia.
- [x] **Limite de vagas com trava automática + lista de espera** — construídos juntos, por serem
      o mesmo mecanismo. `vagas_limite` deixou de ser só informativo: em branco = ilimitado (como
      sempre foi); preenchido = trava de verdade. O formulário público conta quantas inscrições
      **confirmadas** já existem antes de criar uma nova — dentro do limite, confirma normal;
      no limite ou além, a pessoa ainda se inscreve, mas marcada como **lista de espera** (novo
      campo `aguardando_vaga`), com aviso claro na hora e o mesmo código de check-in de sempre.
      A página do evento mostra "(N restantes)" ao lado do limite. No painel, aumentar o limite
      (ou apagá-lo) e salvar **promove sozinho** quem está na lista de espera, do mais antigo pro
      mais novo, até preencher as vagas novas — sem precisar reabrir inscrição pra cada um.
      Tela de inscritos ganhou cartão, filtro e selo próprios pra "Lista de espera", com opção de
      promover manualmente clicando no selo.
      **Bug real encontrado e corrigido nesse processo**: o campo `codigo` nunca esteve liberado
      na permissão pública de **criação** de `inscricoes_eventos` — ou seja, **toda inscrição
      pública real vinha falhando** com erro 403 (só não foi percebido porque, até aqui, todo
      teste de ponta a ponta usou o token de administrador, que ignora permissões). Corrigido
      junto com esta entrega; testado com dados reais direto na API (não só mockado) pra garantir
      que o fluxo completo — confirmar, esperar, promover — funciona de verdade em produção.
- [x] **Crachá de identificação** — inspirado num modelo físico real que a igreja já usa (4 por
      folha A4, com linha de corte), sem copiar à risca — desenho próprio
      (`src/lib/cracha.ts`, compartilhado entre as duas telas), com as cores de identidade do
      site em vez do verde do modelo original. Duas portas, com o mesmo desenho de segurança já
      usado no certificado:
      - **Pública, individual, sem login** (`/cracha/<slug-do-evento>/`): a pessoa digita o
        próprio código de check-in e baixa só o crachá dela, já pronto — sem precisar escrever o
        nome à mão na caixa de identificação, como no processo manual.
      - **No painel, autenticado, em lote** (tela de inscritos): "Baixar crachás de todos os
        confirmados" — um único PDF, 4 por página com linha pontilhada de corte, só quem está
        confirmado (lista de espera fica de fora, já que crachá é entregue antes/na entrada do
        evento, antes do check-in acontecer).
      Testado de ponta a ponta: PDF em lote com o número certo de páginas/posições, excluindo
      quem está na lista de espera.
- [x] **Gráfico visual de uma pergunta de seleção** — quantas pessoas escolheram cada opção de
      uma pergunta de seleção única/múltipla, em barras (`src/lib/graficos.ts`, desenho próprio,
      sem biblioteca de gráficos), em vez de ver resposta por resposta. Só mostra a proporção
      agregada — nunca lista quem respondeu o quê, seguindo a mesma linha da decisão de não
      exportar lista de inscritos.
      - **No painel (tela de inscritos)**: um gráfico por pergunta de seleção, que recalcula
        junto com a busca/filtros já existentes (pago, presente, lista de espera).
      - **Filtro cruzado entre perguntas ("slicer")**: escolhe uma pergunta e um valor (ex.:
        "Cidade" = "Eldorado") e a tabela e os outros gráficos recalculam só com quem respondeu
        aquele valor — dá pra comparar "função na cozinha" entre as pessoas de uma cidade e de
        outra, trocando o valor escolhido.
      - **No relatório de encerramento (PDF)**: os mesmos gráficos de barra, desenhados direto
        no PDF (vetor, sem lista de respostas individuais), numa seção "Gráficos das perguntas"
        depois do fechamento de caixa, com quebra de página automática se não couber.
      Testado de ponta a ponta: gráficos batem com a contagem esperada, o slicer recalcula a
      tabela e os gráficos ao trocar/limpar o filtro, e o PDF de encerramento inclui a seção de
      gráficos sem erros.

Segunda leva de pesquisa (conteúdo sobre QR code em eventos de igreja, e plataformas de gestão
de igreja em geral):

- [x] **Pesquisa de satisfação pós-evento** — reaproveita a mesma infraestrutura de perguntas
      dinâmicas já existente: cada pergunta ganhou um campo **"Quando perguntar"** (`momento`,
      `inscricao` ou `pos_evento`). Perguntas `pos_evento` nunca aparecem no formulário de
      inscrição — só na pesquisa pública (`/pesquisa/<slug do evento>/`), no mesmo formato de
      código de 6 caracteres do check-in/certificado/crachá, exigindo `presente=true` (só quem
      participou pode avaliar).
      - **Quando libera**: automaticamente a partir do dia seguinte ao fim do evento — não existe
        botão manual pra "abrir a pesquisa". Resolve uma dúvida real que surgiu ao planejar isso:
        como a pesquisa é liberada por **data do evento**, e não por "Encerrar evento" nem por
        "arquivado" (`arquivado` é só um rótulo visual no painel — nunca esconde nem apaga nada),
        ela continua funcionando pra sempre, mesmo muito depois do evento arquivado. E como
        "Encerrar evento" (passo 5) só apaga telefone — nome, código e presença continuam
        guardados —, o código de check-in da pessoa continua válido pra responder a pesquisa
        indefinidamente, e as respostas nunca desaparecem.
      - **Onde aparece o resultado**: perguntas de seleção da pesquisa entram automaticamente nos
        mesmos gráficos do painel de inscritos (`src/lib/graficos.ts`, já construído) — não
        precisa de nada novo pra visualizar; texto livre aparece na aba "Respostas" de cada
        inscrito, marcado como "· pesquisa pós-evento" pra diferenciar de resposta dada na
        inscrição.
      - Testado de ponta a ponta contra o Directus real (sem token): liberação por data nos dois
        sentidos (evento passado libera, futuro não libera), busca por código exigindo presença,
        e o POST da resposta.
- [x] **Inscrição em grupo** — generalizada de propósito: não é só "família", é qualquer grupo
      (casal, família, grupo de amigos, delegação de uma congregação) e qualquer tamanho. Novo
      campo do evento **"Permitir inscrição em grupo"** (`permite_inscricao_grupo`, aba "Dados do
      evento" no editor) liga/desliga por evento. Quando ligado, a pessoa marca "Inscrever outras
      pessoas junto" no formulário público e adiciona quantos nomes quiser — cada nome vira uma
      inscrição própria (código de check-in, certificado e crachá individuais), com telefone e
      respostas às perguntas do evento compartilhados pelo grupo (respondidas uma vez só).
      - **Desconto por quantidade, sem sistema novo**: reaproveita as "Faixas de valor" que já
        existiam (antes só informativas). Se o evento tem mais de uma faixa cadastrada, a pessoa
        escolhe uma ao se inscrever (ex.: "Individual" R$50, "Casal" R$80, "Grupo (5 ou mais, por
        pessoa)" R$30), e esse valor é aplicado a cada pessoa do grupo — não existe regra fixa de
        "família" ou "5 pessoas": quem administra o evento define as faixas e os preços que
        fizerem sentido pra aquele evento específico.
      - **Lista de espera funciona igual, pessoa por pessoa**: se o grupo for maior que as vagas
        restantes, os primeiros nomes confirmam e os últimos entram na lista de espera
        automaticamente (mesma trava de vagas já existente, sem regra especial de "tudo ou nada"
        pro grupo).
      - Lembrete automático (push) só é oferecido pra quem preencheu o formulário (a pessoa que
        está com a tela aberta), não pra cada nome do grupo — os demais recebem o código, mas
        ativam lembrete próprio se abrirem a página do evento depois.
      - Corrigido um bug real de permissão descoberto ao testar: a permissão pública de criar
        inscrição nunca incluía o campo `valor` (só existia preenchimento manual pelo painel) —
        sem o ajuste, qualquer inscrição pública com faixa de valor selecionada teria dado 403.
        Testado de ponta a ponta contra o Directus real (sem token): grupo de 3 pessoas com limite
        de 2 vagas confirma as duas primeiras e coloca a terceira na lista de espera, todas com o
        valor da faixa escolhida e o mesmo telefone.
- [x] **Cupons de desconto** — sem processador de pagamento nenhum (Mercado Pago etc.), continua
      tudo manual: o cupom só ajusta o `valor` que fica gravado na inscrição, pra equipe saber
      quanto cobrar de verdade na hora de confirmar o pagamento (o mesmo fluxo manual que já
      existia). Nova coleção `cupons_desconto`, uma aba própria no editor do evento ("Cupons de
      desconto"): código, tipo (percentual ou valor fixo em R$), limite de usos (opcional, sem
      limite se em branco), validade (opcional, sem prazo se em branco) e ativo/inativo.
      - **De propósito, sem nenhuma vitrine**: não aparece lista de cupons em lugar nenhum público
        — só um link discreto "Tem um cupom de desconto?" no formulário de inscrição, que revela
        um campo de texto. Só quem já sabe o código (recebeu da diretoria) consegue usar.
      - **Desconto aplicado sobre a faixa de valor escolhida** (ou sobre R$0, se o evento não tem
        faixa de valor — nesse caso não tem o que descontar). Em inscrição de grupo, funciona
        pessoa por pessoa: se o cupom tiver limite de usos e o grupo for maior que o restante,
        os primeiros da lista levam o desconto e o resto paga o valor cheio — mesmo espírito já
        usado na lista de espera de vagas.
      - Fica registrado qual cupom cada inscrito usou (aparece como uma notinha na tela de
        inscritos, ao lado do valor) — assim a equipe vê exatamente quem ganhou desconto e de
        qual cupom, na hora de conferir o pagamento manual.
      Testado de ponta a ponta contra o Directus real (sem token): leitura do cupom por código,
      atualização do contador de usos (e confirmado que só esse campo é editável publicamente,
      nada mais), e o cenário de grupo com limite de uso batendo no meio da lista.
- [x] **Agenda interna do evento (multi-sessão)** — nova coleção `sessoes_evento` (título,
      palestrante, dia, horário início/fim, local, descrição, ordem), gerenciada numa aba própria
      do editor ("Agenda (sessões)"), mesmo padrão de cartões de perguntas/faixas de valor.
      Aparece na página pública do evento como uma seção "Programação", logo abaixo da descrição.
      - **Agrupamento por dia é automático, não manual**: só agrupa quando o evento tem mais de um
        dia (`event_date` ≠ `end_date`) **e** pelo menos uma sessão tem o campo "Dia" preenchido —
        um seminário de um dia só mostra a lista direto, sem cabeçalho de data repetido à toa.
      - **Check-in continua único por evento** (não por sessão/dia) — decisão deliberada por
        enquanto: fracionar o check-in por sessão levantaria perguntas sobre re-check-in a cada
        palestra, presença parcial em eventos de vários dias etc., que valem uma conversa própria
        depois. A agenda existe hoje só pra informar o visitante, sem depender disso.
      - `sessoes_evento` entra no Directus Flow que dispara o deploy (a agenda é conteúdo
        público, ao contrário de `perguntas_evento`/`inscricoes_eventos`, que são só
        operacionais) — editar a agenda publica sozinho, sem precisar mexer em outro lugar.
        Exclusão em cascata no banco: apagar o evento apaga as sessões dele automaticamente.
      Testado de ponta a ponta: evento de vários dias agrupa certo por dia (verificado contra o
      Directus real), evento de um dia só mostra lista plana, e o CRUD da agenda no painel
      (adicionar, editar, excluir) funciona.

Terceira leva de pesquisa (comparativos de ferramentas de gestão de eventos em geral):

- [x] **Comparação histórica entre edições do mesmo evento** — desenhada de propósito pra não
      supor periodicidade nenhuma: nem todo evento é anual, alguns ficam anos sem acontecer e
      voltam depois. Novo campo **"Edição anterior"** (`evento_anterior`, aba "Dados do evento")
      vincula manualmente esse evento a uma edição passada — a pessoa escolhe qual, não tem
      detecção automática por data/título. Forma uma cadeia (esse evento → o anterior → o anterior
      dele...) que pode pular qualquer intervalo de anos.
      - **De onde vêm os números**: "Encerrar evento" (passo 5) já calculava tudo isso pro
        relatório em PDF — agora também grava um retrato (`estatisticas_finais`: inscritos,
        presentes, % de comparecimento, pagos/não pagos, valor arrecadado, data) direto no próprio
        evento. Decisão: só existe comparação de edições que já foram encerradas — uma edição
        vinculada mas ainda não encerrada simplesmente não entra na comparação ainda.
      - **Nova aba "Histórico"** no editor: anda pela cadeia de edições vinculadas, monta uma
        tabela cronológica (mais antiga → mais recente) com inscritos/presentes/comparecimento/
        arrecadado, mais dois gráficos de barra (reaproveitando `src/lib/graficos.ts`, o mesmo
        módulo dos gráficos de pergunta) comparando inscritos e comparecimento entre as edições.
      Testado de ponta a ponta: cadeia com um hiato de 5 anos entre duas edições anda certinho e
      monta a tabela na ordem cronológica certa (verificado contra o Directus real: vincular,
      pular gerações, e o "Encerrar evento" gravando o retrato de números automaticamente).
- [x] **Múltiplos responsáveis, resolvido como perfis de acesso (não só por evento)** — repensado
      com o usuário: em vez de marcar "quem administra este evento" campo por campo, resolvido na
      raiz com perfis de acesso de verdade no Directus (o mesmo mecanismo de políticas/permissões
      usado a sessão inteira pra moldar o que o público consegue ler/escrever). Cada perfil é uma
      combinação de **role + policy** do Directus — ao criar uma conta nova (Directus →
      Configurações → Usuários → Criar usuário), escolhe-se um destes:
      - **Administrator** (já existia) — acesso total, inclusive Configurações, Fluxos,
        Webhooks, outras contas e tokens de API. Só pra quem administra o sistema de verdade.
      - **Semi-administrador** (novo) — lê/escreve em todo o conteúdo do site (eventos, notícias,
        congregações, galeria, histórico, mural de oração, contatos, tudo) mas **não vê
        Configurações, Fluxos, Webhooks, Usuários/Perfis nem tokens de API** — o Directus já
        esconde esses menus sozinho pra quem não tem `admin_access`, sem precisar de nenhuma
        regra extra. É o perfil pra quem toca o conteúdo do site no dia a dia sem poder quebrar a
        automação de deploy ou vazar credenciais sem querer.
      - **Editor de eventos** (novo) — só `eventos`, perguntas, agenda, inscritos e respostas.
        Não enxerga notícias nem mensagens de contato.
      - **Editor de notícias** (novo) — só a coleção `noticias`.
      - **Editor de contatos** (novo) — só `contato_mensagens` (as mensagens que chegam pelo
        formulário de contato do site).
      Testado de ponta a ponta com uma conta real: login como "Editor de eventos" consegue ler e
      criar em `eventos`, mas toma 403 em `noticias`, `contato_mensagens`, `/policies` e `/flows`
      — confirmando que o isolamento entre perfis funciona de verdade, não só na aparência.

Quarta leva de pesquisa — dessa vez focada em **operação de eventos grandes de verdade**
(credenciamento em massa, congressos com milhares de pessoas), não só telas bonitas. A pergunta
foi "o que muda quando o evento é grande?", não só "quais botões faltam":

- [x] **Já resolvido, sem precisar de nada novo** — dois pontos que grandes operações levam a
      sério e que o desenho atual já cobre de graça: (1) **múltiplos pontos de check-in
      simultâneos** — a página de check-in é pública e sem login, então quantos aparelhos
      quiserem podem abri-la ao mesmo tempo, em portões diferentes, sem qualquer trava; (2)
      **múltiplos pontos de cadastro no dia** — o "+ Adicionar inscrito" funciona do mesmo jeito
      pra qualquer pessoa autenticada, então várias mesas de credenciamento podem cadastrar gente
      ao mesmo tempo sem conflito.
- [x] **Check-in libera por horário** — a página pública de check-in (`/checkin/<slug>/`) ficava
      aberta o tempo todo, sem trava nenhuma; agora só libera sozinha a partir de X minutos antes
      do horário do evento (`checkin_libera_minutos_antes`, padrão 60, configurável por evento na
      aba "Dados do evento"), evitando gente confirmando presença horas ou dias antes de verdade.
      Tem também um botão "Liberar check-in agora" (`checkin_liberado_manualmente`) pra equipe
      abrir mais cedo num imprevisto. Sem horário calculado só no build (a janela muda a cada
      minuto do dia do evento) — o cálculo roda no navegador de quem abre a página, comparando a
      hora real contra `event_date` + `time` do evento.
      - Discutido e decidido junto com o usuário: nem QR Code nem código resolvem o medo de
        alguém "emprestar a senha" — a segurança real do check-in está na pessoa da portaria
        reconhecendo quem está na fila, não no sigilo do código. QR Code (item abaixo) é só uma
        melhoria de **velocidade**, não fecha essa brecha.
      Testado de ponta a ponta contra o Directus real: evento no futuro fica fechado com a
      mensagem certa, evento já no horário fica aberto, e o botão de liberação manual força aberto
      mesmo com o evento ainda no futuro.
- [x] **Check-in por QR Code** — discutido bastante com o usuário antes de construir: o problema
      real não é "qual tecnologia de check-in", é **entrega do código** — se a pessoa não guardou
      nada, nenhuma tecnologia resolve sozinha. Por isso o desenho final combina duas coisas, sem
      exigir que ninguém tenha salvo nada com antecedência:
      - **`/qrcode/<slug do evento>/`** (nova página pública): a pessoa gera o próprio QR Code na
        hora, ali na fila mesmo — digita o código (ou busca pelo nome, mesmo padrão do check-in)
        e o navegador desenha a imagem na hora (biblioteca `qrcode-generator`, carregada via CDN,
        **sem nenhum armazenamento novo** — o QR não é salvo em lugar nenhum, é só uma forma
        visual do código de 6 caracteres que já existe, gerada sob demanda; não tem nada pra
        limpar/excluir depois, ao contrário do que se imaginava no início).
      - **Leitor de QR por câmera em `/checkin/<slug>/`**: botão "Ler QR Code" abre a câmera
        (qualquer celular/tablet — não precisa de leitor dedicado nem sistema de câmera especial)
        e decodifica com a biblioteca `jsQR`, caindo no mesmo fluxo de confirmação de presença que
        já existia pro código digitado — o QR só torna esse fluxo mais rápido, não muda a
        segurança: assim como antes, quem realmente impede uso indevido é a pessoa da portaria
        reconhecendo quem está na fila, não o sigilo do código.
      Testado de ponta a ponta com as bibliotecas de verdade (não só a lógica): gerado um QR real
      com `qrcode-generator` e decodificado com `jsQR` pra confirmar que os dois formatos batem
      (`<id do evento>:<código>`), e simulado o fluxo completo da câmera (webcam falsa exibindo um
      QR real gerado na hora) até a confirmação de presença no Directus.
- [x] **Registrar o local do check-in + check-in condicionado a pagamento** — dois pontos que
      surgiram juntos numa conversa sobre operar check-in com várias pessoas ao mesmo tempo:
      - **Locais de check-in**: campo novo no evento (`locais_checkin`, lista simples, mesmo
        padrão de repetidor das faixas de valor) — quem administra cadastra os nomes das
        portarias/entradas antes de abrir o check-in. Sem geolocalização nenhuma: cada aparelho
        (celular/tablet da equipe) escolhe uma vez qual local ele representa, isso fica guardado
        só naquele navegador (mesmo padrão já usado na preferência de notificação), e toda
        confirmação feita dali em diante já leva essa marcação sozinha — tanto pelo código
        digitado, quanto pela busca por nome, quanto pelo QR Code (os três caem no mesmo fluxo de
        confirmação por baixo). **Não duplica a lista de inscritos em lugar nenhum** — o check-in
        continua sendo a mesma linha de `inscricoes_eventos` de sempre, só ganhou um campo a mais.
      - **Só confirma direto quem já está pago** — discutido com o usuário: por padrão, check-in
        de quem ainda não está marcado como pago pede uma confirmação extra ("é uma exceção,
        digite o motivo — ex.: 'vai pagar depois' — ou cancele"), em vez de bloquear ou de deixar
        passar batido. O motivo fica registrado (`observacao_checkin`), visível na tela de
        inscritos, junto com o local do check-in.
      Testado de ponta a ponta contra o Directus real: leitura pública do campo `pago` e escrita
      de `local_checkin`/`observacao_checkin` funcionando; e simulado o fluxo completo — pessoa
      paga confirma direto, pessoa não paga abre o aviso de exceção, motivo aceito grava a
      observação, e cancelar a exceção não grava nada — e que o local escolhido sobrevive a
      recarregar a página (guardado no navegador).
- [x] **Lotação/presença em tempo real + check-in offline** — os três últimos itens desta seção
      foram construídos juntos, por decisão do usuário (são a mesma base de dados, só duas
      vitrines diferentes):
      - **Contador ao vivo em `/checkin/<slug>/`**: mostra "X presentes" (ou "X presentes de Y
        vagas", se o evento tiver limite), atualizado a cada 20s — resolve exatamente o pedido de
        não precisar abrir a tela de inscritos só pra saber quantos já chegaram.
      - **Mesmo contador no telão "hoje na igreja"** (`/painel/sede/` e `/painel/congregacoes/`):
        se houver um evento especial acontecendo hoje, aparece um bloco "Hoje na igreja — <nome>"
        com a mesma contagem, reaproveitando a mesma consulta agregada do check-in.
      - **Check-in funciona mesmo sem internet**: a lista de inscritos do evento (nome, código,
        pago, presente) fica em cache no navegador do aparelho, atualizada a cada 20s enquanto
        online; se a rede cair, a busca por código/nome cai automaticamente pra esse cache. Toda
        confirmação é **otimista** — confirma na tela na hora (não espera resposta de rede, pra
        nunca passar de alguns segundos, nem em fila grande), e só se a gravação de verdade falhar
        (offline ou erro de rede) é que vira uma "pendência" guardada no aparelho, sincronizada
        sozinha em segundo plano assim que a conexão volta (tentativa a cada 8s, e também no
        evento `online` do navegador). Um aviso de status ("Tudo sincronizado" / "Sincronizando
        X…" / "Sem internet — X guardado(s)") deixa isso visível pra equipe o tempo todo.
      Testado de ponta a ponta (rede real cortada via mock, não só a lógica isolada): confirmação
      offline leva menos de 100ms pra aparecer na tela, o contador atualiza mesmo sem rede, a
      pendência é criada corretamente, e sincroniza sozinha assim que a "conexão" volta.
      - **Bug real corrigido durante a revisão final desta aba**: a atualização periódica do cache
        (a cada 20s) podia "desconfirmar" visualmente alguém que acabara de ser confirmado, se o
        PATCH de verdade ainda não tivesse voltado do servidor — corrigido pra nunca regredir uma
        confirmação já feita neste aparelho. Aproveitado o mesmo ajuste pra impedir confirmar a
        mesma pessoa duas vezes (toque duplo) e pra evitar pendência duplicada na fila de
        sincronização.

**Revisão de bugs ao encerrar esta aba** (pedida explicitamente pelo usuário antes de fechar o
assunto de eventos) — revisão de código de toda a área (inscrição, check-in, cupons, painel),
sem alterar comportamento visível além de corrigir estes três problemas reais encontrados:
- Check-in de evento **sem horário cadastrado** (só data) liberava sozinho às 23h da véspera, em
  vez de à meia-noite do próprio dia — o cálculo de "minutos antes" não fazia sentido sem hora.
- Contagem de vagas confirmadas (tanto na página pública quanto no painel, ao promover a lista de
  espera) não contava corretamente uma inscrição cujo campo "lista de espera" nunca tivesse sido
  definido (`null`, em vez de `true`/`false`) — só acontecia em dado criado fora do fluxo normal,
  mas corrigido pra bater com o mesmo critério já usado na tela de inscritos.
- Num cupom de desconto com limite de usos, se a inscrição em grupo falhasse no meio (rede caiu
  com algumas pessoas já criadas), o contador de usos do cupom não registrava os descontos já
  aplicados às pessoas que chegaram a ser criadas — corrigido pra contar uso por pessoa, na hora,
  em vez de só uma vez no fim do grupo inteiro.

**Fora do escopo, por decisão já tomada antes** (não incluído acima de propósito): qualquer coisa
que exija processamento real de pagamento (checkout, cartão, PIX automático) — isso exigiria uma
plataforma de pagamento de verdade, o que já foi avaliado e descartado. Cupom de desconto **sem**
processamento de pagamento real (só ajusta o valor da inscrição, cobrança continua manual) foi
construído — ver "Cupons de desconto" acima.

#### Pesquisa detalhada por página (suporte ao plano de fases lá em cima)

Nove rodadas de pesquisa (sites grandes e pequenos, nonprofits e igrejas em geral — comparação de
padrões do que costuma funcionar, nunca cópia de um site específico), pedidas pelo usuário depois
de concluída a aba de eventos, cobrindo cada página do site (Eventos ficou de fora de propósito —
já considerada boa). **Nada disto foi construído ainda** — a ordem de execução já está no "Plano
de fases" no início desta seção; isto aqui é o detalhe/justificativa por trás de cada achado.

**Sobre**: seção "Liderança" mistura quem *prega* (autores de mensagens) com quem *administra/
governa* (que já tem estrutura própria em `/orgaos/`) — sem foto de ninguém e sem link pra lá;
falta uma declaração de fé/crenças (resumo curto, linguagem simples, não acadêmica); nenhuma foto
na página inteira; sem vídeo de boas-vindas do pastor; sem prova social (depoimento, tempo de
história, nº de congregações — parte disso já existe em `/historia/`/`/transparencia/`, só falta
linkar/destacar a partir daqui); texto único num campo markdown, sem seções fixas (história →
missão/valores → liderança → próximos passos); sem link pra `/visitante/`.

**SEO** — por que o site não aparece nem buscando o nome da igreja: sem tráfego pago em hipótese
nenhuma (a maioria das igrejas nem usa). Conferido de verdade, não por suposição: `robots.txt`,
sitemap, `noindex`, canonical, Open Graph, Twitter Card, BreadcrumbList e RSS já estavam corretos;
o dado estruturado `Church`/`Event` também já existia (só faltava o `sameAs`, corrigido logo em
seguida). A causa mais provável está fora do código, não é algo que se resolve escrevendo mais
linhas: reivindicar o Perfil da Empresa no Google (maior impacto disponível pra busca pelo nome da
igreja), confirmar no Search Console que o sitemap foi enviado / solicitar indexação da home, e
considerar que domínio novo demora semanas mesmo com tudo tecnicamente certo. Citações/backlinks
gratuitos (diretórios da convenção, prefeitura, parcerias) também ajudam, mas são feitos um por
um, manualmente, fora do site.

**Início**: hero só texto, sem foto real de culto/comunidade (a coleção `galeria` já existe, dá
pra puxar de lá sem upload novo); `siteConfig.youtubeLiveUrl` existe e resolve pra live sozinho,
mas não aparece em lugar nenhum da home nem do cabeçalho; "Acesso rápido" com 8 itens do mesmo
peso visual (concorrência sem hierarquia); endereço só aparece depois do feed inteiro em mobile;
mensagem mais recente só como card de texto, sem player embutido; `/transparencia/` só no rodapé.

**Notícias**: sem filtro por categoria nem paginação na listagem (mensagens já pagina, notícias
não); "mais notícias" no artigo pega só as 3 mais recentes, não relacionadas por categoria (ao
contrário de mensagens, que já tem relacionadas de verdade); sem página de arquivo por categoria.

**Mensagens/Temas**: arquivo de mensagens não combina filtro de tema + pregador na mesma tela;
sem conceito de "série de mensagens" (precisaria de campo novo no Directus, não só front-end);
vídeos (`videoUrl`) sem `VideoObject` no dado estruturado, perdendo elegibilidade a rich results
de vídeo — só funciona pros itens que já têm essa informação.

**Órgãos** (prioridade — o usuário já apontou que essa página "não está boa"): a listagem
(`orgaos.astro`) não mostra nenhuma pessoa, só nome do órgão e descrição — nome/foto do responsável
só aparece depois de entrar na página individual; só existe campo pra **um** líder por órgão
(`leader_name`/`leader_role`/`leader_photo`), mais um caso hardcoded só pra "diretoria executiva"
(sem foto/bio) — órgãos colegiados (assembleia, conselho fiscal) não têm nenhum campo pra listar
vários membros, é lacuna de modelo de dado, não só de exibição; nenhum órgão tem bio, mandato ou
"desde quando"; as 4 categorias (Governança, Departamentos, Secretarias, Serviços) têm o mesmo
tratamento visual apesar de conceitualmente diferentes (governança é deliberativa; departamentos/
serviços são equipes de voluntariado), sem nenhum link pra `/transparencia/` ou atas de reunião;
CTA "Quer participar?" idêntico pra todo órgão, mesmo os deliberativos/eleitos.

**Congregações**: página individual sem mapa nenhum, só endereço em texto + link "Ver rota" (a
mesma técnica de embed grátis, sem chave de API, já usada em `/contato/` ainda não chegou aqui —
é o lugar mais óbvio faltando); inconsistência de provedor de mapa (a listagem usa Leaflet/
OpenStreetMap, Contato/Início usam Google Maps embed — dois sistemas diferentes no mesmo site);
congregação sem `lat`/`lng` simplesmente some do mapa da listagem, só com legenda pequena; sem
ordenar por distância nem foto da fachada de cada congregação.

**Transparência**: sem quebra visual de receitas/despesas (só lista de PDFs + gráfico de
crescimento de congregações); sem indicação de "último relatório publicado" nem cadência esperada;
sem menção de auditoria/parecer independente; CNPJ não aparece nesta página (só em Doações).

**Doações**: sem menção a recibo de doação; sem aviso pra conferir o nome do recebedor no Pix antes
de confirmar (proteção contra golpe de Pix clonado, puramente informativo, sem processador
nenhum); sem sugestão de indicar finalidade (dízimo/oferta/campanha) na descrição do Pix; chave
Pix só em texto, sem QR code estático pra copiar.

**Visitante**: FAQ depende 100% do que for cadastrado no CMS, sem garantia de cobrir dúvidas
específicas do contexto pentecostal (manifestações, duração do culto, chamada ao altar); página só
texto, sem foto/vídeo do ambiente; "estrutura para famílias" não fala de check-in infantil nem
triagem de voluntários; horário/endereço só aparece nos "próximos passos", não no topo.

**Mural de oração**: ⚠️ **achado que é bug de verdade, não só sugestão** (ver Fase 0 do plano) — o
contador "orando por você" incrementa um número calculado no próprio navegador de quem clica, sem
trava nenhuma do lado do servidor: dá pra chamar a API manualmente e definir qualquer número, e
nada impede a mesma pessoa clicar várias vezes na mesma visita (o botão só trava durante o próprio
clique, depois libera de novo). Além disso: sem proteção nenhuma contra spam/envio automatizado no
formulário de pedido (nem honeypot, nem limite de envios — só moderação humana depois do envio);
sem caminho "confidencial, só pra equipe pastoral" separado do mural público; mensagem pós-envio
não diz quanto tempo a moderação costuma levar.

**Galeria**: fotos numa grade só, sem agrupar por evento/álbum (vai virar uma parede confusa
conforme o acervo cresce); nenhuma foto abre em tamanho maior ao clicar (sem lightbox); imagem
sempre no mesmo tamanho fixo, não adaptado ao dispositivo; busca todo o acervo de uma vez, sem
paginação.

**Busca**: sem resultado nenhum não sugere nada nem linka pra outro lugar do site, só mostra "0
resultados"; o índice não inclui o corpo dos textos, só título/resumo (uma busca por uma frase ou
versículo citado dentro de uma mensagem não encontra nada, mesmo a mensagem existindo); sem
ordenação por relevância; a página `/busca` não tem a mesma navegação por teclado que o atalho
rápido (Cmd/Ctrl+K) já tem.

**Páginas novas avaliadas** (detalhe completo na Fase 5 do plano): Crenças/O que Cremos,
Ministérios (distinto de Órgãos — governança vs. áreas de atuação), página de Kids dedicada, e Ao
vivo/Assista online, nesta ordem de valor. Avaliadas e **não** recomendadas por ora: FAQ separada
(melhor virar seção de `/visitante/`), batismo (precisa de processo definido antes), servir/seja
voluntário (precisa de vagas reais primeiro), podcast/vagas de trabalho (perfil de igreja grande,
ficaria vazio aqui agora).

Fontes consultadas (todas as rodadas, título e domínio — sem nome de produto/plataforma específico
no texto acima): [Nonprofit Website Best Practices 2026](https://www.elevationweb.org/blog/nonprofit-website-best-practices/),
[Guia de site de igreja (Tithely)](https://get.tithe.ly/blog/the-ultimate-guide-to-creating-a-successful-church-website),
[Guia de site de igreja nonprofit (Donorbox)](https://donorbox.org/nonprofit-blog/build-a-church-website),
[Exemplos de "About Us" de nonprofit (Wired Impact)](https://wiredimpact.com/blog/5-great-nonprofit-about-us-pages-tips-examples/),
[Exemplos de "About Us" (Shopify)](https://www.shopify.com/blog/how-to-write-an-about-us-page),
[Fundamentos da página "Sobre" de igreja (The Lead Pastor)](https://theleadpastor.com/church-management/church-about-us-page/),
[Página "Sobre" de igreja além da história (UK Churches)](https://www.ukchurches.co.uk/more-than-just-history-how-to-write-a-compelling-about-us-page-for-your-church-website/),
[Ideias de conteúdo pra aprofundar comunidade (The Lead Pastor)](https://theleadpastor.com/church-management/church-website-content-ideas/),
[Página de equipe de igreja (ChurchTechToday)](https://churchtechtoday.com/church-staff-page/),
[Dicas de "About Us" pra pequenos negócios (Salesforce)](https://www.salesforce.com/blog/small-business-about-us-page/),
[Erros comuns de página "About" (OptinMonster)](https://optinmonster.com/6-common-about-page-mistakes-that-are-killing-your-conversions/),
[Local SEO pra nonprofits (Elevation)](https://www.elevationweb.org/blog/nonprofit-local-seo/),
[Guia de Perfil da Empresa no Google pra igrejas (ReachRight)](https://reachrightstudios.com/blog/the-ultimate-google-business-profile-guide/),
[Checklist de SEO local 2026 (LocalHero)](https://localhero.live/blog/local-seo-checklist-small-businesses-ultimate-edition/),
[Quanto tempo o Google demora pra indexar um site novo (Grange)](https://www.grangewebdesign.com/blog/how-long-does-it-take-for-a-new-website-to-index/),
[Por que o site não aparece no Google (Refuge Marketing)](https://refugemarketing.com/blog/website-not-showing-up-google/),
[Checklist de SEO técnico 2026 (Kinetik)](https://www.kinetikagency.com/technical-seo-checklist-2026/),
[Guia de dado estruturado/schema 2026 (Digital Applied)](https://www.digitalapplied.com/blog/structured-data-seo-2026-rich-results-guide),
[Schema markup pra igrejas (Church Design Resource)](https://churchdesignresource.com/search-engines/schema-for-churches/),
[Diretórios online pra igrejas (ReachRight)](https://reachrightstudios.com/blog/online-directories-for-churches/),
[12 táticas de SEO pra igrejas (The Lead Pastor)](https://theleadpastor.com/church-management/seo-for-churches/),
[Backlinks e autoridade de site de igreja (Missional Marketing)](https://missionalmarketing.com/church-website-authority-backlinks/),
[Declaração de fé em site de igreja](https://goodchurchwebsite.com/statement-of-faith/),
[O que é uma declaração de fé (Donorbox)](https://donorbox.org/nonprofit-blog/statement-of-faith),
[12 itens essenciais de site de igreja (The Church Co)](https://thechurchco.com/blog/2024/05/28/12-things-every-church-website-must-have/),
[Página de ministério infantil (MayeCreate)](https://mayecreate.com/blog/childrens-ministry-web-page-design/),
[Estrutura de site de igreja (Missional Marketing)](https://missionalmarketing.com/church-website-site-structure-the-definitive-guide/),
[25 melhores sites de igreja — exemplos (Colorlib)](https://colorlib.com/wp/church-websites/),
[Anatomia da home de nonprofit (Elevation)](https://www.elevationweb.org/blog/the-anatomy-of-your-nonprofits-homepage/),
[Erros comuns de site de igreja (ChurchTrac)](https://www.churchtrac.com/blog/5-common-church-website-mistakes-(how-to-fix-them)),
[Página de sermões de igreja (ReachRight)](https://reachrightstudios.com/blog/perfect-church-sermons-page/),
[Série de mensagens no site (ChurchSpring)](https://churchspring.com/blog/sermon-series-church-website/),
[Marcação VideoObject pra SEO (Swarmify)](https://swarmify.com/blog/video-schema-markup/),
[Boas práticas de blog pra nonprofit (Nonprofit Tech for Good)](https://www.nptechforgood.com/101-best-practices/10-blogging-best-practices-for-nonprofits/),
[Bio de membro de conselho (River Editor)](https://rivereditor.com/blogs/write-board-member-bio-template-150-words-2026),
[Governança e transparência de igreja (GARBC)](https://www.garbc.org/blog/strengthening-church-governance-and-accountability-best-practices-and-essential-resources/),
[Transparência de governança (Church Transparency Project)](https://churchtransparency.org/governance-transparency/),
[Boas práticas de página de localização (NN/g)](https://www.nngroup.com/articles/store-finders-and-locators/),
[Site de igreja multi-campus (Vision Room)](https://www.visionroom.com/multisite-church-website-approach-3-campus-select-option/),
[Transparência financeira de nonprofit (Zeffy)](https://www.zeffy.com/blog/nonprofit-organization-transparency),
[Doação via Pix pra igreja (Cora)](https://www.cora.com.br/blog/como-registrar-doacoes-pix-na-contabilidade-da-igreja/),
[Página "planeje sua visita" de igreja (ChurchTrac)](https://www.churchtrac.com/blog/the-perfect-church-plan-your-visit-page),
[Sistema de pedido de oração (UKChurches)](https://www.ukchurches.co.uk/creating-a-prayer-request-system-for-your-church-website/),
[Mural de oração digital (Sermon Shots)](https://sermonshots.com/blog/how-to-create-a-digital-prayer-wall-for-your-congregation/),
[Padrão de galeria de imagens (UX Patterns for Developers)](https://uxpatterns.dev/patterns/media/image-gallery),
[Boas práticas de busca no site (Nielsen Norman Group)](https://www.nngroup.com/articles/site-search-suggestions/).

#### Pesquisa detalhada — temas transversais (suporte às fases 6-10 lá em cima)

Segunda rodada de pesquisa, pedida pelo usuário depois da primeira leva (página por página) por
ser "muito pouco pra um site de verdade" — 5 áreas que atingem o site inteiro de uma vez, não uma
página específica. Cada uma partiu de leitura real do código antes de pesquisar, não de suposição.
**Nada disto foi construído ainda.**

**Segurança e resiliência técnica**: confirmado no código que não existe `staticwebapp.config.json`
(sem CSP, sem `X-Content-Type-Options`, sem `X-Frame-Options`, sem `Permissions-Policy` — o site
roda sem nenhum header de segurança HTTP) nem `.github/dependabot.yml` (nenhuma dependência é
auditada automaticamente). O banco (PostgreSQL Flexible Server) já tem backup automático nativo do
Azure sem custo adicional — isso não é um gap de infraestrutura — mas a retenção padrão é só 7
dias (grátis até 35), nunca foi confirmada nem testada uma restauração de verdade, e não existe uma
segunda cópia fora da própria conta Azure. O container de mídia no Blob Storage tem leitura pública
(necessário pro site funcionar) mas sem soft delete/versionamento confirmado, ou seja, uma exclusão
acidental de foto/relatório não tem rede de segurança. O token de administrador do Directus foi
confirmado como nunca vazando pro navegador (só usado em build/CI, `.env.local` corretamente
ignorado pelo Git) — isso já está certo. Não dá pra confirmar pelo código se o Directus tem rate
limiter e um `SECRET` forte configurados no App Service (isso vive na infraestrutura, fora do
repositório) — fica como item de verificação, não achado confirmado.

**LGPD e privacidade**: `privacidade.astro` é hoje um rascunho não terminado (o próprio comentário
no código diz "Substitua pelo texto definitivo da igreja antes de publicar oficialmente"), sem
listar as coleções que realmente tratam dado pessoal, sem base legal, sem prazo de retenção e sem
canal claro pro titular pedir acesso/exclusão. O mural de oração publica dado potencialmente
sensível (convicção religiosa, e o que a pessoa escrever pode revelar mais) sem nenhum consentimento
específico e destacado — só um aviso de moderação sobre dado de terceiros, não sobre o próprio
remetente; nenhum formulário do site (contato, mural, inscrição em evento) tem checkbox de
consentimento. Achado mais grave (promovido à Fase 0 acima): a página pública de check-in busca a
lista de inscritos direto no Directus sem autenticação, potencialmente expondo nome, status de
pagamento e o código de check-in de todo mundo inscrito num evento. Dados de evento também ficam
"para sempre" por decisão de design (comentário no próprio código confirma), sem prazo de retenção
documentado. Ponto a favor: hospedagem em `brazilsouth` (dado em território nacional) e a
Resolução CD/ANPD nº 2/2022 provavelmente dispensa a igreja de nomear um encarregado/DPO formal,
desde que exista um canal de comunicação com o titular — hoje só existe um e-mail genérico, sem
descrever esse propósito.

**Acessibilidade (WCAG)**: já bem cuidado em vários pontos (skip link, landmarks, contraste de cor
auditado manualmente nos dois temas, `prefers-reduced-motion` global, modo de leitura fácil, menu
mobile com focus trap real) — o que segue são gaps reais, não uma lista genérica. Certificados e
crachás em PDF (`jsPDF`) não têm nenhuma tag estrutural (PDF/UA); nenhuma biblioteca gratuita de
geração de PDF resolve isso sozinha, então o realista é definir o idioma do documento e aceitar que
o check-in físico já cobre a necessidade prática — o ponto que dá pra corrigir de verdade é o QR
code do check-in, sem `alt` nem alternativa pensada pra quem não consegue escanear sozinho (só uma
fração de usuários com deficiência visual consegue). Campos do formulário de pesquisa de
satisfação sem `label`/`for` associado (promovido à Fase 0 acima, é regressão real comparado ao
formulário de inscrição de evento, que faz isso certo). Várias atualizações dinâmicas sem
`aria-live` (vagas restantes, status de cupom, contador do mural de oração), inconsistente com
outros pontos do mesmo site que já fazem isso certo (status do formulário de contato, botão de
copiar código). Os filtros de busca usam `role="tab"` sem o padrão de teclado que essa role
promete ao leitor de tela — pior que não usar role nenhuma. Calendário mensal marca "hoje"/"tem
evento" só por cor, sem texto acessível equivalente.

**Performance e Core Web Vitals**: as imagens de capa de evento/mensagem/notícia já usam
`loading="eager"` corretamente (evitando o erro que causou o LCP de 11s já documentado em commits
anteriores), mas nenhuma define `fetchpriority="high"` — ganho de 50-200ms medido em testes
públicos, maior retorno pelo menor esforço disponível hoje, já que esse cover costuma ser o próprio
elemento de LCP da página. Essas mesmas capas são geradas numa única largura fixa de 1600px
(`directusAssetUrl(..., { width: 1600 })`), sem `srcset` — um celular baixa a mesma imagem que um
desktop; é um problema distinto do já registrado na Galeria (que é sobre thumbnails de grade), este
é o hero de artigo individual, que pesa mais no LCP mobile. Não existe `staticwebapp.config.json`
(mesmo arquivo da Fase 6) definindo `Cache-Control` de longo prazo pros assets versionados do build
(`_astro/*`, fontes). Falta `<link rel="preconnect">` pro domínio do Directus (terceiro, Azure) no
`<head>` — a conexão TCP/TLS só começa quando a primeira imagem é descoberta. Confirmado que
scripts de terceiro (leitor de QR code, gerador de QR code, Leaflet) já carregam só nas páginas que
os usam, não na home/mensagens/notícias — não é um problema real. `width`/`height` HTML ausente nos
`<img>` também não é problema real, já mitigado por `aspect-ratio` fixo no CSS em todas as páginas
de artigo/galeria.

**Analytics e promoção de conteúdo**: confirmado que não existe nenhuma ferramenta de analytics no
código hoje (nenhum script de terceiro no `<head>`), nem newsletter por e-mail. O feed RSS
(`/rss.xml`, já junta mensagens e notícias) é tecnicamente descoberto (`<link rel="alternate">` no
head, ícone no rodapé) mas invisível na prática — nenhuma página explica o que é RSS ou por que
alguém clicaria ali; essa é a correção de maior valor e menor esforço, sem nenhuma mudança técnica.
Depois disso, dá pra considerar um serviço gratuito que transforma esse mesmo RSS em e-mail
automático pra quem preferir, sem a igreja precisar curar uma newsletter manualmente (que
historicamente para de sair em poucos meses em organizações pequenas sem equipe dedicada) — resolve
RSS e newsletter ao mesmo tempo com zero esforço editorial contínuo. Analytics sem cookies só vale a
pena se alguém for de fato revisar os números, medindo 2-3 perguntas reais (de onde vêm as pessoas,
quais páginas usam) — pageview bruto e contagem de seguidores são métrica de vaidade, sem nenhuma
decisão da liderança do outro lado.

Fontes consultadas (as 5 rodadas, título e domínio — sem nome de produto/plataforma específico no
texto acima): [Resolução CD/ANPD nº 2/2022 (gov.br)](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-2-de-27-de-janeiro-de-2022),
[Resolução CD/ANPD Nº 2 (LegisWeb)](https://www.legisweb.com.br/legislacao/?id=426801),
[Dispensa do encarregado para pequenas empresas (bCompliance)](https://blog.bcompliance.com.br/2025/07/11/lgpd-pequenas-empresas-dispensa-dpo-canal-comunicacao/),
[LGPD para igrejas (Sistema Prover)](https://sistemaprover.com.br/blog/lgpd-para-igrejas-o-que-diz-a-nova-lei-e-como-ela-pode-impactar-sua-igreja),
[Proteção de dados na igreja e concílios (IPB)](https://www.ipb.org.br/content/Downloads/LGPD_VF.pdf),
[LGPD e as igrejas (Jus.com.br)](https://jus.com.br/artigos/92783/lei-de-protecao-de-dados-lgpd-as-igrejas),
[Tratamento de dado religioso (Privacy Tools)](https://www.privacytools.com.br/dadosreligiosos/),
[Adequação de igrejas à LGPD (Conjur)](https://www.conjur.com.br/2021-mar-15/opiniao-adequacao-igrejas-instituicoes-religiosas-lgpd/),
[Fichas de membros e pedidos de oração (Proesecont)](https://www.proesecont.com.br/fichas-de-membros-e-pedidos-de-oracao-como-aplicar-a-lgpd-para-igrejas-e-evitar-processos/),
[Política de privacidade 2026 (Confidata)](https://confidata.com.br/blog/politica-privacidade-2026-anpd-modelos),
[LGPD se aplica a nonprofit? (Contabeis.com.br)](https://www.contabeis.com.br/artigos/7905/a-lgpd-se-aplica-as-empresas-sem-fins-lucrativos/),
[Canal do titular LGPD (Simplifica Compliance)](https://blog.simplificacompliance.com.br/canal-do-titular-lgpd/),
[Direito dos titulares (MCTI)](https://www.gov.br/mcti/pt-br/acesso-a-informacao/lei-geral-de-protecao-de-dados-pessoais-lgpd/direito-dos-titulares),
[Acessibilidade de PDF pra devs (Enrise)](https://enrise.com/2019/06/pdf-accessibility-for-web-developers/),
[Checklist de acessibilidade nonprofit (Elevation)](https://www.elevationweb.org/blog/nonprofit-accessibility-best-practices/),
[Checklist WCAG 2.1/2.2 AA (Accessible.org)](https://accessible.org/wcag/),
[Google Maps/YouTube embutido são acessíveis? (Vision Australia)](https://www.visionaustralia.org/business-consulting/digital-access/blog/embedded-youtube-and-google-maps),
[QR code é barreira de acessibilidade (Medium)](https://medium.com/@roberto_40218/the-invisible-barrier-qr-codes-and-accessibility-f1e4dba6653f),
[QR code acessível (Section508.gov)](https://www.section508.gov/blog/accessibility-bytes/qr-codes/),
[Regiões `aria-live` (UXPin)](https://www.uxpin.com/studio/blog/aria-live-regions-for-dynamic-content/),
[Mensagens de status WCAG 4.1.3 (AAArdvark)](https://aaardvarkaccessibility.com/wcag-plain-english/4-1-3-status-messages/),
[`prefers-reduced-motion` (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion),
[Ferramentas gratuitas de auditoria de acessibilidade (BarrierBreak)](https://www.barrierbreak.com/5-free-must-have-web-accessibility-testing-tools/),
[`fetchpriority=high` na imagem de LCP (Addy Osmani)](https://addyosmani.com/blog/fetch-priority/),
[Fetch Priority API (web.dev)](https://web.dev/articles/fetch-priority),
[Não faça lazy-load da imagem de LCP (Unlighthouse)](https://unlighthouse.dev/learn-lighthouse/lcp/lcp-lazy-loaded),
[Descoberta da requisição de LCP (Chrome for Developers)](https://developer.chrome.com/docs/performance/insights/lcp-discovery),
[Carregar script de terceiro com eficiência (web.dev)](https://web.dev/articles/efficiently-load-third-party-javascript),
[Boas práticas de cache de CDN (Fastly)](https://www.fastly.com/documentation/guides/full-site-delivery/caching/caching-best-practices/),
[Estratégias de cache de CDN (OneUptime)](https://oneuptime.com/blog/post/2026-01-30-cdn-caching-strategies/view),
[Backup do PostgreSQL Flexible Server (Microsoft Learn)](https://learn.microsoft.com/en-us/azure/postgresql/backup-restore/concepts-backup-restore),
[Azure Backup pro PostgreSQL Flexible Server (Microsoft Learn)](https://learn.microsoft.com/en-us/azure/backup/backup-azure-database-postgresql-flex-overview),
[Soft delete de blob (Microsoft Learn)](https://learn.microsoft.com/en-us/azure/storage/blobs/soft-delete-blob-overview?tabs=azure-portal),
[Versionamento de blob (Microsoft Learn)](https://learn.microsoft.com/en-us/azure/storage/blobs/versioning-overview?tabs=powershell),
[Configurar Azure Static Web Apps (Microsoft Learn)](https://learn.microsoft.com/en-us/azure/static-web-apps/configuration),
[Headers de segurança em Azure Static Web Apps (Rebin)](https://rebin.dev/post/configure-http-security-response-headers-for-azure-static-web-apps/),
[Segurança e limites do Directus (Directus Docs)](https://directus.io/docs/guides/security/best-practices),
[Configurar atualizações do Dependabot (GitHub Docs)](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuring-dependabot-version-updates),
[Analytics sem cookies pra nonprofit (Swetrix)](https://swetrix.com/blog/web-analytics/for-nonprofits),
[Ferramentas de analytics self-hosted (PostHog)](https://posthog.com/blog/best-open-source-analytics-tools),
[Como promover um feed RSS (ZenBusiness)](https://www.zenbusiness.com/blog/rss-feed/),
[Transformar RSS em newsletter por e-mail (beehiiv)](https://blog.beehiiv.com/p/rss-to-email-newsletter),
[E-mail marketing gratuito pra nonprofit (Zeffy)](https://www.zeffy.com/blog/mailchimp-alternatives-for-nonprofits),
[Métricas de vaidade — o que medir de verdade (NN/g)](https://www.nngroup.com/articles/vanity-metrics/).

#### Pesquisa detalhada — "melhor site de igreja" (suporte às fases 11-15 lá em cima)

Terceira rodada de pesquisa, pedida pelo usuário depois das duas primeiras (página por página, e
temas transversais de segurança/LGPD/acessibilidade/performance/analytics) — comparando
referências de sites de igreja no Brasil e no exterior, pra elevar o padrão do site ao máximo.
**Nada disto foi construído ainda, exceto onde indicado.**

**Design/UX de referência**: o próprio levantamento do código mostrou um projeto já maduro em
infraestrutura de design (tokens de cor/radius/motion centralizados, paleta ajustada pra WCAG AA
nos dois temas, microinterações reais) — os gaps são de decisão editorial, não de engenharia. O
maior: o hero da home é 100% texto, sem nenhuma foto/vídeo, o que lê como landing page de SaaS, não
como igreja — toda referência internacional (igrejas grandes nos EUA) usa mídia autêntica ocupando
metade do hero. A foto em si depende da igreja (já registrado na Fase 4), mas a arquitetura visual
(duas colunas, técnica de overlay/duotone pra legibilidade do texto) dá pra preparar desde já.
Tipografia é hoje monocórdica (só sans-serif, mesmo com uma fonte serifada já disponível no CSS,
nunca ativada) — usar serifada em títulos daria a "voz editorial" que caracteriza site de igreja
grande. Falta uma escala de tipografia formalizada em tokens (cada componente define seu próprio
tamanho solto hoje, risco real de inconsistência com mais páginas). Cards/superfícies usam sempre a
mesma receita (borda 1px + radius pequeno), visualmente uniforme demais — variar (sombra em cards
de destaque) aproximaria do padrão "acolhedor" das referências. Sem transição entre páginas (só
microinteração local) — o Astro suporta crossfade nativo de baixo custo. Rodapé sem agrupamento
visual por seção, ok hoje mas vai pesar conforme a Fase 5 adicionar páginas. A pesquisa em
português não achou uma cultura de crítica de design de site de igreja tão desenvolvida quanto a
internacional — sinal de que o padrão brasileiro médio tende a repetir templates genéricos com
vídeo de fundo automático e pouca curadoria, o oposto do que a tendência internacional recomenda
(foto autêntica parada + tipografia expressiva + espaço em branco generoso).

**Libras e acessibilidade específica do Brasil**: não existe hoje nenhuma integração de Libras nem
legenda em vídeo de mensagem (o campo `videoUrl` é só link de saída pro YouTube, sem player
embutido — mesmo pré-requisito já registrado na Fase 4). Não há exigência legal clara e específica
de Libras pra entidade religiosa privada — Lei Brasileira de Inclusão e Decreto 5.296/2004 tratam
acessibilidade de forma mais ampla, sem obrigação inequívoca pra site de igreja, e o e-MAG (Modelo
de Acessibilidade em Governo Eletrônico) vale só pra site de governo, não traz achado adicional além
do que a Fase 8 (WCAG geral) já cobre. Maior valor real, custo zero: legenda em português no vídeo
de mensagem quando existir (o YouTube já gera automaticamente, só precisa revisão de termos
religiosos que a legenda automática costuma errar). Um widget gratuito de tradução automática pra
Libras (mantido por órgão do governo federal) é fácil de instalar, mas traduz só texto sob demanda,
não vídeo/áudio, com qualidade reconhecidamente limitada pra conteúdo de fé — vale como complemento
parcial em páginas de texto institucional, nunca como substituto de legenda ou de um intérprete
humano de verdade (se um dia a igreja gravar isso).

**App instalável (PWA)**: ao verificar o código antes de pesquisar, confirmado que isto **já está
construído e testado** — `public/site.webmanifest`, `public/sw.js` (cache de 3 páginas essenciais:
início, eventos, contato, ~380 KB), botão "Instalar app" no cabeçalho (`beforeinstallprompt` no
Android/desktop, instrução manual no iOS, sem popup intrusivo), e o check-in offline-capable com
fila própria de sincronização. Só sobraram dois retoques pequenos: ícone com variante "maskable"
(evita corte em launcher Android que recorta em círculo) e `shortcuts` no manifest espelhando as
mesmas 3 páginas já privilegiadas no cache. Expandir o cache offline pra mais páginas foi avaliado e
**não é recomendado** — cache pequeno e deliberado é a prática certa pra esse porte de site; cache
demais é o erro clássico de PWA mal feita (storage inchado, conteúdo velho servido por engano). Um
app nativo de loja também não se justifica: nenhum recurso de hardware avançado (Bluetooth, NFC) é
necessário além da câmera do leitor de QR, que a PWA já usa sem problema.

**WhatsApp e automação de FAQ**: o link `wa.me` institucional já existe em `/contato/` (usa o
telefone cadastrado no Directus, não um número fixo no código), mas aparece como texto simples
entre "Outros contatos" — destacá-lo mais e usar mensagem pré-preenchida por contexto (`?text=`,
mesmo princípio do `?assunto=` que o formulário interno já usa) entrega a maior parte do valor sem
nenhuma automação. Botão flutuante de WhatsApp é melhoria menor, restrita a páginas de
contato/institucionais — seria ruído em página de conteúdo devocional. Chatbot de FAQ automatizado
(regras ou IA) **avaliado e não recomendado**: exige volume de perguntas repetitivas que uma igreja
pequena sem equipe técnica não tem, e a API oficial paga por conversa não cabe no orçamento — o FAQ
estático já existente em `/visitante/`, reforçado pelo link de WhatsApp, já cobre a necessidade.
Ponto de atenção que liga com a Fase 7 (LGPD): confirmar que o número cadastrado é uma linha
institucional, não o celular pessoal de um líder específico — evita expor a vida pessoal de quem
atende e não depende de uma pessoa só estar disponível.

**Comunidade — pequenos grupos e voluntariado**: "servir/seja voluntário" já havia sido avaliado e
rejeitado (Fase 5) por precisar de vagas reais primeiro; a pesquisa qualifica esse achado — o
formato "lista de vagas abertas" tem uma causa estrutural de ficar desatualizado numa operação
pequena e voluntária (conteúdo velho ativamente passa a impressão de organização inativa), e isso
não desaparece só porque aparecem vagas reais no futuro, precisa trocar de formato. Alternativa de
esforço mínimo e risco baixo: opção "Quero servir" dentro de `/contato/`, no mesmo molde já
construído e testado do "Pedido de oração" — formulário de interesse que a liderança direciona
manualmente, sem catálogo público de vagas que possa envelhecer. Pequenos grupos/células teriam
modelo de dado simples (nome/tema, líder, dia da semana, bairro aproximado — não endereço exato, por
privacidade, já que costumam ser reuniões em casa), mas **depende de confirmar com a liderança se
existe de fato um programa formal de grupos pequenos** — a estrutura visível hoje é por
congregação/ponto de pregação, não célula doméstica; sem essa confirmação, não construir, pelo
mesmo motivo que já evitou inventar dado na Fase 4 (história).

Fontes consultadas (as 5 rodadas desta leva, título e domínio — sem nome de produto/plataforma/
software de gestão de igreja comercial específico no texto acima):
[Melhores sites de igreja 2026 — 43 exemplos](https://mycodelesswebsite.com/church-website-design/),
[43 melhores sites de igreja de todos os tempos (Sage)](https://sage.agency/industry/best-church-websites/),
[25 melhores sites de igreja — exemplos (Colorlib)](https://colorlib.com/wp/church-websites/),
[Tendências de design de site de igreja pra 2025 (One Eighty)](https://oneeighty.digital/2025/01/13/church-website-design-trends-for-2025/),
[23 melhores sites de igreja 2026 (ReachRight)](https://reachrightstudios.com/blog/best-church-websites/),
[Tendências de design de site pra 2026 (Figma)](https://www.figma.com/resource-library/web-design-trends/),
[Tendências de design de site nonprofit 2026 (Advanced Systemics)](https://www.advancedsystemics.com/nonprofit-website-design-trends-2026/),
[Estrutura de site de igreja — guia definitivo (Missional Marketing)](https://missionalmarketing.com/church-website-site-structure-the-definitive-guide/),
[Estratégia digital das principais igrejas no Brasil 2025 (Sociedade Tecnológica)](https://sociedadetecnologica.com/2025/02/17/estrategia-digital-das-principais-igrejas-no-brasil-2025/),
[Sites de igreja pra se inspirar (blog inChurch)](https://inchurch.com.br/blog/8-sites-de-igrejas-para-voce-se-inspirar/),
[Microinterações em web design (Stan Vision)](https://www.stan.vision/journal/micro-interactions-2025-in-web-design),
[Design tokens explicado (Contentful)](https://www.contentful.com/blog/design-token-system/),
[Transições de página com Astro e View Transitions (Codrops)](https://tympanus.net/codrops/2023/10/03/animating-multi-page-navigations-with-browser-view-transitions-and-astro/),
[Texto acessível sobre imagem (Smashing Magazine)](https://www.smashingmagazine.com/2023/08/designing-accessible-text-over-images-part1/),
[Widget de Libras — Governo Digital (gov.br)](https://www.gov.br/governodigital/pt-br/estrategias-e-governanca-digital/sisp/guia-do-gestor/guia-orientativo-de-padroes-e-fluxos-das-tecnologias-de-transformacao-digital/vlibras-widget),
[Desafios da tradução automática de vídeo pra Libras (artigo acadêmico)](https://www.academia.edu/113689108/Tecnologia_assistiva_e_tradu%C3%A7%C3%A3o_para_Libras_desafios_da_ferramenta_de_tradu%C3%A7%C3%A3o_autom%C3%A1tica_de_v%C3%ADdeos_VLibras),
[Leis federais de acessibilidade na web (WPT)](https://mwpt.com.br/acessibilidade-digital/leis-federais-sobre-acessibilidade-na-web/),
[Modelo de Acessibilidade em Governo Eletrônico (e-MAG)](https://emag.governoeletronico.gov.br/),
[Legendas automáticas — Ajuda do YouTube](https://support.google.com/youtube/answer/6373554?hl=pt-BR),
[Intérprete de Libras na igreja (Sinal e Imagem)](https://www.sinaleimagem.com.br/interprete-igreja/),
[Tamanhos de ícone PWA (Imagcon)](https://imagcon.app/pwa-icon-sizes),
[PWA vs. app nativo em 2026 (InstinctTools)](https://www.instinctools.com/blog/pwa-vs-native-app/),
[Boas práticas de UX do prompt de instalação de PWA (Michael Samuel Naeem)](https://blog.michaelsam94.com/pwa-install-prompt-ux/),
[`shortcuts` no manifest de app web (MDN)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/shortcuts),
[Estratégias de cache em PWA (Chrome for Developers/Workbox)](https://developer.chrome.com/docs/workbox/caching-strategies-overview),
[Gerador de link do WhatsApp com mensagem pré-preenchida (Eazybe)](https://eazybe.com/whatsapp-chat-link-generator),
[Chatbot pra ONG — quando vale a pena (BotPenguin)](https://botpenguin.com/blogs/chatbot-for-nonprofits),
[Botão flutuante de WhatsApp em site (Infobip)](https://www.infobip.com/blog/add-whatsapp-button-to-website),
[WhatsApp pra igrejas — guia de comunicação (ePastor)](https://epastor.com.br/blog/whatsapp-para-igrejas-guia-completo),
[6 layouts de site pensados pra igreja (Ekklesia360)](https://hello.ekklesia360.com/blog/6-website-layouts-designed-for-the-church),
[Encontre um grupo pequeno — página de referência (City Hills Church)](https://cityhills.com/groups/),
[Como criar a página de voluntariado perfeita (ServeHQ)](https://servehq.church/blog/how-to-create-volunteer-page-on-church-website/),
[Como manter o conteúdo do site de igreja sempre atualizado (Church Web Global)](https://www.churchwebglobal.com/blog/keep-church-website-content-fresh),
[Modelo de formulário de interesse de voluntário (WNC UMC)](https://www.wnccumc.org/formdetail/sample-volunteer-interest-form-12240485).

### Ideias rejeitadas

Avaliadas e descartadas por decisão explícita — registradas aqui só para não serem propostas de
novo sem necessidade.

- **"Ao vivo agora" automático** — aviso que aparece sozinho quando há transmissão ao vivo. As
  duas formas possíveis de fazer isso (interruptor manual no painel, ou checagem automática via
  API) foram descartadas: a primeira tem um fluxo ruim pra quem está no evento, a segunda tem
  limite diário de consultas que não compensa pra transmissões raras. Ficou só o link estático
  "Assistir ao vivo" em `/eventos/`, que já resolve na prática sem nenhuma dessas complicações.
- **Aniversariantes do mês** — envolveria coletar e expor data de nascimento de membros de várias
  congregações — dado sensível demais pra pouco benefício.
- **Escala de trabalho/voluntários** — já existe um sistema de gestão de membros usado pela
  igreja com essa função, mais completo do que valeria a pena reconstruir aqui do zero. Pesquisa
  posterior confirmou o mesmo achado por outro ângulo: o padrão de mercado pra escala de louvor/
  mídia/recepção é reaproveitar o próprio sistema de gestão de membros da organização, e a causa
  mais comum de abandono desse tipo de ferramenta não é falta de recurso técnico, é falta de dono
  do processo — um sistema novo no site sofreria do mesmo problema, só que sem o suporte pronto que
  o sistema já usado tem. Só reconsiderar se ficar confirmado que esse sistema não cobre escala de
  serviço de verdade (não só cadastro de membro).
- **Área "Batismo/Casamento/Dedicação de crianças"** — mesma razão: já existe no sistema interno
  de gestão de membros usado pela igreja, não faz sentido duplicar aqui.
- **Diretório/cadastro privado de membros no site** — pesquisado e descartado pelo mesmo motivo das
  duas ideias acima (já existe um sistema de gestão de membros em uso, mais completo). Manter um
  segundo cadastro de pessoa no site institucional criaria dado sensível duplicado (afiliação
  religiosa é dado sensível pela LGPD mesmo entre membros da própria comunidade) sob duas
  superfícies diferentes de vazamento, sem nenhum ganho de funcionalidade sobre o que já existe.
- **Módulo completo de Escola Bíblica Dominical (turma, professor, currículo, matrícula)** —
  pesquisado e descartado: é uma estrutura de dado recorrente (toda semana, não um cadastro
  estático) que precisa de manutenção contínua por professores voluntários — maior risco de
  abandono que qualquer outra ideia já rejeitada neste documento, porque o problema se repete
  semanalmente em vez de uma vez só. Se um dia a dor real e específica for só controlar presença
  (não currículo nem matrícula), o check-in de eventos já testado (`checkin/[slug].astro`) dá a
  base técnica pra um experimento pequeno — mas só depois de confirmar que essa dor existe de
  verdade, não preventivamente.
- **Sistema de reserva de espaço/salão com calendário de disponibilidade em tempo real** —
  avaliado e adiado: verificar conflito de horário automaticamente exige lógica que o Directus
  gratuito não resolve nativamente (mesma limitação de "sem filtro condicional" já documentada
  noutra parte deste README), e o volume de pedidos numa igreja deste porte provavelmente não
  justifica o esforço. Só reconsiderar se houver reclamação real de sobreposição de horário — nesse
  caso, a opção de menor esforço é embutir (via iframe, como já é feito com o mapa em `/contato/`)
  uma agenda compartilhada gratuita, em vez de construir algo customizado.
- **Painel financeiro interno (tesouraria)** — pesquisado a fundo (a recomendação técnica era usar
  coleções novas no Directus com Directus Insights, sem página custom), mas **retirado do plano
  depois de esclarecimento do usuário**: já existe um sistema financeiro separado sendo montado
  pela igreja pra essa finalidade. Construir qualquer versão disso aqui duplicaria um sistema que já
  está em andamento em outra plataforma — o mesmo motivo, generalizado, que já valia pra diretório
  de membros e escala de voluntários: **o site não deve propor recursos de "gestão de igreja" que
  dependam de conectar a outro sistema/banco de dados que já existe fora deste projeto** (outro app
  do Azure com seu próprio servidor, exigindo integração via API só pra buscar dado de lá). Eventos
  seguem sendo a exceção correta, porque não são cobertos por nenhum sistema de gestão que a igreja
  já usa ou está construindo — esse é o critério a aplicar em qualquer ideia nova daqui pra frente.
- **Kit de imprensa formal (logo em várias versões, fotos oficiais, boilerplate institucional)** —
  pesquisado e descartado: media kit serve primariamente pra jornalista/parceiro externo pedir
  material pronto, e não há evidência de cobertura de imprensa ou demanda de terceiros por ativo de
  marca pra esse porte de igreja. Se surgir pedido real no futuro, resolver com 2-3 arquivos soltos
  em `public/`, não uma página dedicada.
- **Devocional diário com reflexão/comentário original** — pesquisado e descartado: exigiria
  produção de texto teológico novo todos os dias, indefinidamente — risco de abandono maior que
  qualquer outra ideia já rejeitada aqui, porque o problema se repetiria diariamente em vez de
  semanalmente (como EBD) ou pontualmente (como newsletter). O "versículo do dia" já existente
  cumpre o papel de leitura diária guiada sem depender de ninguém escrever nada novo.
- **Plano de leitura bíblica anual construído do zero** — pesquisado e descartado: o mercado já
  resolve isso de graça, em escala que a igreja não alcançaria (aplicativo dedicado com milhões de
  planos completados, inclusive em parceria com sociedade bíblica brasileira). Construir uma versão
  própria seria competir sem chance real com algo que muitos membros provavelmente já usam.
  Alternativa de baixo risco, se um dia fizer sentido: um plano temático curto e com prazo definido
  (2-4 semanas, ex. Advento), reaproveitando o banco de versículos que já existe no repositório, com
  progresso salvo em `localStorage` (mesmo padrão já usado pro modo de leitura fácil) — sem exigir
  produção de texto novo nem compromisso contínuo.
- **Multilíngue (PT/EN/ES)** — a igreja não recebe público de outros idiomas com frequência que
  justifique manter traduções; o tradutor automático do navegador já cobre o caso raro.
- **Exportar lista de inscritos (CSV/Excel)** — decidido não construir: gerar um arquivo solto de
  dados pessoais que passa a circular fora do sistema (e-mail, pendrive, WhatsApp) é pior do ponto
  de vista de segurança do que manter tudo dentro do painel, com autenticação e controle de
  acesso. A tela de inscritos já cobre visualização, busca e filtro sem precisar exportar nada.
- **Link rápido de WhatsApp por inscrito** — pesquisado e descartado: o WhatsApp lançou (rollout
  mundial a partir de setembro/2026) um recurso de nome de usuário que deixa a pessoa **esconder
  o próprio número** de quem não é contato salvo — a intenção declarada é impedir justamente esse
  tipo de contato ("eu tenho seu telefone, então posso te chamar"). O link direto por número
  (`wa.me/55...`) parece continuar funcionando por enquanto, mas é uma função nova, feita com esse
  propósito específico, sem garantia de continuar funcionando conforme mais gente ativar essa
  configuração. Não vale a pena construir algo que pode parar de funcionar sozinho, sem aviso.
- **Newsletter por e-mail** — pesquisado a fundo (Resend, Mailjet, Brevo). O Brevo (o mais
  recomendado, contatos ilimitados de graça) exige um clique manual ("Requeue") pra completar o
  envio sempre que a lista passar de 300 inscritos, porque o plano grátis não permite programar
  isso com antecedência nem enfileira sozinho o restante. A alternativa (programar o envio nós
  mesmos, sem usar a Campanha do Brevo) tiraria esse clique manual, mas exigiria construir e
  manter por conta própria o link de descadastro e o controle de quem já saiu da lista — risco e
  trabalho maior que o benefício. Decidido não valer a pena por nenhum dos dois caminhos.

## Licença

Uso restrito — ver [LICENSE](./LICENSE). O código é público apenas para fins de transparência e
consulta; não é software de código aberto, não permite uso comercial e qualquer reaproveitamento
por terceiros depende de autorização prévia da IEADESPA.
