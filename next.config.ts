import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Enable experimental features / Eksperimental xüsusiyyətləri aktivləşdir
  serverExternalPackages: ['@prisma/client'],
  
  // ESLint configuration / ESLint konfiqurasiyası
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Seller subdomain configuration / Seller subdomain konfiqurasiyası
  // Note: Rewrites removed as routes are directly under /seller path
  // Qeyd: Route-lar birbaşa /seller yolu altında olduğu üçün rewrites silindi
  // async rewrites() {
  //   return [
  //     {
  //       source: '/seller/:path*',
  //       destination: '/:path*',
  //     },
  //   ];
  // },
  
  // Image optimization configuration / Şəkil optimizasiyası konfiqurasiyası
  images: {
    domains: [
      'localhost',
      'images.unsplash.com',
      'via.placeholder.com',
      'lh3.googleusercontent.com',
      'platform-lookaside.fbsbx.com',
      's.gravatar.com',
    ],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Environment variables configuration / Mühit dəyişənləri konfiqurasiyası
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Redirects configuration / Yönləndirmələr konfiqurasiyası
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: true,
      },
    ];
  },
  
  // Headers configuration / Başlıqlar konfiqurasiyası
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
