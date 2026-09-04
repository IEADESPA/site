import { defineCollection } from "astro:content";
import { file, glob } from "astro/loaders";
import { z } from "astro/zod";
import { parse } from "yaml";
import { categories } from "@/config/categories";

const posts = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    /**
     * Deve corresponder a um dos itens em src/config/categories.ts. Padrão
     * "Notícias e Avisos" para publicações feitas pelo Decap CMS, que não
     * pede um tema — só quem escreve mensagens/pregações define um tema
     * específico.
     */
    category: z.enum(categories).default("Notícias e Avisos"),
    date: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    /**
     * Padrão para posts publicados pela secretaria via Decap CMS, que não
     * preenche pregador/cargo — apenas mensagens escritas manualmente
     * definem um autor específico.
     */
    author: z
      .object({
        name: z.string(),
        role: z.string(),
      })
      .default({ name: "Secretaria da IEADESPA", role: "Comunicação e Avisos" }),
    /**
     * Caminho público da imagem de capa (ex.: "/uploads/foto.jpg"), publicada
     * pelo Decap CMS na pasta de mídia configurada. Uma string simples, e não
     * o helper `image()` do Astro, porque a imagem não fica junto do arquivo
     * de conteúdo — ela é enviada para public/uploads pelo painel.
     */
    cover: z.string().optional(),
    /** Link opcional para o vídeo da pregação (YouTube, etc.). */
    videoUrl: z.url().optional(),
    /** Exibe a mensagem na lista "Destaques" da barra lateral da home. */
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

/** Relatórios de prestação de contas, publicados pela diretoria via Decap CMS. */
const relatorios = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/relatorios" }),
  schema: z.object({
    title: z.string(),
    period: z.string(),
    date: z.coerce.date(),
    excerpt: z.string().optional(),
    /** Caminho público do PDF anexado (ex.: "/uploads/balancete-t1.pdf"). */
    file: z.string(),
  }),
});

/**
 * Extrai a lista aninhada sob `key` de um arquivo YAML de dados (formato
 * gerado pelo widget "list" do painel administrativo) e garante um `id`
 * único por item, exigido pelo loader `file()` do Astro.
 */
const dataListParser = (key: string) => (text: string) => {
  const parsed = parse(text) as Record<string, unknown[]> | null;
  const items = (parsed?.[key] as Record<string, unknown>[] | undefined) ?? [];
  return items.map((item, index) => ({ id: String(index), ...item }));
};

/** Ministérios e departamentos, editáveis pelo painel administrativo. */
const ministerios = defineCollection({
  loader: file("src/data/ministerios.yml", { parser: dataListParser("ministerios") }),
  schema: z.object({
    name: z.string(),
    description: z.string(),
  }),
});

/** Agenda de cultos e eventos, editável pelo painel administrativo. */
const eventos = defineCollection({
  loader: file("src/data/eventos.yml", { parser: dataListParser("eventos") }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    description: z.string(),
  }),
});

/** Fotos da galeria, editáveis pelo painel administrativo. */
const galeria = defineCollection({
  loader: file("src/data/galeria.yml", { parser: dataListParser("fotos") }),
  schema: z.object({
    src: z.string(),
    alt: z.string(),
    caption: z.string().optional(),
  }),
});

export const collections = { posts, relatorios, ministerios, eventos, galeria };
