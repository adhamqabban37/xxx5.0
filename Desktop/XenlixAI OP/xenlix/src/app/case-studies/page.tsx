import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import CaseStudyCardImage from "./_components/CaseStudyCardImage";

export const metadata: Metadata = {
  title: "Case Studies | Real Results from AI Marketing & AEO",
  description: "See how businesses across industries are winning with Answer Engine Optimization and AI-powered marketing. Detailed case studies with metrics and results.",
  keywords: "case studies, AI marketing results, AEO success stories, answer engine optimization case studies, AI SEO results",
  openGraph: {
    title: "Case Studies | Real Results from AI Marketing & AEO - XenlixAI",
    description: "See how businesses across industries are winning with Answer Engine Optimization and AI-powered marketing. Detailed case studies with metrics and results.",
    type: "website",
    url: "https://www.xenlixai.com/case-studies",
    siteName: "XenlixAI",
    images: [
      {
        url: "https://www.xenlixai.com/og-case-studies.jpg",
        width: 1200,
        height: 630,
        alt: "Case Studies - Real Results from AI Marketing & AEO"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Case Studies | Real Results from AI Marketing & AEO - XenlixAI",
    description: "See how businesses across industries are winning with Answer Engine Optimization and AI-powered marketing. Detailed case studies with metrics and results.",
    creator: "@XenlixAI",
    images: ["https://www.xenlixai.com/og-case-studies.jpg"]
  },
  alternates: {
    canonical: 'https://www.xenlixai.com/case-studies',
  },
};

interface CaseStudy {
  title: string;
  slug: string;
  industry: string;
  city: string;
  summary: string;
  heroImage: string;
  date: string;
  testimonial: {
    quote: string;
    author: string;
    rating: number;
  };
  results: Array<{
    metric: string;
    before: string;
    after: string;
    improvement: string;
  }>;
  metrics: {
    timeToResults: string;
    totalInvestment: string;
    roiPercent: string;
  };
}

// Case studies data - in production this would come from MDX files
const caseStudies: CaseStudy[] = [
  {
    title: "Auto Detailing Shop Triples Leads with AEO",
    slug: "auto-detailing-dallas",
    industry: "Automotive Services",
    city: "Dallas",
    summary: "Shine Auto Detailing went from invisible to top AI assistant mentions, generating 3x more qualified leads in 60 days.",
    heroImage: "/img/case-studies/shine-auto-hero.jpg",
    date: "2024-08-15",
    testimonial: {
      quote: "They cracked AI answers for us. Phone hasn't stopped.",
      author: "Luis R., Owner",
      rating: 5
    },
    results: [
      { metric: "AI Mentions", before: "0", after: "Top 3 in ChatGPT", improvement: "+∞%" },
      { metric: "Monthly Leads", before: "12", after: "38", improvement: "+217%" },
      { metric: "Cost per Lead", before: "$85", after: "$31", improvement: "-64%" }
    ],
    metrics: { timeToResults: "14 days", totalInvestment: "$2,400/month", roiPercent: "340%" }
  },
  {
    title: "Dental Practice Dominates AI Search Results",
    slug: "dental-practice-ai-optimization",
    industry: "Healthcare",
    city: "Austin",
    summary: "Lakeview Dental achieved #1 AI mentions for competitive dental terms, increasing new patients by 156% in 90 days.",
    heroImage: "/img/case-studies/lakeview-dental-hero.jpg",
    date: "2024-07-22",
    testimonial: {
      quote: "From nowhere to top 3 in ChatGPT/Perplexity for core terms.",
      author: "Dr. Nguyen",
      rating: 5
    },
    results: [
      { metric: "AI Visibility", before: "Not mentioned", after: "#1 in ChatGPT", improvement: "+100%" },
      { metric: "New Patients", before: "18/month", after: "46/month", improvement: "+156%" },
      { metric: "Consultation Bookings", before: "32/month", after: "78/month", improvement: "+144%" }
    ],
    metrics: { timeToResults: "21 days", totalInvestment: "$3,200/month", roiPercent: "425%" }
  },
  {
    title: "SaaS Company Cuts CAC 38% with AEO + PMax",
    slug: "saas-blended-cac-reduction",
    industry: "Software/Technology",
    city: "San Francisco",
    summary: "NutriCo reduced blended customer acquisition cost by 38% while scaling from $2M to $5M ARR using integrated AEO and Performance Max strategy.",
    heroImage: "/img/case-studies/nutrico-saas-hero.jpg",
    date: "2024-06-10",
    testimonial: {
      quote: "-38% blended CAC after PMax + AEO in 30 days.",
      author: "Maya S., CMO",
      rating: 5
    },
    results: [
      { metric: "Blended CAC", before: "$312", after: "$194", improvement: "-38%" },
      { metric: "Organic Demo Requests", before: "89/month", after: "267/month", improvement: "+200%" },
      { metric: "AI-Driven Signups", before: "0", after: "156/month", improvement: "+∞%" }
    ],
    metrics: { timeToResults: "30 days", totalInvestment: "$8,500/month", roiPercent: "520%" }
  },
  {
    title: "Local Restaurant Chain Expands with AI Marketing",
    slug: "restaurant-chain-expansion",
    industry: "Food & Beverage",
    city: "Chicago",
    summary: "LocalFresh Markets used AEO to establish authority in new markets, achieving 89% faster location launches and 156% higher revenue per location.",
    heroImage: "/img/case-studies/localfresh-expansion-hero.jpg",
    date: "2024-05-18",
    testimonial: {
      quote: "AEO put us ahead of enterprise competitors in AI search.",
      author: "Sarah Chen, Founder",
      rating: 5
    },
    results: [
      { metric: "Market Entry Speed", before: "8 months", after: "4.2 months", improvement: "-48%" },
      { metric: "Revenue per Location", before: "$52K/month", after: "$133K/month", improvement: "+156%" },
      { metric: "Brand Recognition", before: "Local only", after: "Regional leader", improvement: "+300%" }
    ],
    metrics: { timeToResults: "45 days", totalInvestment: "$12,000/month", roiPercent: "680%" }
  },
  {
    title: "Consulting Firm Scales with AI-Powered Lead Generation",
    slug: "consulting-firm-lead-generation",
    industry: "Professional Services",
    city: "New York",
    summary: "Apex Consulting transformed their lead generation using AEO and targeted ads, increasing qualified leads by 340% while reducing cost per lead by 52%.",
    heroImage: "/img/case-studies/apex-consulting-hero.jpg",
    date: "2024-04-25",
    testimonial: {
      quote: "ROI calculator helped us sell AEO internally. Game changer.",
      author: "Mike Rodriguez, Digital Director",
      rating: 5
    },
    results: [
      { metric: "Qualified Leads", before: "23/month", after: "101/month", improvement: "+340%" },
      { metric: "Cost per Lead", before: "$420", after: "$201", improvement: "-52%" },
      { metric: "Proposal Win Rate", before: "28%", after: "47%", improvement: "+68%" }
    ],
    metrics: { timeToResults: "60 days", totalInvestment: "$15,000/month", roiPercent: "450%" }
  }
];

function CaseStudyCard({ study }: { study: CaseStudy }) {
  return (
    <article className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105">
      {/* Hero Image */}
      <div className="relative h-48 bg-gradient-to-r from-primary to-primary/80">
        <CaseStudyCardImage
          src={study.heroImage}
          alt={`${study.title} case study hero image`}
          industry={study.industry}
          city={study.city}
        />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute top-4 left-4">
          <span className="bg-white/90 text-primary px-3 py-1 rounded-full text-sm font-medium">
            {study.industry}
          </span>
        </div>
        <div className="absolute top-4 right-4">
          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            {study.metrics.roiPercent} ROI
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Title and Summary */}
        <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
          {study.title}
        </h2>
        <p className="text-gray-600 mb-4 line-clamp-3">
          {study.summary}
        </p>

        {/* Key Results */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {study.results.slice(0, 3).map((result, index) => (
            <div key={index} className="text-center">
              <div className="text-lg font-bold text-primary">{result.improvement}</div>
              <div className="text-xs text-gray-600">{result.metric}</div>
            </div>
          ))}
        </div>

        {/* Testimonial */}
        <blockquote className="bg-gray-50 p-4 rounded-lg mb-4">
          <p className="text-sm text-gray-700 italic mb-2">
            &ldquo;{study.testimonial.quote}&rdquo;
          </p>
          <footer className="flex items-center justify-between">
            <cite className="text-xs font-medium text-gray-900">
              {study.testimonial.author}
            </cite>
            <div className="flex text-yellow-400">
              {'★'.repeat(study.testimonial.rating)}
            </div>
          </footer>
        </blockquote>

        {/* Metrics */}
        <div className="flex justify-between text-xs text-gray-500 mb-4">
          <span>Results in {study.metrics.timeToResults}</span>
          <span>{study.city}</span>
        </div>

        {/* CTA */}
        <Link
          href={`/case-studies/${study.slug}`}
          className="w-full bg-primary text-white text-center py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors duration-200 font-medium block"
        >
          Read Full Case Study
        </Link>
      </div>
    </article>
  );
}

export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-primary to-primary/80 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Real Results from Real Businesses
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
            See how companies across industries are dominating AI search results and scaling their growth 
            with Answer Engine Optimization and intelligent advertising.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-white/80">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Real metrics</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Verified results</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Multiple industries</span>
            </div>
          </div>
        </div>
      </section>

      {/* Case Studies Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {caseStudies.map((study) => (
              <CaseStudyCard key={study.slug} study={study} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Ready for Similar Results?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Our proven AEO and AI marketing strategies work across industries. 
            Let's discuss how we can replicate these results for your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors duration-200 font-medium"
            >
              Get Your Strategy Session
            </Link>
            <Link
              href="/plans"
              className="border border-primary text-primary px-8 py-3 rounded-lg hover:bg-primary hover:text-white transition-all duration-200 font-medium"
            >
              See Our Plans
            </Link>
            <Link
              href="/calculators/roi"
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:border-primary hover:text-primary transition-all duration-200 font-medium"
            >
              Calculate Your ROI
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}