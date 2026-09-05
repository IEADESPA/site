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
   * Ambos os formulários abaixo saem habilitados com uma `action` vazia, o
   * que os torna demonstrações totalmente interativas que não enviam para
   * lugar nenhum: um pequeno script confirma o envio e limpa os campos. Cole
   * o endpoint do seu provedor em `action` para receber envios reais, ou
   * defina `enabled: false` para desativar os controles.
   */
  newsletter: {
    enabled: true,
    action: "",
    method: "post",
    emailFieldName: "email",
    title: "Receba nossos avisos",
    description: "Um e-mail quando houver novidades: eventos, mensagens novas e avisos da igreja.",
  },
  contact: {
    enabled: true,
    action: "",
    method: "post",
    responseTime: "Normalmente respondemos em até dois dias úteis.",
  },
  socials: [
    { label: "Instagram", href: "https://instagram.com/adsetaparauapebas" },
    { label: "YouTube", href: "https://www.youtube.com" },
    { label: "RSS", href: "/rss.xml" },
  ],
};

/** Navegação do cabeçalho. Adicione ou remova itens livremente; o cabeçalho os renderiza em ordem. */
export const navigation = [
  { label: "Início", href: "/" },
  { label: "Sobre", href: "/sobre/" },
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
  { label: "Painel administrativo", href: DIRECTUS_ADMIN_URL },
];
