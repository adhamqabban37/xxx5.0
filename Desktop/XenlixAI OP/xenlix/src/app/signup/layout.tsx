import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up | XenlixAI - Start Your AI Marketing Journey',
  description:
    'Create your XenlixAI account and start optimizing your business for AI search engines. Get access to AEO tools, AI marketing automation, and expert guidance.',
  keywords:
    'sign up XenlixAI, create account, AI marketing registration, AEO tools access, AI search optimization',
  robots: 'noindex, nofollow', // Authentication pages should not be indexed
  openGraph: {
    title: 'Sign Up | XenlixAI - Start Your AI Marketing Journey',
    description:
      'Create your XenlixAI account and start optimizing your business for AI search engines. Get access to AEO tools, AI marketing automation, and expert guidance.',
    type: 'website',
    url: 'https://www.xenlixai.com/signup',
    siteName: 'XenlixAI',
    images: [
      {
        url: 'https://www.xenlixai.com/og-signup.jpg',
        width: 1200,
        height: 630,
        alt: 'Sign Up for XenlixAI - Start Your AI Marketing Journey',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sign Up | XenlixAI - Start Your AI Marketing Journey',
    description:
      'Create your XenlixAI account and start optimizing your business for AI search engines. Get access to AEO tools, AI marketing automation, and expert guidance.',
    creator: '@XenlixAI',
    images: ['https://www.xenlixai.com/og-signup.jpg'],
  },
  alternates: {
    canonical: 'https://www.xenlixai.com/signup',
  },
};

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
