import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@answerpoint/db", "@answerpoint/knowledge"],
};

export default nextConfig;
