import type { Metadata } from 'next';
import './globals.css'; // MUST BE IMPORTED for Tailwind to work
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: {
    default: 'SYNQ | Next-Gen AI Collaboration',
    template: '%s | SYNQ'
  },
  description: 'AI-powered workflows, real-time sync, and seamless team collaboration for distributed teams.',
  keywords: ['collaboration', 'AI', 'real-time', 'sync', 'workflow', 'team', 'productivity'],
  authors: [{ name: 'SYNQ Team' }],
  creator: 'SYNQ',
  metadataBase: new URL('https://synq1.vercel.app'),
  openGraph: {
    title: 'SYNQ | Next-Gen AI Collaboration',
    description: 'Empower your team with AI-driven real-time sync.',
    url: 'https://synq1.vercel.app',
    siteName: 'SYNQ',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SYNQ | Next-Gen AI Collaboration',
    description: 'Empower your team with AI-driven real-time sync.',
  },
  icons: {
    icon: '/iconsynq1.svg',
    shortcut: '/iconsynq1.svg',
    apple: '/iconsynq1.svg',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': 'SYNQ',
    'operatingSystem': 'Web, Windows, macOS, Linux',
    'applicationCategory': 'CollaborationSoftware',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD'
    },
    'description': 'Next-gen AI-powered collaboration platform for distributed teams.'
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        {children}
        <Toaster 
          theme="dark" 
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'rgba(10, 10, 10, 0.8)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#f8fafc',
            },
            className: 'font-sans shadow-2xl rounded-xl',
          }}
        />
      </body>
    </html>
  );
}