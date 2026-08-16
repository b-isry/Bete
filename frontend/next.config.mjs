/** @type {import('next').NextConfig} */

/**
 * Build remotePatterns for listing images.
 * Dev MinIO: localhost + 127.0.0.1 :9000.
 * Prod/staging: set NEXT_PUBLIC_S3_PUBLIC_URL_BASE (e.g. https://cdn.example.com/bete/public)
 * or NEXT_PUBLIC_IMAGE_HOSTS as comma-separated hostnames (https assumed).
 */
function s3RemotePatterns() {
  /** @type {import('next').NextConfig['images']} */
  const patterns = [
    {
      protocol: "https",
      hostname: "images.unsplash.com",
    },
    {
      protocol: "http",
      hostname: "localhost",
      port: "9000",
      pathname: "/bete/public/**",
    },
    {
      protocol: "http",
      hostname: "127.0.0.1",
      port: "9000",
      pathname: "/bete/public/**",
    },
  ];

  const base = process.env.NEXT_PUBLIC_S3_PUBLIC_URL_BASE?.trim();
  if (base) {
    try {
      const url = new URL(base);
      const protocol = url.protocol === "http:" ? "http" : "https";
      patterns.push({
        protocol,
        hostname: url.hostname,
        ...(url.port ? { port: url.port } : {}),
        pathname: `${url.pathname.replace(/\/$/, "")}/**`,
      });
    } catch {
      // ignore invalid URL — leave MinIO + Unsplash only
    }
  }

  const hosts = process.env.NEXT_PUBLIC_IMAGE_HOSTS?.split(",") ?? [];
  for (const raw of hosts) {
    const hostname = raw.trim();
    if (!hostname) continue;
    patterns.push({
      protocol: "https",
      hostname,
      pathname: "/**",
    });
  }

  return patterns;
}

const nextConfig = {
  images: {
    remotePatterns: s3RemotePatterns(),
  },
};

export default nextConfig;
