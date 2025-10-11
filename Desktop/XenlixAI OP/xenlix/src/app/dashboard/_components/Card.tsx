import { ReactNode } from 'react';

interface CardProps {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export default function Card({
  title,
  description,
  children,
  action,
  footer,
  className = '',
}: CardProps) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}
    >
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            {description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      </div>
      <div className="p-6">{children}</div>
      {footer && (
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
          {footer}
        </div>
      )}
    </div>
  );
}
