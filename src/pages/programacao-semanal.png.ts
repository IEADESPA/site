import sharp from "sharp";
import { siteConfig } from "@/config/site";
import { DAY_LABEL, OCCURRENCE_LABEL, getAllProgramacao, groupByDay } from "@/lib/programacao";

const WIDTH = 1080;
const HEIGHT = 1920;

const escapeXml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] as string);

export async function GET() {
  const programacao = await getAllProgramacao();
  const schedule = groupByDay(programacao);

  // Soma a altura total do conteúdo primeiro, pra centralizar o bloco no story.
  let contentHeight = 0;
  for (const group of schedule) {
    contentHeight += 52 + group.items.length * 46 + 28;
  }

  const headerBottom = 260;
  const footerTop = HEIGHT - 140;
  const availableHeight = footerTop - headerBottom;
  let y = headerBottom + Math.max(80, (availableHeight - contentHeight) / 2) + 40;

  const rows: string[] = [];

  for (const group of schedule) {
    rows.push(
      `<text x="90" y="${y}" font-family="sans-serif" font-size="34" font-weight="700" fill="#d9b34f">${escapeXml(DAY_LABEL[group.day])}</text>`,
    );
    y += 52;

    for (const item of group.items) {
      const label = item.occurrence ? `${OCCURRENCE_LABEL[item.occurrence]}: ${item.title}` : item.title;
      rows.push(`<text x="90" y="${y}" font-family="sans-serif" font-size="30" fill="#f4f1e6">${escapeXml(label)}</text>`);
      y += 46;
    }
    y += 28;
  }

  const svg = `
    <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${WIDTH}" height="${HEIGHT}" fill="#0a1220" />
      <text x="90" y="160" font-family="sans-serif" font-size="56" font-weight="700" fill="#f4f1e6">${escapeXml(siteConfig.name)}</text>
      <text x="90" y="220" font-family="sans-serif" font-size="34" fill="#a7adba">Programação semanal</text>
      <line x1="90" y1="260" x2="${WIDTH - 90}" y2="260" stroke="#33456b" stroke-width="2" />
      ${rows.join("\n")}
      <text x="90" y="${HEIGHT - 80}" font-family="sans-serif" font-size="28" fill="#a7adba">${escapeXml(siteConfig.siteUrl.replace("https://", ""))}</text>
    </svg>
  `;

  const png = await sharp(Buffer.from(svg)).png().toBuffer();

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": 'inline; filename="programacao-semanal.png"',
    },
  });
}
