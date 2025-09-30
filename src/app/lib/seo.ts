import { Metadata } from "next";

type SeoOptions = {
  title: string;
  description?: string;
  slug?: string; // para productos/categorías dinámicas
  baseUrl?: string;
  canonicanl?: string;
};

export function generateSeoMetadata({
  title,
  description = "",
  slug = "",
  baseUrl = "https://e-tianguis.com",
}: SeoOptions): Metadata {
  const url = slug ? `${baseUrl}/${slug}` : baseUrl;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
  };
}
