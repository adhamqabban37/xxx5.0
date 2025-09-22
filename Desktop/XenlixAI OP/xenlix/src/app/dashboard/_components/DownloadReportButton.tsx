'use client';
import React from 'react';
import { Download, Loader2 } from 'lucide-react';

export function DownloadReportButton({ auditData }: { auditData: any }) {
  const [downloading, setDownloading] = React.useState(false);

  async function handleDownloadReport() {
    if (downloading) return;
    setDownloading(true);
    try {
      const res = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auditData)
      });
      if (!res.ok) {
        if (res.status === 401) {
          alert('You must be signed in to download the report. Please sign in and try again.');
        } else {
          alert('Could not generate report. Please try again later.');
        }
        throw new Error('Failed to generate report');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'xenlix-full-report.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      // Error message already shown above
    } finally {
      setDownloading(false);
    }
  }

  return (
    <button
      onClick={handleDownloadReport}
      disabled={downloading}
      className={`relative bg-transparent font-semibold py-4 px-6 rounded-lg transition-all duration-300 border-2 hover:shadow-md flex flex-col items-center justify-center ${downloading ? 'cursor-not-allowed opacity-60 border-cyan-400 text-cyan-300' : 'text-cyan-400 hover:text-cyan-300 border-cyan-500 hover:border-cyan-400 hover:bg-cyan-500/10'}`}
    >
      <span className="flex items-center justify-center">
        {downloading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Download className="w-5 h-5 mr-2" />}
        <span>{downloading ? 'Generating...' : 'Download Full Report'}</span>
      </span>
      <div className="text-xs opacity-75 mt-1">Get detailed analysis</div>
    </button>
  );
}
