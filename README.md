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
plataforma de eventos de verdade (Even3), não se sustentava. Revisado depois de analisar prints
reais de um módulo de eventos completo: a lição principal foi que **controle financeiro por
pessoa não é o objetivo** — só interessa um total geral do evento, lançado manualmente no sistema
de membros (fora do site). E-mail também ficou fora — nunca é armazenado.

Para evento complexo de verdade (pago, com certificado, check-in), **usar Even3/Sympla**,
apontando o já existente campo `registration_url` pra lá — não vale a pena reconstruir isso aqui.

- [x] **Evento semanal** (culto) — já existia (coleção `programacao`).
- [x] **Evento simples** (festa, aniversário) — coleção `eventos`:
      - `end_time`: horário de término real (ex. "8h às 17h"), além da data.
      - `congregacao` (relação com a coleção `congregacoes`): quando o evento acontece numa
        congregação cadastrada, o endereço é **puxado automaticamente** de lá (nome + endereço,
        via `congregacaoEndereco()` em `src/lib/directus.ts`). O campo `location` (texto livre)
        continua existindo pra endereço avulso.
      - `responsavel`: quem organiza o evento (nome ou ministério).
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
      - **Certificado**: ainda adiado, mas confirmado como a dor real mais forte do processo
        manual atual (49 certificados feitos um por um à mão). Quando for construído, a meta é
        não precisar de nenhuma exportação — nome usado direto do banco pra gerar um link único
        por inscrição (`/certificado/<código>/`), sem conta nem senha.
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
- [ ] **Linha do tempo/história interativa** — versão visual (scroll com marcos) da página
      "Nossa história", reaproveitando o conteúdo já cadastrado.
- [ ] **Área "Batismo/Casamento/Dedicação de crianças"** — página com pré-requisitos e formulário
      de solicitação de data, salvando no Directus como as inscrições de evento.
- [ ] **Estatísticas públicas de crescimento** — gráfico simples (ex. nº de congregações ao longo
      dos anos, atendendo à transparência) na página `/transparencia/`.
- [ ] **Impressão amigável (modo impressão) da programação semanal** — CSS `@media print`
      dedicado, para quem prefere imprimir em vez de guardar a imagem compartilhável.
- [ ] **Newsletter por e-mail** — resumo semanal automático (notícias + próximos eventos) via
      Flow do Directus, para quem se cadastra com o e-mail.
- [ ] **Progressive Web App (PWA)** — permite "instalar" o site na tela inicial do celular como
      se fosse um app, com ícone próprio, sem passar pela loja de aplicativos.
- [ ] **Modo offline básico** — cache da programação semanal e contatos via Service Worker, para
      funcionar mesmo sem internet (útil em áreas de sinal fraco).
- [ ] **Busca por proximidade nas congregações** — usar a localização do navegador (com permissão
      do visitante) para ordenar as congregações da mais próxima para a mais distante.
- [ ] **Painel "hoje na igreja"** — tela pensada para ficar num telão/TV na recepção, mostrando
      automaticamente o culto do dia, versículo e avisos, atualizando sozinha.
- [ ] **Certificado/declaração automática** — para batismo, conclusão de curso ou participação em
      evento, gerado em PDF a partir de um formulário simples (reaproveita `sharp`, já usado no
      gerador de imagem compartilhável).
- [ ] **Trocar pelo Google Maps Platform** — trocar o mapa de congregações (hoje Leaflet +
      OpenStreetMap) e o embed de `/contato/` pelo Google Maps, com rotas reais e Street View da
      sede. Depende de uma chave de API própria (nunca fica salva em nenhum arquivo do
      repositório) — avisar quando estiver disponível.
- [ ] **Aba dedicada de gestão de eventos (só camada 3)** — decidido **adiar** para depois do
      Google Maps e dos ajustes gerais do site, e das ideias de comunidade/crescimento/operação
      interna acima; retomar só quando houver disposição de mexer com calma, por ser a mudança
      de maior fôlego desta lista. Escopo: uma área nova dentro do próprio site, autenticada,
      exclusiva para os eventos com inscrição (camada 3) — a programação semanal (camada 1) e o
      calendário de eventos simples (camada 2) continuam geridos no Directus normalmente, sem
      mudança nenhuma. Objetivo: gerenciar o ciclo inteiro do evento complexo num só lugar, com a
      tela do jeito que a igreja quer (não o formulário genérico do Directus), e resolver o
      problema real de **inscrições acumulando para sempre** depois que o evento termina.
      Exige transformar essa parte do site (hoje 100% estático) em renderização sob demanda
      (suportado nativamente pelo Azure Static Web Apps) e um login simples só para as poucas
      pessoas que administram evento. Ordem de construção combinada:
      1. Autenticação da aba.
      2. Criar evento + suas perguntas (substitui o cadastro no Directus).
      3. Inscritos, pagamento e check-in reunidos numa única tela.
      4. Certificado — link único por inscrição (`/certificado/<código>/`), nome direto do banco,
         sem exportação, sem conta nem senha.
      5. **Encerrar evento** — ação que grava um resumo agregado (total de inscritos, presentes,
         pagos, valor arrecadado) direto no evento e **apaga** os dados pessoais (nome, telefone,
         respostas) daquela edição — evita acumular centenas de inscrições de eventos passados
         junto com as do evento atual, e evita guardar dado pessoal além do necessário.
      6. **Relatório automático** — ao encerrar, gera um rascunho de notícia/relatório público
         (quantas pessoas participaram, quem ministrou, fotos) para a aba de notícias/relatórios
         do site — sem valor em dinheiro, que nunca é publicado.

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
  igreja com essa função, mais completo do que valeria a pena reconstruir aqui do zero.
- **Multilíngue (PT/EN/ES)** — a igreja não recebe público de outros idiomas com frequência que
  justifique manter traduções; o tradutor automático do navegador já cobre o caso raro.

## Licença

Uso restrito — ver [LICENSE](./LICENSE). O código é público apenas para fins de transparência e
consulta; não é software de código aberto, não permite uso comercial e qualquer reaproveitamento
por terceiros depende de autorização prévia da IEADESPA.
