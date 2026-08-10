import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Gera o bundle standalone usado pela imagem Docker (runner enxuto)
  output: "standalone",
};

export default nextConfig;
