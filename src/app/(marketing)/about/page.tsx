import React from 'react';
import Navbar from '../Navbar';

export default function AboutPage() {
  return (
    <main className="relative min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-6 pt-40 pb-24 relative z-10">
        <h1 className="text-5xl lg:text-7xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-500">
          Reimagining Team Synergy.
        </h1>
        
        <div className="space-y-8 text-lg text-slate-400 leading-relaxed">
          <p>
            At SYNQ, we believe that the tools we use shouldn't just store information—they should facilitate flow. In a world of fragmented apps and endless notifications, we set out to build a unified workspace where communication and action are one and the same.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 py-12">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">Our Mission</h2>
              <p>To eliminate the friction of distributed work by creating an environment where teams feel as connected as if they were in the same room.</p>
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">Our Vision</h2>
              <p>A future where distance is irrelevant to collaboration, and where every great idea has a clear path from conversation to completion.</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white mt-16 mb-6">Why SYNQ?</h2>
          <p>
            Most tools force you to choose between "talking about work" and "doing work." SYNQ bridges that gap. We've combined low-latency voice channels with high-velocity task management to create a platform that adapts to how you naturally work.
          </p>
          
          <p>
            Whether you're a startup scaling at light speed or a global enterprise coordination complex workflows, SYNQ provides the clarity and speed you need to build the future.
          </p>
        </div>
      </div>

      {/* Decorative Background Glow */}
      <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full -z-10" />
      <div className="fixed bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full -z-10" />
    </main>
  );
}
