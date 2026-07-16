import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://campuschain.local";
  const pages = [
    "",
    "/dashboard",
    "/wallet",
    "/transactions",
    "/notifications",
    "/profile",
    "/settings",
    "/help",
  ];

  return pages.map((page) => ({
    url: `${baseUrl}${page}`,
    lastModified: new Date(),
    changeFrequency: page === "" ? "weekly" : "daily",
    priority: page === "" ? 1.0 : 0.8,
  }));
}
