import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import AuthProvider from '../components/AuthProvider';
import { ToastProvider, ToastContainer } from '../components/toast/ToastProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'XenlixAI | AI Marketing Automation Platform for Small Business',
  description:
    'AI-powered marketing & website automation platform. XenlixAI helps businesses scale with AI-driven ad creation, website optimization, SEO automation, and analytics dashboards.',
  keywords:
    'AI marketing automation, AI SEO tools, AI website builder, AI ad creator, small business marketing, Dallas AI agency',
  authors: [{ name: 'XenlixAI' }],
  robots: process.env.APP_ENV === 'production' ? 'index, follow' : 'noindex, nofollow',
  openGraph: {
    title: 'XenlixAI | AI Marketing Automation Platform',
    description:
      'Scale your business with AI-driven marketing automation, website building, and SEO optimization.',
    url: 'https://www.xenlixai.com',
    siteName: 'XenlixAI',
    type: 'website',
    images: [
      {
        url: 'https://www.xenlixai.com/og-homepage.jpg',
        width: 1200,
        height: 630,
        alt: 'XenlixAI - AI Marketing Automation Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'XenlixAI | AI Marketing Automation Platform',
    description:
      'Scale your business with AI-driven marketing automation, website building, and SEO optimization.',
    site: '@xenlixai',
    creator: '@XenlixAI',
    images: ['https://www.xenlixai.com/og-homepage.jpg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'XenlixAI',
    legalName: 'XenlixAI LLC',
    url: 'https://www.xenlixai.com',
    logo: 'https://www.xenlixai.com/logo.png',
    description:
      'AI-powered marketing & website automation platform. XenlixAI helps businesses scale with AI-driven ad creation, website optimization, SEO automation, and analytics dashboards.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'TBD - Contact for Address',
      addressLocality: 'Dallas',
      addressRegion: 'TX',
      postalCode: 'TBD',
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 32.7767,
      longitude: -96.797,
    },
    telephone: '+1-TBD-TBD-TBDD',
    email: 'info@xenlixai.com',
    openingHours: ['Mo-Fr 09:00-17:00'],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      telephone: '+1-TBD-TBD-TBDD',
      email: 'info@xenlixai.com',
      areaServed: ['US', 'CA', 'GB', 'AU'],
    },
    sameAs: [
      'https://business.google.com/[TO-BE-UPDATED]',
      'https://x.com/xenlixai',
      'https://www.linkedin.com/company/xenlixai',
    ],
    serviceArea: {
      '@type': 'GeoCircle',
      geoMidpoint: {
        '@type': 'GeoCoordinates',
        latitude: 32.7767,
        longitude: -96.797,
      },
      geoRadius: 'global',
    },
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
          <ToastContainer />
        </ToastProvider>
      </body>
    </html>
  );
}
