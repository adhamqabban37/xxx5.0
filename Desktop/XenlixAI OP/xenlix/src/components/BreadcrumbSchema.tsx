'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

// Route mapping for custom breadcrumb names (max 60 chars)
const ROUTE_NAMES: Record<string, string> = {
  // Root
  '': 'Home',
  
  // Main sections
  'contact': 'Contact Us',
  'about': 'About XenlixAI',
  'plans': 'Pricing Plans',
  'signup': 'Sign Up',
  'signin': 'Sign In',
  
  // Tools & Features
  'aeo-scan': 'AEO Audit',
  'seo-analyzer': 'SEO Strategy Analyzer',
  'schema-generator': 'Schema Generator',
  'calculators': 'Business Calculators',
  'ai-website-builder': 'AI Website Builder',
  'ai-seo-automation': 'AI SEO Automation',
  
  // Calculator types
  'roi': 'ROI Calculator',
  'pricing': 'Pricing Calculator',
  'conversion': 'Conversion Calculator',
  
  // Business sections
  'dashboard': 'Dashboard',
  'analytics': 'Analytics',
  'onboarding': 'Onboarding',
  'guidance': 'Guidance',
  'checkout': 'Checkout',
  'city-management': 'City Management',
  
  // Content sections
  'case-studies': 'Case Studies',
  'vs-competitors': 'Competitive Analysis',
  'ads': 'Ad Creator',
  'tools': 'Marketing Tools',
  
  // Dynamic routes
  'auto-detailing-dallas': 'Auto Detailing Case Study',
  'consulting-firm-lead-generation': 'Consulting Firm Case Study',
  'dental-practice-ai-optimization': 'Dental Practice Case Study',
  'restaurant-chain-expansion': 'Restaurant Chain Case Study',
  'saas-blended-cac-reduction': 'SaaS CAC Reduction Case Study',
  
  // City pages
  'dallas': 'Dallas SEO Services',
  'houston': 'Houston SEO Services',
  'austin': 'Austin SEO Services',
  'fort-worth': 'Fort Worth SEO Services',
  'san-antonio': 'San Antonio SEO Services',
};

// Category mapping for section grouping
const ROUTE_CATEGORIES: Record<string, string> = {
  'calculators': 'Business Tools',
  'case-studies': 'Success Stories',
  'seo-analyzer': 'SEO Tools',
  'schema-generator': 'SEO Tools',
  'aeo-scan': 'SEO Tools',
  'ai-website-builder': 'AI Tools',
  'ai-seo-automation': 'AI Tools',
  'ads': 'Marketing Tools',
  'tools': 'Marketing Tools',
  'dashboard': 'Account',
  'analytics': 'Account',
  'onboarding': 'Account',
  'guidance': 'Account',
  'checkout': 'Account',
};

export interface BreadcrumbItem {
  name: string;
  url: string;
  position: number;
}

export interface BreadcrumbSchemaProps {
  /** Base URL for the site */
  baseUrl?: string;
  /** Override breadcrumb items */
  customBreadcrumbs?: BreadcrumbItem[];
  /** Additional schema props for WebPage */
  webPageProps?: {
    name?: string;
    description?: string;
    datePublished?: string;
    dateModified?: string;
    author?: any;
    publisher?: any;
  };
}

export function useBreadcrumbs(customBreadcrumbs?: BreadcrumbItem[]): BreadcrumbItem[] {
  const pathname = usePathname();
  
  return useMemo(() => {
    if (customBreadcrumbs) {
      return customBreadcrumbs;
    }

    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];
    
    // Always start with home
    breadcrumbs.push({
      name: 'Home',
      url: '/',
      position: 1
    });

    // Build breadcrumbs from URL segments
    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Get display name for segment
      const displayName = ROUTE_NAMES[segment] || 
                         segment.split('-').map(word => 
                           word.charAt(0).toUpperCase() + word.slice(1)
                         ).join(' ');
      
      breadcrumbs.push({
        name: displayName.length > 60 ? displayName.substring(0, 57) + '...' : displayName,
        url: currentPath,
        position: index + 2
      });
    });

    return breadcrumbs;
  }, [pathname, customBreadcrumbs]);
}

export function generateBreadcrumbSchema(breadcrumbs: BreadcrumbItem[], baseUrl: string = 'https://xenlix.ai') {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map(crumb => ({
      "@type": "ListItem",
      "position": crumb.position,
      "name": crumb.name,
      "item": {
        "@type": "WebPage",
        "@id": `${baseUrl}${crumb.url}`,
        "url": `${baseUrl}${crumb.url}`,
        "name": crumb.name
      }
    }))
  };
}

export function generateWebPageSchema(
  url: string,
  breadcrumbs: BreadcrumbItem[],
  props?: BreadcrumbSchemaProps['webPageProps'],
  baseUrl: string = 'https://xenlix.ai'
) {
  const currentPageName = breadcrumbs[breadcrumbs.length - 1]?.name || 'Page';
  
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${baseUrl}${url}#webpage`,
    "url": `${baseUrl}${url}`,
    "name": props?.name || `${currentPageName} | XenlixAI`,
    "description": props?.description || `${currentPageName} - AI-powered marketing automation and SEO optimization tools.`,
    "isPartOf": {
      "@type": "WebSite",
      "@id": `${baseUrl}#website`,
      "url": baseUrl,
      "name": "XenlixAI"
    },
    "about": {
      "@type": "Organization",
      "@id": `${baseUrl}#organization`,
      "name": "XenlixAI"
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "@id": `${baseUrl}${url}#breadcrumb`
    },
    "primaryImageOfPage": {
      "@type": "ImageObject",
      "url": `${baseUrl}/og-${url.split('/').pop() || 'default'}.jpg`,
      "width": 1200,
      "height": 630
    },
    "datePublished": props?.datePublished || "2024-01-01",
    "dateModified": props?.dateModified || new Date().toISOString().split('T')[0],
    "inLanguage": "en-US",
    ...(props?.author && { "author": props.author }),
    ...(props?.publisher && { "publisher": props.publisher })
  };
}

export default function BreadcrumbSchema({ 
  baseUrl = 'https://xenlix.ai', 
  customBreadcrumbs,
  webPageProps 
}: BreadcrumbSchemaProps) {
  const pathname = usePathname();
  const breadcrumbs = useBreadcrumbs(customBreadcrumbs);
  
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs, baseUrl);
  const webPageSchema = generateWebPageSchema(pathname, breadcrumbs, webPageProps, baseUrl);
  
  return (
    <>
      {/* BreadcrumbList Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema)
        }}
      />
      
      {/* WebPage Schema with Breadcrumb Reference */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageSchema)
        }}
      />
    </>
  );
}