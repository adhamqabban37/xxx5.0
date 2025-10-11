import { Metadata } from 'next';

const title = 'Dallas AI Marketing | Local SEO & AEO | XenlixAI';
const description =
  'Dallas AI marketing that gets you found in ChatGPT & Google. Local SEO + high-intent ads with 14-day results guarantee. Book your audit today!';
const canonicalUrl = '/dallas';
const imageUrl = '/img/dallas-hero.jpg';

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    'AI SEO Dallas',
    'Answer Engine Optimization Dallas',
    'AEO Dallas',
    'ChatGPT optimization Dallas',
    'AI marketing Dallas',
    'Google Ads Dallas',
    'Performance Max Dallas',
    'local SEO Dallas',
    'digital marketing Dallas',
    'AI advertising Dallas',
    'Dallas business marketing',
    'DFW SEO services',
    'Dallas PPC management',
  ],
  authors: [{ name: 'XenlixAI' }],
  creator: 'XenlixAI',
  publisher: 'XenlixAI',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: canonicalUrl,
  },
  openGraph: {
    title,
    description,
    url: canonicalUrl,
    siteName: 'XenlixAI',
    images: [
      {
        url: imageUrl,
        width: 1200,
        height: 630,
        alt: 'Dallas business district skyline representing AI SEO and digital marketing services',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [imageUrl],
    creator: '@XenlixAI',
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
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  category: 'Business Services',
};
