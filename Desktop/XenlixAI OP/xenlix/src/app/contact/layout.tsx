import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact XenlixAI | Get Expert Help with AEO & AI Marketing',
  description: 'Get expert help with Answer Engine Optimization (AEO), AI search visibility, and AI marketing automation. Book a free consultation with our AEO specialists.',
  keywords: 'contact XenlixAI, AEO consultation, AI marketing help, answer engine optimization support, AI search optimization contact, book AEO demo',
  openGraph: {
    title: 'Contact XenlixAI | Get Expert Help with AEO & AI Marketing',
    description: 'Get expert help with Answer Engine Optimization (AEO), AI search visibility, and AI marketing automation. Book a free consultation with our AEO specialists.',
    type: 'website',
    url: '/contact',
    siteName: 'XenlixAI',
    images: [
      {
        url: '/og-contact.jpg',
        width: 1200,
        height: 630,
        alt: 'Contact XenlixAI - AEO & AI Marketing Experts',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact XenlixAI — Book Demo / Get in Touch',
    description: 'Ready to transform your advertising with AI? Book a personalized demo or get in touch with our team.',
    images: ['https://yourdomain.com/og-contact.jpg'],
  },
  alternates: {
    canonical: 'https://yourdomain.com/contact',
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

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}