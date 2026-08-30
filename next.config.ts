import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundle standalone para a imagem Docker; na Vercel o pipeline próprio
  // de build conflita com esse modo, então fica desativado lá.
  output: process.env.VERCEL ? undefined : "standalone",
  // Dev mode acessado via Cloudflare Tunnel (trycloudflare) — sem isso o
  // Next bloqueia recursos de dev (chunks JS, fontes, HMR) por cross-origin
  // e a página não hidrata (cliques não respondem no celular).
  allowedDevOrigins: ["*.trycloudflare.com", "*.cloudflared.com"],
  experimental: {
    serverActions: {
      // Upload de currículos (limite da action; validação de 8 MB no servidor)
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
