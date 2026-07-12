import type { MetadataRoute } from "next";

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://evpitch.com"
).replace(/\/+$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/account/",
          "/admin/",
          "/api/",
          "/applied-jobs/",
          "/archived-jobs/",
          "/bookmarks/",
          "/candidate-list/",
          "/elevator-video-pitch/",
          "/internal-recruiter-list/",
          "/job-application/",
          "/messages/",
          "/notifications/",
          "/payment/",
          "/success/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
