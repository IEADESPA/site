const crypto = require("crypto");

/**
 * Únicos contêineres para os quais esta função emite autorização de upload.
 * "imagens" recebe fotos (notícias), "relatorios" recebe PDFs (prestação de
 * contas) — ver public/admin/config.yml e public/admin/index.html.
 */
const ALLOWED_CONTAINERS = new Set(["imagens", "relatorios"]);

/**
 * Versão da API REST do Azure Storage usada para assinar o SAS. Não precisa
 * ser a mais recente — só precisa existir; ver
 * https://learn.microsoft.com/rest/api/storageservices/create-service-sas
 */
const SAS_VERSION = "2021-08-06";

/** Evita nomes de arquivo com espaços, acentos ou caracteres que quebrem a URL. */
function safeFileName(name) {
  const cleaned = String(name || "arquivo")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w.-]+/g, "-");
  return `${Date.now()}-${cleaned}`;
}

/**
 * Gera uma SAS (Shared Access Signature) de blob assinando manualmente com
 * HMAC-SHA256, sem depender do SDK "@azure/storage-blob" — só o módulo
 * "crypto", nativo do Node. Formato do string-to-sign documentado em
 * https://learn.microsoft.com/rest/api/storageservices/create-service-sas
 */
function buildBlobSasQuery({ accountName, accountKey, container, blobName, permissions, expiresOn }) {
  const signedExpiry = expiresOn.toISOString().replace(/\.\d{3}Z$/, "Z");
  const canonicalizedResource = `/blob/${accountName}/${container}/${blobName}`;
  const signedResource = "b";
  const signedProtocol = "https";

  const stringToSign = [
    permissions, // signedPermissions
    "", // signedStart (vazio: SAS vale a partir de agora)
    signedExpiry, // signedExpiry
    canonicalizedResource, // canonicalizedResource
    "", // signedIdentifier
    "", // signedIP
    signedProtocol, // signedProtocol
    SAS_VERSION, // signedVersion
    signedResource, // signedResource
    "", // signedSnapshotTime
    "", // signedEncryptionScope
    "", // rscc
    "", // rscd
    "", // rsce
    "", // rscl
    "", // rsct
  ].join("\n");

  const key = Buffer.from(accountKey, "base64");
  const signature = crypto.createHmac("sha256", key).update(stringToSign, "utf8").digest("base64");

  const params = new URLSearchParams({
    sv: SAS_VERSION,
    se: signedExpiry,
    sr: signedResource,
    sp: permissions,
    spr: signedProtocol,
    sig: signature,
  });

  return params.toString();
}

module.exports = async function (context, req) {
  const container = req.query.container;
  const filename = req.query.filename;

  if (!container || !ALLOWED_CONTAINERS.has(container)) {
    context.res = { status: 400, body: "Container inválido. Use 'imagens' ou 'relatorios'." };
    return;
  }

  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

  if (!accountName || !accountKey) {
    context.res = {
      status: 500,
      body: "Armazenamento não configurado: faltam AZURE_STORAGE_ACCOUNT_NAME/AZURE_STORAGE_ACCOUNT_KEY.",
    };
    return;
  }

  try {
    const blobName = safeFileName(filename);
    // Validade curta: a autorização só precisa durar o tempo do envio, feito
    // logo em seguida pelo navegador de quem está publicando.
    const expiresOn = new Date(Date.now() + 15 * 60 * 1000);
    const permissions = "cw"; // create + write

    const sas = buildBlobSasQuery({ accountName, accountKey, container, blobName, permissions, expiresOn });

    const uploadUrl = `https://${accountName}.blob.core.windows.net/${container}/${blobName}?${sas}`;
    const publicUrl = `https://${accountName}.blob.core.windows.net/${container}/${blobName}`;

    context.res = {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadUrl, publicUrl }),
    };
  } catch (error) {
    context.res = { status: 500, body: "Falha ao gerar autorização de upload." };
  }
};
