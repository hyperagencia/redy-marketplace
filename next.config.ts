import type { NextConfig } from "next";

const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

const nextConfig: NextConfig = {
  // Reverse proxy para PostHog: sirve los eventos desde nuestro dominio (/ingest)
  // y así los adblockers no los tumban.
  async rewrites() {
    return [
      { source: '/ingest/static/:path*', destination: 'https://us-assets.i.posthog.com/static/:path*' },
      { source: '/ingest/:path*', destination: `${POSTHOG_HOST}/:path*` },
    ];
  },
  // PostHog necesita que /ingest no haga redirect por trailing slash.
  skipTrailingSlashRedirect: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;