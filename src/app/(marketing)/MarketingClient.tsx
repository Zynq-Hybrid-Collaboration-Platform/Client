'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const MarketingSections = dynamic(() => import('./MarketingSections'), { 
  ssr: false,
  loading: () => <div className="min-h-screen bg-[#0a0a0a]" />
});

export default function MarketingClient() {
  return <MarketingSections />;
}
