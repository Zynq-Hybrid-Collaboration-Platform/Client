import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/workspace/', '/api/', '/_next/'],
    },
    sitemap: 'https://synq1.vercel.app/sitemap.xml',
  };
}
