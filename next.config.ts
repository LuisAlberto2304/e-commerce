import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const baseCSP =
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.vercel.app https://*.google.com https://*.gstatic.com https://www.googletagmanager.com https://www.google-analytics.com https://js.stripe.com https://www.paypal.com https://www.sandbox.paypal.com; " +
  "style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' blob: data: https://*; " +
  "connect-src 'self' https://*; " +
  "frame-src 'self' https://*.vercel.app https://accounts.google.com https://js.stripe.com https://www.paypal.com https://www.sandbox.paypal.com; " +
  "object-src 'none'; base-uri 'self'; form-action 'self';";


const securityHeaders = [
  // COOP/COEP — permite popups durante desarrollo
  ...(isDev
    ? [
        { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        { key: "Cross-Origin-Embedder-Policy", value: "unsafe-none" },
      ]
    : [
        // En producción puedes endurecerlo si no usas popups:
        { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        { key: "Cross-Origin-Embedder-Policy", value: "unsafe-none" },
      ]),

  // CSP
// {
//   key: "Content-Security-Policy",
//   value: baseCSP,
// },


  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "no-referrer" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(self https://js.stripe.com https://www.paypal.com https://www.sandbox.paypal.com)",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },

  reactStrictMode: true,
};

export default nextConfig;
