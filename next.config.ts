import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundle standalone para a imagem Docker; na Vercel o pipeline próprio
  // de build conflita com esse modo, então fica desativado lá.
  output: process.env.VERCEL ? undefined : "standalone",
  experimental: {
    serverActions: {
      // Upload de currículos (limite da action; validação de 8 MB no servidor)
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
