// Roda uma vez por dia (ver .github/workflows/event-notifications.yml).
// Avisa, por notificação push do navegador, quem ativou os avisos em
// /eventos/ sobre eventos especiais que acontecem amanhã.
import webpush from "web-push";

const { DIRECTUS_URL, DIRECTUS_ADMIN_TOKEN, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, SITE_URL } = process.env;

if (!DIRECTUS_URL || !DIRECTUS_ADMIN_TOKEN || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !SITE_URL) {
  throw new Error("Faltam variáveis de ambiente obrigatórias (ver README).");
}

webpush.setVapidDetails("mailto:seta@ieadespa.org", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

function amanhaISO() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const amanha = amanhaISO();

  const eventsRes = await fetch(`${DIRECTUS_URL}/items/eventos?limit=-1`);
  if (!eventsRes.ok) throw new Error(`Falha ao buscar eventos: ${eventsRes.status}`);
  const { data: events } = await eventsRes.json();

  // Cobre eventos de vários dias: "amanhã" pode cair no meio do intervalo,
  // não só no primeiro dia.
  const matching = events.filter((e) => {
    if (!e.event_date) return false;
    const inicio = e.event_date;
    const fim = e.end_date || e.event_date;
    return amanha >= inicio && amanha <= fim;
  });

  if (matching.length === 0) {
    console.log(`Nenhum evento em ${amanha} — nada a enviar.`);
    return;
  }

  const subsRes = await fetch(`${DIRECTUS_URL}/items/push_subscriptions?limit=-1`, {
    headers: { Authorization: `Bearer ${DIRECTUS_ADMIN_TOKEN}` },
  });
  if (!subsRes.ok) throw new Error(`Falha ao buscar inscrições: ${subsRes.status}`);
  const { data: subs } = await subsRes.json();

  if (subs.length === 0) {
    console.log("Nenhum inscrito em notificações — nada a enviar.");
    return;
  }

  console.log(`Enviando aviso de ${matching.length} evento(s) para ${subs.length} inscrito(s)...`);

  const expiradas = new Set();

  for (const sub of subs) {
    const subscription = { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } };

    for (const event of matching) {
      const url = event.body ? `${SITE_URL}/evento/${event.slug}/` : `${SITE_URL}/eventos/`;
      const payload = JSON.stringify({
        title: `Amanhã: ${event.title}`,
        body: [event.time, event.location].filter(Boolean).join(" · ") || "Não perca!",
        url,
      });

      try {
        await webpush.sendNotification(subscription, payload);
      } catch (err) {
        // 404/410: inscrição não existe mais no navegador do visitante
        // (ex.: limpou os dados do site) — sem problema, só remove.
        if (err.statusCode === 404 || err.statusCode === 410) {
          expiradas.add(sub.id);
        } else {
          console.error(`Falha ao enviar para inscrição ${sub.id}:`, err.statusCode, err.body);
        }
      }
    }
  }

  for (const id of expiradas) {
    await fetch(`${DIRECTUS_URL}/items/push_subscriptions/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${DIRECTUS_ADMIN_TOKEN}` },
    });
    console.log("Removida inscrição expirada:", id);
  }

  console.log("Concluído.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
