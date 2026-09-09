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
- **Mídia**: fotos e PDFs enviados no Directus vão direto para o Azure Blob Storage (nome da conta
  e do contêiner guardados só em `.env.local`, fora do Git), não para o repositório do GitHub.
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
  **Branch `main` protegido** (ativado em 2026-09-09): ninguém consegue apagar o branch nem
  reescrever o histórico (`force-push`) — mas push direto continua funcionando normalmente, sem
  exigir Pull Request, porque hoje só uma pessoa mexe no código. Se um dia entrar outro
  desenvolvedor no time, vale reforçar pra exigir Pull Request com aprovação antes de qualquer
  mudança entrar no `main` (Settings → Branches → Branch protection rules).
- **Painel do Directus**: para quem publica conteúdo (secretaria, diretoria). Cada pessoa tem seu
  próprio login de e-mail e senha, criado por um administrador do Directus (Configurações →
  Usuários → Criar usuário). Contas podem ser desativadas individualmente a qualquer momento, sem
  afetar as demais.
- **Token de administrador da API**: usado só para configuração inicial das coleções (feita via
  script, não faz parte do dia a dia). Fica salvo no perfil do usuário administrador no Directus —
  pode ser revogado e gerado de novo a qualquer momento em Account Settings → Token.
- **Acesso ao Azure (App Service, PostgreSQL, Storage Account)**: não é feito por login pessoal —
  usa um service principal escopado só aos 3 recursos deste projeto (nunca a assinatura inteira),
  criado via Cloud Shell (`az ad sp create-for-rbac ... --scopes <3 IDs>`). **As credenciais e os
  nomes exatos dos recursos ficam só em `.env.local`** (nunca neste README, que é público) — se
  `.env.local` não tiver essa seção, ela precisa ser recriada seguindo o mesmo processo (documentado
  no histórico desta conversa/commits). Revogar quando não precisar mais: `az ad sp delete --id
  <AZURE_CLIENT_ID>`.

## Azure Blob Storage (mídia)

Fotos e PDFs publicados no Directus não vão para o repositório do GitHub — vão direto para o Azure
Blob Storage, para não pesar o histórico do Git com arquivos binários. Isso é um recurso nativo do
Directus (driver `azure` de armazenamento, configurado como variáveis de ambiente no App Service:
`STORAGE_LOCATIONS`, `STORAGE_AZURE_DRIVER`, `STORAGE_AZURE_CONTAINER_NAME`,
`STORAGE_AZURE_ACCOUNT_NAME`, `STORAGE_AZURE_ACCOUNT_KEY`), sem nenhum código customizado nosso.

**Configuração já feita, uma única vez, na conta de armazenamento** (nome guardado só em
`.env.local`, fora do Git — ver seção "Acesso Azure" abaixo):

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
    **Isto reduz drasticamente o problema, mas não fechava 100% sozinho**: eventos dentro dessa
    janela de 90 dias continuavam listáveis por completo por quem chamasse a API direto — e o
    `codigo` sozinho nunca foi páreo pra isso, porque justamente esse `codigo` também libera
    certificado/crachá/pesquisa de satisfação de qualquer pessoa, sem checar mais nada.
    **Segunda camada de correção**: certificado, crachá e pesquisa de satisfação agora exigem
    **código E telefone combinados**, não só o código — fechando o furo real que o usuário
    identificou ("puxar o certificado de outra pessoa"). Como o telefone nunca esteve entre os
    campos de leitura pública do Directus, não dava pra simplesmente acrescentar o filtro (o próprio
    Directus barra filtrar por um campo que a política não permite ler — testado e confirmado). A
    solução foi um **Flow do Directus** (endpoint `/flows/trigger/<id>`, rodando com
    `accountability: "all"`, acesso interno elevado que ignora a política Public), com 3 modos:
    `codigo` (código+telefone combinados — certificado/crachá/pesquisa/QR Code), `nome` (lista
    candidatos por nome parcial, **sem nunca devolver código** — nome não é segredo, mas o código
    sim) e `id` (depois de escolher um nome da lista, confirma telefone e só então devolve o
    código). O telefone em si nunca sai do Directus, nem pro navegador de quem acertou.
    **Terceira camada, achada auditando o resto do site pelo mesmo critério**: `/qrcode/<slug>/`
    (onde a pessoa gera o próprio QR Code na fila) tinha uma busca por nome que devolvia o código de
    **qualquer inscrito** direto, sem checar absolutamente nada além do nome — pior que o furo
    original, porque nem exigia saber o código de antemão. Corrigido com o mesmo Flow (modo `nome`
    pra listar, modo `id`+telefone pra só então liberar o código).
    **Quarta camada, a pedido do usuário**: o check-in feito pela equipe na portaria
    (`/checkin/<slug>/`) não pedia login nenhum — qualquer um com o link operava o check-in e via o
    roster completo (nome/código/pagamento/presença de todo mundo), o que o usuário apontou
    corretamente como uma falha grave por si só, independente do resto. Agora exige login real do
    Directus (mesma conta usada em `/painel-eventos/`, reaproveitando `exigirAutenticacao`) antes de
    liberar qualquer coisa — inclusive com redirecionamento de volta pra página certa depois de
    entrar (parâmetro `?voltar=`), e um link "Fazer check-in" direto da tela de gestão do evento.
    **Com o check-in autenticado, a permissão pública de leitura/atualização de
    `inscricoes_eventos` foi enxugada ao mínimo possível** (confirmado com teste real, sem token):
    leitura pública agora só devolve `id`/`evento`/`aguardando_vaga`/`presente` (usados só pra
    contadores agregados — "vagas restantes" na inscrição, presença ao vivo no telão —, nunca linha
    por linha com nome/código/telefone); atualização pública só aceita os campos de inscrição push
    (`push_endpoint`/`push_p256dh`/`push_auth`, usados pela própria pessoa logo após se inscrever);
    tentar ler `nome`/`codigo` ou atualizar `presente` sem estar autenticado agora dá 403 — testado
    e confirmado direto no Directus. **Isto fecha o vazamento original por completo**, não só
    reduz — a janela de 90 dias da primeira correção virou uma segunda camada de proteção, não mais
    a única. Tudo testado de ponta a ponta: os 3 modos do Flow contra o Directus real, Playwright
    simulando login/redirecionamento no check-in (sem usar credencial de verdade) e o fluxo completo
    de busca por nome + confirmação de telefone no QR Code, além de testes diretos com curl
    confirmando que os campos sensíveis agora dão 403 pra quem não está autenticado.
  - **Labels quebrados no formulário de pesquisa de satisfação** — cada campo (`pesquisa/[slug].astro`)
    agora recebe um `id` único e o `<label>` correspondente aponta pra ele via `for`; pro campo de
    seleção múltipla (que não é um único controle), o rótulo virou um `<p id>` referenciado via
    `aria-labelledby` no grupo (`role="group"`), sem usar `<label for>` incorretamente. Testado com
    verificação isolada da lógica de template cobrindo os 6 tipos de campo existentes — todos com
    associação correta.

- [x] **Fase 1 — mudança de modelo de dado que o resto depende**: antes só existia campo pra **um**
  líder por órgão (`leader_name`/`leader_role`/`leader_photo`), mais um caso especial fixo só pra
  "diretoria executiva" (coleção `diretoria` separada, hardcoded por slug) sem foto/bio/mandato.
  Órgãos colegiados (assembleia, conselho fiscal) não tinham como listar vários membros.
  **Resolvido com uma coleção nova e genérica, `orgao_membros`** (M2O pra `ministerios`, de 0 a N
  membros por órgão): `name`, `role` (cargo dentro do órgão), `photo` (opcional), `bio` (opcional),
  `since`/`term_end` (texto livre — "desde quando"/"mandato até", sem forçar data exata que
  ninguém sabe de cor), `current` (mantém histórico no banco sem aparecer na página pública — dá
  pra montar uma seção de "diretorias anteriores" em `/transparencia/` no futuro só com uma
  consulta, sem mudar schema) e `sort`. Isto substitui de vez os três campos soltos e a coleção
  `diretoria` — removidos e migrados (as 4 pessoas da diretoria já viraram registros de
  `orgao_membros`, sem perda de dado; os demais órgãos já estavam com o campo de líder vazio, sem
  nada a migrar). `orgao/[slug].astro` decide o layout pela **contagem de membros vinculados**, sem
  precisar de campo novo pra isso: 1 membro → card de responsável (como já existia antes, agora
  também mostrando bio/mandato quando cadastrados); 2+ membros → grade em peso visual igual (sem
  "herói"), correto pra colegiado onde a decisão é do colegiado, não de uma pessoa. O CTA final
  também mudou por categoria: em `governanca`, "Como participar" explica que a composição vem de
  eleição/indicação em assembleia (não é vaga de voluntariado); nas demais categorias, mantém o
  convite de "Quer servir aqui?". Testado com build real e conferência do HTML gerado: a página da
  diretoria mostra os 4 membros migrados corretamente, e uma página de departamento sem membro
  cadastrado ainda mostra o CTA certo sem quebrar.

  **Aprimorado além do que a fase pedia originalmente**, a pedido do usuário: (1) **Tipos de órgão
  agora são geridos direto no Directus**, numa coleção nova `orgao_categorias` (id/label/description/
  sort), em vez de ficarem fixos no código — o campo `category` de `ministerios` virou uma relação
  de verdade pra essa coleção (migração sem perda: os 4 valores que já existiam como texto solto
  viraram as 4 categorias iniciais, sem precisar tocar nos órgãos já cadastrados). Agora dá pra criar
  um tipo novo (ex.: "Secretarias da Igreja") só cadastrando na coleção, sem mudança de código —
  `orgaos.astro`/`orgao/[slug].astro` já leem a lista dinamicamente. Testado de ponta a ponta:
  criei uma categoria e um órgão de teste, confirmei que apareceram corretamente agrupados na
  listagem e na página individual, depois apaguei os dois. (2) **"Há quanto tempo está no cargo"**:
  quando o campo `since` tem um ano reconhecível (ex. "2012"), a página calcula e mostra "(há X
  anos)" automaticamente, com um selo "longa trajetória" quando passa de 10 anos — sem exigir data
  exata, já que ninguém guarda de cor o dia certo. (3) **Histórico de quem já compôs o órgão**: uma
  seção recolhida (`<details>`) lista os membros com `current = false`, sem precisar de nenhuma
  subpágina por ano/mandato — a alternativa de "uma página por ano de mandato" foi avaliada e
  descartada (ver "Ideias rejeitadas"): cresceria sem limite a cada novo mandato, pra um ganho que
  uma seção recolhida na própria página do órgão já entrega. Os três itens testados juntos com dado
  real de teste (categoria nova, órgão de teste, membro atual com 14 anos de mandato e um membro
  histórico) antes de apagar tudo.

- [x] **Fase 2 — reaproveita dado que já existe, zero conteúdo novo necessário da igreja** — os
  9 itens construídos e testados:
  - **Congregações**: mapa embutido (`congregacao/[slug].astro`) em cada página individual, mesma
    técnica sem chave de API já usada em Contato (`congregacaoMapsQuery` novo em `directus.ts`).
  - **Início**: botão "Assista ao vivo" (`siteConfig.youtubeLiveUrl`, já existia no código mas não
    aparecia em lugar nenhum) ao lado dos outros botões do hero; endereço com link "Ver rota" logo
    abaixo dos botões (antes só no rodapé da barra lateral, longe do topo em mobile); "Acesso
    rápido" reduzido de 8 pra 4 itens (Primeira vez aqui, Doações, Galeria, Mural de oração) —
    Notícias/Órgãos/Congregações/Eventos saíram por já terem destaque próprio no menu principal.
  - **Notícias**: filtro por categoria na listagem (mesmo padrão visual do filtro de tipo em
    `/busca/`); "mais notícias" no artigo agora prioriza a mesma categoria antes de completar com
    as mais recentes de qualquer categoria (antes era só cronológico).
  - **Doações**: QR code Pix de verdade — não é só "texto virar imagem", é um payload real no
    padrão BR Code/EMV do Banco Central (`src/lib/pix.ts`, com CRC16 implementado e validado contra
    o vetor de teste público da variante CCITT-FALSE), estático e sem valor fixo (a pessoa digita o
    valor no próprio app do banco). Também ganhou botão "Copiar código Pix" e os avisos de
    segurança em texto (conferir o nome do recebedor exibido, sugerir finalidade na descrição).
  - **Transparência**: CNPJ (centralizado em `siteConfig.cnpj`, reaproveitado também em Doações
    em vez de duplicar o literal) e resumo do último relatório publicado no topo da página.
  - **Busca**: fallback de "0 resultados" com atalhos úteis (mensagens, notícias, eventos,
    contato) em vez de só a mensagem vazia; navegação por teclado (seta pra baixo/cima) idêntica à
    do atalho rápido Ctrl+K, incluindo voltar pro campo de busca ao subir a partir do primeiro
    resultado.
  - **Galeria**: lightbox — clique na foto abre um `<dialog>` nativo com a imagem em resolução
    maior (1600px em vez dos 640px da grade) e a legenda, fecha por botão, clique fora ou Escape
    (comportamento nativo do `<dialog>`).
  - **Mensagens**: `VideoObject` no dado estruturado quando `videoUrl` está cadastrado (nome,
    descrição, `thumbnailUrl`, `uploadDate`, `embedUrl`) — só entra pros itens que já têm vídeo, sem
    reivindicar rich result pra quem não tem.
  - **Sobre**: três links novos — `/orgaos/` (explicando que "Liderança" aqui é só quem já pregou
    mensagens, e que governança/departamentos/secretarias estão em Órgãos), `/visitante/` (próximo
    passo natural) e `/transparencia/` (antes só linkava pra `/historia/`).

  Testado de ponta a ponta: o payload Pix foi verificado matematicamente (CRC16 contra vetor de
  teste conhecido, parsing campo a campo do BR Code, e o próprio QR gerado foi decodificado de
  volta via `jsQR` no navegador, confirmando que bate exatamente com o payload original) e com
  Playwright contra o preview real — filtro de notícias (com 2 notícias de teste criadas e
  apagadas em seguida), lightbox da galeria (com 1 foto de teste), `VideoObject` (com 1 mensagem de
  teste), fallback de busca e navegação por teclado — tudo revertido ao estado original depois.

- [x] **Fase 3 — melhorias de UX que exigem mais decisão de desenho** — os 7 itens construídos e
  testados:
  - **Órgãos**: a listagem (`orgaos.astro`) agora destaca Governança visualmente (borda de
    destaque, selo "Deliberativo/eleito") diferente de Departamentos/Secretarias/Serviços; o CTA
    também muda por categoria — "Ver composição" pra Governança, "Saiba mais" pras demais (a
    diferenciação de texto na página individual já tinha sido feita no refinamento da Fase 1).
  - **Congregações**: ⚠️ **achado real ao investigar** — nenhuma das 41 congregações tem `lat`/`lng`
    cadastrado (só a sede tem), então a listagem hoje mostra só 1 pino no mapa. Unificar a
    tecnologia de mapa de verdade (só Leaflet em tudo) faria a página de cada congregação
    **perder** o mapa que já funciona hoje (o embed do Google usa busca por endereço em texto, não
    precisa de coordenada) — seria regressão, não melhoria, então a unificação completa fica
    registrada como não recomendada por ora (ver "Ideias rejeitadas"). O que foi construído, que é
    o que a fase realmente pede pra esse caso: a listagem agora mostra "Localização em cadastro"
    com o nome de cada congregação sem coordenada, em vez de simplesmente sumir do mapa sem
    explicação.
  - **Galeria**: agrupamento por álbum (campo novo `album` em `galeria`, opcional — sem álbum vai
    pra "Outras fotos"), `srcset` responsivo (4 larguras — mobile não baixa a imagem pensada pra
    desktop) e paginação por álbum ("Ver mais fotos deste álbum", 12 por vez).
  - **Mural de oração**: honeypot (campo escondido por CSS que só bot preenche — se vier
    preenchido, finge sucesso sem gravar nada) contra spam; caminho "confidencial" (campo `confidencial`
    novo, filtrado na própria permissão de leitura pública do Directus — testado que nunca aparece
    no mural mesmo aprovado); prazo de moderação ("em até 2 dias úteis") no aviso pós-envio.
  - **Visitante**: horário da semana + endereço logo depois do cabeçalho (antes só apareciam nos
    "Próximos passos", no fim da página); FAQ ampliado com 3 perguntas específicas de quem nunca
    foi a um culto pentecostal (manifestações na adoração, chamada ao altar, levantar as mãos) —
    conteúdo real adicionado à coleção `visitantes`, não texto de rascunho.
  - **Sobre**: o texto de `sobre_corpo` já usava títulos `##` ("Quem somos", "Nossa missão", "Nossa
    visão", "O que cremos") — sem precisar de campo novo nem reescrever nada, a página agora quebra
    esse texto nesses títulos como seções visuais distintas, cada uma com destaque de borda, em vez
    de um bloco de texto corrido.
  - **Mensagens**: filtro por tema e por pregador combinados na mesma tela (`/mensagens/`) —
    enquanto nenhum filtro está ativo, mantém a paginação normal; ao filtrar, troca pra uma lista
    client-side com o arquivo inteiro (não só a página atual de 10). Conceito de "série de
    mensagens" implementado com 2 campos novos (`serie`, `serie_ordem`) — em vez de inventar
    mensagem nova, encontrei 3 mensagens reais já publicadas que formam uma sequência lógica
    (mesma categoria "Fé e Doutrina", em ordem cronológica) e marquei como a série "Fundamentos da
    Fé"; a página de cada mensagem agora mostra "parte X de 3" com links pras outras partes.

  **Sobre "inventar conteúdo" quando falta (pedido explícito do usuário nesta fase)**: usado com
  critério — em vez de inventar dado novo do zero, priorizei reaproveitar/reorganizar conteúdo real
  já existente sempre que possível (a série de mensagens usa mensagens reais; as seções do Sobre
  usam o texto real já escrito). A única frente onde inventar teria sentido — coordenadas de mapa
  pras 41 congregações sem `lat`/`lng` — foi **deliberadamente evitada**: coordenada falsa poderia
  mandar alguém de verdade pro endereço errado, um risco real que não existe em inventar uma foto
  ou vídeo de demonstração. Preferi o estado "localização em cadastro" (honesto) à coordenada
  inventada (arriscada).

  Testado de ponta a ponta com Playwright contra o preview real: agrupamento e paginação da galeria
  (com fotos de teste criadas e apagadas em seguida), honeypot do mural (confirmado que não chama a
  rede), checkbox confidencial (payload conferido, e testado direto no Directus que um pedido
  confidencial nunca aparece na leitura pública mesmo aprovado), e o filtro combinado de mensagens
  (tema sozinho, com resumo e feed corretos — o filtro de pregador só não é exibido hoje porque só
  existe 1 pregador cadastrado, comportamento correto do próprio código).

- [x] **Fase 4 — depende de conteúdo/decisão que só a igreja pode gerar.** Dividida em duas
  categorias, tratadas de forma diferente de propósito:

  **Construído agora, com dado 100% real** (nada inventado): a "prova social" em `/sobre/` —
  faixa de estatísticas logo abaixo do cabeçalho (anos de história, calculado do marco mais antigo
  de `/historia/`; número de congregações; número de ministérios/departamentos fora da governança)
  — todos os três números vêm direto do que já está cadastrado no Directus, sem nenhum valor fixo
  no código. Também preenchidas as 2 descrições de ministério que ainda diziam "A definir"
  (Departamento de Senhoras e Departamento de Homens), com texto genérico real no mesmo padrão dos
  outros 11 ministérios já descritos — não é fato específico inventado, é a mesma descrição de
  função que qualquer departamento equivalente teria. A declaração de fé ("O que cremos") já existia
  de verdade em `sobre_corpo` desde antes desta fase — conferido, não precisou de nada novo.

  **Deliberadamente NÃO fabricado**, ao contrário da permissão de inventar conteúdo dada na Fase 3
  — porque aqui a natureza do dado é diferente: não é texto genérico de preenchimento, é uma
  afirmação de fato específica atribuída a uma pessoa real e identificável, ou uma imagem/vídeo que
  pretende retratar esta igreja especificamente. Publicar isso fabricado seria diferente de um
  texto placeholder — seria uma mentira sobre uma pessoa ou sobre a própria igreja, no ar. Este é o
  mesmo critério já usado para não inventar coordenada de GPS na Fase 3. Ficam para quando a igreja
  fornecer o dado real: fotos reais de culto/comunidade (hero da home, Sobre, Congregações,
  Ministérios); os nomes reais de vice-presidente/secretário(a)/tesoureiro(a) da diretoria (hoje
  "A definir" em `orgao_membros` — mesma pendência já listada no topo deste README); bios dos
  membros de cada órgão; vídeo de boas-vindas; depoimento de membro.

  Em vez de inventar, esses pontos ganharam um aviso honesto de "a ser inserido" — visualmente
  diferente de conteúdo real (itálico, opacidade reduzida, borda tracejada no caso das seções da
  home/Sobre), pra não passar a impressão de que já é definitivo nem de que é fato inventado:
  "Biografia a ser adicionada." em cada card de `/orgao/[slug]/` sem bio cadastrada, e duas caixas
  em `/sobre/` ("Vídeo a ser inserido aqui." e "Depoimento a ser inserido aqui.").

- [x] **Fase 5 — páginas inteiramente novas.** Revisada com o usuário item por item; decisões:

  **Construídas**: `/crencas/` — obrigatória segundo o usuário, não podia ser só uma cópia do
  resumo que já existia em "O que cremos" (`/sobre/`) — é a mesma declaração de fé, mas expandida
  com um parágrafo por ponto (Escrituras, Trindade, Cristo, salvação, batismo nas águas, batismo
  com o Espírito Santo, missão da igreja, volta de Cristo). Conteúdo real, doutrina pública da
  Convenção das Assembleias de Deus — não é fato inventado sobre esta igreja especificamente, é
  a mesma categoria de conteúdo doutrinário que já existia. `/sobre/` agora só resume e linka pra
  declaração completa, sem duplicar o texto. `/kids/` — ministério infantil, com a programação real
  da sede e um aviso explícito de que faixa etária, check-in/check-out e política de segurança
  ainda não estão confirmados (não dá pra fabricar isso — ver Fase 4 sobre o mesmo critério).
  `/ao-vivo/` (Assista Online) — embed oficial do YouTube (`embed/live_stream?channel=`, mostra a
  transmissão em andamento ou a tela de espera do próprio YouTube), com a programação da sede e um
  aviso de que nem toda reunião listada é necessariamente transmitida. Também corrigido, de
  passagem: `/mensagens/` já tem suporte a vídeo por mensagem (`videoUrl`, desde a Fase 2) — quando
  a primeira mensagem tiver vídeo cadastrado, ela deve aparecer em destaque nesta página (hoje
  nenhuma tem, então o espaço mostra um aviso honesto em vez de fabricar uma lista).

  **Avaliada e considerada já resolvida**: página de "Ministérios" — o usuário achou a ideia boa,
  mas o que ela pediria (nome, descrição, foto, liderança de cada ministério/departamento) é
  exatamente o que `/orgaos/` já entrega desde a Fase 1, incluindo os que não são governança. Uma
  página nova seria duplicar `/orgaos/` sob outro nome. De quebra, corrigido um link morto real que
  já existia no índice de busca (`src/lib/search.ts` apontava pra `/ministerios/`, uma URL que
  nunca existiu desde que a página virou `/orgaos/` na Fase 1 — agora aponta pro lugar certo).

  **Confirmadas como já rejeitadas** (sem mudança): FAQ separada (`/visitante/` já cobre, desde a
  Fase 3); servir/seja voluntário (ver "Ideias rejeitadas").

  **Rejeitadas nesta revisão, com a razão do próprio usuário**: podcast — a intenção já é atendida
  por `/ao-vivo/` apontando pro canal do YouTube da igreja, sem precisar de um formato/feed
  separado; vagas de trabalho — a igreja não deve anunciar vaga pro público do site, contratação
  tem que vir de dentro da própria igreja (confiança), então não faz sentido como funcionalidade
  pública.

  **Avaliada, registrada, mas não construída**: batismo. A dificuldade real, identificada pelo
  próprio usuário: um evento de batismo não tem endereço fixo de congregação como os outros eventos
  (pode ser num rio, numa piscina, num lugar diferente a cada vez), o que já quebra a suposição
  atual do módulo de eventos. A ideia levantada — criar "tipos" de evento customizáveis (congresso
  com inscrição limitada, curso/seminário com fluxo de inscrição próprio, batismo com local
  variável) — é maior que um ajuste pontual e precisa de desenho próprio; **fica registrada para
  avaliação futura, não para construir agora**, por instrução explícita do próprio usuário
  ("tem que ser avaliado esse negócio, talvez nem compense"). Escopo completo formalizado na
  **Fase 21**, mais abaixo.

Depois destas 6 primeiras (0 a 5, todas página-por-página), o usuário pediu uma segunda rodada,
bem mais ampla, cobrindo o que um "site de verdade" precisa além do conteúdo de cada página —
temas transversais que atingem o site inteiro de uma vez. São 5 fases novas, cada uma com achados
concretos, detalhados na seção "Pesquisa detalhada — temas transversais" mais abaixo:

- **Fase 6 — segurança e resiliência técnica.** Status misto — cada item abaixo diz exatamente o
  que foi feito, o que foi investigado e não deu certo, e o que só pode ser feito manualmente
  (esta sessão só tem o token de administrador do Directus, sem acesso ao Azure CLI/Portal).

  **Construído e testado**:
  - `public/staticwebapp.config.json` (vira `dist/staticwebapp.config.json` no build — é onde o
    Azure Static Web Apps espera encontrá-lo) — CSP, `X-Content-Type-Options: nosniff`,
    `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` (câmera liberada só pra própria
    origem, usada no scanner de QR do check-in; geolocalização/microfone/pagamento/USB bloqueados).
    **Testado de verdade** com o emulador oficial (`@azure/static-web-apps-cli`, que aplica esse
    arquivo do mesmo jeito que o Azure faz em produção — o `astro preview` comum ignora esse
    arquivo por completo) servindo o build real, navegado com Playwright em 26 páginas reais do
    site (incluindo mapa Leaflet/OSM, embed do Google Maps, embed do YouTube, os dois scripts de QR
    via CDN, e o mural de oração). **Um bug real foi encontrado e corrigido nesse processo**: o
    mural de oração abre um WebSocket (`wss://`) com o Directus pra atualização em tempo real, e o
    CSP inicial só liberava `https://`, não `wss://` — o navegador bloqueava a conexão. Corrigido
    adicionando o `wss://` do mesmo domínio em `connect-src`. Depois da correção, 0 violações nas 26
    páginas. **Não testado**: check-in e QR de autoatendimento continuam sem nenhum evento aceitando
    inscrição no momento, então essas páginas não têm build estático pra visitar agora — a política
    de câmera/CDN que elas precisam está no arquivo e foi conferida por leitura, mas não por teste
    real de ponta a ponta; vale re-testar quando houver um evento ativo.
  - `.github/dependabot.yml` — audita `npm` (agrupando `astro`/`@astrojs/*` numa PR só, pra não
    gerar uma PR por pacote toda semana) e `github-actions`, semanalmente.

  **Investigado a fundo, e descartado por não ser possível hoje** — criptografia do telefone,
  pedida explicitamente pelo usuário ("vai virar praticamente senha... tem que ser criptografado"):
  a ideia certa seria trocar o telefone armazenado em texto puro por um hash de verdade (como se
  fosse uma senha) — mas isso foi **testado ao vivo contra o próprio Directus da igreja, não só
  suposto**, e travou em três pontos diferentes, todos confirmados por teste real (com uma coleção
  e um flow descartáveis, apagados depois):
  1. O utilitário `/utils/hash/generate` e `/utils/hash/verify`, que existe na documentação do
     Directus, **não existe nesta instalação** (retorna `ROUTE_NOT_FOUND` — confirmado também que
     não aparece na especificação OpenAPI do próprio servidor).
  2. O campo especial `type: hash` existe e funciona pra *gravar* (gera hash Argon2 de verdade,
     confirmado na prática), mas **não dá pra filtrar por ele** — a API recusa `_eq` num campo hash
     ("hash field type does not contain the _eq filter operator"), então não tem como comparar um
     telefone digitado contra o hash guardado usando só filtro.
  3. O sandbox onde os Flows rodam código (`exec`/"Run Script", o mesmo mecanismo usado no endpoint
     de verificação código+telefone já existente) **não tem `crypto`, não tem `fetch`, não tem
     `require`, não tem nem `Buffer`** — confirmado rodando código de teste dentro dele. Não dá pra
     calcular nem verificar hash nenhum ali dentro.

  **Conclusão honesta**: com só o token de administrador da API do Directus (sem acesso pra instalar
  uma extensão customizada no servidor, o que exigiria acesso de deploy/SSH ao App Service que esta
  sessão não tem), não existe um jeito de implementar uma verificação de hash de verdade. Forçar
  uma versão fraca (ex.: hash sem salt calculado na mão, reversível por força bruta já que telefone
  tem só ~8 dígitos) daria falsa sensação de segurança, então **não foi construído** — o dado
  continua em texto puro. **O que já protege esse dado hoje, e continua valendo**: o papel Público
  nunca lê o campo `telefone` (só o Flow com acesso interno elevado lê, pra comparar), e o telefone é
  apagado automaticamente quando o evento é encerrado (`painel-eventos`, função já existente). A
  correção de verdade — extensão customizada no Directus com hash real, ou trocar pra um provedor
  que exponha esses utilitários — fica registrada como pendência técnica, não como algo recusado por
  design.

  **Atualização — acesso ao Azure foi concedido nesta mesma conversa** (um service principal
  temporário, escopado só a 3 recursos: o App Service do Directus, o PostgreSQL Flexible Server e a
  Storage Account do Directus — nomes e IDs exatos guardados só em `.env.local`, fora do Git, nunca
  neste README público — criado pelo próprio usuário e revogável a qualquer momento). Com isso, o
  que antes só dava pra documentar como pendência virou trabalho concluído e testado de verdade:

  - **Retenção de backup do PostgreSQL**: aumentada de 7 para **35 dias**, confirmado via API
    (`backupRetentionDays: 35`, servidor `Ready`).
  - **Teste real de restauração, feito de ponta a ponta**: restaurado um servidor novo e separado
    (nome descartável, apagado ao final — a partir de um ponto no tempo recente), conectado nele com
    um usuário `pg` temporário instalado só pra esse teste, e **conferido dado real** — as 54
    tabelas esperadas presentes, `congregacoes` com 41 linhas, `historia` com 21, `orgao_membros`
    com 4, `mensagens` com 15 (a primeira sendo "A graça que nos salva" — bate com o que já se sabia
    de fases anteriores). Backup confirmado funcional na prática, não só configurado. Servidor de
    teste apagado logo em seguida (existiu por ~17 minutos, custo estimado abaixo de R$ 0,30,
    aprovado previamente pelo usuário).
  - **Blob Storage**: soft delete de blob e de container **já estavam ativados** (7 dias, decisão de
    quem provisionou a infraestrutura originalmente) — só faltava o **versionamento**, ativado agora
    e confirmado (`isVersioningEnabled: true`).
  - **Rate limiter do Directus — configurado corretamente, mas confirmado ineficaz na prática**: o
    usuário aplicou as variáveis de ambiente certas (`RATE_LIMITER_ENABLED=true`,
    `RATE_LIMITER_STORE=memory`, `RATE_LIMITER_POINTS=25`, `RATE_LIMITER_DURATION=1`) — confirmado
    que aplicaram, via `GET /server/info` mostrando `rateLimit: {points: 25, duration: 1}` (antes
    era `false`). Mas **testado com até 60 tentativas de login simultâneas contra o servidor real, e
    nenhuma foi bloqueada** — 100% `401`, nenhum `429`. Isso não é erro de configuração: é um
    **bug conhecido e não corrigido do próprio Directus**
    ([issue #23067](https://github.com/directus/directus/issues/23067), fechada pela equipe do
    Directus como "not planned"). A proteção contra força bruta de login **continua não
    funcionando de verdade**, apesar de configurada — fica ligada à mesma solução da extensão
    customizada (próximo item), que pode implementar bloqueio de tentativas por fora, com código
    nosso.
  - **Força do `SECRET`**: ainda não verificado — verificar isso exigiria ler as variáveis de
    ambiente do App Service, e o classificador de segurança do próprio Claude Code bloqueou
    corretamente essa leitura (evita expor segredo de produção sem necessidade). Quem tem acesso ao
    Portal deve confirmar visualmente que é uma string longa e aleatória.

  **Descoberto durante o processo — como o Directus roda de verdade**: é um container da imagem
  oficial `directus/directus:12.3.1` (Docker Hub), publicado via o recurso mais novo "Site
  Containers" do Azure App Service, sem nenhum volume montado. Avaliado montar um volume de
  arquivos (Azure Files) nele pra instalar uma extensão customizada — **descartado**: o formato do
  campo `data` do volume nessa API ("Site Containers") é novo e mal documentado, e experimentar às
  cegas num container de produção que a igreja inteira depende (mensagens, eventos, tudo) era risco
  demais pra um formato que nem a documentação oficial da Microsoft explica direito.

  **Solução construída, testada de ponta a ponta e no ar: uma Azure Function dentro do próprio
  Static Web App** (o mesmo recurso que já hospeda o site, gratuito, sem infraestrutura nova) —
  caminho bem mais simples e documentado do que mexer no container do Directus:
  - `api/src/lib/telefone.js`: gera e confere hash com `crypto.scrypt` — **nativo do Node.js, zero
    dependência externa**. Chegou a ser testada a biblioteca `argon2` (a mesma que o Directus usa
    por baixo) primeiro, mas ela exige compilação nativa (C++) e **falhou ao instalar localmente**
    por falta de Visual Studio Build Tools — risco real demais de falhar também no build do Azure
    pra apostar nisso. `scrypt` é igualmente robusto (KDF reconhecida, recomendada pelo
    OWASP) e não tem esse risco. Comparação em tempo constante
    (`crypto.timingSafeEqual`), pra não vazar informação por diferença de tempo de resposta.
  - `api/src/functions/verificar-inscricao.js`: substitui o Flow do Directus — mesmo formato de
    entrada/saída (nenhuma página teve que mudar nada além da URL), mas roda em Node.js completo,
    então consegue de fato comparar o telefone contra um hash (o Flow não conseguia — sandbox sem
    `crypto`, ver acima).
  - `api/src/functions/telefone-hash.js`: utilitário que recebe um telefone em texto (só na
    chamada, nunca fica guardado) e devolve o valor já hashado, pronto pra salvar. Usado tanto pela
    inscrição pública (`/evento/[slug]/`) quanto pela edição manual da equipe
    (`/painel-eventos/.../inscritos/`) — os dois pontos que gravam telefone.
  - **Limitador de tentativas de verdade, embutido na própria Function** (`api/src/lib/
    rateLimit.js`) — 20 tentativas por 5 minutos por IP, testado e confirmado bloqueando com
    `429`. É melhor esforço (contador em memória, zera se a instância reiniciar), mas já é
    infinitamente mais eficaz do que o rate limiter do Directus, que está confirmadamente sem
    nenhum efeito (ver item anterior). **Não resolve** o problema do rate limiter do `/auth/login`
    do próprio Directus (login de administrador/equipe) — essa Function só protege os próprios
    endpoints dela, não o que roda dentro do container do Directus.
  - Efeito colateral aceito conscientemente: a busca por telefone em
    `/painel-eventos/.../inscritos/` deixou de funcionar (não dá pra buscar por um valor que virou
    hash) — a interface foi ajustada pra deixar isso claro ("Buscar por nome…", campo de telefone
    mostra "(definido — deixe em branco pra manter)" em vez do valor).
  - **Testado de ponta a ponta com o emulador oficial** (`@azure/static-web-apps-cli`, que roda
    site + Function juntos exatamente como em produção): inscrição real por navegador (Playwright)
    até o Directus, QR Code real gerado com o telefone certo, rejeitado com o telefone errado,
    limite de tentativas confirmado bloqueando. Zero linhas de dado de teste deixadas no Directus.
  - **Confirmado em produção**: as Application Settings do Static Web App (`DIRECTUS_URL`,
    `DIRECTUS_ADMIN_TOKEN`) foram configuradas pelo usuário (fora do escopo do service principal
    desta sessão, que só cobre os 3 recursos do Directus, não o Static Web App). Testado de novo
    direto em `www.ieadespa.org.br` depois da configuração — inscrição real, verificação com
    telefone certo e errado, tudo respondendo certo — e o dado de teste apagado em seguida. O Flow
    antigo do Directus (`Verificar inscricao (codigo + telefone)`) foi **apagado** (não só
    desativado) depois dessa confirmação.

- [x] **Fase 7 — LGPD e privacidade.** Pedida explicitamente pelo usuário pra ir além do mínimo
  legal ("nós devemos ser o exemplo"). Construído:

  - **`/privacidade/` reescrita do zero** (antes era literalmente um rascunho, com o comentário
    "substitua pelo texto definitivo..."). Cobre, com linguagem acessível e citando o artigo da
    LGPD correspondente: quem é o controlador (nome, CNPJ, endereço), quem responde pelo papel de
    encarregado de dados (DPO) e como contatar, uma tabela por coleção que trata dado pessoal
    (mural de oração, contato, inscrição em evento, notificação push) com finalidade/base
    legal/prazo de retenção/quem acessa própria de cada uma — não uma regra única genérica —,
    explicação em linguagem simples de como o hash do telefone funciona e por que ele fica
    guardado para sempre, uma seção específica sobre crianças/adolescentes (Art. 14 — dado de
    menor só com consentimento do responsável, nunca coletado diretamente), os 6 direitos do
    titular (Art. 18) com como exercer cada um, canal de reclamação à ANPD, e o que fica só no
    navegador (`localStorage`) sem nunca chegar ao servidor.
  - **Checkbox de consentimento específico** (Art. 11 — dado sobre convicção religiosa é categoria
    especial) no mural de oração e no formulário de contato quando o assunto é pedido de oração —
    `required`, bloqueia o envio pelo próprio navegador se não marcado, testado confirmando que
    `validity.valid` fica `false` sem a marcação.
  - **Prova de consentimento guardada, não só a intenção na tela**: novo campo
    `consentimento_lgpd` (booleano) em `mural_oracao` e `contato_mensagens`, gravado como `true` no
    momento do envio — importante porque a LGPD (Art. 8º, §2º) coloca o ônus da prova do
    consentimento no controlador, não em quem deu o consentimento.
  - **Canal de exercício de direitos de verdade, não só uma promessa no texto**: novo assunto
    "Meus dados pessoais (LGPD)" no formulário de contato (`/contato/?assunto=lgpd`), com texto
    próprio explicando o que informar pra localizar o registro e o prazo de resposta (15 dias) —
    testado confirmando que o assunto muda o título, o texto de ajuda e o placeholder da mensagem.
  - **Retenção do telefone, decisão explícita do usuário — ver detalhe completo abaixo.**

  **Prazo de retenção — decisão explícita do usuário, não mais uma pendência em aberto**: o
  telefone de inscrição em evento é guardado **para sempre, por design, e isso é intencional** —
  ele é a chave que permite pedir segunda via de certificado/crachá anos depois (o usuário chamou
  isso de "perpetuidade" do documento), e desde a Fase 6 ele é guardado como hash (`scrypt`), nunca
  em texto puro — reter um hash indefinidamente não tem o mesmo risco que reter o dado real, porque
  não dá pra reverter o hash de volta pro telefone mesmo com acesso total ao banco. (Antes da Fase
  6 existia uma rotina que apagava o telefone ao encerrar o evento — **removida**, porque contradizia
  o próprio propósito: sem telefone não tem como verificar código depois, então "encerrar" estava
  quebrando a "segunda via" que deveria garantir.) Já **outros dados do formulário de inscrição**
  (respostas de pergunta livre, por exemplo) não têm essa mesma justificativa de perpetuidade —
  esses continuam candidatos a uma rotina de arquivamento/exclusão periódica, a ser documentada como
  processo manual quando essa fase for priorizada.

- [x] **Fase 8 — acessibilidade (WCAG).** Pedida pelo usuário pra ir além do mínimo ("ser o
  exemplo"). Todos os 5 pontos já identificados foram corrigidos, e a correção foi verificada com
  uma ferramenta de verdade (`axe-core`, o motor de regras usado por auditorias profissionais de
  acessibilidade), não só por leitura de código:

  - **Idioma nos PDFs gerados** (`jsPDF` não faz tagging completo — nenhuma biblioteca gratuita
    faz — mas declarar idioma do documento é suportado e muda a pronúncia do leitor de tela): novo
    helper `src/lib/pdf.ts` (`configurarAcessibilidadePdf`), aplicado nos **6 pontos do site que
    geram PDF** — certificado, crachá, PDF de programação de eventos, relatório de encerramento, e
    os dois downloads em lote (crachás/certificados de todos os confirmados) — não só nos 2
    originalmente citados.
  - **QR Code com alternativa textual**: `alt` no QR de check-in (`qrcode-generator` suporta um
    3º parâmetro em `createImgTag` pra isso) explicando que o operador também aceita o código
    digitado manualmente — e, de propósito, também no QR Pix de `/doacoes/`, que tinha o mesmo
    problema sem estar na lista original.
  - **`aria-live` nas 3 atualizações dinâmicas** citadas (vagas restantes, status de cupom,
    contador "orando por você" do mural) — agora consistentes com o resto do site.
  - **Padrão de teclado de verdade nas abas de busca** (`role="tab"` sem teclado é pior que nenhuma
    role): implementado o padrão ARIA completo — seta esquerda/direita move e ativa a aba vizinha,
    Home/End pulam pro primeiro/último, *roving tabindex* (só a aba ativa fica no `Tab` normal da
    página). **Um bug real foi pego testando isso de verdade com Playwright**: o listener de teclado
    tinha sido preso a um `NodeList` (`querySelectorAll`), que não tem `addEventListener` — o erro
    lançado no meio do script travava *todo o resto* dele, o que teria quebrado silenciosamente o
    botão de instalar o PWA, o menu mobile e o tema junto (tudo registrado depois daquela linha no
    mesmo arquivo). Corrigido antes de qualquer deploy.
  - **Calendário mensal**: "hoje" agora também tem `aria-current="date"` e borda tracejada (forma,
    não só cor); dias com evento ganham um ponto sob o número (forma) além da cor; os dois ganham
    texto oculto pra leitor de tela (`(hoje, tem evento)`).

  **Ido além do que foi pedido** — auditoria automatizada com `axe-core` (regras WCAG 2.0/2.1 A e
  AA) rodada contra **28 páginas reais do site** (não só as 5 áreas citadas), que **encontrou 2
  problemas reais que ninguém tinha listado**:
  - O texto placeholder "Biografia a ser adicionada." (criado na própria Fase 4 desta sessão) tinha
    contraste de só 3,08:1 — a opacidade reduzida (`opacity: 0.7`) aplicada sobre um texto já
    "muted" caiu abaixo do 4.5:1 exigido. Corrigido removendo a opacidade (o itálico sozinho já
    diferencia visualmente, sem prejudicar quem precisa de mais contraste).
  - A caixa "Série" de `/mensagem/[slug]/` (Fase 3) tinha texto na cor de destaque (`--accent`)
    sobre o fundo `--muted` da própria caixa, medindo 4,27:1 — abaixo do 4.5:1. Corrigido trocando
    para `--accent-strong` (mesmo ajuste que o filtro de busca do cabeçalho já usava, por motivo
    idêntico, então virou consistente com um padrão que já existia).

  Depois das duas correções, **nova rodada do `axe-core` nas mesmas 28 páginas voltou com 0
  violações.**

- [x] **Fase 9 — performance e Core Web Vitals.** Os 4 pontos identificados, todos construídos e
  **medidos de verdade** (não só aplicados por suposição — não existia nenhum conteúdo real com
  capa cadastrada em produção pra testar, então foi criada uma mensagem e uma imagem de teste reais,
  medido, e apagado tudo depois):

  - **`srcset` com 3 larguras (640/1024/1600px)** nas capas de evento/mensagem/notícia — novo
    helper `directusAssetSrcset` em `src/lib/directus.ts`. **Medido com navegador real em duas
    telas**: no viewport mobile (390px) o navegador baixou a versão de 640px (**42,7 KB**); no
    desktop (1440px), a de 1600px (222 KB) — **redução real de 5,2× no mobile**, não uma estimativa.
  - **`fetchpriority="high"`** nas mesmas 3 capas (já usavam `loading="eager"` certo, só faltava
    esse atributo — confirmado presente no HTML gerado).
  - **`Cache-Control` de longo prazo** em `staticwebapp.config.json` (mesmo arquivo da Fase 6): 1
    ano + `immutable` pra `/_astro/*` (nome de arquivo já tem hash de conteúdo — o Astro garante
    que muda o nome se o conteúdo mudar, então "nunca expira" é seguro de verdade); 1 ano (sem
    `immutable`, porque o nome do arquivo não tem hash) pra `/fonts/*`. **Testado com o emulador
    oficial da Azure** (o mesmo motivo de sempre: `astro preview` não aplica esse arquivo) —
    cabeçalho confirmado presente nos dois casos.
  - **`<link rel="preconnect">` + `dns-prefetch`** pro domínio do Directus em `BaseLayout.astro` —
    confirmado presente no HTML de toda página (é onde toda imagem/dado do site vem).

  **Verificação adicional, além do pedido**: conferido que nenhuma outra imagem do site (logo,
  ícones, imagem de compartilhamento social) passa de ~180KB ou está sem otimização — nenhum outro
  ponto do tamanho dos 4 já corrigidos foi encontrado.

- [x] **Fase 10 — analytics e promoção de conteúdo.** Pedida explicitamente sem depender de nenhum
  serviço pago de terceiro fora do Azure — as 3 partes discutidas com o usuário, todas construídas
  reaproveitando só infraestrutura que a igreja já paga (Directus/Postgres) ou que já é gratuita
  (GitHub Actions), **sem nenhum serviço novo**:

  - **RSS explicado, não só existente**: `/mensagens/` e `/noticias/` ganharam uma frase explicando
    o que é RSS e como usar, com link pro feed — a correção de maior valor/menor esforço já
    identificada, sem mudança técnica nenhuma.
  - **Aviso automático de conteúdo novo, sem e-mail e sem newsletter**: em vez de um serviço de
    RSS-pra-e-mail (dependeria de terceiro — envio de e-mail em massa de graça não existe nem
    dentro do Azure), **estendida a notificação push que já existia só pra eventos** — mesma tabela
    `push_subscriptions`, mesmas chaves VAPID, mesmo Service Worker. Cada preferência (eventos,
    mensagens, notícias) agora é um campo booleano próprio (`avisar_eventos`, `avisar_mensagens`,
    `avisar_noticias`) na mesma inscrição do navegador, com um cuidado que não existia antes:
    cancelar UM tipo de aviso só desliga aquele — a inscrição push de verdade (e o registro no
    banco) só é removida quando os três estiverem desligados, senão cancelar aviso de evento
    apagaria também o aviso de mensagem nova sem a pessoa esperar isso. Botão de assinar em
    `/mensagens/` e `/noticias/`, no mesmo padrão do que já existia em `/eventos/`.
    - Backend: novo script `.github/scripts/send-content-notifications.mjs` +
      `.github/workflows/content-notifications.yml`, disparado pelo **mesmo** `repository_dispatch`
      que já existe (a Flow do Directus dispara em qualquer publicação, não só mensagem/notícia
      nova) — por isso o envio é **idempotente por design**: cada mensagem/notícia tem um campo
      `notificacao_enviada`, só notifica uma vez, e vira `true` logo depois, então rodar de novo
      (ou editar um conteúdo antigo) nunca reenvia. Conteúdo já existente foi marcado como já
      enviado no momento de criar o campo, pra não disparar um aviso retroativo de 20+ itens de
      uma vez.
    - **Testado de verdade em duas partes**, porque o ambiente de teste local não consegue usar a
      Push API de verdade (limitação conhecida do Chromium em contexto efêmero, não do código):
      testado que o botão nunca tenta nada em página interna, e testado o script de envio de
      ponta a ponta contra o Directus real — criada uma mensagem de teste e uma inscrição push
      (com chaves VAPID descartáveis geradas na hora, só pra esse teste, nunca as reais), rodado o
      script de verdade: encontrou a pendência certa, tentou enviar, tratou o endpoint inválido
      como esperado, marcou `notificacao_enviada: true` — e rodando de novo, confirmado **zero**
      reenvio. A entrega de verdade pra um aparelho real reaproveita o mesmo `web-push` já
      comprovado em produção pelo aviso de eventos, não foi reinventada.
    - **Achado real, não relacionado a esta fase, só descoberto por causa desse teste**: o secret
      `DIRECTUS_ADMIN_TOKEN` do GitHub estava **desatualizado** — diferente do token de
      administrador realmente válido hoje. O primeiro disparo automático desta fase falhou com
      `401`, o que expôs o problema: o aviso de eventos (Fase já existente antes desta sessão)
      teria falhado do mesmo jeito na próxima execução agendada, silenciosamente, sem ninguém
      perceber até um evento não avisar ninguém. Corrigido atualizando o secret pro valor correto,
      confirmado com um novo disparo manual (sucesso).
  - **Contador de visitas próprio, sem cookie nenhum**: nova coleção `pageviews` no Directus —
    só caminho da página, domínio de origem (se veio de fora, nunca a URL completa) e data. Sem
    IP, sem identificador de pessoa, sem nada guardado no navegador do visitante. Permissão
    Pública é **só criar** (mesmo padrão de `contato_mensagens`/`mural_oracao`) — ninguém de fora
    consegue ler os dados de ninguém pela API. Um script de ~15 linhas em `BaseLayout.astro` manda
    isso via `navigator.sendBeacon` em toda página pública — **excluindo de propósito** as páginas
    internas (`/painel-eventos/`, `/painel/`, `/checkin/`), que não são "visita" de verdade e
    distorceriam os números. Testado confirmando que a exclusão funciona (nenhuma tentativa de
    envio nessas páginas) e que a gravação chega certa no Directus (testado direto, sem cookie,
    sem CORS liberado pra fora do domínio de produção — mesma proteção que qualquer outra coleção
    já tem). Responde exatamente as 2-3 perguntas reais que valem a pena (de onde vêm as pessoas,
    quais páginas usam) sem herdar a complexidade de um produto de analytics genérico.

  - **Painel visual construído** (usuário pediu pra não deixar só "cru"): um Dashboard no próprio
    Directus Insights (recurso já incluso, sem custo extra — não é preciso nenhuma extensão paga)
    chamado "Visitas do site", com 4 painéis: total de visitas, visitas ao longo do tempo (por
    dia), páginas mais vistas, e de onde as pessoas vêm. Construído direto pela API (o schema exato
    de cada tipo de painel — `metric`, `time-series`, `bar-chart` — foi conferido no código-fonte
    oficial do Directus antes de criar, pra não adivinhar campo errado às cegas, já que não dá pra
    ver a tela do Insights renderizada durante a configuração). Testado rodando manualmente a mesma
    consulta agregada que cada painel executa (contagem total, agrupado por página, agrupado por
    dia) direto contra o Directus — todas retornaram o formato esperado, com dado real (a essa
    altura já havia 4 visitas reais registradas, de gente que visitou o site nas horas depois do
    deploy — não eram de teste). Acesse em Directus → menu **Insights** → "Visitas do site" (mesmo
    login que já usa pra editar conteúdo).

- **De quebra, 2 melhorias reais de SEO/tráfego orgânico encontradas nesta fase, fora do escopo
  original mas do mesmo espírito** ("promoção de conteúdo"):
  - **`FAQPage` (dado estruturado) em `/visitante/`**: as perguntas frequentes que já existiam
    (Fase 3) agora são elegíveis para o Google mostrar a pergunta e a resposta direto no resultado
    de busca, expansível, sem precisar clicar no site — zero conteúdo novo, só o mesmo texto já
    cadastrado, exportado no formato que o Google entende.
  - **Espaço pronto pra verificar o site no Google Search Console** (`siteConfig.
    googleSiteVerification`, vazio por padrão): o Search Console é gratuito e é o que mostra de
    verdade quais buscas trazem gente pro site — só falta a igreja criar a propriedade em
    search.google.com/search-console (não dá pra fazer por código, precisa de uma conta Google) e
    colar o código de verificação nesse campo, sem precisar de nenhum deploy além disso.

O usuário pediu ainda mais uma rodada — comparando referências de sites de igreja no Brasil e no
exterior, pra deixar este "o melhor site de igreja". Mais 5 fases, detalhadas na mesma seção de
pesquisa transversal mais abaixo:

- [x] **Fase 11 — design/UX de referência (Brasil e exterior).** Os 6 pontos, todos construídos e
  testados (build real + `astro check` + Playwright contra `astro preview`, telas clara/escura,
  desktop/mobile):
  - **Hero em duas colunas** (texto + área de imagem) em `index.astro`, a partir de 768px (empilha
    em telas estreitas, onde uma segunda coluna só empurraria o conteúdo pra baixo). Como a foto
    real da igreja ainda depende da Fase 4, a coluna da direita mostra por enquanto um padrão só em
    CSS — degradê duotone nas cores da marca (`--primary` → `--accent-strong`, os dois já trocam
    sozinhos no tema escuro) com raios concêntricos bem sutis (`mix-blend-mode: soft-light`) e uma
    vinheta por cima —, deixado pronto (comentário no código explica o encaixe exato) pra virar
    `<img>` real sem precisar redesenhar nada quando a foto chegar.
  - **Fonte serifada ativada nos títulos**: `--font-display` (usado em `pagehead-title`,
    `hero-title`, título de card, `wordmark`, `prose h2/h3`) trocou de `var(--font-sans)` pra
    `var(--font-serif)` — já era só isso, o token só não tinha sido ligado ainda.
  - **Escala de tipografia formalizada em tokens** (`--text-title-sm` a `--text-title-3xl`,
    `--text-body-sm` a `--text-body-article`, em `global.css`): antes cada componente (card de
    post, card de notícia, título de artigo, hero, pagehead, busca) definia seu próprio `clamp()`
    solto, vários quase idênticos sem nenhuma relação no código; agora todos apontam pro mesmo
    degrau, e um componente novo reaproveita em vez de inventar mais um valor.
  - **Cards de destaque com sombra em vez de borda uniforme**: nova classe `.card-elevated` (token
    `--shadow-card`, halo de borda em vez de sombra no tema escuro, onde sombra escura não aparece
    contra fundo já escuro) aplicada aos cards de "Acesso rápido"/"Próximos passos" e aos cards de
    horário em destaque no hero — os únicos realmente "de call-to-action" da home; cards
    informativos (horário na página de visitante, FAQ) continuam com a borda simples de sempre, de
    propósito, pra sombra não virar só "todo card tem uma sombra agora" sem hierarquia nenhuma.
  - **Transição de página (crossfade)** via `<ClientRouter />` do Astro (`BaseLayout.astro`) — o
    crossfade é o comportamento padrão dele, sem precisar de `transition:animate` em nada; já
    desativa sozinho com `prefers-reduced-motion`.
  - **Rodapé agrupado por seção** (`footerNavigation` em `config/site.ts` virou 3 grupos —
    Participe, Institucional, Equipe — em vez de uma lista única) em `SiteFooter.astro`, com
    espaço pra crescer à medida que a Fase 5 adicionar mais páginas sem virar uma parede de links.
  - **2 problemas reais encontrados e corrigidos por causa do `ClientRouter`, não haviam antes
    dele**: (1) ele troca os atributos do `<html>` pelos "de fábrica" da página nova a cada
    navegação — o que resetava o tema escuro e o modo de leitura fácil pro padrão claro a cada
    clique em um link, e deixava os botões "A+"/tema da página nova sem funcionar (o script de
    tema só rodava uma vez, amarrado aos botões da primeira página); corrigido reestruturando esse
    script em `BaseLayout.astro` pra reaplicar tema/leitura e religar os botões também no evento
    `astro:after-swap`, não só no carregamento inicial. (2) um `setInterval()` de uma página (telão
    da recepção, sincronização do check-in, rotação do versículo na home) não morre sozinho só
    porque a pessoa navegou pra outra página — ficaria rodando escondido pro resto da sessão,
    acumulando um a cada visita à mesma página. Corrigido com um `window.ieadespaSetInterval()`
    global (também em `BaseLayout.astro`) que registra o ID de cada intervalo e limpa todos antes
    de cada troca de página (`astro:before-swap`); os 7 `setInterval()` do site (`index.astro`,
    `checkin/[slug].astro`, `painel/[local].astro`) foram migrados pra ele.

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

- **Fase 15 — comunidade (pequenos grupos)**: pequenos grupos/células teriam modelo de dado simples
  (nome/tema, líder, dia, bairro aproximado — não endereço exato, por privacidade), mas **depende de
  confirmar com a liderança se existe de fato um programa formal de grupos pequenos** (a estrutura
  visível hoje é por congregação/ponto de pregação, não célula doméstica) — sem essa confirmação,
  não construir, pelo mesmo motivo que já levou a não inventar dado na Fase 4 (história). O item
  "servir/seja voluntário" (incluindo a variante mais leve "Quero servir" dentro de `/contato/`,
  proposta numa rodada de pesquisa anterior) foi **definitivamente descartado** — ver justificativa
  do usuário em "Ideias rejeitadas".

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

- **Fase 20 — acervo histórico ampliado**: pedida pelo usuário depois de ver a linha do tempo visual
  construída pra histórico de liderança de órgão (Fase 1) — a mesma ideia, só que pro acervo da
  igreja inteira. **A estrutura técnica já existe**: `/historia/` já é uma timeline visual completa
  (navegação por ano, foto, texto), com 21 marcos cadastrados (2006 a 2026). **O problema não é
  técnico, é de conteúdo**: boa parte desses marcos tem título genérico ("Segunda congregação",
  "Ministério de comunicação e mídia") sem foto nem relato de verdade — os últimos ~20 anos de
  história da igreja não foram documentados/reunidos ainda, e recuperar isso agora depende de
  encontrar pessoas que guardam fotos e lembranças de época, não de escrever código. Mesmo padrão
  já registrado na Fase 4 (conteúdo que só a igreja pode gerar) — **não é pra construir nada agora**,
  é pra registrar a intenção e o que fica pronto assim que o conteúdo chegar:
  - Hoje cada marco só aceita **uma foto**; caberia um campo de galeria (múltiplas fotos por
    marco/era), já que um evento histórico de verdade raramente tem só um registro fotográfico.
  - **Preservação de qualidade já está coberta pela arquitetura atual, vale confirmar isso ao
    usuário em vez de tratar como pendência**: o Directus nunca sobrescreve o arquivo original
    enviado — os parâmetros de largura/qualidade (`directusAssetUrl(..., { width, quality })`)
    geram só uma versão derivada pra exibição no site, o arquivo em alta resolução enviado continua
    guardado integralmente no Blob Storage. O cuidado real fica do lado de quem digitaliza uma foto
    física antiga: escanear na maior resolução possível antes de enviar, já que o site preserva
    fielmente o que for enviado, não consegue "recuperar" qualidade que a digitalização não captou.
  - Sem tráfego pago em hipótese nenhuma — o "achado de pessoas com fotos antigas" citado pelo
    usuário é trabalho humano de pedir/reunir material, fora do escopo de qualquer coisa que o site
    resolva sozinho.

- **Fase 21 — eventos customizáveis por tipo (batismo e além)**: registrada a partir da própria
  análise do usuário na revisão da Fase 5 — **não é pra construir agora, é só escopo e
  planejamento**, esperando uma análise de caso futura que decida se compensa ou não.

  **O problema de origem**: batismo não encaixa no módulo de eventos como ele existe hoje, porque
  todo evento assume implicitamente uma congregação com endereço fixo — um batismo pode acontecer
  num rio, numa piscina, num lugar diferente a cada vez, sem vínculo com nenhuma congregação
  cadastrada. Ao investigar esse caso, apareceram outros que têm a mesma raiz — um evento "genérico"
  não serve igualmente bem pra todo tipo de programação da igreja:
  - **Congresso**: precisaria de inscrições limitadas por vaga (o sistema atual já tem
    `aguardando_vaga`, mas não um limite numérico rígido que fecha inscrição sozinho).
  - **Curso/escola**: precisaria de um fluxo de inscrição com critério de aceite (hoje toda
    inscrição é aceita automaticamente; um curso pode precisar de pré-requisito ou aprovação
    manual antes de confirmar vaga).
  - **Batismo**: precisaria de local variável por edição do evento, em vez de herdar o endereço de
    uma congregação cadastrada.

  **O que a análise de caso futura precisa decidir**: se vale a pena introduzir um campo "tipo de
  evento" com comportamento condicional (endereço obrigatório vs. opcional, vaga limitada vs.
  aberta, aprovação manual vs. automática) — ganho real de flexibilidade — contra o custo de
  complexidade que isso adiciona ao módulo de eventos inteiro (mais estados possíveis, mais lugar
  pra bug, formulário de cadastro de evento fica mais confuso pra quem edita no Directus). A
  alternativa mais simples — tratar o batismo como evento comum e só preencher o campo de local
  como texto livre em vez de vínculo com congregação — também precisa entrar na comparação, porque
  pode resolver o essencial sem nenhuma mudança estrutural.

  **Pedido explícito do usuário para essa análise futura**: comparar como esse módulo de eventos
  (inscrição, fila de espera, cupom de desconto, e principalmente a situação financeira — hoje
  `pago` é só uma marcação manual feita por quem faz o check-in, não existe processamento de
  pagamento online nenhum, nem Pix nem cartão integrado ao fluxo de inscrição) se compara a
  gerenciadores de eventos existentes no mercado, tanto nacionais (ex.: Sympla, Even3) quanto
  estrangeiros (ex.: Eventbrite) — pra informar a decisão com o que já é padrão de mercado, não só
  com o que a igreja pediu até agora.

  **Comparação feita** (pesquisa real em Sympla, Even3 e Eventbrite — fontes ao final), **excluindo
  de propósito todo o lado de processamento de pagamento** por instrução do usuário: comparar isso
  seria injusto e sem utilidade, já que o nosso sistema não processa pagamento nenhum (`pago` é só
  uma marcação manual). A comparação de pagamento continua de fora, reservada pra quando/se esse
  recurso existir.

  **Onde o nosso módulo de eventos já está à frente ou empatado**, sem precisar de nada a mais:
  - Certificado e crachá em PDF gerados automaticamente — recurso que só a Even3 replica entre as
    três, e o nosso fica no próprio domínio da igreja, sem marca de terceiro.
  - Check-in que funciona offline — a Even3 destaca isso como diferencial ("aplicativo de
    credenciamento offline elimina filas"); o nosso PWA instalável cobre o mesmo caso sem precisar
    de app de loja (Fase 13, já testado).
  - Autoinscrição/autocredenciamento pelo próprio participante (Even3 usa "totens"; o nosso QR
    autoatendimento com nome+telefone cobre o mesmo caso, e com uma verificação de identidade mais
    forte que a Even3 documenta — nome sozinho não confirma quem é a pessoa).
  - Pesquisa de satisfação pós-evento, PDF exportável da programação, `.ics` de calendário e imagem
    compartilhável de story — nenhuma das três plataformas pesquisadas tem os quatro juntos como
    recurso citado; são diferenciais nossos, não do mercado.
  - Todo o fluxo é 100% na marca/domínio da igreja — nenhuma das três é assim: as três são
    plataformas de terceiro, com a marca delas aparecendo pro inscrito em algum momento.

  **Gaps reais, por ordem de impacto**:
  1. **Nenhum canal de confirmação além da tela na hora** — o cadastro só pede nome e telefone
     (sem e-mail), e o código de check-in só aparece uma vez na tela ("anote ou tire um print");
     não existe confirmação enviada pra guardar depois. Sympla, Even3 e Eventbrite mandam e-mail de
     confirmação com o ingresso/QR anexado, por padrão, pra toda inscrição — é o item de maior
     impacto porque, sem isso, quem perde o print depende do fluxo de "esqueci o código" (que
     existe e funciona, mas é uma correção, não o padrão esperado).
  2. **Lembrete alcança só quem instalou o site como app e permitiu notificação** — o lembrete de
     evento (Fase construída anteriormente) é só push; sem e-mail cadastrado, não existe um segundo
     canal pra quem não ativou push. Os três concorrentes usam e-mail como canal padrão de
     lembrete, sem exigir instalação de nada.
  3. **Lista de espera não se promove sozinha** — hoje só promove quem está esperando quando um
     administrador aumenta manualmente o limite de vagas (`painel-eventos`); não existe fluxo de "o
     próprio inscrito cancelou" liberando a vaga automaticamente, nem notificação de quem foi
     promovido. Eventbrite documenta especificamente isso como recurso padrão: cancelamento libera
     vaga e notifica automaticamente o próximo da fila.
  4. **Sem cancelamento pelo próprio inscrito** — hoje só a equipe apaga o evento inteiro
     (`painel-eventos`); a pessoa que se inscreveu não tem como desistir da própria vaga. Está
     amarrado ao gap anterior — não dá pra promover a lista de espera automaticamente sem antes ter
     como alguém liberar a própria vaga.
  5. **Certificado não tem verificação pública de autenticidade** — a Even3 tem um link público
     onde qualquer terceiro (ex. um empregador) digita o código do certificado e confirma que é
     autêntico. O nosso código de certificado é só uma chave de acesso privada (código + telefone),
     não um selo verificável por quem não é o próprio inscrito.
  6. **Sem controle de múltiplos portões/dispositivos de check-in** — a Sympla permite configurar
     aparelhos diferentes por portão com controle de fluxo de entrada. Registrado só por
     completude: **provavelmente não vale a pena** no porte de evento desta igreja (um point de
     check-in já cobre o fluxo real hoje) — não recomendado sem um caso concreto que justifique.

  **O que fica decidido vs. o que ainda depende da análise futura**: os gaps 1-4 são relativamente
  simples de descrever (e-mail no cadastro, e-mail como segundo canal de lembrete, cancelamento
  pelo inscrito, promoção automática da lista de espera) e não dependem da decisão de "tipos de
  evento" do início desta fase — poderiam virar itens de uma fase própria de melhoria do módulo de
  eventos, independente do caso do batismo. O gap 5 é menor prioridade. O gap 6 não é recomendado.
  A parte de pagamento segue de fora, como pedido.

  Fontes consultadas: [Check-in Sympla](https://produtores.sympla.com.br/funcionalidades/check-in-para-eventos/),
  [Credenciamento mobile Sympla](https://produtores.sympla.com.br/funcionalidades/credenciamento-mobile/),
  [Credenciamento Even3](https://plataforma.even3.com.br/aplicativo-de-credenciamento/),
  [Certificados Even3](https://plataforma.even3.com.br/certificados-para-eventos/),
  [Eventbrite — Waitlist](https://www.eventbrite.com/features/waitlist/),
  [Eventbrite — Registration](https://www.eventbrite.com/features/registration/).

- **Fase 22 — gestão de camisetas/uniformes**: pedida pelo usuário, hoje resolvida só por planilha
  (Excel) — o objetivo explícito é sair do Excel. **Só escopo e planejamento, não é pra construir
  agora.**

  **Por que não é só "mais um campo no evento"**: uma camiseta/uniforme muitas vezes não pertence a
  um evento só — um ministério pode ter um uniforme único que vale pro ano inteiro, pra toda
  programação daquele ministério (o exemplo dado pelo usuário: um departamento com uma camiseta
  fixa usada em todos os encontros do ano). Ao mesmo tempo, também precisa servir um evento
  específico e pontual — o usuário citou como exemplo uma marcha/caminhada com várias igrejas da
  cidade (tipo "Marcha para Jesus"), que já poderia em tese ser cadastrada no módulo de eventos
  atual (percurso, data, ministérios participantes), mas trava exatamente na parte de camiseta, que
  hoje não existe em lugar nenhum do sistema. **Pergunta em aberto pra decidir na análise futura**:
  isso é um módulo à parte (reutilizável por qualquer evento ou por nenhum) ou um recurso dentro do
  módulo de eventos? O usuário levantou essa dúvida e não decidiu — fica registrada, não resolvida.

  **O que a gestão de camiseta precisaria fazer, descrito pelo próprio usuário**:
  - **Lado de quem compra** (self-service, com login): ver o valor, escolher tamanho e modelo
    (masculino/feminino), saber o próprio lote, e ver automaticamente se a própria camiseta já
    chegou ou não — sem precisar perguntar pra ninguém.
  - **Lado de quem administra**: controlar valor de custo vs. valor de venda (lucro), quem comprou e
    quem não comprou, quem pagou inteiro, quem pagou metade, quem ficou de pagar fiado, quem já
    recebeu a peça e quem ainda não recebeu, o que ainda está pra chegar, e quantas unidades a mais
    pedir de folga/encaixe (tamanhos que sempre faltam).

  **Pesquisa feita agora, por pedido explícito do usuário — existe algo pronto e gratuito que já
  resolve isso?** Não, nada encontrado cobre o conjunto completo. Duas categorias existem, e as
  duas erram o alvo por motivos diferentes:
  - **Sistemas de loja de roupa** (Siscoban, SIGE Lite, Stoqui e similares, com plano grátis) — são
    feitos pra uma loja com estoque físico e cliente de balcão, não pro caso real: um lote único
    fechado uma vez por ano, vendido por encomenda antes de existir estoque. Forçar esse encaixe
    seria usar a ferramenta errada pro problema errado.
  - **Plataformas de "group order" de camiseta** (Custom Ink, CreateMyTee, Fourthwall, e
    similares) — resolvem tamanho + pagamento em grupo, mas são americanas, em inglês, cobradas em
    dólar, e **obrigam a comprar a camiseta física delas** — não servem pra uma igreja brasileira
    que já tem sua própria gráfica/fornecedor. Por baixo, ainda são só um formulário bonito — não
    fazem a gestão de lucro/custo/fiado/lote que o usuário descreveu. **O "formulário Google" que o
    usuário disse explicitamente que não é isso** é, na prática, o teto do que essas ferramentas
    prontas entregam.
  - **Conclusão da pesquisa**: não existe ferramenta pronta e gratuita que cubra o caso completo —
    se a igreja quiser sair do Excel de verdade (com o lado financeiro completo: fiado, lucro,
    lote, chegada), a única forma encontrada é construir algo sob medida. Fica pra uma análise de
    caso futura decidir se compensa o esforço, seguindo o mesmo critério já usado na Fase 21.

  Fontes consultadas: [Siscoban](https://siscoban.com.br/sistema-para-loja-de-roupas/),
  [SIGE Lite](https://www.sigelite.com.br/sistema-de-gestao-para-lojas-de-roupa),
  [Stoqui](https://www.stoqui.com.br/segmento/sistema-para-loja-de-roupas),
  [Custom Ink — Group Order Form](https://www.customink.com/help_center/collecting-sizes-and-payment-with-gof),
  [CreateMyTee — Group Order](https://www.createmytee.com/About/GroupOrder/),
  [Fourthwall — Church Group T-Shirts](https://fourthwall.com/make-your-own/church-group-t-shirts).

- **Fase 23 — opinião pública (enquetes) e destaque de notícias na página inicial**: pedida pelo
  usuário na mesma conversa, junto com a Fase 22 — **também só registro, não construir agora**.
  Enquete/opinião pública provavelmente pertence à aba de Notícias, como um tipo de publicação a
  mais (ao lado do texto normal). Separadamente, o usuário quer poder **fixar/destacar notícias
  importantes na página inicial** — deu como exemplo o próprio anúncio de camiseta/uniforme (Fase
  22) ou um evento especial — hoje a home não tem esse tipo de destaque fixável, só o feed normal.
  As duas ideias precisam de mais conversa antes de virar plano (que tipo de pergunta uma enquete
  aceita, quem pode fixar/desafixar da home, quantos itens fixados ao mesmo tempo) — por isso ficam
  só como intenção registrada, não como escopo fechado igual às Fases 21 e 22.

- **Fase 24 — mapas de verdade com Google Maps Platform (última fase planejada)**: pedida pelo
  usuário, condicionada a ele configurar antes um projeto no Google Cloud com faturamento ativado —
  **só registro, não construir agora**, e com uma correção importante feita antes de registrar
  qualquer escopo.

  **Duas fontes de crédito diferentes, as duas reais, pesquisadas e confirmadas**:
  1. **Cota gratuita padrão, pra qualquer projeto** — o crédito geral de "US$ 200/mês" que existia
     antes **foi aposentado pelo próprio Google em 1º de março de 2025**
     ([fonte oficial](https://developers.google.com/maps/billing-and-pricing/faq)), substituído por
     uma cota gratuita mensal separada por API (10.000 usos/mês na faixa "Essentials", onde ficam
     Maps JavaScript API e Geocoding API) — não junta mais num valor em dólar.
  2. **Crédito adicional específico pra organização sem fins lucrativos verificada** — esse é o que
     o usuário lembrava, e está certo: existe um **crédito de US$ 250/mês em Google Maps Platform,
     só pra quem tem conta verificada no [Google para ONGs](https://www.google.com/nonprofits/)**
     ([fonte oficial](https://support.google.com/nonprofits/answer/3367237)), **a mais** da cota
     gratuita padrão do item 1. Não é automático — precisa: (a) primeiro ter a conta da igreja
     verificada no Google para ONGs (organização religiosa se qualifica), (b) dentro desse painel,
     na seção "Créditos do Google Maps Platform", pedir a ativação — o Google revisa em até 3 dias
     úteis. Com os dois juntos, a folga de uso fica bem confortável pro tamanho deste site.

  **O que fica registrado pra quando o projeto Google Cloud existir**:
  - **Geocoding API pra preencher `lat`/`lng` das 41 congregações** — hoje **nenhuma** tem
    coordenada cadastrada (só a sede) — é a limitação que já tinha feito rejeitar, na Fase 3,
    unificar a tecnologia de mapa do site inteiro. Resolvido isso, essa rejeição pode ser
    revisitada. Uso pontual (41 chamadas, uma vez, mais alguma manutenção esporádica) — nem chega
    perto da cota gratuita.
  - **Mapa interativo de verdade na listagem de congregações**, substituindo o Leaflet/OpenStreetMap
    atual (que existe hoje só porque as coordenadas reais não existiam) — pinos de verdade,
    clique pra detalhes, no estilo visual do site.
  - **Mapa interativo em cada página de congregação individual**, substituindo o embed simples
    atual (iframe de busca por endereço) por um mapa de verdade com pino exato e botão de rota.
  - **Avaliar** (não decidido ainda) uma função de "qual congregação mais perto de mim", usando a
    geolocalização do próprio navegador do visitante (já usada em outras partes do site) contra as
    coordenadas agora reais — só faz sentido depois do item da Geocoding API acima estar pronto.

  **Pré-requisitos que têm que existir antes de eu escrever qualquer código** (nenhum depende de
  mim, todos dependem de uma conta Google do usuário):
  1. Conta da igreja verificada no Google para ONGs (se ainda não tiver) — pré-requisito pro
     crédito de US$ 250/mês do item 2 acima, mesmo que ele não seja usado imediatamente.
  2. Projeto criado no Google Cloud com faturamento (cartão) ativado — sem isso, nenhuma chamada
     funciona, mesmo dentro da cota gratuita.
  3. APIs "Maps JavaScript API" e "Geocoding API" ativadas nesse projeto.
  4. Uma chave de API gerada e **restringida** (por domínio/referenciador HTTP, só
     `ieadespa.org.br`/`www.ieadespa.org.br`, e só às 2 APIs acima) — sem essa restrição, qualquer
     pessoa que copiar a chave do código-fonte da página (ela é pública por natureza, usada no
     navegador do visitante) pode gastar a cota da igreja em outro site.
  5. Um **alerta de orçamento** configurado no Google Cloud Billing (gratuito, e-mail avisando ao
     atingir um valor pequeno, ex.: US$ 1) — rede de segurança caso algum uso inesperado passe da
     cota grátis.

**Fases 0 a 11 já foram construídas e testadas** (ver o `[x]` de cada uma acima). **Das fases 12 a
24, nada foi construído ainda**, com uma exceção: o app instalável da Fase 13 (que já existia
antes mesmo desta pesquisa). O detalhe completo de cada achado (com a
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

- **Unificar toda a tecnologia de mapa em uma só (só Leaflet, ou só Google Maps embed)** —
  avaliado e descartado por ora: nenhuma das 41 congregações tem `lat`/`lng` cadastrado hoje, só a
  sede. Forçar Leaflet (que exige coordenada) em toda página de congregação faria a maioria delas
  **perder** o mapa que já funciona via busca por endereço em texto (a técnica do Google embed) —
  seria regressão, não unificação de verdade. Reconsiderar só quando/se as congregações tiverem
  coordenada cadastrada — nesse momento, Leaflet (mais capaz: multi-pino, zoom, sem geocodificação
  incerta) vira a escolha natural pra tudo, inclusive a sede.
- **Subpágina por ano de mandato pra cada órgão (ex.: "Diretoria 2020", "Diretoria 2021"...)** —
  avaliado e descartado: cresceria uma página nova a cada mandato, sem limite, pro mesmo ganho que
  uma linha do tempo na própria página do órgão já entrega. **Construído**: a seção evoluiu de uma
  lista recolhida (`<details>`) pra uma linha do tempo visual de verdade — membros atuais e
  anteriores juntos, em ordem cronológica, com foto, período (`desde`–`até`) e "há X anos" pra quem
  está há mais tempo — usando o mesmo dado de `orgao_membros`, sem precisar de schema novo nem de
  subpágina nenhuma.
- **"Servir/seja voluntário" (incluindo a variante leve "Quero servir" em `/contato/`)** —
  definitivamente descartado, com justificativa do próprio usuário: não faz sentido pra uma igreja
  tradicional como esta. Faria sentido se a igreja funcionasse como associação/clube de associados
  (que dependem de recrutar gente ativamente) ou se houvesse um projeto social que ultrapassasse os
  limites da própria igreja (que precisaria captar voluntário de fora) — não é o caso aqui: membro
  fala pessoalmente com a liderança, e quem é de fora não teria como servir em área sensível (ex.
  creche) sem processo de confiança prévio, então um formulário público de "quero servir" ficaria
  desconectado da realidade prática.
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
