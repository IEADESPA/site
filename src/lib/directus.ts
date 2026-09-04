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

/** Monta a URL pública de um arquivo (imagem, PDF) enviado no Directus. */
export const directusAssetUrl = (fileId: string) => `${DIRECTUS_URL}/assets/${fileId}`;
