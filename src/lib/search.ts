import { enderecoCompleto, fetchConfiguracoes, fetchItems } from "@/lib/directus";
import { getAllNoticias, categoryLabel as noticiaCategoryLabel, noticiaHref, visibleNoticias } from "@/lib/noticias";
import { formatDate, getAllMensagens, postHref, visiblePosts } from "@/lib/posts";

export interface SearchItem {
  title: string;
  excerpt: string;
  href: string;
  group: "Mensagem" | "Notícia" | "Órgão" | "Congregação" | "Sede";
  meta: string;
}

interface Orgao {
  slug: string;
  name: string;
  description: string;
  category: string;
}

const ORGAO_CATEGORY_LABEL: Record<string, string> = {
  governanca: "Governança",
  departamentos: "Departamentos",
  secretarias: "Secretarias",
  servicos: "Serviços",
};

interface Congregacao {
  name: string;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
}

let cachedIndex: SearchItem[] | null = null;

/** Índice de busca do site inteiro: mensagens, notícias, órgãos e congregações. */
export async function buildSearchIndex(): Promise<SearchItem[]> {
  if (cachedIndex) return cachedIndex;

  const [posts, noticias, orgaos, congregacoes, config] = await Promise.all([
    visiblePosts(await getAllMensagens()),
    visibleNoticias(await getAllNoticias()),
    fetchItems<Orgao>("ministerios"),
    fetchItems<Congregacao>("congregacoes"),
    fetchConfiguracoes(),
  ]);

  const fromPosts: SearchItem[] = posts.map((post) => ({
    title: post.data.title,
    excerpt: post.data.excerpt,
    href: postHref(post),
    group: "Mensagem",
    meta: `${post.data.category} · ${formatDate(post.data.date)}`,
  }));

  const fromNoticias: SearchItem[] = noticias.map((noticia) => ({
    title: noticia.data.title,
    excerpt: noticia.data.excerpt,
    href: noticiaHref(noticia),
    group: "Notícia",
    meta: `${noticiaCategoryLabel(noticia.data.category)} · ${formatDate(noticia.data.date)}`,
  }));

  const fromOrgaos: SearchItem[] = orgaos.map((orgao) => ({
    title: orgao.name,
    excerpt: orgao.description,
    href: `/orgao/${orgao.slug}/`,
    group: "Órgão",
    meta: ORGAO_CATEGORY_LABEL[orgao.category] ?? orgao.category,
  }));

  const fromCongregacoes: SearchItem[] = congregacoes.map((congregacao) => ({
    title: congregacao.name,
    excerpt: [congregacao.address, congregacao.neighborhood].filter(Boolean).join(" — "),
    href: `/congregacoes/`,
    group: "Congregação",
    meta: [congregacao.neighborhood, congregacao.city].filter(Boolean).join(", "),
  }));

  const sede: SearchItem = {
    title: "Sede",
    excerpt: enderecoCompleto(config),
    href: "/contato/",
    group: "Sede",
    meta: "Endereço e horários de culto",
  };

  cachedIndex = [sede, ...fromPosts, ...fromNoticias, ...fromOrgaos, ...fromCongregacoes];
  return cachedIndex;
}
