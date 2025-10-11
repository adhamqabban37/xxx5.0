'use client';

import Link from 'next/link';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/20/solid';
import { useBreadcrumbs, type BreadcrumbItem } from './BreadcrumbSchema';

export interface VisualBreadcrumbsProps {
  /** Custom breadcrumb items to override automatic generation */
  customBreadcrumbs?: BreadcrumbItem[];
  /** Custom separator icon */
  separator?: React.ReactNode;
  /** Show home icon instead of "Home" text */
  showHomeIcon?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Hide on mobile */
  hideOnMobile?: boolean;
}

export default function VisualBreadcrumbs({
  customBreadcrumbs,
  separator = <ChevronRightIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />,
  showHomeIcon = true,
  className = '',
  hideOnMobile = true,
}: VisualBreadcrumbsProps) {
  const breadcrumbs = useBreadcrumbs(customBreadcrumbs);

  // Don't render if only home breadcrumb
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav
      className={`
        bg-gray-50 border-b border-gray-200 
        ${hideOnMobile ? 'hidden sm:block' : ''} 
        ${className}
      `}
      aria-label="Breadcrumb"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-4 py-4">
          <ol className="flex items-center space-x-4">
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              const isHome = index === 0;

              return (
                <li key={crumb.url} className="flex items-center">
                  {index > 0 && <div className="flex items-center">{separator}</div>}

                  <div
                    className={`ml-4 text-sm font-medium ${
                      isLast ? 'text-gray-700 cursor-default' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {isLast ? (
                      <span
                        className="truncate max-w-xs sm:max-w-sm lg:max-w-md"
                        aria-current="page"
                      >
                        {isHome && showHomeIcon ? (
                          <HomeIcon className="h-4 w-4" aria-label="Home" />
                        ) : (
                          crumb.name
                        )}
                      </span>
                    ) : (
                      <Link
                        href={crumb.url}
                        className="transition-colors duration-200 hover:underline truncate max-w-xs sm:max-w-sm lg:max-w-md block"
                      >
                        {isHome && showHomeIcon ? (
                          <HomeIcon className="h-4 w-4" aria-label="Home" />
                        ) : (
                          crumb.name
                        )}
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </nav>
  );
}
