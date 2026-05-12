import React from 'react';
import Navbar from '../Navbar';
import { Shield, Lock, EyeOff, Server, HardDrive, Cpu } from 'lucide-react';

export default function SecurityPage() {
  return (
    <main className="relative min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-6 pt-40 pb-24 relative z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-bold mb-6 uppercase tracking-widest">
            <Shield size={16} /> Enterprise-Grade Security
          </div>
          <h1 className="text-5xl lg:text-7xl font-bold mb-6 tracking-tight">Your data, <br />fortified.</h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            At SYNQ, security isn't a feature—it's the foundation of everything we build. We employ multi-layered security protocols to keep your team's collaboration private and safe.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          <div className="p-8 rounded-[32px] bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
              <Lock size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">Encryption in Transit</h3>
            <p className="text-slate-400 text-sm leading-relaxed">All data transmitted between your device and our servers is encrypted using industry-standard TLS 1.3 protocols.</p>
          </div>
          <div className="p-8 rounded-[32px] bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-6">
              <HardDrive size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">Encryption at Rest</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Your files and messages are stored with AES-256 military-grade encryption on our distributed server infrastructure.</p>
          </div>
          <div className="p-8 rounded-[32px] bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6">
              <EyeOff size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">Zero Knowledge</h3>
            <p className="text-slate-400 text-sm leading-relaxed">We design our systems to ensure your sensitive communication remains private. Your workspace, your rules.</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-600/10 to-transparent border border-white/10 rounded-[40px] p-8 lg:p-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Infrastructure Security</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="shrink-0 text-indigo-400"><Server size={20} /></div>
                  <div>
                    <h4 className="font-semibold text-white">Global Compliance</h4>
                    <p className="text-slate-400 text-sm">Hosted on ISO 27001, SOC 2, and HIPAA compliant data centers worldwide.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="shrink-0 text-blue-400"><Cpu size={20} /></div>
                  <div>
                    <h4 className="font-semibold text-white">Automatic Vulnerability Scanning</h4>
                    <p className="text-slate-400 text-sm">Real-time monitoring and automated scanning for infrastructure and code-level vulnerabilities.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center">
               <Shield size={80} className="text-white/5 animate-pulse" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
               <div className="absolute bottom-6 left-6 right-6">
                 <div className="text-xs font-mono text-indigo-400 opacity-60">SECURITY_FIREWALL_ACTIVE: 100%</div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
