export const siteConfig = {
  /** Nome curto exibido no cabeçalho e rodapé. */
  name: "IEADESPA",
  /** Nome oficial completo, usado em textos institucionais e SEO. */
  fullName: "Igreja Evangélica Assembleia de Deus Ministério do Seta em Parauapebas/PA",
  tagline: "Um lugar de fé, família e esperança",
  title: "IEADESPA — Assembleia de Deus Ministério do Seta em Parauapebas/PA",
  description:
    "Site oficial da IEADESPA, Igreja Evangélica Assembleia de Deus Ministério do Seta, em Parauapebas/PA. Confira horários de culto, ministérios, eventos, mensagens e como chegar.",
  siteUrl: "https://ieadespa.org",
  authorName: "IEADESPA",
  email: "seta@ieadespa.org",
  language: "pt-BR",
  dateLocale: "pt-BR",
  locale: "pt_BR",
  socialImage: "/og-image.png",
  /** Exibido no card "Sobre" da barra lateral da página inicial. */
  about:
    "A IEADESPA é uma igreja evangélica comprometida em pregar o evangelho de Jesus Cristo, fortalecer famílias e servir à comunidade de Parauapebas com amor e verdade.",
  address: {
    line: "PA-275, Quadra 2G, Lote 05, Bairro Cidade Jardim",
    city: "Parauapebas",
    state: "PA",
    zip: "68515-000",
    full: "PA-275, Quadra 2G, Lote 05, Bairro Cidade Jardim, CEP 68515-000, Parauapebas – PA",
    mapsQuery: "PA-275, Quadra 2G, Lote 05, Bairro Cidade Jardim, Parauapebas - PA, 68515-000",
  },
  /** Horários semanais de culto, exibidos na home e na página de contato. */
  serviceTimes: [
    { day: "Domingo", time: "18h", label: "Culto de Celebração" },
    { day: "Quarta-feira", time: "19h30", label: "Culto de Oração e Doutrina" },
    { day: "Sexta-feira", time: "19h30", label: "Culto de Jovens" },
  ],
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
  { label: "Ministérios", href: "/ministerios/" },
  { label: "Eventos", href: "/eventos/" },
  { label: "Mensagens", href: "/mensagens/" },
  { label: "Contato", href: "/contato/" },
];

/** Navegação secundária exibida no rodapé. */
export const footerNavigation = [
  { label: "Congregações", href: "/congregacoes/" },
  { label: "Doações", href: "/doacoes/" },
  { label: "Galeria", href: "/galeria/" },
  { label: "Transparência", href: "/transparencia/" },
  { label: "Pregadores", href: "/pregadores/" },
  { label: "Privacidade", href: "/privacidade/" },
  { label: "Painel administrativo", href: "/admin/" },
];
