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
- [ ] **Modo escuro (dark mode)** — alternância manual, respeitando a preferência do sistema por
      padrão.
- [ ] **Player de áudio persistente (mini-player)** — ao abrir uma mensagem, o áudio continua
      tocando enquanto se navega para outras páginas do site.
- [ ] **Transmissão ao vivo** — embutir o link do YouTube/Instagram Live nos dias de culto, com
      aviso automático "ao vivo agora" na home quando dentro do horário de culto.
- [ ] **Aniversariantes do mês** — lista opcional (com autorização de cada membro) na página de
      congregações ou em área restrita.
- [ ] **Escala de trabalho/voluntários** — coleção no Directus para escalas de louvor, mídia,
      recepção etc., visível só para quem está escalado.
- [ ] **Enquetes/avaliação pós-evento** — formulário curto após eventos especiais, para feedback
      da congregação.
- [ ] **Multilíngue (PT/EN/ES)** — para visitantes estrangeiros, caso a igreja receba público
      diverso.
- [ ] **Feed RSS/Atom das mensagens e notícias** — para quem acompanha por leitor de feeds.
- [ ] **QR code em cartazes físicos** — gerado automaticamente por evento, apontando direto para
      a página `/evento/<slug>/`.
- [ ] **Inscrição/gestão de eventos pelo próprio site** — testado como viável, sem precisar de
      Sympla/Eventbrite nem outro app pago:
      - Nova coleção `inscricoes` no Directus (nome, telefone, e-mail, evento vinculado),
        permissão pública apenas de **criar** item — ninguém de fora consegue ler a lista, só a
        diretoria no painel.
      - Formulário na própria página do evento (`/evento/<slug>/`) que salva direto na coleção.
      - **Limite de vagas**: o formulário conta as inscrições já feitas e se fecha sozinho ao
        bater o limite cadastrado no evento.
      - **Confirmação automática por e-mail**: usa o Flow de e-mail nativo do Directus (grátis,
        já usado no Flow de deploy), sem serviço de terceiro.
      - **Exportar lista de presença**: o próprio painel do Directus exporta a coleção em CSV.
      - Não cobre pagamento de inscrição (ex. evento pago) — para isso seria necessário um
        gateway de pagamento de verdade (Stripe/Mercado Pago), que é serviço externo com custo.

### Mais ideias (comunidade, crescimento e operação interna)

- [ ] **Chat/mural de oração em tempo real** — usando o Directus Realtime (WebSocket, já incluso
      no plano gratuito) para um mural onde pedidos aparecem e recebem "orando por você" sem
      precisar de recarregar a página.
- [ ] **Devocional em áudio** — versículo do dia narrado (Text-to-Speech do navegador,
      `SpeechSynthesis`, sem custo nem serviço externo).
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

## Licença

Uso restrito — ver [LICENSE](./LICENSE). O código é público apenas para fins de transparência e
consulta; não é software de código aberto, não permite uso comercial e qualquer reaproveitamento
por terceiros depende de autorização prévia da IEADESPA.
