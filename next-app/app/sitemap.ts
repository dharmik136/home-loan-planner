import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://home-loan-planner-neon.vercel.app';
const routes = ['', '/planner', '/calculator', '/planner/optimizer', '/sample-report', '/pricing', '/about', '/privacy'];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : route === '/planner' ? 0.9 : 0.7,
  }));
}
