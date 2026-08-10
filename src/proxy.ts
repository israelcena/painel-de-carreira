import { getIronSession } from "iron-session";
import { NextRequest, NextResponse } from "next/server";
import { sessionOptions, type SessionData } from "@/lib/session-config";

export default async function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(
    request,
    response,
    sessionOptions
  );

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/login";

  if (!session.loggedIn && !isLoginPage) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (session.loggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/board/nacional", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    // Protege tudo, exceto assets estáticos e arquivos públicos
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)",
  ],
};
