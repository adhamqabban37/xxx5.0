import Link from "next/link";
import { Metadata } from "next";
import HomeContent from "../components/HomeContent";
import { orgAggregateRatingJsonLd, calculateAggregateRating } from "./(lib)/schema";
import { generateHomepageSchema, XENLIX_HOMEPAGE_CONFIG } from "./(lib)/homepage-schema";
import JsonLd from "./(components)/JsonLd";
import { MetadataTemplates } from "../components/SEOMetadata";

// Testimonials data for schema calculation
const testimonials = [
  { rating: 5 }, { rating: 5 }, { rating: 5 }, 
  { rating: 5 }, { rating: 5 }, { rating: 5 }
];

// Generate metadata with proper canonical normalization and tracking parameter handling
export async function generateMetadata({ searchParams }: { 
  searchParams: { [key: string]: string | string[] | undefined } 
}): Promise<Metadata> {
  const baseMetadata = await MetadataTemplates.homepage(searchParams);
  
  return {
    ...baseMetadata,
    // Override with homepage-specific content
    title: "Free AEO Audit | Get Found in AI Search | XenlixAI",
    description: "Get found in ChatGPT, Claude & AI search with our free AEO audit. Discover why you're invisible + get actionable fixes in 60 seconds. Start now!",
    keywords: "AEO audit, answer engine optimization, ChatGPT SEO, AI search optimization, free website audit, AI visibility, get found in AI search",
  };
}

export default function Home() {
  const { average, count } = calculateAggregateRating(testimonials);
  
  // Generate comprehensive homepage schema with aggregate rating
  const homepageConfig = {
    ...XENLIX_HOMEPAGE_CONFIG,
    aggregateRating: {
      ratingValue: average,
      reviewCount: count
    }
  };
  
  const homepageSchemas = generateHomepageSchema(homepageConfig);
  
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is XenlixAI?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "XenlixAI is an Answer Engine Optimization (AEO) platform that helps businesses get found in AI search engines like ChatGPT, Claude, Perplexity, and Google AI. We also offer traditional SEO services (coming soon)."
        }
      },
      {
        "@type": "Question",
        "name": "Who is XenlixAI for?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Small to medium businesses, startups, and entrepreneurs looking to improve their SEO rankings and organic traffic with AI-powered automation."
        }
      },
      {
        "@type": "Question",
        "name": "How does AEO (Answer Engine Optimization) work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "AEO optimizes your content to be easily understood and cited by AI search engines. Our platform analyzes your website, optimizes content for AI readability, implements structured data, and ensures your business appears in AI-generated answers. Traditional SEO services coming soon."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen relative">
      {/* New Logo-Inspired Background System */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900"></div>
      <div className="fixed inset-0 bg-gradient-to-br from-transparent via-blue-800/30 to-transparent"></div>
      
      {/* Corner Glow Effects from Logo Colors */}
      <div className="fixed top-0 right-0 w-96 h-96 opacity-20">
        <div className="w-full h-full bg-gradient-to-bl from-cyan-500 via-cyan-400 to-transparent blur-3xl"></div>
      </div>
      <div className="fixed bottom-0 left-0 w-96 h-96 opacity-20">
        <div className="w-full h-full bg-gradient-to-tr from-pink-500 via-pink-400 to-transparent blur-3xl"></div>
      </div>
      
      {/* Content Layer */}
      <div className="relative z-10">
        {/* Comprehensive Homepage Schema Array */}
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(homepageSchemas)
          }}
        />
        
        {/* FAQ Schema */}
        <JsonLd data={faqSchema} id="faq-schema" />
      
        {/* Use HomeContent component which includes the modal */}
        <HomeContent 
          faqSchema={faqSchema} 
          orgSchema={orgAggregateRatingJsonLd(average, count)} 
        />
      
      </div>
    </div>
  );
}
