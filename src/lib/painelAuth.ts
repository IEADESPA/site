/**
 * Autenticação do painel de gestão de eventos (/painel-eventos/) — reaproveita
 * a própria conta do Directus, sem senha nenhuma guardada no código. Ver
 * README ("Aba dedicada de gestão de eventos") para o desenho completo.
 */
const TOKEN_KEY = "painel_eventos_token";

export function irParaLogin(): void {
  window.location.href = "/painel-eventos/entrar/";
}

/** Token em sessionStorage, ou renovado silenciosamente via cookie httpOnly. */
export async function obterTokenValido(directusUrl: string): Promise<string | null> {
  const tokenAtual = sessionStorage.getItem(TOKEN_KEY);
  if (tokenAtual) return tokenAtual;

  try {
    const res = await fetch(`${directusUrl}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "cookie" }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    sessionStorage.setItem(TOKEN_KEY, json.data.access_token);
    return json.data.access_token as string;
  } catch {
    return null;
  }
}

/** Redireciona pro login se não houver sessão válida; senão devolve o token. */
export async function exigirAutenticacao(directusUrl: string): Promise<string | null> {
  const token = await obterTokenValido(directusUrl);
  if (!token) {
    irParaLogin();
    return null;
  }
  return token;
}

export function limparToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

export async function sair(directusUrl: string): Promise<void> {
  try {
    await fetch(`${directusUrl}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "cookie" }),
    });
  } catch {
    // segue o baile mesmo se o logout no servidor falhar — o token local já é limpo
  }
  limparToken();
  irParaLogin();
}
