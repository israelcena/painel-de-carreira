import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Gera o bundle standalone usado pela imagem Docker (runner enxuto)
  output: "standalone",
  experimental: {
    serverActions: {
      // Upload de currículos (limite da action; validação de 8 MB no servidor)
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
