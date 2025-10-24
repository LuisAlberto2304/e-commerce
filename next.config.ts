import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: `
      default-src 'self';

      script-src
        'self'
        'unsafe-inline'
        https://js.stripe.com
        https://www.paypal.com
        https://www.sandbox.paypal.com
        https://www.googletagmanager.com
        https://www.google-analytics.com;

      style-src
        'self'
        'unsafe-inline';

      img-src
        'self'
        data:
        blob:
        https://d1fufvy4xao6k9.cloudfront.net
        https://etianguis.s3.us-east-2.amazonaws.com
        https://medusa-public-images.s3.eu-west-1.amazonaws.com
        https://images.unsplash.com
        https://picsum.photos
        https://png.pngtree.com
        https://www.oxiclean.com
        https://www.lakeland.com
        https://www.google-analytics.com
        https://www.googletagmanager.com;

      connect-src
        'self'
        https://api.stripe.com
        https://www.paypal.com
        https://www.sandbox.paypal.com
        https://www.googletagmanager.com
        https://www.google-analytics.com
        https://*.ngrok-free.app
        https://adivor.com.mx
        https://identitytoolkit.googleapis.com
        https://securetoken.googleapis.com
        https://firestore.googleapis.com
        https://firebase.googleapis.com
        https://firebaseinstallations.googleapis.com
        https://sandbox.paypal.com
        https://countriesnow.space
        https://ipapi.co;

      frame-src
        https://js.stripe.com
        https://www.paypal.com
        https://www.sandbox.paypal.com;

      object-src 'none';
      base-uri 'self';
      form-action 'self';
    `.replace(/\s{2,}/g, " "),
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "no-referrer" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self https://js.stripe.com https://www.paypal.com https://www.sandbox.paypal.com)",
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
};

export default nextConfig;
