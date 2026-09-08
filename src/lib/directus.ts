/**
 * URL pública do Directus. Não é segredo — as coleções usadas aqui têm
 * leitura liberada para o público (política "Public" no Directus), então o
 * site busca o conteúdo sem precisar de nenhum token.
 */
export const DIRECTUS_URL = "https://ieadespa-directus-gae4hfarf4a4ffcf.brazilsouth-01.azurewebsites.net";

/** Painel administrativo (Directus Studio), onde o conteúdo é editado. */
export const DIRECTUS_ADMIN_URL = `${DIRECTUS_URL}/admin`;

/**
 * Endpoint do Flow "Verificar inscrição (código + telefone)" — usado por
 * certificado, crachá e pesquisa de satisfação em vez de consultar
 * `inscricoes_eventos` direto. Exige código E telefone combinados (não só o
 * código), pra impedir que alguém gere o certificado/crachá de outra pessoa
 * só por ter visto/adivinhado o código dela — o telefone nunca é legível
 * publicamente via API, o Flow roda com acesso interno elevado só pra
 * conferir a combinação e devolve os dados sem o telefone.
 */
export const VERIFICAR_INSCRICAO_URL = `${DIRECTUS_URL}/flows/trigger/5a43eb73-9011-4676-a69d-13cfd550fe76`;

/**
 * Busca uma URL do Directus com tentativas automáticas em caso de erro
 * transitório (5xx ou falha de rede) — o Directus no plano gratuito
 * ocasionalmente fica "sob pressão" por alguns segundos, e sem isso um
 * único soluço passageiro derruba o build inteiro (já aconteceu de
 * verdade: 503 bem na hora de gerar /transparencia/). Erros 4xx (coleção
 * sem permissão, não existe etc.) não são tentados de novo — são erros
 * reais, não transitórios, e tentar de novo só esconderia o problema.
 */
async function fetchWithRetry(url: string, attempts = 3): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
      if (response.status < 500 || attempt === attempts) return response;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (err) {
      lastError = err;
      if (attempt === attempts) throw err;
    }
    await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
  }
  throw lastError;
}

/**
 * Busca itens de uma coleção pública do Directus. Roda em tempo de build.
 *
 * Sempre sem limite de itens (`limit=-1`) — o Directus, por padrão, corta a
 * resposta em 100 itens, e todo lugar que chama isso aqui espera a coleção
 * inteira, não uma página dela. Sem isso, uma coleção que crescesse além de
 * 100 itens (galeria, eventos, versículos...) passaria a perder conteúdo
 * silenciosamente, sem nenhum erro.
 */
export async function fetchItems<T>(collection: string, query = ""): Promise<T[]> {
  const params = new URLSearchParams(query);
  if (!params.has("limit")) params.set("limit", "-1");
  const url = `${DIRECTUS_URL}/items/${collection}?${params.toString()}`;
  const response = await fetchWithRetry(url);
  if (!response.ok) {
    throw new Error(`Falha ao buscar ${collection} no Directus: ${response.status}`);
  }
  const { data } = (await response.json()) as { data: T[] };
  return data;
}

/** Busca uma coleção "singleton" do Directus (um registro único, sem lista). */
export async function fetchSingleton<T>(collection: string): Promise<T> {
  const response = await fetchWithRetry(`${DIRECTUS_URL}/items/${collection}`);
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
  lat: number | null;
  lng: number | null;
}

export const fetchConfiguracoes = () => fetchSingleton<Configuracoes>("configuracoes");

/** Endereço completo, formatado para exibição. */
export const enderecoCompleto = (c: Configuracoes) =>
  `${c.address_line}, ${c.address_neighborhood}, CEP ${c.address_zip}, ${c.address_city} – ${c.address_state}`;

/** String de busca pro Google Maps, usada como alternativa quando não há `maps_url`. */
export const enderecoMapsQuery = (c: Configuracoes) =>
  `${c.address_line}, ${c.address_neighborhood}, ${c.address_city} - ${c.address_state}, ${c.address_zip}`;

/** Link "Ver rota": usa o link real cadastrado, ou monta uma busca a partir do endereço. */
export const mapsHref = (c: Configuracoes) =>
  c.maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(enderecoMapsQuery(c))}`;

interface CongregacaoEndereco {
  address: string | null;
  neighborhood: string | null;
  address_new: string | null;
  neighborhood_new: string | null;
  city: string | null;
  state: string | null;
}

/** Endereço de uma congregação, formatado para exibição — usa o endereço
 * novo (pós-mudança de CEP) quando cadastrado, senão o antigo. Centralizado
 * aqui porque a mesma lógica já existia repetida em /congregacoes/. */
export const congregacaoEndereco = (c: CongregacaoEndereco) => {
  const line = c.address_new || c.address;
  const neighborhood = c.neighborhood_new || c.neighborhood;
  return [line, neighborhood, c.city && c.state ? `${c.city} – ${c.state}` : null].filter(Boolean).join(", ");
};
