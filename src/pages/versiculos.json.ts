import versiculos from "@/data/versiculos.json";

/**
 * Bíblia completa (Bíblia Livre / BLIVRE, licença CC-BY 3.0 Brasil), usada
 * pelo "Versículo do dia" na página inicial. Vive no código (não no
 * Directus) porque nunca precisa de edição — é um texto fixo. Servido como
 * arquivo à parte (não embutido no HTML) e buscado pelo navegador só na
 * home, com cache de um dia — cada visitante baixa isso no máximo uma vez
 * por dia.
 */
export function GET() {
  return new Response(JSON.stringify(versiculos), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
