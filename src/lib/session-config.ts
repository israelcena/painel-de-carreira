// Config da sessão isolada de next/headers para poder ser usada no proxy (edge).
import type { SessionOptions } from "iron-session";

export interface SessionData {
  loggedIn?: boolean;
  user?: string;
}

export const sessionOptions: SessionOptions = {
  password:
    process.env.SESSION_SECRET ??
    "segredo-de-desenvolvimento-local-trocar-em-producao",
  cookieName: "painel_sessao",
  ttl: 60 * 60 * 24 * 30, // 30 dias
  cookieOptions: {
    // A aplicação roda em http://localhost (Docker); secure=true bloquearia o cookie.
    secure: false,
    httpOnly: true,
    sameSite: "lax",
  },
};
