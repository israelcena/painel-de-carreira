import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SessionData } from "./session-config";

export type { SessionData };

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

/** Garante sessão autenticada dentro de server actions. */
export async function assertSession(): Promise<SessionData> {
  const session = await getSession();
  if (!session.loggedIn) {
    throw new Error("Não autenticado.");
  }
  return session;
}
