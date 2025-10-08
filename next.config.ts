import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "d1fufvy4xao6k9.cloudfront.net",
      "etianguis.s3.us-east-2.amazonaws.com",
      "png.pngtree.com",
      "www.oxiclean.com",
      "www.lakeland.com",
      "caissoned-uncorrelative-dedra.ngrok-free.dev",
      "images.unsplash.com",
      "picsum.photos"
    ],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "*.ngrok-free.app",
      },
      {
        protocol: "https",
        hostname: "medusa-public-images.s3.eu-west-1.amazonaws.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "adivor.com.mx",
      }
    ],
  },
};

export default nextConfig;
