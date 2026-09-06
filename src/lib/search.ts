import { enderecoCompleto, fetchConfiguracoes, fetchItems } from "@/lib/directus";
import { getAllNoticias, categoryLabel as noticiaCategoryLabel, noticiaHref, visibleNoticias } from "@/lib/noticias";
import {
  categoryHref,
  formatDate,
  getAllAuthors,
  getAllMensagens,
  getCategoryList,
  postHref,
  visiblePosts,
} from "@/lib/posts";

export type SearchGroup =
  | "Mensagem"
  | "Notícia"
  | "Órgão"
  | "Congregação"
  | "Sede"
  | "História"
  | "Evento"
  | "Tema"
  | "Pregador"
  | "Página";

export interface SearchItem {
  title: string;
  excerpt: string;
  href: string;
  group: SearchGroup;
  meta: string;
}

/** Ordem de exibição dos filtros na busca (do mais específico ao mais geral). */
export const SEARCH_GROUPS: SearchGroup[] = [
  "Mensagem",
  "Notícia",
  "Evento",
  "Órgão",
  "Congregação",
  "Tema",
  "Pregador",
  "Página",
  "Sede",
  "História",
];

/** Rótulo no plural usado nos filtros da busca. */
export const GROUP_LABEL_PLURAL: Record<SearchGroup, string> = {
  Mensagem: "Mensagens",
  Notícia: "Notícias",
  Evento: "Eventos",
  Órgão: "Órgãos",
  Congregação: "Congregações",
  Tema: "Temas",
  Pregador: "Pregadores",
  Página: "Páginas",
  Sede: "Sede",
  História: "História",
};

/** "à" -> "a", pra "familia" encontrar "família" e vice-versa. */
export const stripDiacritics = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

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
  slug: string;
  name: string;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
}

interface RegistroHistorico {
  title: string;
  period: string | null;
}

interface Evento {
  slug: string;
  title: string;
  event_date: string | null;
  location: string | null;
  description: string;
  body: string | null;
}

/** Páginas institucionais que não vêm de nenhuma coleção do Directus, mas
 * fazem parte da navegação — cobertas aqui pra busca servir de atalho
 * pra qualquer canto do site, não só pra conteúdo. */
const STATIC_PAGES: { title: string; excerpt: string; href: string }[] = [
  { title: "Sobre", excerpt: "História, missão, visão e liderança da igreja.", href: "/sobre/" },
  { title: "Nossa História", excerpt: "A trajetória da igreja ao longo dos anos.", href: "/historia/" },
  { title: "Ministérios", excerpt: "Ministérios e departamentos da igreja.", href: "/ministerios/" },
  { title: "Congregações", excerpt: "Congregações e pontos de pregação vinculados.", href: "/congregacoes/" },
  { title: "Eventos", excerpt: "Programação semanal e eventos especiais.", href: "/eventos/" },
  { title: "Mensagens", excerpt: "Arquivo completo de mensagens.", href: "/mensagens/" },
  { title: "Notícias", excerpt: "Comunicados e novidades da igreja.", href: "/noticias/" },
  { title: "Doações", excerpt: "Dízimos, ofertas e chave Pix da igreja.", href: "/doacoes/" },
  { title: "Galeria", excerpt: "Fotos de cultos e eventos da igreja.", href: "/galeria/" },
  { title: "Transparência", excerpt: "Diretoria e prestação de contas.", href: "/transparencia/" },
  { title: "Primeira vez aqui?", excerpt: "Informações para quem vai visitar pela primeira vez.", href: "/visitante/" },
  { title: "Contato", excerpt: "Formulário, endereço e mapa.", href: "/contato/" },
];

let cachedIndex: SearchItem[] | null = null;

/** Índice de busca do site inteiro: mensagens, notícias, eventos, órgãos,
 * congregações, temas, pregadores, história e páginas institucionais. */
export async function buildSearchIndex(): Promise<SearchItem[]> {
  if (cachedIndex) return cachedIndex;

  const [posts, noticias, orgaos, congregacoes, registrosHistoricos, eventos, config] = await Promise.all([
    visiblePosts(await getAllMensagens()),
    visibleNoticias(await getAllNoticias()),
    fetchItems<Orgao>("ministerios"),
    fetchItems<Congregacao>("congregacoes"),
    fetchItems<RegistroHistorico>("historia"),
    fetchItems<Evento>("eventos"),
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
    href: `/congregacao/${congregacao.slug}/`,
    group: "Congregação",
    meta: [congregacao.neighborhood, congregacao.city].filter(Boolean).join(", "),
  }));

  const fromHistoria: SearchItem[] = registrosHistoricos.map((registro) => ({
    title: registro.title,
    excerpt: "",
    href: "/historia/",
    group: "História",
    meta: registro.period ?? "",
  }));

  const fromEventos: SearchItem[] = eventos.map((evento) => ({
    title: evento.title,
    excerpt: evento.description,
    href: evento.body ? `/evento/${evento.slug}/` : "/eventos/",
    group: "Evento",
    meta: [evento.event_date ? formatDate(new Date(evento.event_date), "long") : null, evento.location]
      .filter(Boolean)
      .join(" · "),
  }));

  const fromTemas: SearchItem[] = getCategoryList(posts).map((category) => ({
    title: category.name,
    excerpt: `Mensagens sobre ${category.name}.`,
    href: categoryHref(category.name),
    group: "Tema",
    meta: `${category.count} ${category.count === 1 ? "mensagem" : "mensagens"}`,
  }));

  const fromPregadores: SearchItem[] = getAllAuthors(posts).map((author) => ({
    title: author.name,
    excerpt: author.role,
    href: `/pregador/${author.slug}/`,
    group: "Pregador",
    meta: `${author.posts.length} ${author.posts.length === 1 ? "mensagem" : "mensagens"}`,
  }));

  const fromPaginas: SearchItem[] = STATIC_PAGES.map((page) => ({
    title: page.title,
    excerpt: page.excerpt,
    href: page.href,
    group: "Página",
    meta: "",
  }));

  const sede: SearchItem = {
    title: "Sede",
    excerpt: enderecoCompleto(config),
    href: "/contato/",
    group: "Sede",
    meta: "Endereço e horários de culto",
  };

  cachedIndex = [
    sede,
    ...fromPosts,
    ...fromNoticias,
    ...fromEventos,
    ...fromOrgaos,
    ...fromCongregacoes,
    ...fromTemas,
    ...fromPregadores,
    ...fromPaginas,
    ...fromHistoria,
  ];
  return cachedIndex;
}
