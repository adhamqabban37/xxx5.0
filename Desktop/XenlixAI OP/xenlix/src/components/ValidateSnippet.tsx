"use client"
import React, { useState } from "react";

type Strategy = 'exact' | 'normalized' | 'fuzzy';

interface ValidateSnippetProps {
  snippet: string;
  targetUrl: string;
  defaultStrategy?: Strategy;
}

export default function ValidateSnippet({ snippet, targetUrl, defaultStrategy = 'exact' }: ValidateSnippetProps) {
  const [status, setStatus] = useState("Not Validated");
  const [loading, setLoading] = useState(false);
  const [strategy, setStrategy] = useState<Strategy>(defaultStrategy);
  const [threshold, setThreshold] = useState(0.85);
  const [score, setScore] = useState<number | null>(null);
  const [diagnostics, setDiagnostics] = useState<any>(null);

  const handleValidate = async () => {
    setLoading(true);
    setStatus("Validating...");
    setScore(null);
    setDiagnostics(null);
    try {
      const res = await fetch("/api/validate-snippet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUrl, snippet, strategy, threshold }),
      });
      const data = await res.json();
      setStatus(data.status === "pass" ? "Pass" : "Fail");
      if (typeof data.score === 'number') setScore(data.score);
      if (data.diagnostics) setDiagnostics(data.diagnostics);
    } catch (e) {
      setStatus("Error");
    }
    setLoading(false);
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 max-w-xl mx-auto">
      <h2 className="text-lg font-bold mb-2">Paste this code on your site:</h2>
      <pre className="bg-slate-900 p-4 rounded text-sm mb-4 overflow-x-auto">{snippet}</pre>
      <div className="mb-4 text-gray-400">
        <strong>Where to paste this:</strong> In your website’s <code>&lt;head&gt;</code> or as instructed.
      </div>
      <div className="flex flex-col md:flex-row md:items-end gap-4 mb-4">
        <div className="flex-1">
          <label className="block text-xs uppercase tracking-wide text-gray-400 mb-1">Validation Mode</label>
          <select
            value={strategy}
            onChange={e => setStrategy(e.target.value as Strategy)}
            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="exact">Exact</option>
            <option value="normalized">Normalized</option>
            <option value="fuzzy">Fuzzy (Token %)</option>
          </select>
          <p className="text-[11px] text-gray-500 mt-1">
            Exact: raw substring. Normalized: whitespace & case ignored. Fuzzy: token overlap %. 
          </p>
        </div>
        {strategy === 'fuzzy' && (
          <div className="w-full md:w-48">
            <label className="block text-xs uppercase tracking-wide text-gray-400 mb-1">Threshold ({Math.round(threshold*100)}%)</label>
            <input
              type="range"
              min={0.5}
              max={0.99}
              step={0.01}
              value={threshold}
              onChange={e => setThreshold(parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-[11px] text-gray-500 mt-1">Minimum token match % to pass.</p>
          </div>
        )}
        <div>
          <button
            className="px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 w-full"
            onClick={handleValidate}
            disabled={loading}
          >
            {loading ? "Validating..." : "Validate"}
          </button>
        </div>
      </div>
      <div className="mt-4">
        <span>Status: </span>
        <span
          className={
            status === "Pass"
              ? "text-green-400 font-bold"
              : status === "Fail"
              ? "text-red-400 font-bold"
              : "text-gray-400"
          }
        >
          {status}
        </span>
        {strategy === 'fuzzy' && score !== null && (
          <div className="mt-2 text-sm text-gray-400">
            Score: <span className="text-cyan-400 font-semibold">{(score*100).toFixed(1)}%</span> (needs ≥ {(threshold*100).toFixed(0)}%)
            {diagnostics && (
              <div className="mt-1 text-[11px] text-gray-500">
                Matched tokens {diagnostics.matchedTokens}/{diagnostics.totalTokens}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
