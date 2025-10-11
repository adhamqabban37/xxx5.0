import { Metadata } from 'next';
import BreadcrumbSchema from '../src/components/BreadcrumbSchema';
import VisualBreadcrumbs from '../src/components/VisualBreadcrumbs';

export const metadata: Metadata = {
  title: 'Contact Us | XenlixAI - AI Marketing Automation Support',
  description:
    'Get in touch with XenlixAI for AI marketing automation, AEO services, and business growth solutions. Our team is ready to help you scale with AI.',
  robots: 'index, follow',
  openGraph: {
    title: 'Contact XenlixAI | AI Marketing Support & Consultation',
    description:
      'Connect with our AI marketing experts for personalized business growth solutions.',
    type: 'website',
  },
  alternates: {
    canonical: '/contact',
  },
};

export default function ContactPageExample() {
  return (
    <>
      {/* Breadcrumb Schema + WebPage Schema */}
      <BreadcrumbSchema
        webPageProps={{
          name: 'Contact Us | XenlixAI',
          description:
            'Get in touch with XenlixAI for AI marketing automation, AEO services, and business growth solutions.',
          dateModified: new Date().toISOString().split('T')[0],
          author: {
            '@type': 'Organization',
            '@id': 'https://xenlix.ai#organization',
          },
        }}
      />

      {/* Visual Breadcrumbs */}
      <VisualBreadcrumbs />

      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Contact Us</h1>
          <p className="text-lg text-gray-600">
            Ready to transform your business with AI marketing automation? Let's talk!
          </p>

          {/* Contact form content would go here */}
        </div>
      </div>
    </>
  );
}
