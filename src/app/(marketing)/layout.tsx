import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Next-Gen Collaboration for Modern Teams',
  description: 'Experience the future of work with AI-powered workflows and real-time synchronization. Built for speed, clarity, and distributed teams.',
  openGraph: {
    title: 'SYNQ | Next-Gen AI Collaboration',
    description: 'Empower your team with AI-driven real-time sync.',
    images: [{ url: '/og-image.png' }],
  }
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // We apply the dark background here too, just in case
    <div className="min-h-screen bg-[#0A0710] text-white">
      {/* You will eventually add your Navbar here */}
      {children}
      {/* You will eventually add your Footer here */}
    </div>
  );
}