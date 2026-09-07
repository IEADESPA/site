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
- [ ] **Múltiplos responsáveis por evento** — marcar quem administra cada evento especificamente,
      útil quando existir mais de uma conta usando o painel (hoje só uma conta usa).

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
- [ ] **Check-in por QR Code** — hoje a pessoa digita o código de 6 caracteres; poderia mostrar
      também um QR Code (gerado na hora da confirmação, sem servidor extra) pra escanear com a
      câmera do celular na entrada — mais rápido que digitar quando a fila é grande, e ganha mais
      sentido junto dos outros itens de credenciamento em massa desta seção.
- [ ] **Registrar o portão/local do check-in** — pra eventos com mais de uma entrada, guardar em
      qual ponto cada pessoa confirmou presença (útil pra saber qual portão está mais cheio).
- [ ] **Lotação em tempo real visível pra quem está na porta** — um contador ao vivo de "quantos
      já confirmaram presença" (derivado do que já existe), pra saber quando parar de deixar
      entrar mais gente num espaço com capacidade limitada — questão de segurança, não só
      estatística.
- [ ] **Check-in funciona mesmo se a internet cair** — hoje o check-in depende de internet no
      aparelho; num evento grande, se a rede do local falhar, ninguém confirma presença. Guardar
      as confirmações no aparelho e sincronizar depois que a conexão voltar resolveria isso —
      mais complexo de construir bem, por isso separado como item à parte.
- [ ] **Contador de presença ao vivo no telão "hoje na igreja"** — conectar o painel de telão já
      existente ao número de presentes do evento em andamento, pra equipe acompanhar o
      andamento sem abrir o painel de inscritos numa outra tela.

**Fora do escopo, por decisão já tomada antes** (não incluído acima de propósito): cupom de
desconto com código de verdade, e qualquer coisa que exija processamento real de pagamento —
ambos exigiriam uma plataforma de pagamento de verdade, o que já foi avaliado e descartado.

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
- **Área "Batismo/Casamento/Dedicação de crianças"** — mesma razão: já existe no sistema interno
  de gestão de membros usado pela igreja, não faz sentido duplicar aqui.
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
