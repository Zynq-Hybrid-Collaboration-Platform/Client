import React from 'react';
import Navbar from './Navbar';
import HeroSection from './HeroSection';
import MarketingClient from './MarketingClient';

export default function MarketingPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden text-slate-50 font-sans bg-[#0a0a0a]">
      {/* Wrapping content in a relative wrapper to scroll over the fixed background */}
      <div className="relative z-10 w-full">
        <Navbar />

        {/* HERO SECTION (Server-Side & Ultra-Fast) */}
        <HeroSection />

        {/* CLIENT SIDE SECTIONS (Lazy-loaded via wrapper) */}
        <MarketingClient />
      </div>
    </main>
  );
}