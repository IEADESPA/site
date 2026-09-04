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

## Painel administrativo (Decap CMS)

Quem não mexe em código publica notícias e relatórios pelo painel visual em `/admin` (hoje:
`https://salmon-bay-0efd06d0f.3.azurestaticapps.net/admin`), sem precisar do VS Code. Veja os
detalhes de uso na seção
[Regras Operacionais e Convivência do Projeto](#regras-operacionais-e-convivência-do-projeto)
abaixo.

- **Configuração do painel**: [public/admin/config.yml](./public/admin/config.yml)
- **Notícias e Avisos**: cada publicação salva em `src/content/posts/<slug>/index.md`, na mesma
  pasta das mensagens/pregações. Como o painel não pede tema nem pregador, essas notícias recebem
  automaticamente o tema "Notícias e Avisos" e o autor "Secretaria da IEADESPA" — ver os valores
  padrão em [src/content.config.ts](./src/content.config.ts).
- **Prestação de Contas**: cada relatório salva em `src/content/relatorios/<slug>.md` e aparece
  automaticamente em [`/transparencia/`](./src/pages/transparencia.astro).
- **Mídia**: fotos e PDFs enviados pelo painel vão direto para o Azure Blob Storage (contêineres
  `imagens` e `relatorios`), não para o repositório — o GitHub guarda só o link. Ver
  [public/admin/index.html](./public/admin/index.html) e [api/sas](./api/sas) (detalhes em
  [Azure Blob Storage (mídia)](#azure-blob-storage-mídia)).
- **Autenticação**: [api/](./api) — Azure Functions que fazem o login do GitHub sem depender de
  terceiros (detalhes em [Segurança e usuários](#segurança-e-usuários)).

## Pendências antes de publicar

- Trocar a chave Pix de exemplo em [src/pages/doacoes.astro](./src/pages/doacoes.astro)
- Preencher os nomes reais da diretoria em
  [src/pages/transparencia.astro](./src/pages/transparencia.astro) (os relatórios em si já vêm do
  painel administrativo, não precisam mais ser editados manualmente aqui)
- Adicionar fotos reais em `public/galeria/` e listá-las em
  [src/pages/galeria.astro](./src/pages/galeria.astro)
- Revisar os nomes de pregadores de exemplo no conteúdo em `src/content/posts`
- Definir `siteUrl` definitivo e trocar `og-image.png` em `public/`
- Criar o aplicativo OAuth do GitHub e configurar as variáveis de ambiente da autenticação — ver
  [Segurança e usuários](#segurança-e-usuários) abaixo
- Liberar o CORS e o acesso público de leitura nos contêineres do Azure Storage, e configurar as
  variáveis de ambiente do armazenamento — ver
  [Azure Blob Storage (mídia)](#azure-blob-storage-mídia) abaixo

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

1. **Acesso**: entre em `https://[dominio-do-site]/admin` (ex.: `https://ieadespa.org/admin`) e
   faça login com sua conta do GitHub.
2. **Publicar uma notícia ou aviso**: abra a coleção "Notícias e Avisos", clique em "Novo", e
   preencha título, data, foto de capa (opcional) e resumo. No campo de corpo do texto (o editor
   Markdown), use o botão de imagem na barra de ferramentas para inserir fotos no meio do texto,
   intercaladas com os parágrafos — não é necessário escrever código para isso. Ao salvar, o
   painel publica direto no site.
3. **Publicar um relatório/balancete em PDF**: abra a coleção "Prestação de Contas", clique em
   "Novo", preencha título, período/trimestre, data e um resumo opcional, e anexe o arquivo PDF no
   campo de anexo. Ele aparece automaticamente na página `/transparencia/` do site.

### Segurança e usuários

- Cada colaborador (da secretaria, diretoria ou equipe técnica) deve ter **sua própria conta no
  GitHub** e ser adicionado como colaborador do repositório `IEADESPA/site` (em Settings →
  Collaborators, no GitHub). Ninguém deve compartilhar login nem senha de administrador — o
  acesso é individual e pode ser removido a qualquer momento sem afetar os demais.
- **Autenticação do painel (auto-hospedada no Azure)**: o login do `/admin` não depende de nenhum
  serviço de terceiros — é atendido pela nossa própria API em [api/](./api), publicada junto com o
  site pelo mesmo Azure Static Web Apps. `api/auth` inicia o login do GitHub e `api/callback`
  troca o código pelo token e o devolve ao painel. Antes do primeiro uso, é preciso, uma única vez:
  1. Criar um **OAuth App** no GitHub (Settings → Developer settings → OAuth Apps → New OAuth App)
     com **Authorization callback URL** = `https://salmon-bay-0efd06d0f.3.azurestaticapps.net/api/callback`.
  2. Em Azure Static Web Apps → Configuration → Application settings, cadastrar `OAUTH_CLIENT_ID` e
     `OAUTH_CLIENT_SECRET` com o Client ID e o Client Secret gerados nesse OAuth App.
  Sem essas duas variáveis configuradas no Azure, a tela de login do `/admin` não completa a
  autenticação.
- **Se/quando adicionar um domínio próprio** (ex.: `ieadespa.org`) ao Static Web App, o login
  para de funcionar até você atualizar duas coisas para o novo domínio: o `base_url` em
  [public/admin/config.yml](./public/admin/config.yml) e a Authorization callback URL do OAuth
  App no GitHub (item 1 acima). É esperado — avise para ajustarmos os dois juntos quando isso
  acontecer.

### Azure Blob Storage (mídia)

Fotos e PDFs publicados pelo painel não vão para o repositório do GitHub — vão direto para o Azure
Blob Storage, para não pesar o histórico do Git com arquivos binários. O fluxo:

1. O painel pede, para a função [api/sas](./api/sas), uma autorização de upload de curta duração
   (SAS) para um contêiner específico (`imagens` para fotos, `relatorios` para PDFs).
2. O navegador de quem está publicando envia o arquivo direto para o Azure usando essa
   autorização — o arquivo nunca passa pelo GitHub.
3. Só a URL pública do arquivo (ex.: `https://storageigrejaportal.blob.core.windows.net/imagens/…`)
   é salva no Markdown/frontmatter, que aí sim vai para o repositório.

Esta é uma integração escrita sob medida (não existe um conector pronto e testado do Decap CMS
para Azure Blob), então teste com calma após configurar — pode precisar de pequenos ajustes.
**Configuração manual necessária, uma única vez, na conta de armazenamento `storageigrejaportal`:**

1. **CORS** (Portal Azure → conta de armazenamento → Configurações → Compartilhamento de recursos
   — CORS → aba Serviço Blob): origem permitida = o domínio do site (ou `*`), métodos `GET, PUT,
   POST, OPTIONS, HEAD`, cabeçalhos permitidos e expostos = `*`, idade máxima = `3600`. Sem isso o
   navegador bloqueia o envio direto para o Azure.
2. **Acesso público de leitura** nos contêineres `imagens` e `relatorios` (Contêiner → Alterar
   nível de acesso → "Blob (acesso de leitura anônimo somente para blobs)") — sem isso, o upload
   funciona mas as fotos e PDFs não aparecem no site (ficam privados).
3. **Duas variáveis em Azure Static Web Apps → Configuration → Application settings**:
   `AZURE_STORAGE_ACCOUNT_NAME` = `storageigrejaportal`, e `AZURE_STORAGE_ACCOUNT_KEY` = uma das
   chaves de acesso da conta (Portal Azure → conta de armazenamento → Segurança + rede → Chaves de
   acesso). Essa chave é secreta — só vai como Application Setting no Azure, nunca em código ou
   commitada no repositório.

**Limitação conhecida**: `api/sas` não confere quem está pedindo a autorização de upload — qualquer
pessoa que descubra essa URL poderia gerar uma autorização de envio para os dois contêineres
(nunca para ler a chave da conta, só para enviar um arquivo, por até 15 minutos). O risco prático é
baixo (o painel `/admin` em si continua exigindo login do GitHub, e uploads indevidos apareceriam
como blobs estranhos nos contêineres, fáceis de notar e apagar), mas é bom saber que essa porta
existe. Se isso virar um problema, dá para reforçar depois exigindo que `api/sas` confira o token
de login do GitHub antes de emitir a autorização.

### Integração com Azure

Qualquer alteração no repositório — seja um `git push` feito no VS Code, seja uma publicação feita
pelo painel administrativo — aciona automaticamente o workflow do GitHub Actions
(`.github/workflows/azure-static-web-apps-*.yml`), que gera a versão de produção do site e
atualiza o Azure Static Web Apps. O site no ar reflete a alteração em cerca de 1 a 2 minutos, sem
qualquer ação manual adicional.

## Licença

MIT — ver [LICENSE](./LICENSE), que também lista as licenças das fontes, ícones e imagens
originais do tema base.
