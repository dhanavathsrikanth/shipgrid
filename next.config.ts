const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: ['10.228.84.152', 'localhost'],
} as any;

export default nextConfig;
