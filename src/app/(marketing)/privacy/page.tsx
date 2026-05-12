import React from 'react';
import Navbar from '../Navbar';

export default function PrivacyPage() {
  return (
    <main className="relative min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-6 pt-40 pb-24 relative z-10">
        <h1 className="text-4xl lg:text-6xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-slate-400 mb-12">Last Updated: May 2026</p>
        
        <div className="space-y-12 text-slate-400 leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">1. Our Commitment to Privacy</h2>
            <p>
              Your privacy is fundamental to our mission at SYNQ. We build our platform with your data security and confidentiality at the forefront of every decision. This policy explains what information we collect, how we use it, and how we protect it.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">2. Information We Collect</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-slate-200">Account Information:</strong> Your name, email address, and professional profile details.</li>
              <li><strong className="text-slate-200">Workspace Data:</strong> Messages, tasks, files, and room configurations created within your workspaces.</li>
              <li><strong className="text-slate-200">Usage Data:</strong> Technical logs to help us improve performance and stability.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">3. How We Use Your Data</h2>
            <p>
              We use your data solely to provide and improve the SYNQ experience. We <strong className="text-white">never</strong> sell your personal information to third parties. Your data is used for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Maintaining your account and workspaces.</li>
              <li>Enabling real-time communication and task synchronization.</li>
              <li>Providing customer support and technical assistance.</li>
              <li>Security monitoring and fraud prevention.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">4. Data Retention & Deletion</h2>
            <p>
              You own your data. You can export or delete your workspace data at any time. Upon account termination, we purge your personal data from our active systems within 30 days.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">5. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact our Data Protection Officer at <span className="text-indigo-400">privacy@synq.app</span>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
