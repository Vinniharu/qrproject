import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '*.vercel.app']
    },
  },
  images: {
    domains: ['your-supabase-url.supabase.co'],
  },
};

export default nextConfig;
