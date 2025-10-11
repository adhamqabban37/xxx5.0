interface KpiProps {
  title: string;
  value: string | number;
  helpText?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export default function Kpi({ title, value, helpText, trend }: KpiProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <span className="text-green-500">↗</span>;
      case 'down':
        return <span className="text-red-500">↘</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-600">{title}</h4>
        {getTrendIcon()}
      </div>
      <div className="mt-2">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {helpText && <div className="text-xs text-gray-500 mt-1">{helpText}</div>}
      </div>
    </div>
  );
}
