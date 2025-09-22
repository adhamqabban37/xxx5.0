"use client";

import { Copy } from 'lucide-react';

interface CopyButtonProps {
  code: string;
}

export function CopyButton({ code }: CopyButtonProps) {
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add toast notification here if needed
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <button
      onClick={() => copyToClipboard(code)}
      className="flex items-center space-x-1 text-blue-400 hover:text-blue-300"
    >
      <Copy className="w-4 h-4" />
      <span className="text-sm">Copy</span>
    </button>
  );
}