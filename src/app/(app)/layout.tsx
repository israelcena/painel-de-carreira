import { redirect } from "next/navigation";
import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { getSession } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session.loggedIn) redirect("/login");

  return (
    <div className="flex min-h-dvh flex-col">
      <Topbar user={session.user ?? "?"} />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        {/* overflow-x-clip: se algum conteúdo estourar a largura, ele é cortado aqui
            em vez de alargar a página e deslocar o menu fixo do mobile */}
        <main className="min-w-0 flex-1 overflow-x-clip pb-20 md:pb-0">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
