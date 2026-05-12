'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const DarkVeil = dynamic(() => import('./DarkVeil'), { 
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-[#0a0a0a]" /> 
});

export default function MarketingSections() {
  return (
    <>
      {/* GLOBAL UNIFIED BACKGROUND */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <DarkVeil
          hueShift={0}
          noiseIntensity={0}
          scanlineIntensity={0}
          speed={0.5}
          scanlineFrequency={0}
          warpAmount={0}
          resolutionScale={0.5}
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
      </div>

      {/* Global CSS for Component Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Shared & Section 1 Animations */
        .anim-slide-up { animation: slideUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards 0.5s; opacity: 0; }
        .anim-slide-right-1 { animation: slideRight 0.8s forwards 1.2s; opacity: 0; }
        .anim-slide-right-2 { animation: slideRight 0.8s forwards 1.4s; opacity: 0; }
        .anim-slide-right-3 { animation: slideRight 0.8s forwards 1.6s; opacity: 0; }
        .anim-pop-in { animation: popIn 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards 0.8s; opacity: 0; transform-style: preserve-3d; }
        .anim-float-up { animation: floatUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards 1.6s, hoverWave 4s ease-in-out infinite 2.4s; opacity: 0; }
        .anim-drop-in { animation: dropIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards 1.8s, hoverFloat 3s ease-in-out infinite 2.6s; opacity: 0; }
        .anim-pulse-op { animation: pulseOp 2s infinite; }
        
        .audio-bar { animation: audioBounce 1.2s infinite ease-in-out alternate; }
        .audio-bar:nth-child(1) { height: 20%; animation-delay: 0.1s; }
        .audio-bar:nth-child(2) { height: 50%; animation-delay: 0.2s; background: linear-gradient(to top, #7c3aed, #3b82f6); }
        .audio-bar:nth-child(3) { height: 90%; animation-delay: 0.3s; background: #3b82f6; }
        .audio-bar:nth-child(4) { height: 40%; animation-delay: 0.4s; background: linear-gradient(to top, #3b82f6, #ec4899); }
        .audio-bar:nth-child(5) { height: 70%; animation-delay: 0.5s; background: #ec4899; }
        .audio-bar:nth-child(6) { height: 30%; animation-delay: 0.6s; }

        @keyframes slideUp { to { opacity: 1; transform: translateY(0); } }
        @keyframes slideRight { to { opacity: 1; transform: translateX(0); } }
        @keyframes popIn { to { opacity: 1; transform: rotateY(-12deg) rotateX(5deg) scale(1); } }
        @keyframes floatUp { to { opacity: 1; transform: translateZ(60px) translateY(0); } }
        @keyframes dropIn { to { opacity: 1; transform: translateZ(40px) translateY(0); } }
        @keyframes pulseOp { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes audioBounce { 0% { transform: scaleY(0.4); } 100% { transform: scaleY(1.3); } }
        @keyframes hoverWave { 0%, 100% { transform: translateZ(60px) translateY(0); } 50% { transform: translateZ(60px) translateY(-12px); } }
        @keyframes hoverFloat { 0%, 100% { transform: translateZ(40px) translateY(0); } 50% { transform: translateZ(40px) translateY(-8px); } }

        /* Section 2 Animations */
        .anim-slide-up-txt { animation: slideUpTxt 1s cubic-bezier(0.16, 1, 0.3, 1) forwards 0.3s; opacity: 0; }
        .anim-mockup-in-right { animation: popInRight 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards 0.6s; opacity: 0; transform-style: preserve-3d; }
        .anim-msg-1 { animation: slideMsgLeft 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards 1.0s; opacity: 0; }
        .anim-msg-2 { animation: slideMsgRight 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards 1.3s; opacity: 0; }
        .anim-msg-3 { animation: slideMsgLeft 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards 1.6s; opacity: 0; }
        .anim-action-btn { animation: popActionBtn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards 2.0s; opacity: 0; transform: scale(0); }
        .anim-task-card { animation: popTaskCard 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards 2.4s, hoverTask 4s ease-in-out infinite 3.2s; opacity: 0; }

        @keyframes slideUpTxt { to { opacity: 1; transform: translateY(0); } }
        @keyframes popInRight { to { opacity: 1; transform: rotateY(12deg) rotateX(5deg) scale(1); } }
        @keyframes slideMsgLeft { from { transform: translateX(-20px); opacity: 0; } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideMsgRight { from { transform: translateX(20px); opacity: 0; } to { opacity: 1; transform: translateX(0); } }
        @keyframes popActionBtn { to { opacity: 1; transform: scale(1); } }
        @keyframes popTaskCard { 
          0% { opacity: 0; transform: translateZ(60px) scale(0.8) translateY(20px); } 
          100% { opacity: 1; transform: translateZ(60px) scale(1) translateY(0); } 
        }
        @keyframes hoverTask { 0%, 100% { transform: translateZ(60px) translateY(0); } 50% { transform: translateZ(60px) translateY(-10px); } }
      `}} />

      {/* ========================================= */}
      {/* MARKETING SECTION 1 */}
      {/* ========================================= */}
      <section className="relative w-full px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-24 relative z-10">
          
          <div className="flex-1 w-full order-2 lg:order-1 relative perspective-[1200px] h-[450px] lg:h-[600px] flex items-center justify-center">
            <div className="anim-pop-in w-full max-w-lg h-[340px] lg:h-[420px] rounded-2xl border border-white/10 p-5 lg:p-6 flex flex-col gap-4 shadow-2xl bg-gradient-to-br from-slate-800/70 to-slate-900/80 backdrop-blur-xl relative">
              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <div className="font-semibold text-base lg:text-lg text-white flex items-center gap-2">
                  <span className="block w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]"></span>
                  Design Sync Room
                </div>
                <div className="flex">
                  <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full border-2 border-slate-900 bg-gradient-to-br from-violet-600 to-blue-500 shadow-md"></div>
                  <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full border-2 border-slate-900 bg-gradient-to-br from-blue-500 to-pink-500 -ml-3 z-10 shadow-md"></div>
                  <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full border-2 border-slate-900 bg-gradient-to-br from-pink-500 to-amber-500 -ml-3 z-20 shadow-md"></div>
                </div>
              </div>

              <div className="flex gap-4 flex-1">
                <div className="flex-[2] bg-gradient-to-br from-blue-500/10 to-black/60 rounded-xl relative overflow-hidden border border-white/5">
                  <Image 
                    src="https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80&w=600"
                    alt="Collaboration Mockup"
                    fill
                    className="object-cover opacity-40 mix-blend-luminosity"
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                  <div className="absolute top-4 left-4 bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full text-[10px] lg:text-xs font-semibold flex items-center gap-2 border border-emerald-500/30 backdrop-blur-sm anim-pulse-op z-10">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                    Screen Sharing
                  </div>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white cursor-pointer hover:bg-white/20 transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                    </div>
                    <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg cursor-pointer">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>
                    </div>
                    <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg cursor-pointer hover:bg-red-600 transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91z"/><line x1="23" y1="1" x2="1" y2="23"/></svg>
                    </div>
                  </div>
                </div>
                <div className="flex-1 bg-black/50 rounded-xl border border-white/5 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
                </div>
              </div>
            </div>

            <div className="anim-drop-in absolute top-[0%] right-[-5%] lg:right-[0%] xl:right-[-10%] px-5 py-2.5 lg:px-6 lg:py-3 bg-gradient-to-r from-violet-600/20 to-blue-500/20 backdrop-blur-xl border border-white/10 rounded-full text-xs lg:text-sm font-medium text-white flex items-center gap-2.5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] z-20">
              <svg className="text-blue-400 w-4 h-4 lg:w-5 lg:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path><line x1="4" y1="4" x2="20" y2="20"></line></svg>
              No links required
            </div>

            <div className="anim-float-up absolute bottom-[0%] lg:bottom-[5%] left-[-5%] lg:left-[0%] xl:left-[-10%] w-[200px] h-[75px] lg:w-[240px] lg:h-[90px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 lg:p-6 flex items-center justify-center gap-1.5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] z-20">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="audio-bar w-1 lg:w-1.5 bg-violet-600 rounded-full"></div>
              ))}
            </div>
          </div>

          <div className="flex-1 space-y-6 order-1 lg:order-2">
            <h2 className="anim-slide-up text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-indigo-300 leading-[1.1] tracking-tight">
              Crystal Clear <br /> Voice & Video
            </h2>
            <p className="anim-slide-up text-lg lg:text-xl text-slate-400 max-w-lg leading-relaxed" style={{ animationDelay: '0.6s' }}>
              Jump into high-fidelity audio and video rooms instantly. No meeting links required. Screen share, co-browse, and collaborate as if you are in the same room.
            </p>
            
            <ul className="space-y-4 mt-8">
              {["Instant drop-in audio channels", "High definition screen sharing", "Low-latency global infrastructure"].map((item, i) => (
                <li key={i} className={`flex items-center gap-4 text-slate-200 font-medium anim-slide-right-${i+1}`}>
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 5L5 9L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ========================================= */}
      {/* MARKETING SECTION 2 */}
      {/* ========================================= */}
      <section id='marketing' className="relative w-full px-6 lg:px-8 py-24">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-24 relative z-10">
          <div className="flex-1 space-y-6">
            <h2 className="anim-slide-up-txt text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-teal-200 leading-[1.1] tracking-tight">
              Manage Tasks <br /> At The Speed Of Chat
            </h2>
            <p className="anim-slide-up-txt text-lg lg:text-xl text-slate-400 max-w-lg leading-relaxed" style={{ animationDelay: '0.4s' }}>
              Don't let ideas get lost in the scroll. Turn any message into an actionable task, assign it to a teammate, and track it seamlessly.
            </p>
            <div className="pt-4 anim-slide-up-txt" style={{ animationDelay: '0.5s' }}>
              <Link href="/features" className="text-white hover:text-teal-300 font-semibold transition-colors inline-flex items-center gap-2 group">
                Explore workflow features 
                <span aria-hidden="true" className="group-hover:translate-x-1 transition-transform">&rarr;</span>
              </Link>
            </div>
          </div>

          <div className="flex-1 w-full relative perspective-[1200px] h-[450px] lg:h-[550px] flex items-center justify-center">
            <div className="anim-mockup-in-right w-full max-w-md h-[400px] lg:h-[480px] rounded-2xl border border-white/10 p-5 flex flex-col shadow-2xl bg-gradient-to-br from-slate-800/70 to-slate-900/80 backdrop-blur-xl relative" style={{ transform: 'rotateY(12deg) rotateX(5deg) scale(0.95)' }}>
              <div className="flex items-center gap-3 pb-4 border-b border-white/5 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-md">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">Product Team</div>
                  <div className="text-teal-400 text-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full inline-block"></span> 4 Online
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-5 flex-1 p-2">
                <div className="anim-msg-1 self-start bg-white/5 backdrop-blur-md px-4 py-2.5 rounded-2xl rounded-tl-sm max-w-[85%] border border-white/5 text-sm text-slate-200 flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex-shrink-0 mt-0.5"></div>
                  <div>Hey team, the new dashboard styling looks a bit off on mobile screens.</div>
                </div>

                <div className="anim-msg-2 self-end bg-gradient-to-br from-teal-600/60 to-emerald-600/60 backdrop-blur-md px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[85%] border border-teal-500/20 text-sm text-white shadow-lg">
                  Good catch! I can take a look at it this afternoon.
                </div>

                <div className="anim-msg-3 self-start bg-white/5 backdrop-blur-md px-4 py-2.5 rounded-2xl rounded-tl-sm max-w-[85%] border border-white/5 text-sm text-slate-200 flex gap-3 relative">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex-shrink-0 mt-0.5"></div>
                  <div>Could you also update the empty states while you're at it?</div>
                  <div className="anim-action-btn absolute -right-3 -top-3 w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white border-2 border-slate-800 shadow-[0_0_15px_rgba(20,184,166,0.5)] z-10">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </div>
                </div>
              </div>

              <div className="h-11 mt-auto rounded-full bg-black/40 border border-white/10 flex items-center px-4 justify-between">
                <div className="text-slate-500 text-xs">Type a message...</div>
                <div className="text-slate-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"></path><path d="M22 2L15 22L11 13L2 9L22 2Z"></path></svg>
                </div>
              </div>

              <div className="anim-task-card absolute top-[40%] left-[10%] lg:left-[20%] w-[260px] lg:w-[280px] bg-white/10 backdrop-blur-2xl border border-white/20 rounded-xl p-4 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] z-20">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded border-2 border-teal-400/50 flex items-center justify-center mt-0.5 group hover:bg-teal-500/20 hover:border-teal-400 transition-colors cursor-pointer"></div>
                  <div className="flex-1">
                    <h4 className="text-white text-sm font-semibold mb-1">Update empty states</h4>
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500"></div>
                      Assigned to Sarah
                    </div>
                  </div>
                  <div className="text-[9px] bg-teal-500/20 border border-teal-500/30 text-teal-300 px-2 py-0.5 rounded uppercase font-bold tracking-wider">New Task</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================= */}
      {/* PRICING SECTION */}
      {/* ========================================= */}
      <section id="pricing" className="relative w-full px-6 lg:px-8 py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">Simple, Transparent Pricing</h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">Choose the plan that's right for your team. No hidden fees, no complexity.</p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Free Plan */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col hover:bg-white/10 transition-colors">
            <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
            <div className="text-4xl font-black text-white mb-6">$0<span className="text-lg font-medium text-slate-500">/mo</span></div>
            <ul className="space-y-4 mb-8 text-slate-400 text-sm flex-1">
              <li className="flex items-center gap-2">✓ Up to 5 team members</li>
              <li className="flex items-center gap-2">✓ Unlimited chat history</li>
              <li className="flex items-center gap-2">✓ 5GB Storage</li>
            </ul>
            <Link href="/login" className="w-full py-3 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/10 transition-colors text-center">Get Started</Link>
          </div>

          {/* Pro Plan */}
          <div className="bg-indigo-600/10 border-2 border-indigo-500 rounded-3xl p-8 flex flex-col relative scale-105 shadow-[0_0_40px_-10px_rgba(99,102,241,0.3)]">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Most Popular</div>
            <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
            <div className="text-4xl font-black text-white mb-6">$12<span className="text-lg font-medium text-slate-300">/mo</span></div>
            <ul className="space-y-4 mb-8 text-slate-200 text-sm flex-1">
              <li className="flex items-center gap-2">✓ Unlimited members</li>
              <li className="flex items-center gap-2">✓ 50GB Storage</li>
              <li className="flex items-center gap-2">✓ Advanced task management</li>
              <li className="flex items-center gap-2">✓ Custom roles & permissions</li>
            </ul>
            <Link href="/login" className="w-full py-3 rounded-xl bg-white text-black font-bold hover:bg-slate-200 transition-colors text-center shadow-lg">Start Free Trial</Link>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col hover:bg-white/10 transition-colors">
            <h3 className="text-xl font-bold text-white mb-2">Enterprise</h3>
            <div className="text-4xl font-black text-white mb-6">Custom</div>
            <ul className="space-y-4 mb-8 text-slate-400 text-sm flex-1">
              <li className="flex items-center gap-2">✓ Unlimited everything</li>
              <li className="flex items-center gap-2">✓ Dedicated account manager</li>
              <li className="flex items-center gap-2">✓ SSO & advanced security</li>
              <li className="flex items-center gap-2">✓ API access</li>
            </ul>
            <button className="w-full py-3 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/10 transition-colors">Contact Sales</button>
          </div>
        </div>
      </section>

      {/* ========================================= */}
      {/* SUPPORT / FAQ SECTION */}
      {/* ========================================= */}
      <section id="support" className="relative w-full px-6 lg:px-8 py-24 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16">
          <div className="lg:w-1/3">
            <h2 className="text-4xl font-bold text-white mb-6">Need help?</h2>
            <p className="text-slate-400 mb-8">Our team is here to support you 24/7. Whether you have a technical question or just want to say hi, we're all ears.</p>
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-white">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-indigo-400">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
                <span>support@synq.app</span>
              </div>
            </div>
          </div>
          
          <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-3">
              <h4 className="text-white font-semibold">How do I get started?</h4>
              <p className="text-slate-400 text-sm">Simply create an account, create a workspace, and invite your team. You'll be up and running in under 2 minutes.</p>
            </div>
            <div className="space-y-3">
              <h4 className="text-white font-semibold">Is my data secure?</h4>
              <p className="text-slate-400 text-sm">Yes. We use industry-standard AES-256 encryption for all data at rest and TLS for data in transit.</p>
            </div>
            <div className="space-y-3">
              <h4 className="text-white font-semibold">Can I use it on mobile?</h4>
              <p className="text-slate-400 text-sm">Absolutely. Our web app is fully responsive, and native apps are currently in early access.</p>
            </div>
            <div className="space-y-3">
              <h4 className="text-white font-semibold">Do you have a free plan?</h4>
              <p className="text-slate-400 text-sm">Yes, our Starter plan is free forever for small teams of up to 5 members.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================= */}
      {/* CTA SECTION */}
      {/* ========================================= */}
      <section className="relative w-full px-6 lg:px-8 py-24 text-white text-center">
        <div className="max-w-3xl mx-auto space-y-8 relative z-10">
          <h2 className="text-4xl lg:text-6xl font-bold tracking-tight">Ready to sync up?</h2>
          <p className="text-xl text-slate-400">Join thousands of teams already using SYNQ to build better software, faster.</p>
          <Link href="/login" className="inline-block px-8 py-4 rounded-md bg-white text-black font-bold hover:bg-slate-200 transition-colors w-full sm:w-auto text-lg mt-4 shadow-lg shadow-white/10">
            Get Started for Free
          </Link>
        </div>
      </section>

      {/* ========================================= */}
      {/* FOOTER  */}
      {/* ========================================= */}
      <footer className="relative w-full py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 md:col-span-2 flex flex-col gap-6">
              <Link href="/" className="flex items-center gap-2 group">
                <span className="font-extrabold text-xl tracking-wider text-white">SYNQ</span>
              </Link>
              <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
                Empowering distributed teams with AI-driven real-time collaboration. Built for speed, clarity, and the future of work.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <strong className="text-white font-semibold text-sm">Product</strong>
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-slate-400 hover:text-white text-sm transition-colors text-left">Download</button>
              <Link href="#pricing" className="text-slate-400 hover:text-white text-sm transition-colors">Pricing</Link>
              <Link href="#support" className="text-slate-400 hover:text-white text-sm transition-colors">Documentation</Link>
            </div>
            <div className="flex flex-col gap-3">
              <strong className="text-white font-semibold text-sm">Company</strong>
              <Link href="/about" className="text-slate-400 hover:text-white text-sm transition-colors">About Us</Link>
              <Link href="#support" className="text-slate-400 hover:text-white text-sm transition-colors">Support</Link>
              <Link href="#" className="text-slate-400 hover:text-white text-sm transition-colors">Blog</Link>
            </div>
            <div className="flex flex-col gap-3">
              <strong className="text-white font-semibold text-sm">Legal</strong>
              <Link href="/privacy" className="text-slate-400 hover:text-white text-sm transition-colors">Terms of Service</Link>
              <Link href="/privacy" className="text-slate-400 hover:text-white text-sm transition-colors">Privacy Policy</Link>
              <Link href="/security" className="text-slate-400 hover:text-white text-sm transition-colors">Security</Link>
            </div>
          </div>
          <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-white/5">
            <p className="text-slate-400 text-sm">© 2026 SYNQ. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="#" className="text-slate-500 hover:text-white transition-colors">Twitter</Link>
              <Link href="#" className="text-slate-500 hover:text-white transition-colors">GitHub</Link>
              <Link href="#" className="text-slate-500 hover:text-white transition-colors">LinkedIn</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
