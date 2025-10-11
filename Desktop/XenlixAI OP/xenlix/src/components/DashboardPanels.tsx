import DashboardCard from './DashboardCard';
// Switched to lucide-react icons (already installed) to avoid adding react-icons dependency
import { Bot, Zap, Search, MapPin, CheckCircle, AlertTriangle } from 'lucide-react';

// AEO Coverage Panel
export function AEOCoveragePanel() {
  const engines = [
    { name: 'Google SGE', score: 82 },
    { name: 'Bing Copilot', score: 74 },
    { name: 'Perplexity', score: 65 },
  ];
  return (
    <DashboardCard title="AEO Coverage" icon={<Bot className="w-6 h-6" />}>
      <ul className="space-y-4">
        {engines.map((e) => (
          <li key={e.name} className="flex flex-col">
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-200">{e.name}</span>
              <span className="text-cyan-400 font-bold">{e.score}/100</span>
            </div>
            <div className="w-full h-2 bg-slate-700 rounded">
              <div className="h-2 rounded bg-cyan-500" style={{ width: `${e.score}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}

// Performance Panel
export function PerformancePanel() {
  const assets = [
    { name: 'hero-bg.jpg', size: '320KB', msSaved: 120 },
    { name: 'main.js', size: '210KB', msSaved: 80 },
  ];
  return (
    <DashboardCard title="Performance" icon={<Zap className="w-6 h-6" />}>
      <table className="w-full text-sm text-gray-300">
        <thead>
          <tr>
            <th className="text-left py-1">Asset</th>
            <th className="text-left py-1">Size</th>
            <th className="text-left py-1">ms Saved</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((a) => (
            <tr key={a.name} className="border-t border-slate-700">
              <td className="py-1">{a.name}</td>
              <td className="py-1">{a.size}</td>
              <td className="py-1 text-cyan-400 font-bold">{a.msSaved}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </DashboardCard>
  );
}

// Indexability Panel
export function IndexabilityPanel() {
  const items = [
    { name: 'Sitemap.xml', status: 'ok' },
    { name: 'robots.txt', status: 'ok' },
    { name: 'Broken Links', status: 'warn' },
  ];
  return (
    <DashboardCard title="Indexability" icon={<Search className="w-6 h-6" />}>
      <ul className="space-y-3">
        {items.map((i) => (
          <li key={i.name} className="flex items-center gap-2">
            {i.status === 'ok' ? (
              <CheckCircle className="text-green-400 w-4 h-4" />
            ) : (
              <AlertTriangle className="text-yellow-400 w-4 h-4" />
            )}
            <span className="text-gray-200">{i.name}</span>
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}

// Local SEO Panel
export function LocalSEOPanel() {
  const localItems = [
    { name: 'Google Business Profile', status: 'ok' },
    { name: 'Yelp Listing', status: 'warn' },
    { name: 'Hours Consistency', status: 'ok' },
  ];
  return (
    <DashboardCard title="Local SEO" icon={<MapPin className="w-6 h-6" />}>
      <ul className="space-y-3">
        {localItems.map((i) => (
          <li key={i.name} className="flex items-center gap-2">
            {i.status === 'ok' ? (
              <CheckCircle className="text-green-400 w-4 h-4" />
            ) : (
              <AlertTriangle className="text-yellow-400 w-4 h-4" />
            )}
            <span className="text-gray-200">{i.name}</span>
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}
