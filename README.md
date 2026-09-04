# Site institucional — IEADESPA

Site oficial da **Igreja Evangélica Assembleia de Deus Ministério do Seta em Parauapebas/PA**
(IEADESPA), construído com [Astro](https://astro.build/) e Tailwind CSS 4. Estático, rápido e sem
banco de dados.

## Requisitos

- Node.js `22.12.0` ou mais recente
- npm

## Como rodar

```bash
npm install
npm run dev
```

Gerar a versão de produção e pré-visualizar o resultado:

```bash
npm run build
npm run preview
```

Antes de publicar, revise `siteUrl` em [src/config/site.ts](./src/config/site.ts) — URLs canônicas,
RSS, sitemap, imagens sociais e dados estruturados derivam dele.

## Estrutura do conteúdo

- **Dados da igreja** (nome, endereço, horários de culto, e-mail, redes sociais, textos da home e
  navegação): [src/config/site.ts](./src/config/site.ts)
- **Temas das mensagens**: [src/config/categories.ts](./src/config/categories.ts)
- **Mensagens/pregações**: cada uma é uma pasta em
  [src/content/posts](./src/content/posts) com um `index.md` (ou `.mdx`):

  ```yaml
  ---
  title: "Título da mensagem"
  excerpt: "Resumo de uma frase."
  category: "Fé e Doutrina" # deve existir em src/config/categories.ts
  date: 2026-08-02
  author:
    name: "Nome do pregador"
    role: "Cargo na igreja"
  videoUrl: "https://youtube.com/..." # opcional
  featured: false # true exibe na barra lateral da home
  draft: false
  ---
  ```

- **Ministérios, Eventos e Galeria**: cada um é um arquivo único em
  [src/data](./src/data) (`ministerios.yml`, `eventos.yml`, `galeria.yml`), editável tanto no
  VS Code quanto pelo painel administrativo — os dois editam exatamente o mesmo arquivo.

## Páginas do site

| Rota                 | Conteúdo                                          |
| -------------------- | -------------------------------------------------- |
| `/`                  | Página inicial: horários, mensagens recentes, temas |
| `/sobre/`            | História, missão, visão e liderança                 |
| `/ministerios/`      | Ministérios e departamentos                         |
| `/eventos/`          | Agenda de cultos e eventos                          |
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

## Painel administrativo (Sveltia CMS)

Quem não mexe em código publica notícias e relatórios pelo painel visual em `/admin` (hoje:
`https://www.ieadespa.org.br/admin`), sem precisar do VS Code. Veja os detalhes de uso na seção
[Regras Operacionais e Convivência do Projeto](#regras-operacionais-e-convivência-do-projeto)
abaixo.

O painel usa o [Sveltia CMS](https://github.com/sveltia/sveltia-cms) — um sucessor moderno do
Decap CMS, compatível com o mesmo formato de `config.yml`. A troca aconteceu porque o Decap exigia
um servidor próprio de login (OAuth) rodando como Azure Function, e esse ambiente do Azure se
mostrou instável (erro 500 persistente, resolvido só depois de regenerar o token de implantação do
Static Web App). O Sveltia elimina essa peça inteira: faz login com um Token de Acesso Pessoal do
GitHub, direto no navegador, sem nenhum servidor nosso no meio.

- **Configuração do painel**: [public/admin/config.yml](./public/admin/config.yml)
- **Notícias e Avisos**: cada publicação salva em `src/content/posts/<slug>/index.md`, na mesma
  pasta das mensagens/pregações. Como o painel não pede tema nem pregador, essas notícias recebem
  automaticamente o tema "Notícias e Avisos" e o autor "Secretaria da IEADESPA" — ver os valores
  padrão em [src/content.config.ts](./src/content.config.ts).
- **Prestação de Contas**: cada relatório salva em `src/content/relatorios/<slug>.md` e aparece
  automaticamente em [`/transparencia/`](./src/pages/transparencia.astro).
- **Ministérios, Eventos e Galeria**: coleções de "arquivo único" ([src/data](./src/data)) — dá
  para adicionar, editar e remover itens da lista, mas não criar páginas novas separadas.
- **Mídia**: fotos e PDFs enviados pelo painel vão direto para o Azure Blob Storage (contêiner
  `imagens`), não para o repositório — o GitHub guarda só o link. É um recurso nativo do Sveltia,
  sem nenhum código customizado nosso (detalhes em
  [Azure Blob Storage (mídia)](#azure-blob-storage-mídia)).
- **Autenticação**: nenhuma peça própria — é o login por token do próprio Sveltia CMS (detalhes em
  [Segurança e usuários](#segurança-e-usuários)).

## Pendências antes de publicar

- Trocar a chave Pix de exemplo em [src/pages/doacoes.astro](./src/pages/doacoes.astro)
- Preencher os nomes reais da diretoria em
  [src/pages/transparencia.astro](./src/pages/transparencia.astro) (os relatórios em si já vêm do
  painel administrativo, não precisam mais ser editados manualmente aqui)
- Adicionar fotos reais em `public/galeria/` e listá-las em
  [src/pages/galeria.astro](./src/pages/galeria.astro)
- Revisar os nomes de pregadores de exemplo no conteúdo em `src/content/posts`
- Definir `siteUrl` definitivo e trocar `og-image.png` em `public/`
- Liberar o CORS no contêiner `imagens` do Azure Storage e gerar o token de SAS a ser colado no
  painel na primeira publicação — ver [Azure Blob Storage (mídia)](#azure-blob-storage-mídia)
  abaixo

## Regras Operacionais e Convivência do Projeto

Este projeto tem duas portas de entrada para o mesmo conteúdo: o **VS Code** (para quem mexe em
código e layout) e o **painel administrativo em `/admin`** (para quem publica notícias e
relatórios). As duas escrevem no mesmo repositório GitHub, então seguir esta ordem evita
conflitos.

### Fluxo de quem edita no VS Code

**Regra de ouro: sempre rode `git pull` antes de começar a editar.** A equipe da secretaria e da
diretoria pode ter publicado notícias ou relatórios pelo painel enquanto você estava offline. Sem
esse `git pull`, seu editor local fica desatualizado e a próxima tentativa de envio pode gerar
conflito com o que foi publicado pelo painel.

```bash
git pull            # sempre primeiro, antes de qualquer edição
```

Depois de editar, envie as alterações de volta:

```bash
git add .
git commit -m "descrição do que mudou"
git push
```

### Fluxo da equipe não técnica (dia a dia)

1. **Gerar o token de acesso** (uma única vez por pessoa, refazer só quando expirar):
   1. No GitHub, clique na sua foto (canto superior direito) → **Settings** → role até o fim do
      menu esquerdo → **Developer settings** → **Personal access tokens** → **Tokens (classic)** →
      **Generate new token** → **Generate new token (classic)**.
   2. Em "Note", dê um nome (ex.: "Painel do site"). Em "Expiration", escolha um prazo (ex.:
      90 dias ou 1 ano).
   3. Marque a caixa **`repo`** (é a única necessária — ela já marca todas as caixinhas abaixo
      dela junto). Não marque mais nada.
   4. Clique em **Generate token** no fim da página e **copie o token** — ele só aparece uma vez.
2. **Acesso ao painel**: entre em `https://www.ieadespa.org.br/admin`, clique em **"Sign In with
   Token"** e cole o token gerado acima. Ele fica salvo apenas no navegador de quem fez login.
3. **Publicar uma notícia ou aviso**: abra a coleção "Notícias e Avisos", clique em "Novo", e
   preencha título, data, foto de capa (opcional) e resumo. No campo de corpo do texto (o editor
   Markdown), use o botão de imagem na barra de ferramentas para inserir fotos no meio do texto,
   intercaladas com os parágrafos — não é necessário escrever código para isso. Ao salvar, o
   painel publica direto no site.
4. **Publicar um relatório/balancete em PDF**: abra a coleção "Prestação de Contas", clique em
   "Novo", preencha título, período/trimestre, data e um resumo opcional, e anexe o arquivo PDF no
   campo de anexo. Ele aparece automaticamente na página `/transparencia/` do site.
5. **Editar Ministérios, Eventos ou Galeria**: essas três aparecem no painel como coleções de um
   arquivo só (não dá pra criar "nova página" nelas, só editar a lista existente). Abra a
   coleção, clique em "Adicionar" para incluir um item novo (um ministério, um evento ou uma
   foto) ou no item existente para editar/remover. Cada alteração já aparece direto na página
   correspondente do site.

### Segurança e usuários

- Cada colaborador (da secretaria, diretoria ou equipe técnica) deve ter **sua própria conta no
  GitHub** e ser adicionado como colaborador do repositório `IEADESPA/site` (em Settings →
  Collaborators, no GitHub). Ninguém deve compartilhar login nem senha de administrador — o
  acesso é individual e pode ser removido a qualquer momento sem afetar os demais.
- **Autenticação do painel**: feita pelo próprio Sveltia CMS via Personal Access Token do GitHub —
  não existe nenhum servidor nosso envolvido no login (não tem mais `api/` no projeto). Cada
  colaborador gera seu próprio token (o painel já indica exatamente como, com as permissões
  certas), então continua valendo a regra acima: acesso individual, revogável a qualquer momento
  direto nas configurações do GitHub de cada pessoa (Settings → Developer settings → Tokens), sem
  afetar os demais.
- **Trocar de domínio não quebra mais nada**: como não há mais `base_url`/callback OAuth para
  ajustar, adicionar ou trocar o domínio do site não exige nenhuma mudança no painel.

### Azure Blob Storage (mídia)

Fotos e PDFs publicados pelo painel não vão para o repositório do GitHub — vão direto para o Azure
Blob Storage, para não pesar o histórico do Git com arquivos binários. Isso é um recurso nativo do
Sveltia CMS (`media_libraries.azure_blob_storage` em
[public/admin/config.yml](./public/admin/config.yml)), sem nenhum código customizado nosso — só o
próprio navegador de quem está publicando envia o arquivo direto para o Azure, usando um token de
SAS que fica salvo apenas ali (nunca no repositório).

**Configuração manual necessária, uma única vez, na conta de armazenamento `storageigrejaportal`:**

1. **CORS** (Portal Azure → conta de armazenamento → Configurações → Compartilhamento de recursos
   — CORS → aba Serviço Blob): origem permitida = `https://www.ieadespa.org.br` (ou `*`), métodos
   `GET, HEAD, PUT, OPTIONS`, cabeçalhos permitidos e expostos = `*`, idade máxima = `3600`. Sem
   isso o navegador bloqueia o envio direto para o Azure.
2. **Acesso público de leitura** no contêiner `imagens` (Contêiner → Alterar nível de acesso →
   "Blob (acesso de leitura anônimo somente para blobs)") — sem isso, o upload funciona mas as
   fotos e PDFs não aparecem no site (ficam privados).
3. **Gerar um token de SAS do contêiner** (Portal Azure → conta de armazenamento → Segurança + rede
   → Assinatura de acesso compartilhado, ou direto no contêiner `imagens` → Gerar SAS), com
   permissões de Leitura, Gravação, Criação e Listagem, e uma validade generosa (ex.: 1 ano). Na
   primeira vez que alguém enviar um arquivo pelo painel, ele pede esse token — cole-o ali; fica
   guardado só no navegador de quem publicou. Quando o token expirar, é só gerar um novo e colar de
   novo.

### Integração com Azure

Qualquer alteração no repositório — seja um `git push` feito no VS Code, seja uma publicação feita
pelo painel administrativo — aciona automaticamente o workflow do GitHub Actions
(`.github/workflows/azure-static-web-apps-*.yml`), que gera a versão de produção do site e
atualiza o Azure Static Web Apps. O site no ar reflete a alteração em cerca de 1 a 2 minutos, sem
qualquer ação manual adicional.

## Licença

MIT — ver [LICENSE](./LICENSE), que também lista as licenças das fontes, ícones e imagens
originais do tema base.
