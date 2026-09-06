import { siteConfig } from "@/config/site";
import { fetchItems } from "@/lib/directus";
import { buildIcs } from "@/lib/ics";

interface Evento {
  slug: string;
  title: string;
  event_date: string | null;
  end_date: string | null;
  time: string | null;
  location: string | null;
  description: string;
  body: string | null;
}

export async function getStaticPaths() {
  const events = await fetchItems<Evento>("eventos");
  return events.filter((event) => event.event_date).map((event) => ({ params: { slug: event.slug }, props: { event } }));
}

interface Props {
  event: Evento;
}

export async function GET({ props }: { props: Props }) {
  const { event } = props;
  const ics = buildIcs(
    [
      {
        uid: `evento-${event.slug}@ieadespa.org.br`,
        title: event.title,
        description: event.description,
        location: event.location ?? undefined,
        date: event.event_date as string,
        endDate: event.end_date,
        time: event.time,
        url: event.body ? `${siteConfig.siteUrl}/evento/${event.slug}/` : undefined,
      },
    ],
    event.title,
  );

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}.ics"`,
    },
  });
}
