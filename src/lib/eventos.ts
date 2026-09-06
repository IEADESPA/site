/** Só o suficiente pra decidir se um evento tem página própria — cada
 * página que usa isso declara o resto dos campos que precisa. */
export interface EventoComPagina {
  slug: string;
  body: string | null;
}

/** Ganha página própria (`/evento/<slug>/`) quem tem texto (`body`) —
 * centralizado aqui porque a mesma decisão é repetida em várias páginas
 * (lista de eventos, busca, .ics). */
export const hasEventPage = (event: EventoComPagina) => Boolean(event.body);

export const eventoHref = (event: EventoComPagina) => `/evento/${event.slug}/`;
