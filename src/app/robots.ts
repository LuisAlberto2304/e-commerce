// app/robots.ts - FORMATO CORRECTO
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/api/secret/", "/login"],
    },
    sitemap: "https://e-tianguis.com/sitemap.xml",
  };
}