import type { Metadata, Viewport } from "next";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";

const nunito = Nunito_Sans({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ProMove — movimento profissional",
    template: "%s · ProMove",
  },
  description:
    "Gerenciador de candidaturas a vagas de emprego com kanban, análise SWOT, histórico e métricas.",
};

export const viewport: Viewport = {
  themeColor: "#7b6ce4",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${nunito.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
