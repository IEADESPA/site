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

Quem não mexe em código publica notícias e relatórios pelo painel visual em `/admin` (ex.:
`https://ieadespa.org/admin`), sem precisar do VS Code. Veja os detalhes de uso na seção
[Regras Operacionais e Convivência do Projeto](#regras-operacionais-e-convivência-do-projeto)
abaixo.

- **Configuração do painel**: [public/admin/config.yml](./public/admin/config.yml)
- **Notícias e Avisos**: cada publicação salva em `src/content/posts/<slug>/index.md`, na mesma
  pasta das mensagens/pregações. Como o painel não pede tema nem pregador, essas notícias recebem
  automaticamente o tema "Notícias e Avisos" e o autor "Secretaria da IEADESPA" — ver os valores
  padrão em [src/content.config.ts](./src/content.config.ts).
- **Prestação de Contas**: cada relatório salva em `src/content/relatorios/<slug>.md` e aparece
  automaticamente em [`/transparencia/`](./src/pages/transparencia.astro).
- **Mídia**: fotos e PDFs enviados pelo painel vão para `public/uploads/`.
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
     com **Authorization callback URL** = `https://[domínio-do-site]/api/callback`.
  2. Em Azure Static Web Apps → Configuration → Application settings, cadastrar `OAUTH_CLIENT_ID` e
     `OAUTH_CLIENT_SECRET` com o Client ID e o Client Secret gerados nesse OAuth App.
  Sem essas duas variáveis configuradas no Azure, a tela de login do `/admin` não completa a
  autenticação.

### Integração com Azure

Qualquer alteração no repositório — seja um `git push` feito no VS Code, seja uma publicação feita
pelo painel administrativo — aciona automaticamente o workflow do GitHub Actions
(`.github/workflows/azure-static-web-apps-*.yml`), que gera a versão de produção do site e
atualiza o Azure Static Web Apps. O site no ar reflete a alteração em cerca de 1 a 2 minutos, sem
qualquer ação manual adicional.

## Licença

MIT — ver [LICENSE](./LICENSE), que também lista as licenças das fontes, ícones e imagens
originais do tema base.
