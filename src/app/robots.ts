import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
    {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/"],
    },
    {
    userAgent: "Googlebot",
    allow: "/",
    disallow: "/login",
  }
    ],
    sitemap: "https://e-tianguis.com/sitemap.xml",
  };
}
