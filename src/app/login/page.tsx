import { BriefcaseBusiness } from "lucide-react";
import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-violet to-brand-blue text-white shadow-float">
            <BriefcaseBusiness size={26} strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-ink">
              Painel de Carreira
            </h1>
            <p className="text-sm font-semibold text-ink-soft">
              Suas candidaturas, organizadas.
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-card">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
