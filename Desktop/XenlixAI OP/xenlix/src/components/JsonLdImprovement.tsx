'use client';

import { useState } from 'react';
import { CheckCircle, AlertCircle, Copy, Download, Zap, TrendingUp } from 'lucide-react';

interface JsonLdSchema {
  '@context'?: string;
  '@type': string;
  [key: string]: any;
}

interface JsonLdAnalysis {
  current: JsonLdSchema[];
  weaknesses: string[];
  recommendations: string[];
  improved: JsonLdSchema[];
  completenessScore: number;
  aeoScore: number;
}

interface JsonLdImprovementProps {
  analysis: JsonLdAnalysis;
  className?: string;
}

export default function JsonLdImprovement({ analysis, className = '' }: JsonLdImprovementProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showAllSchemas, setShowAllSchemas] = useState(false);

  const copyToClipboard = async (schema: JsonLdSchema, index: number) => {
    try {
      const jsonString = JSON.stringify(schema, null, 2);
      await navigator.clipboard.writeText(jsonString);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const downloadAllSchemas = () => {
    const allSchemas = analysis.improved;
    const jsonString = JSON.stringify(allSchemas, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'improved-json-ld-schemas.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500/20 border-green-500/30';
    if (score >= 60) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  return (
    <div className={`bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">
            JSON-LD Schema Analysis
          </h3>
          <p className="text-white/60 text-sm">
            Structured data optimization for AI search engines
          </p>
        </div>
        
        {/* Scores */}
        <div className="flex space-x-4">
          <div className={`px-3 py-2 rounded-lg border ${getScoreBg(analysis.completenessScore)}`}>
            <div className="text-xs text-white/60">Completeness</div>
            <div className={`text-lg font-bold ${getScoreColor(analysis.completenessScore)}`}>
              {analysis.completenessScore}%
            </div>
          </div>
          <div className={`px-3 py-2 rounded-lg border ${getScoreBg(analysis.aeoScore)}`}>
            <div className="text-xs text-white/60">AEO Score</div>
            <div className={`text-lg font-bold ${getScoreColor(analysis.aeoScore)}`}>
              {analysis.aeoScore}/100
            </div>
          </div>
        </div>
      </div>

      {/* Current Schemas */}
      {analysis.current.length > 0 && (
        <div className="mb-6">
          <h4 className="text-brand-400 font-medium mb-3 flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            Current Schemas ({analysis.current.length})
          </h4>
          <div className="space-y-2">
            {analysis.current.slice(0, showAllSchemas ? undefined : 3).map((schema, index) => (
              <div key={index} className="bg-black/20 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <span className="text-green-400 font-medium">{schema['@type']}</span>
                  {schema.name && (
                    <span className="text-white/60 ml-2 text-sm">- {schema.name}</span>
                  )}
                </div>
                <div className="text-xs text-white/40">
                  {Object.keys(schema).length} properties
                </div>
              </div>
            ))}
            {analysis.current.length > 3 && (
              <button
                onClick={() => setShowAllSchemas(!showAllSchemas)}
                className="text-brand-400 text-sm hover:text-brand-300 transition-colors"
              >
                {showAllSchemas ? 'Show less' : `Show ${analysis.current.length - 3} more`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Weaknesses & Recommendations */}
      {analysis.weaknesses.length > 0 && (
        <div className="mb-6">
          <h4 className="text-red-400 font-medium mb-3 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            Improvement Areas ({analysis.weaknesses.length})
          </h4>
          <div className="space-y-2">
            {analysis.weaknesses.map((weakness, index) => (
              <div key={index} className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <div className="text-red-300 text-sm mb-1">• {weakness}</div>
                {analysis.recommendations[index] && (
                  <div className="text-white/60 text-xs ml-4">
                    💡 {analysis.recommendations[index]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Improved Schemas */}
      {analysis.improved.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-brand-400 font-medium flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              Optimized JSON-LD ({analysis.improved.length} schemas)
            </h4>
            <button
              onClick={downloadAllSchemas}
              className="flex items-center space-x-1 px-3 py-1 bg-brand-600/20 border border-brand-500/30 rounded-lg text-brand-400 hover:bg-brand-600/30 transition-colors text-sm"
            >
              <Download className="h-3 w-3" />
              <span>Download All</span>
            </button>
          </div>
          
          <div className="space-y-4">
            {analysis.improved.map((schema, index) => (
              <div key={index} className="bg-black/30 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-3 bg-black/20">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-green-400" />
                    <span className="text-white font-medium">{schema['@type']} Schema</span>
                    <span className="text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded">
                      AEO Optimized
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(schema, index)}
                    className="flex items-center space-x-1 px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded text-sm transition-colors"
                  >
                    <Copy className="h-3 w-3" />
                    <span>{copiedIndex === index ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                
                <pre className="bg-black/40 p-4 text-xs text-green-300 overflow-x-auto border-t border-white/10">
                  {JSON.stringify(schema, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Implementation Guide */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <h5 className="text-blue-400 font-medium mb-2">Implementation Guide</h5>
        <div className="text-white/80 text-sm space-y-1">
          <p>1. Copy the optimized JSON-LD schemas above</p>
          <p>2. Add them to your website's &lt;head&gt; section inside &lt;script type="application/ld+json"&gt; tags</p>
          <p>3. Validate your implementation using Google's Rich Results Test</p>
          <p>4. Monitor improvements in AI search visibility over 2-4 weeks</p>
        </div>
      </div>
    </div>
  );
}