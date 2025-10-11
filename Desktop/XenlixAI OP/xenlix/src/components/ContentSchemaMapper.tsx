'use client';

import { useMemo } from 'react';

// Types for schema generation
export interface FAQItem {
  question: string;
  answer: string;
}

export interface ServiceData {
  name: string;
  description: string;
  provider: {
    name: string;
    url: string;
  };
  areaServed?: string[];
  offers?: {
    price?: string;
    priceCurrency?: string;
    priceValidUntil?: string;
  };
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
}

export interface ProductData {
  name: string;
  description: string;
  brand: {
    name: string;
  };
  category: string;
  offers?: {
    price?: string;
    priceCurrency?: string;
    availability?: string;
    priceValidUntil?: string;
  };
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
}

// Content mapping rules
export const CONTENT_SCHEMA_MAPPING = {
  // Pages that should have FAQPage schema
  faqPages: [
    '/contact',
    '/about',
    '/plans',
    '/calculators',
    '/seo-analyzer',
    '/aeo-scan',
    '/case-studies',
    '/guidance',
    /\/case-studies\/.+/,
    /\/\[city\]/,
  ] as (string | RegExp)[],

  // Pages that should have Service schema
  servicePages: [
    '/aeo-scan',
    '/seo-analyzer',
    '/schema-generator',
    '/ai-seo-automation',
    '/ai-website-builder',
    '/calculators',
    /\/\[city\]/,
  ] as (string | RegExp)[],

  // Pages that should have Product schema
  productPages: ['/plans', '/dashboard', '/analytics'] as (string | RegExp)[],
};

// Real FAQ content for different pages (max 300 chars per answer)
export const PAGE_FAQ_CONTENT: Record<string, FAQItem[]> = {
  '/': [
    {
      question: 'What is XenlixAI?',
      answer:
        'XenlixAI is an Answer Engine Optimization (AEO) platform helping businesses get found in AI search engines like ChatGPT, Claude, Perplexity, and Google AI. We also offer traditional SEO services.',
    },
    {
      question: 'Who is XenlixAI for?',
      answer:
        'Small to medium businesses, startups, and entrepreneurs looking to improve their SEO rankings and organic traffic with AI-powered automation.',
    },
    {
      question: 'How does AEO work?',
      answer:
        'AEO optimizes content for AI engines through structured data, conversational content, and question-answer formats that AI engines prefer for citations and answers.',
    },
    {
      question: 'How much does XenlixAI cost?',
      answer:
        'We offer flexible plans starting with a free AEO audit. Premium plans include advanced analytics, automated optimization, and priority support.',
    },
  ],

  '/contact': [
    {
      question: 'How can I contact XenlixAI?',
      answer:
        'You can reach us through our contact form, email hello@xenlix.ai, or book a free consultation directly through our website.',
    },
    {
      question: 'What is your response time?',
      answer:
        "We typically respond to inquiries within 24 hours during business days. For urgent matters, please mention 'urgent' in your subject line.",
    },
    {
      question: 'Do you offer free consultations?',
      answer:
        'Yes, we offer free 30-minute consultations to discuss your AEO and AI marketing needs. Book through our contact form.',
    },
  ],

  '/aeo-scan': [
    {
      question: 'What is an AEO audit?',
      answer:
        "An AEO audit analyzes your website's visibility in AI search engines like ChatGPT and Claude, identifying optimization opportunities for better AI citations.",
    },
    {
      question: 'How long does the audit take?',
      answer:
        'Our free AEO audit generates results in under 60 seconds, providing your AI visibility score and actionable improvement recommendations.',
    },
    {
      question: 'Is the AEO audit really free?',
      answer:
        'Yes, our basic AEO audit is completely free with no strings attached. Premium detailed reports are available for comprehensive analysis.',
    },
  ],

  '/plans': [
    {
      question: 'What plans do you offer?',
      answer:
        'We offer Starter (free audit), Growth (monthly optimization), and Enterprise (custom solutions) plans to fit different business needs and budgets.',
    },
    {
      question: 'Can I change plans later?',
      answer:
        'Yes, you can upgrade or downgrade your plan at any time. Changes take effect at your next billing cycle with pro-rated adjustments.',
    },
    {
      question: 'Do you offer refunds?',
      answer:
        "We offer a 30-day money-back guarantee on all paid plans. If you're not satisfied, contact us for a full refund.",
    },
  ],

  '/calculators': [
    {
      question: 'Are the calculators free to use?',
      answer:
        'Yes, all our business calculators (ROI, pricing, conversion) are completely free to use with no registration required.',
    },
    {
      question: 'How accurate are the calculations?',
      answer:
        'Our calculators use industry-standard formulas and benchmarks. Results are estimates for planning purposes and should be verified with actual data.',
    },
  ],
};

// Service definitions for different pages
export const PAGE_SERVICE_CONTENT: Record<string, ServiceData> = {
  '/aeo-scan': {
    name: 'AEO Audit Service',
    description:
      "Comprehensive Answer Engine Optimization audit that analyzes your website's visibility in AI search engines and provides actionable recommendations.",
    provider: {
      name: 'XenlixAI',
      url: 'https://xenlix.ai',
    },
    areaServed: ['United States', 'Canada', 'United Kingdom', 'Australia'],
    offers: {
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      ratingValue: 4.8,
      reviewCount: 127,
    },
  },

  '/seo-analyzer': {
    name: 'SEO Strategy Analyzer',
    description:
      'Advanced SEO analysis tool providing comprehensive business profile analysis, keyword strategies, and local SEO recommendations for premium users.',
    provider: {
      name: 'XenlixAI',
      url: 'https://xenlix.ai',
    },
    areaServed: ['United States', 'Canada', 'United Kingdom', 'Australia'],
  },

  '/schema-generator': {
    name: 'Schema Markup Generator',
    description:
      'Automated schema markup generation tool for businesses to improve search engine visibility and rich snippet appearance.',
    provider: {
      name: 'XenlixAI',
      url: 'https://xenlix.ai',
    },
    areaServed: ['Worldwide'],
  },

  '/ai-seo-automation': {
    name: 'AI SEO Automation',
    description:
      'Automated SEO optimization using artificial intelligence to improve search rankings, content optimization, and technical SEO implementation.',
    provider: {
      name: 'XenlixAI',
      url: 'https://xenlix.ai',
    },
    areaServed: ['United States', 'Canada', 'United Kingdom', 'Australia'],
  },
};

// Product definitions for SaaS platform pages
export const PAGE_PRODUCT_CONTENT: Record<string, ProductData> = {
  '/plans': {
    name: 'XenlixAI Marketing Automation Platform',
    description:
      'AI-powered marketing automation platform with Answer Engine Optimization, SEO tools, and business growth analytics.',
    brand: {
      name: 'XenlixAI',
    },
    category: 'Software as a Service (SaaS)',
    offers: {
      price: '99',
      priceCurrency: 'USD',
      availability: 'InStock',
      priceValidUntil: '2025-12-31',
    },
    aggregateRating: {
      ratingValue: 4.8,
      reviewCount: 89,
    },
  },

  '/dashboard': {
    name: 'XenlixAI Analytics Dashboard',
    description:
      'Comprehensive analytics dashboard providing AI search visibility metrics, SEO performance tracking, and business growth insights.',
    brand: {
      name: 'XenlixAI',
    },
    category: 'Analytics Software',
    aggregateRating: {
      ratingValue: 4.7,
      reviewCount: 156,
    },
  },
};

// Schema generation functions
export function generateFAQSchema(faqItems: FAQItem[], baseUrl = 'https://xenlix.ai') {
  if (!faqItems || faqItems.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function generateServiceSchema(serviceData: ServiceData, baseUrl = 'https://xenlix.ai') {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: serviceData.name,
    description: serviceData.description,
    provider: {
      '@type': 'Organization',
      '@id': `${baseUrl}#organization`,
      name: serviceData.provider.name,
      url: serviceData.provider.url,
    },
    ...(serviceData.areaServed && {
      areaServed: serviceData.areaServed.map((area) => ({
        '@type': 'Country',
        name: area,
      })),
    }),
    ...(serviceData.offers && {
      offers: {
        '@type': 'Offer',
        ...(serviceData.offers.price && { price: serviceData.offers.price }),
        ...(serviceData.offers.priceCurrency && {
          priceCurrency: serviceData.offers.priceCurrency,
        }),
        ...(serviceData.offers.priceValidUntil && {
          priceValidUntil: serviceData.offers.priceValidUntil,
        }),
        availability: 'https://schema.org/InStock',
      },
    }),
    ...(serviceData.aggregateRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: serviceData.aggregateRating.ratingValue.toString(),
        reviewCount: serviceData.aggregateRating.reviewCount,
      },
    }),
  };
}

export function generateProductSchema(productData: ProductData, baseUrl = 'https://xenlix.ai') {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: productData.name,
    description: productData.description,
    brand: {
      '@type': 'Brand',
      name: productData.brand.name,
    },
    category: productData.category,
    ...(productData.offers && {
      offers: {
        '@type': 'Offer',
        ...(productData.offers.price && { price: productData.offers.price }),
        ...(productData.offers.priceCurrency && {
          priceCurrency: productData.offers.priceCurrency,
        }),
        ...(productData.offers.availability && {
          availability: `https://schema.org/${productData.offers.availability}`,
        }),
        ...(productData.offers.priceValidUntil && {
          priceValidUntil: productData.offers.priceValidUntil,
        }),
      },
    }),
    ...(productData.aggregateRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: productData.aggregateRating.ratingValue.toString(),
        reviewCount: productData.aggregateRating.reviewCount,
      },
    }),
  };
}

// Hook for automatic schema detection
export function useContentSchema(pathname: string) {
  return useMemo(() => {
    const schemas: any[] = [];

    // Check if page should have FAQ schema
    const shouldHaveFAQ = CONTENT_SCHEMA_MAPPING.faqPages.some((pattern) => {
      if (typeof pattern === 'string') return pathname === pattern;
      return pattern.test(pathname);
    });

    if (shouldHaveFAQ && PAGE_FAQ_CONTENT[pathname]) {
      const faqSchema = generateFAQSchema(PAGE_FAQ_CONTENT[pathname]);
      if (faqSchema) schemas.push(faqSchema);
    }

    // Check if page should have Service schema
    const shouldHaveService = CONTENT_SCHEMA_MAPPING.servicePages.some((pattern) => {
      if (typeof pattern === 'string') return pathname === pattern;
      return pattern.test(pathname);
    });

    if (shouldHaveService && PAGE_SERVICE_CONTENT[pathname]) {
      const serviceSchema = generateServiceSchema(PAGE_SERVICE_CONTENT[pathname]);
      schemas.push(serviceSchema);
    }

    // Check if page should have Product schema
    const shouldHaveProduct = CONTENT_SCHEMA_MAPPING.productPages.some((pattern) => {
      if (typeof pattern === 'string') return pathname === pattern;
      return pattern.test(pathname);
    });

    if (shouldHaveProduct && PAGE_PRODUCT_CONTENT[pathname]) {
      const productSchema = generateProductSchema(PAGE_PRODUCT_CONTENT[pathname]);
      schemas.push(productSchema);
    }

    return schemas;
  }, [pathname]);
}

export default function ContentSchemaMapper() {
  return null; // This is a utility component
}
