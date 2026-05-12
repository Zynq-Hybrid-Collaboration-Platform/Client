import React from 'react';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="w-full pt-40 pb-20 lg:pt-48 lg:pb-32 min-h-[90vh] flex items-center justify-center text-center">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col items-center gap-6 relative z-10">
        <h1 className="anim-hero-text text-5xl lg:text-7xl font-black tracking-tight text-white leading-[1.1]">
          Next-Gen Collaboration <br />
          <span className="text-slate-400">Platform</span>
        </h1>

        <p className="anim-hero-subtext text-lg lg:text-xl text-slate-300 max-w-2xl leading-relaxed mt-4">
          Empower your distributed teams with AI-powered workflows, real-time sync, and seamless communication across every touchpoint. Built for speed and clarity.
        </p>

        <div className="anim-hero-btns flex flex-col sm:flex-row items-center gap-4 mt-8">
          <Link href="/login" className="px-8 py-3.5 rounded-md bg-white text-black font-medium hover:bg-slate-200 transition-all w-full sm:w-auto shadow-sm active:scale-95">
            Start Free Trial
          </Link>
          <Link href="/login" className="px-8 py-3.5 rounded-md bg-black border border-white/20 text-white font-medium hover:bg-white/10 transition-all w-full sm:w-auto shadow-sm active:scale-95">
            Watch Demo
          </Link>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .anim-hero-text {
          animation: fadeSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .anim-hero-subtext {
          animation: fadeSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards 0.2s;
          opacity: 0;
        }
        .anim-hero-btns {
          animation: fadeSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards 0.4s;
          opacity: 0;
        }

        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}} />
    </section>
  );
}
