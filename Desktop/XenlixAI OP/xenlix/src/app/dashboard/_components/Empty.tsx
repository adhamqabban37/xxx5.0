import Link from 'next/link';
import { ReactNode } from 'react';

interface EmptyProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  ctaText?: string;
  ctaHref?: string;
  className?: string;
}

export default function Empty({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  ctaText,
  ctaHref,
  className = '',
}: EmptyProps) {
  // Use actionLabel/actionHref if provided, otherwise fall back to ctaText/ctaHref
  const buttonText = actionLabel || ctaText;
  const buttonHref = actionHref || ctaHref;
  return (
    <div className={`text-center py-8 ${className}`}>
      {icon && (
        <div className="text-4xl mb-4" aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">{description}</p>
      {buttonText && buttonHref && (
        <Link
          href={buttonHref}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {buttonText}
        </Link>
      )}
    </div>
  );
}
