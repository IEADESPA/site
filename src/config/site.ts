import { DIRECTUS_ADMIN_URL } from "@/lib/directus";

export const siteConfig = {
  /** Nome curto exibido no cabeçalho e rodapé. */
  name: "IEADESPA",
  /** Nome oficial completo, usado em textos institucionais e SEO. */
  fullName: "Igreja Evangélica Assembleia de Deus Ministério do Seta em Parauapebas/PA",
  tagline: "Um lugar de fé, família e esperança",
  title: "IEADESPA — Assembleia de Deus Ministério do Seta em Parauapebas/PA",
  description:
    "Site oficial da IEADESPA, Igreja Evangélica Assembleia de Deus Ministério do Seta, em Parauapebas/PA. Confira horários de culto, ministérios, eventos, mensagens e como chegar.",
  siteUrl: "https://www.ieadespa.org.br",
  authorName: "IEADESPA",
  email: "seta@ieadespa.org",
  language: "pt-BR",
  dateLocale: "pt-BR",
  locale: "pt_BR",
  socialImage: "/og-image.png",
  /**
   * Frase de destaque, resumo, texto completo do "Sobre", endereço e
   * horários de culto NÃO ficam mais aqui — são editáveis em Directus →
   * Configurações do Site (coleção singleton "configuracoes"). Ver
   * src/lib/directus.ts (fetchConfiguracoes).
   */
  /**
   * Envia direto para o Directus (coleção "contato_mensagens" — ver
   * `fetch()` em src/pages/contato.astro). `enabled: false` desativa o
   * controle. Não há newsletter por e-mail: avisos e novidades vão na
   * coleção "noticias" (páginas /noticias/), sem depender de um provedor de
   * envio de e-mail em massa.
   */
  contact: {
    enabled: true,
    responseTime: "Normalmente respondemos em até dois dias úteis.",
  },
  /** Só entram aqui redes que a igreja realmente usa — não deixe link de rede que não existe ainda. */
  socials: [
    { label: "Instagram", href: "https://instagram.com/adseta.parauapebas" },
    { label: "RSS", href: "/rss.xml" },
  ],
};

/** Navegação do cabeçalho. Adicione ou remova itens livremente; o cabeçalho os renderiza em ordem. */
export const navigation = [
  { label: "Início", href: "/" },
  { label: "Sobre", href: "/sobre/" },
  { label: "Nossa História", href: "/historia/" },
  { label: "Notícias", href: "/noticias/" },
  { label: "Órgãos", href: "/orgaos/" },
  { label: "Congregações", href: "/congregacoes/" },
  { label: "Eventos", href: "/eventos/" },
  { label: "Mensagens", href: "/mensagens/" },
  { label: "Contato", href: "/contato/" },
];

/** Navegação secundária exibida no rodapé. */
export const footerNavigation = [
  { label: "Doações", href: "/doacoes/" },
  { label: "Galeria", href: "/galeria/" },
  { label: "Transparência", href: "/transparencia/" },
  { label: "Pregadores", href: "/pregadores/" },
  { label: "Privacidade", href: "/privacidade/" },
  { label: "Painel de conteúdo", href: DIRECTUS_ADMIN_URL },
];
