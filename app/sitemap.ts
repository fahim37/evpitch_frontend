import type { MetadataRoute } from "next";

const CACHE_REVALIDATE_SECONDS = 3600;

export const revalidate = 3600;

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://evpitch.com"
).replace(/\/+$/, "");

const apiBaseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/+$/, "");

const staticRoutes = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/about-us", priority: 0.8, changeFrequency: "monthly" },
  { path: "/contact-us", priority: 0.7, changeFrequency: "monthly" },
  { path: "/alljobs", priority: 0.9, changeFrequency: "daily" },
  { path: "/blogs", priority: 0.8, changeFrequency: "weekly" },
  { path: "/faq", priority: 0.7, changeFrequency: "monthly" },
  { path: "/user-pricing", priority: 0.7, changeFrequency: "monthly" },
  { path: "/recruiter-pricing", priority: 0.7, changeFrequency: "monthly" },
  { path: "/company-pricing", priority: 0.7, changeFrequency: "monthly" },
  { path: "/privacy-policy", priority: 0.4, changeFrequency: "yearly" },
  { path: "/terms-condition", priority: 0.4, changeFrequency: "yearly" },
] as const;

type SitemapItem = MetadataRoute.Sitemap[number];

const toSitemapItem = (
  path: string,
  options: Omit<SitemapItem, "url"> = {}
): SitemapItem => ({
  url: `${siteUrl}${path}`,
  lastModified: new Date(),
  ...options,
});

const fetchJson = async <T>(path: string): Promise<T | null> => {
  if (!apiBaseUrl) return null;

  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      next: { revalidate: CACHE_REVALIDATE_SECONDS },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
};

const getDynamicJobUrls = async (): Promise<SitemapItem[]> => {
  const payload = await fetchJson<{
    data?: { jobs?: Array<{ _id?: string; updatedAt?: string; createdAt?: string }> };
  }>("/jobs?limit=1000");

  const jobs = payload?.data?.jobs ?? [];
  return jobs
    .filter((job) => job._id)
    .map((job) =>
      toSitemapItem(`/alljobs/${job._id}`, {
        lastModified: job.updatedAt || job.createdAt || new Date(),
        changeFrequency: "daily",
        priority: 0.8,
      })
    );
};

const getDynamicBlogUrls = async (): Promise<SitemapItem[]> => {
  const payload = await fetchJson<{
    data?: {
      blogs?: Array<{
        _id?: string;
        slug?: string;
        updatedAt?: string;
        createdAt?: string;
      }>;
    };
  }>("/blogs/get-all?limit=1000");

  const blogs = payload?.data?.blogs ?? [];
  return blogs
    .map((blog) => ({
      id: blog.slug || blog._id,
      updatedAt: blog.updatedAt,
      createdAt: blog.createdAt,
    }))
    .filter((blog) => blog.id)
    .map((blog) =>
      toSitemapItem(`/blogs/${blog.id}`, {
        lastModified: blog.updatedAt || blog.createdAt || new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      })
    );
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticUrls = staticRoutes.map((route) =>
    toSitemapItem(route.path, {
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })
  );

  const [jobUrls, blogUrls] = await Promise.all([
    getDynamicJobUrls(),
    getDynamicBlogUrls(),
  ]);

  return [...staticUrls, ...jobUrls, ...blogUrls];
}
