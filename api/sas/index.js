const {
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  SASProtocol,
} = require("@azure/storage-blob");

/**
 * Únicos contêineres para os quais esta função emite autorização de upload.
 * "imagens" recebe fotos (notícias), "relatorios" recebe PDFs (prestação de
 * contas) — ver public/admin/config.yml e public/admin/index.html.
 */
const ALLOWED_CONTAINERS = new Set(["imagens", "relatorios"]);

/** Evita nomes de arquivo com espaços, acentos ou caracteres que quebrem a URL. */
function safeFileName(name) {
  const cleaned = String(name || "arquivo")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w.-]+/g, "-");
  return `${Date.now()}-${cleaned}`;
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
    const credential = new StorageSharedKeyCredential(accountName, accountKey);
    const blobName = safeFileName(filename);
    // Validade curta: a autorização só precisa durar o tempo do envio, feito
    // logo em seguida pelo navegador de quem está publicando.
    const expiresOn = new Date(Date.now() + 15 * 60 * 1000);

    const sas = generateBlobSASQueryParameters(
      {
        containerName: container,
        blobName,
        permissions: BlobSASPermissions.parse("cw"),
        protocol: SASProtocol.Https,
        expiresOn,
      },
      credential,
    ).toString();

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
