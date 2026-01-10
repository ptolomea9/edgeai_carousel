const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: [],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
      },
      {
        protocol: 'https',
        hostname: 'generativelanguage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    // Increase body size limit for base64 image uploads (10MB)
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

export default nextConfig
