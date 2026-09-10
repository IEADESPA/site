/**
 * URL pública do Directus. Não é segredo — as coleções usadas aqui têm
 * leitura liberada para o público (política "Public" no Directus), então o
 * site busca o conteúdo sem precisar de nenhum token.
 */
export const DIRECTUS_URL = "https://ieadespa-directus-gae4hfarf4a4ffcf.brazilsouth-01.azurewebsites.net";

/** Painel administrativo (Directus Studio), onde o conteúdo é editado. */
export const DIRECTUS_ADMIN_URL = `${DIRECTUS_URL}/admin`;

/**
 * Endpoint próprio (Azure Function do próprio site, `/api/verificar-inscricao`
 * — ver `api/src/functions/verificarInscricao.js`) que substituiu o Flow do
 * Directus "Verificar inscrição (código + telefone)". Usado por certificado,
 * crachá, pesquisa de satisfação e o gerador de QR Code, em vez de consultar
 * `inscricoes_eventos` direto (que não tem leitura pública de nome/código/
 * telefone). Mesmo formato de entrada/saída de antes — três modos, todos
 * exigindo `{ evento, modo, ... }` no corpo da requisição:
 * - `modo: "codigo"` — `{ codigo, telefone }`: confirma os dois combinados,
 *   devolve os dados (incluindo o próprio código, útil pro QR Code).
 * - `modo: "nome"` — `{ nome }`: lista candidatos por nome parcial, sem
 *   telefone nem código (nome não é segredo, mas o código nunca aparece
 *   aqui) — usado pra montar uma lista de "foi você?" pra quem esqueceu o
 *   código.
 * - `modo: "id"` — `{ id, telefone }`: depois de escolher um candidato da
 *   lista acima, confirma o telefone pra só então devolver o código —
 *   impede que a busca por nome sozinha revele o código de outra pessoa.
 *
 * Diferente do Flow (sandbox sem `crypto`, incapaz de verificar hash de
 * verdade — ver README, Fase 6), a Function roda em Node.js completo: o
 * telefone é comparado contra um hash real (`scrypt`, ver `api/src/lib/
 * telefone.js`), nunca contra texto puro.
 */
export const VERIFICAR_INSCRICAO_URL = "/api/verificar-inscricao";

/**
 * Mesma Function, endpoint separado (`/api/telefone-hash`) — recebe um
 * telefone em texto (só nesta chamada, nunca fica guardado em lugar nenhum)
 * e devolve o valor já hashado, pronto pra ser salvo no campo `telefone`.
 * Usado no momento de gravar (inscrição pública em `/evento/[slug]/` e edição
 * manual da equipe em `/painel-eventos/`) — quem grava continua sendo quem já
 * gravava antes (o navegador do inscrito ou a equipe autenticada), só que
 * agora envia o valor hashado em vez do telefone puro.
 */
export const TELEFONE_HASH_URL = "/api/telefone-hash";

/**
 * Fase 21 — cancelamento pelo próprio inscrito, sem depender da equipe.
 * Mesma verificação de identidade de `VERIFICAR_INSCRICAO_URL` (código +
 * telefone conferido por hash) — só que, em vez de só consultar, esta
 * apaga a inscrição de verdade e, se a vaga cancelada era confirmada (não
 * uma vaga que já estava na lista de espera), promove sozinha quem está há
 * mais tempo esperando naquele evento (mesma lógica que já existia só pro
 * caminho do admin aumentar o limite de vagas, em `painel-eventos`).
 */
export const CANCELAR_INSCRICAO_URL = "/api/cancelar-inscricao";

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

/**
 * Monta um `srcset` com várias larguras da mesma imagem, pra o navegador
 * baixar só o tamanho que precisa (uma tela de celular não precisa da
 * imagem de 1600px pensada pra desktop) — usado nas capas de evento/
 * mensagem/notícia, que antes serviam uma única largura fixa pra qualquer
 * dispositivo.
 */
export const directusAssetSrcset = (
  fileId: string,
  widths: number[],
  transform?: Omit<ImageTransform, "width">,
) => widths.map((width) => `${directusAssetUrl(fileId, { ...transform, width })} ${width}w`).join(", ");

/** Larguras padrão pras capas de evento/mensagem/notícia — celular, tablet, desktop. */
export const COVER_WIDTHS = [640, 1024, 1600];

/** Dados institucionais e de contato, editáveis em Directus → Configurações do Site. */
export interface Configuracoes {
  tagline: string;
  about: string;
  sobre_corpo: string;
  crencas_corpo: string;
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

/** String de busca pro Google Maps de uma congregação — mesma técnica sem
 * chave de API já usada pra sede em `/contato/` (embed via `?q=&output=embed`). */
export const congregacaoMapsQuery = (c: CongregacaoEndereco) => congregacaoEndereco(c);
