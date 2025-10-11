'use client';
import React, { useState } from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { RefreshCw } from 'lucide-react';

export const RescanButton: React.FC = () => {
  const { simulateRescan } = useTaskStore();
  const [loading, setLoading] = useState(false);

  const handleRescan = async () => {
    if (loading) return;
    setLoading(true);
    await simulateRescan();
    setLoading(false);
  };

  return (
    <button
      onClick={handleRescan}
      disabled={loading}
      className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white font-medium shadow hover:from-cyan-400 hover:to-fuchsia-400 transition disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Scanning…' : 'Re-scan Now'}
    </button>
  );
};
