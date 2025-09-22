// Example UI snippets showing GSC integration features

// 1. Index Status Badge Component
export const IndexBadge = ({ status, verdict }: { 
  status: 'indexed' | 'not-indexed' | 'partially-indexed' | 'unknown';
  verdict: string;
}) => {
  const colorClasses = {
    indexed: 'bg-green-100 text-green-800',
    'not-indexed': 'bg-red-100 text-red-800',
    'partially-indexed': 'bg-yellow-100 text-yellow-800',
    unknown: 'bg-gray-100 text-gray-800',
  };
  
  const icons = {
    indexed: '✓',
    'not-indexed': '✗',
    'partially-indexed': '⚠',
    unknown: '?',
  };
  
  return (
    <span 
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorClasses[status]}`}
      title={verdict}
    >
      {icons[status]} {status.replace('-', ' ').toUpperCase()}
    </span>
  );
};

// 2. Query Performance Row
export const QueryRow = ({ query, clicks, impressions, ctr, position }: {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}) => (
  <tr className="hover:bg-gray-50">
    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={query}>
      {query}
    </td>
    <td className="px-6 py-4 text-sm text-gray-900">{clicks.toLocaleString()}</td>
    <td className="px-6 py-4 text-sm text-gray-900">{impressions.toLocaleString()}</td>
    <td className="px-6 py-4 text-sm text-gray-900">{(ctr * 100).toFixed(1)}%</td>
    <td className="px-6 py-4 text-sm text-gray-900">{position.toFixed(1)}</td>
  </tr>
);

// 3. Page Performance Row with Index Badge
export const PageRow = ({ page, clicks, impressions, ctr, position, indexStatus }: {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  indexStatus: { status: string; verdict: string; };
}) => (
  <tr className="hover:bg-gray-50">
    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={page}>
      {page}
    </td>
    <td className="px-6 py-4 text-sm text-gray-900">{clicks.toLocaleString()}</td>
    <td className="px-6 py-4 text-sm text-gray-900">{impressions.toLocaleString()}</td>
    <td className="px-6 py-4 text-sm text-gray-900">{(ctr * 100).toFixed(1)}%</td>
    <td className="px-6 py-4 text-sm text-gray-900">{position.toFixed(1)}</td>
    <td className="px-6 py-4 text-sm text-gray-900">
      <IndexBadge 
        status={indexStatus.status as any} 
        verdict={indexStatus.verdict} 
      />
    </td>
  </tr>
);

// 4. Summary Cards
export const SummaryCard = ({ title, value, change }: {
  title: string;
  value: string | number;
  change?: { value: number; type: 'increase' | 'decrease' };
}) => (
  <div className="bg-white p-6 rounded-lg border border-gray-200">
    <div className="text-sm font-medium text-gray-500">{title}</div>
    <div className="mt-2 text-3xl font-bold text-gray-900">{value}</div>
    {change && (
      <div className={`mt-2 text-sm ${change.type === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
        {change.type === 'increase' ? '↗' : '↘'} {Math.abs(change.value)}
      </div>
    )}
  </div>
);

// 5. API Usage Examples

// Fetch sites for property picker
export const fetchGSCSites = async () => {
  const response = await fetch('/api/gsc/sites');
  const data = await response.json();
  return data.data.sites;
};

// Get search analytics data
export const fetchSearchAnalytics = async (siteUrl: string, days = 28) => {
  const response = await fetch('/api/gsc/search-analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      siteUrl,
      days,
      dimensions: ['query'],
      rowLimit: 100,
    }),
  });
  const data = await response.json();
  return data.data;
};

// Get URL inspection data
export const fetchUrlInspection = async (siteUrl: string, url: string) => {
  const response = await fetch(`/api/gsc/url-inspect?siteUrl=${encodeURIComponent(siteUrl)}&url=${encodeURIComponent(url)}`);
  const data = await response.json();
  return data.data;
};