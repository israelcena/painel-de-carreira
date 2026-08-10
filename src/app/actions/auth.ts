"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export interface LoginState {
  error?: string;
}

export async function login(
  _prevState: LoginState | undefined,
  formData: FormData
): Promise<LoginState> {
  const user = String(formData.get("user") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const expectedUser = process.env.APP_USER ?? "admin";
  const expectedPassword = process.env.APP_PASSWORD ?? "admin123";

  if (user !== expectedUser || password !== expectedPassword) {
    return { error: "Usuário ou senha inválidos." };
  }

  const session = await getSession();
  session.loggedIn = true;
  session.user = user;
  await session.save();

  redirect("/board/nacional");
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect("/login");
}
