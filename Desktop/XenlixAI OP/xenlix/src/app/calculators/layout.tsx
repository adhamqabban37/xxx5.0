import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Business Calculators | XenlixAI - ROI & Pricing Tools',
  description: 'Free business calculators for ROI analysis and pricing estimation. Calculate advertising ROI, customer acquisition costs, and subscription pricing with our AI-powered tools.',
  keywords: 'ROI calculator, pricing calculator, CAC calculator, business tools, advertising ROI, subscription pricing',
  openGraph: {
    title: 'Business Calculators | XenlixAI',
    description: 'Free ROI and pricing calculators to optimize your business decisions',
    type: 'website',
    url: 'https://www.xenlixai.com/calculators',
    siteName: 'XenlixAI',
    images: [
      {
        url: 'https://www.xenlixai.com/og-calculators.jpg',
        width: 1200,
        height: 630,
        alt: 'Business Calculators - XenlixAI ROI & Pricing Tools',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Business Calculators | XenlixAI',
    description: 'Free ROI and pricing calculators to optimize your business decisions',
    creator: '@XenlixAI',
    images: ['https://www.xenlixai.com/og-calculators.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function CalculatorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-primary">
                XenlixAI
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/calculators" 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Calculators
              </Link>
              <Link 
                href="/contact" 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Contact
              </Link>
              <Link 
                href="/plans" 
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Breadcrumbs */}
      <div className="bg-muted/50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-foreground">
                  Home
                </Link>
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 mx-2 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <Link href="/calculators" className="text-muted-foreground hover:text-foreground">
                  Calculators
                </Link>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* JSON-LD Schema for Calculator Tools */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "XenlixAI Business Calculators",
            "description": "Free business calculators for ROI analysis and pricing estimation",
            "url": "https://yourdomain.com/calculators",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "featureList": [
              "ROI Calculator",
              "Pricing Calculator", 
              "CAC Analysis",
              "Export Results",
              "Shareable Links"
            ]
          })
        }}
      />
    </div>
  );
}