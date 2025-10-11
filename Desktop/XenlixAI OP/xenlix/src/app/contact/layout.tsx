import { Metadata } from 'next';
import BreadcrumbSchema from '../../components/BreadcrumbSchema';
import VisualBreadcrumbs from '../../components/VisualBreadcrumbs';
import ContentSchema from '../../components/ContentSchema';

export const metadata: Metadata = {
  title: 'Contact XenlixAI | Get Expert Help with AEO & AI Marketing',
  description:
    'Get expert help with AI search optimization & marketing automation. Book a free consultation with our AEO specialists. Start your growth today!',
  keywords:
    'contact XenlixAI, AEO consultation, AI marketing help, answer engine optimization support, AI search optimization contact, book AEO demo',
  openGraph: {
    title: 'Contact XenlixAI | Get Expert Help with AEO & AI Marketing',
    description:
      'Get expert help with Answer Engine Optimization (AEO), AI search visibility, and AI marketing automation. Book a free consultation with our AEO specialists.',
    type: 'website',
    url: 'https://www.xenlixai.com/contact',
    siteName: 'XenlixAI',
    images: [
      {
        url: 'https://www.xenlixai.com/og-contact.jpg',
        width: 1200,
        height: 630,
        alt: 'Contact XenlixAI - AEO & AI Marketing Experts',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact XenlixAI — Book Demo / Get in Touch',
    description:
      'Ready to transform your advertising with AI? Book a personalized demo or get in touch with our team.',
    creator: '@XenlixAI',
    images: ['https://www.xenlixai.com/og-contact.jpg'],
  },
  alternates: {
    canonical: 'https://www.xenlixai.com/contact',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* BreadcrumbList + WebPage Schema */}
      <BreadcrumbSchema
        webPageProps={{
          name: 'Contact Us | XenlixAI',
          description:
            'Get expert help with Answer Engine Optimization (AEO), AI search visibility, and AI marketing automation. Book a free consultation with our AEO specialists.',
          dateModified: new Date().toISOString().split('T')[0],
          author: {
            '@type': 'Organization',
            '@id': 'https://xenlix.ai#organization',
          },
        }}
      />

      {/* Content Schema (FAQ for Contact Page) */}
      <ContentSchema />

      {/* Visual Breadcrumbs */}
      <VisualBreadcrumbs />

      {/* Page Content */}
      {children}
    </>
  );
}
