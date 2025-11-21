import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const baseCSP =
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-inline' https://apis.google.com https://accounts.google.com https://www.googletagmanager.com https://www.google-analytics.com https://js.stripe.com https://www.paypal.com https://www.sandbox.paypal.com https://connect.facebook.net; " +
  "style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data: blob: https://lh3.googleusercontent.com https://*.googleusercontent.com https://*.ggpht.com https://images.unsplash.com https://picsum.photos https://d1fufvy4xao6k9.cloudfront.net https://etianguis.s3.us-east-2.amazonaws.com https://medusa-public-images.s3.eu-west-1.amazonaws.com https://www.facebook.com; " +
  "connect-src 'self' https://apis.google.com https://accounts.google.com https://www.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://firebase.googleapis.com https://firebaseinstallations.googleapis.com https://api.stripe.com https://www.paypal.com https://www.sandbox.paypal.com https://www.googletagmanager.com https://www.google-analytics.com https://*.algolia.net https://*.algolianet.com https://countriesnow.space https://caissoned-uncorrelative-dedra.ngrok-free.app https://graph.facebook.com; " +
  "frame-src 'self' https://etianguis-fa446.firebaseapp.com https://accounts.google.com https://js.stripe.com https://www.paypal.com https://www.sandbox.paypal.com; " +
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
