/**
 * URL pública do Directus. Não é segredo — as coleções usadas aqui têm
 * leitura liberada para o público (política "Public" no Directus), então o
 * site busca o conteúdo sem precisar de nenhum token.
 */
export const DIRECTUS_URL = "https://ieadespa-directus-gae4hfarf4a4ffcf.brazilsouth-01.azurewebsites.net";

/** Painel administrativo (Directus Studio), onde o conteúdo é editado. */
export const DIRECTUS_ADMIN_URL = `${DIRECTUS_URL}/admin`;

/** Busca itens de uma coleção pública do Directus. Roda em tempo de build. */
export async function fetchItems<T>(collection: string, query = ""): Promise<T[]> {
  const url = `${DIRECTUS_URL}/items/${collection}${query ? `?${query}` : ""}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Falha ao buscar ${collection} no Directus: ${response.status}`);
  }
  const { data } = (await response.json()) as { data: T[] };
  return data;
}

/** Busca uma coleção "singleton" do Directus (um registro único, sem lista). */
export async function fetchSingleton<T>(collection: string): Promise<T> {
  const response = await fetch(`${DIRECTUS_URL}/items/${collection}`);
  if (!response.ok) {
    throw new Error(`Falha ao buscar ${collection} no Directus: ${response.status}`);
  }
  const { data } = (await response.json()) as { data: T };
  return data;
}

export interface ImageTransform {
  width?: number;
  height?: number;
  quality?: number;
  fit?: "cover" | "contain" | "inside" | "outside";
  format?: "webp" | "avif" | "jpg" | "png";
}

/**
 * Monta a URL pública de um arquivo (imagem, PDF) enviado no Directus.
 * Passar `transform` faz o Directus redimensionar/comprimir a imagem sob
 * demanda (ex.: uma miniatura de galeria não precisa baixar a foto original
 * de vários MB) — não se aplica a arquivos não-imagem, como PDFs.
 */
export const directusAssetUrl = (fileId: string, transform?: ImageTransform) => {
  const url = `${DIRECTUS_URL}/assets/${fileId}`;
  if (!transform) return url;

  const params = new URLSearchParams();
  if (transform.width) params.set("width", String(transform.width));
  if (transform.height) params.set("height", String(transform.height));
  if (transform.quality) params.set("quality", String(transform.quality));
  if (transform.fit) params.set("fit", transform.fit);
  if (transform.format) params.set("format", transform.format);

  return `${url}?${params.toString()}`;
};

/** Dados institucionais e de contato, editáveis em Directus → Configurações do Site. */
export interface Configuracoes {
  tagline: string;
  about: string;
  sobre_corpo: string;
  address_line: string;
  address_neighborhood: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  maps_url: string;
  phone: string;
  service_times: { day: string; time: string; label: string }[];
}

export const fetchConfiguracoes = () => fetchSingleton<Configuracoes>("configuracoes");

/** Endereço completo, formatado para exibição. */
export const enderecoCompleto = (c: Configuracoes) =>
  `${c.address_line}, ${c.address_neighborhood}, CEP ${c.address_zip}, ${c.address_city} – ${c.address_state}`;

/** String de busca pro Google Maps, usada como alternativa quando não há `maps_url`. */
export const enderecoMapsQuery = (c: Configuracoes) =>
  `${c.address_line}, ${c.address_neighborhood}, ${c.address_city} - ${c.address_state}, ${c.address_zip}`;
