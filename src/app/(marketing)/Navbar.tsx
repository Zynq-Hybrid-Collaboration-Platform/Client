'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Smartphone, Monitor, ChevronRight } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  return (
    <>
      <div className="fixed top-6 left-0 w-full z-50 flex justify-center px-4">
        <header className="w-full max-w-5xl px-6 py-3 flex justify-between items-center bg-black/80 backdrop-blur-md border border-white/10 rounded-full shadow-lg">

          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <span className="font-extrabold text-xl tracking-wider text-white">
              SYNQ
            </span>
          </Link>

          {/* NAV (Desktop) */}
          <nav className="hidden lg:flex items-center gap-8 text-[14px] font-medium text-slate-400">
            <button 
              onClick={() => setShowDownloadModal(true)} 
              className="hover:text-white transition-colors"
            >
              Download
            </button>
            <Link href="/#marketing" className="hover:text-white transition-colors">Features</Link>
            <Link href="/#pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/#support" className="hover:text-white transition-colors">Support</Link>
          </nav>

          {/* RIGHT */}
          <div className="flex items-center gap-4">
            <Link 
              href="/login"
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden sm:block"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="bg-white text-black px-5 py-2 rounded-full font-medium text-sm hover:bg-slate-200 transition-colors shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </header>
      </div>

      {/* DOWNLOAD MODAL */}
      <AnimatePresence>
        {showDownloadModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDownloadModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[#0f111a] border border-white/10 rounded-[32px] p-8 shadow-2xl overflow-hidden"
            >
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] -mr-32 -mt-32" />
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Monitor className="w-6 h-6" />
                  </div>
                  <button 
                    onClick={() => setShowDownloadModal(false)}
                    className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <h3 className="text-3xl font-bold text-white mb-3">SYNQ Desktop is on its way</h3>
                <p className="text-slate-400 mb-8 leading-relaxed">
                  We're putting the finishing touches on the native SYNQ experience for Windows, Mac, and Linux. Join 5,000+ others waiting for early access.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4 hover:border-white/10 transition-colors cursor-default">
                    <Monitor className="text-slate-400" size={20} />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-white">Desktop Client</div>
                      <div className="text-xs text-slate-500">macOS, Windows, Linux</div>
                    </div>
                    <div className="text-[10px] font-bold text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded-md uppercase tracking-wider">Waitlist</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4 hover:border-white/10 transition-colors cursor-default opacity-60">
                    <Smartphone className="text-slate-400" size={20} />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-white">Mobile Apps</div>
                      <div className="text-xs text-slate-500">iOS & Android</div>
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-1 rounded-md uppercase tracking-wider">Coming Q4</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 bg-white text-black h-12 rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                    Join Waitlist <ChevronRight size={18} />
                  </button>
                  <button 
                    onClick={() => setShowDownloadModal(false)}
                    className="flex-1 bg-white/5 text-white h-12 rounded-xl font-bold hover:bg-white/10 transition-colors border border-white/10"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}