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

## Pendências antes de publicar

- Trocar a chave Pix de exemplo em [src/pages/doacoes.astro](./src/pages/doacoes.astro)
- Preencher a diretoria e os relatórios em
  [src/pages/transparencia.astro](./src/pages/transparencia.astro)
- Adicionar fotos reais em `public/galeria/` e listá-las em
  [src/pages/galeria.astro](./src/pages/galeria.astro)
- Revisar os nomes de pregadores de exemplo no conteúdo em `src/content/posts`
- Definir `siteUrl` definitivo e trocar `og-image.png` em `public/`

## Licença

MIT — ver [LICENSE](./LICENSE), que também lista as licenças das fontes, ícones e imagens
originais do tema base.
