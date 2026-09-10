const { app } = require("@azure/functions");
const { conferirHash } = require("../lib/telefone");
const { permitir, ipDoPedido } = require("../lib/rateLimit");

const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN;

/*
 * Fase 22 (camisetas/uniformes) — consulta pública só com telefone, de
 * propósito sem código nenhum (decisão explícita do usuário: "só digita o
 * telefone e pronto"). `camiseta_pedidos` não tem leitura pública (protege
 * telefone e valor_pago), então essa Function faz o mesmo papel de
 * `verificar-inscricao.js`: varre com o token de admin e só devolve o que
 * bate com o hash do telefone informado. Como não há segundo fator (nem
 * código, nem nome), o risco aceito é: quem souber o telefone de outra
 * pessoa vê o pedido dela — mesmo risco que já existe em "esqueci meu
 * código" de eventos, mas aqui sem a camada extra do código.
 */
app.http("consultar-pedidos-camiseta", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "consultar-pedidos-camiseta",
  handler: async (request, context) => {
    const chave = `camiseta:${ipDoPedido(request)}`;
    if (!permitir(chave)) {
      return { status: 429, jsonBody: { erro: "Muitas tentativas. Aguarde alguns minutos." } };
    }

    if (!DIRECTUS_URL || !DIRECTUS_ADMIN_TOKEN) {
      context.error("DIRECTUS_URL/DIRECTUS_ADMIN_TOKEN não configurados nas Application Settings.");
      return { status: 500, jsonBody: { erro: "Configuração ausente." } };
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return { status: 400, jsonBody: { erro: "Corpo inválido." } };
    }

    const { telefone } = body || {};
    if (!telefone) {
      return { status: 400, jsonBody: { erro: "Telefone ausente." } };
    }

    const headers = { Authorization: `Bearer ${DIRECTUS_ADMIN_TOKEN}` };

    const pedidosRes = await fetch(
      `${DIRECTUS_URL}/items/camiseta_pedidos?fields=id,nome,telefone,tamanho,modelo,valor_pago,entregue,lote.nome,lote.valor_venda,lote.chegou&limit=-1`,
      { headers },
    );
    if (!pedidosRes.ok) {
      context.error("Falha ao buscar pedidos no Directus:", pedidosRes.status);
      return { status: 502, jsonBody: { erro: "Falha ao consultar pedidos." } };
    }
    const pedidos = (await pedidosRes.json()).data || [];

    const encontrados = pedidos
      .filter((p) => conferirHash(telefone, p.telefone))
      .map((p) => ({
        nome: p.nome,
        lote: p.lote?.nome ?? null,
        tamanho: p.tamanho,
        modelo: p.modelo,
        valorVenda: p.lote?.valor_venda ?? null,
        valorPago: p.valor_pago,
        loteChegou: Boolean(p.lote?.chegou),
        entregue: Boolean(p.entregue),
      }));

    return { jsonBody: { pedidos: encontrados } };
  },
});
