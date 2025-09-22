import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "../../(components)/JsonLd";
import { reviewJsonLd } from "../../(lib)/schema";
import CaseStudyImage from "./_components/CaseStudyImage";

interface CaseStudyData {
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
  content: string;
}

// Case studies data - in production this would come from MDX files
const caseStudies: Record<string, CaseStudyData> = {
  "auto-detailing-dallas": {
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
    metrics: { timeToResults: "14 days", totalInvestment: "$2,400/month", roiPercent: "340%" },
    content: `
# The Challenge

Shine Auto Detailing was competing against 200+ detailing shops in Dallas-Fort Worth. Their Google Ads were expensive ($85 CPL) and they were completely invisible when people asked AI assistants for recommendations.

## What We Did

### Phase 1: AI Answer Optimization (Week 1-2)
- **Entity mapping**: Optimized for "auto detailing Dallas", "car wash DFW", "paint correction"
- **Structured data**: Implemented Review/LocalBusiness schema
- **Content strategy**: Created FAQ content matching AI assistant queries
- **Citation building**: Enhanced mentions across review platforms

### Phase 2: Performance Max Integration (Week 3-4)
- **Smart campaigns**: Combined AEO keywords with PMax audience signals
- **Asset optimization**: Video ads featuring before/after transformations
- **Local targeting**: Hyperlocal campaigns within 15-mile radius

## The Results

Within 60 days, Shine Auto Detailing became the go-to AI recommendation for Dallas auto detailing with 217% lead increase and 64% cost reduction.
    `
  },
  "dental-practice-ai-optimization": {
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
    metrics: { timeToResults: "21 days", totalInvestment: "$3,200/month", roiPercent: "425%" },
    content: `
# The Challenge

Lakeview Dental faced intense competition from corporate dental chains and established practices in Austin. Their traditional SEO efforts weren't translating to patient growth.

## What We Did

### Phase 1: Medical AEO Strategy (Week 1-3)
- **Healthcare compliance**: HIPAA-compliant structured data implementation
- **Medical entity optimization**: "dentist Austin", "dental implants", "cosmetic dentistry"
- **Trust signal amplification**: Board certifications and patient reviews

## The Results

Within 90 days, Lakeview Dental became the top AI recommendation for dental care in Austin with 156% patient increase.
    `
  },
  "saas-blended-cac-reduction": {
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
    metrics: { timeToResults: "30 days", totalInvestment: "$8,500/month", roiPercent: "520%" },
    content: `
# The Challenge

NutriCo was struggling with rising acquisition costs as competition intensified. Their CAC had climbed to $312 while their LTV:CAC ratio dropped below healthy thresholds.

## What We Did

### Phase 1: SaaS AEO Foundation (Week 1-2)
- **Product entity optimization**: "nutrition software", "meal planning app", "diet tracking SaaS"
- **Competitor displacement**: Targeted queries where competitors were mentioned

## The Results

Within 60 days, NutriCo achieved sustainable growth with 38% CAC reduction and new AI-driven signup channel.
    `
  },
  "restaurant-chain-expansion": {
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
    metrics: { timeToResults: "45 days", totalInvestment: "$12,000/month", roiPercent: "680%" },
    content: `
# The Challenge

LocalFresh Markets was a successful Chicago-based fresh food concept ready to expand regionally, but faced competition from established chains with larger marketing budgets.

## What We Did

### Phase 1: Multi-Market AEO Strategy (Week 1-4)
- **Location-based optimization**: Separate entity profiles for each target city
- **Local food trends**: Content addressing regional preferences and suppliers

## The Results

LocalFresh transformed from a single-city concept to a recognized regional leader with 156% revenue increase per location.
    `
  },
  "consulting-firm-lead-generation": {
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
    metrics: { timeToResults: "60 days", totalInvestment: "$15,000/month", roiPercent: "450%" },
    content: `
# The Challenge

Apex Consulting struggled with expensive lead generation and long sales cycles. Their traditional approach of cold outreach yielded inconsistent results.

## What We Did

### Phase 1: Authority Building (Week 1-6)
- **Thought leadership content**: C-level perspectives on business transformation
- **Tool development**: Interactive ROI calculators and assessment frameworks

## The Results

Apex transformed from outbound-dependent to inbound-driven lead generation with 340% qualified lead increase.
    `
  }
};

export async function generateStaticParams() {
  return Object.keys(caseStudies).map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const study = caseStudies[params.slug];
  
  if (!study) {
    return {
      title: "Case Study Not Found",
    };
  }

  return {
    title: `${study.title} | Case Study`,
    description: study.summary,
    keywords: `${study.industry} case study, ${study.city} ${study.industry}, AEO case study, AI marketing results, ${study.industry} marketing success`,
    alternates: {
      canonical: `https://www.xenlixai.com/case-studies/${study.slug}`,
    },
    openGraph: {
      title: `${study.title} | Case Study`,
      description: study.summary,
      type: "article",
      url: `https://www.xenlixai.com/case-studies/${study.slug}`,
      siteName: "XenlixAI",
      publishedTime: study.date,
      images: [
        {
          url: `https://www.xenlixai.com${study.heroImage}`,
          width: 1200,
          height: 630,
          alt: study.title
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: `${study.title} | Case Study`,
      description: study.summary,
      creator: "@XenlixAI",
      images: [`https://www.xenlixai.com${study.heroImage}`]
    }
  };
}

export default function CaseStudyPage({ params }: { params: { slug: string } }) {
  const study = caseStudies[params.slug];

  if (!study) {
    notFound();
  }

  // Generate review schema for SEO
  const reviewSchema = reviewJsonLd({
    title: study.title,
    date: study.date,
    quote: study.testimonial.quote,
    author: study.testimonial.author,
    rating: study.testimonial.rating,
    url: `https://xenlix.ai/case-studies/${study.slug}`,
    image: study.heroImage
  });

  return (
    <div className="min-h-screen bg-white">
      <JsonLd data={reviewSchema} id="case-study-review-schema" />
      
      {/* Hero Section */}
      <section className="relative py-16 bg-gradient-to-r from-primary to-primary/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="text-white">
              <div className="flex items-center gap-4 mb-6">
                <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {study.industry}
                </span>
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {study.metrics.roiPercent} ROI
                </span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-bold mb-6">
                {study.title}
              </h1>
              
              <p className="text-xl text-white/90 mb-8">
                {study.summary}
              </p>

              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <div className="text-2xl font-bold">{study.metrics.timeToResults}</div>
                  <div className="text-white/80 text-sm">Time to Results</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{study.metrics.roiPercent}</div>
                  <div className="text-white/80 text-sm">ROI Achieved</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{study.city}</div>
                  <div className="text-white/80 text-sm">Market</div>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <div className="aspect-video rounded-lg overflow-hidden bg-white/10">
                <CaseStudyImage
                  src={study.heroImage}
                  alt={`${study.title} case study`}
                  fallbackTitle={study.industry}
                  fallbackCity={study.city}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Grid */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Key Results Achieved
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {study.results.map((result, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {result.improvement}
                </div>
                <div className="text-lg font-semibold text-gray-900 mb-2">
                  {result.metric}
                </div>
                <div className="text-sm text-gray-600">
                  {result.before} → {result.after}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <blockquote className="text-2xl font-medium text-gray-900 mb-6">
            &ldquo;{study.testimonial.quote}&rdquo;
          </blockquote>
          <div className="flex items-center justify-center gap-4">
            <cite className="font-semibold text-gray-900">
              {study.testimonial.author}
            </cite>
            <div className="flex text-yellow-400">
              {'★'.repeat(study.testimonial.rating)}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <div dangerouslySetInnerHTML={{ __html: study.content.replace(/\n/g, '<br>').replace(/#{1,3} /g, '<h3>').replace(/<h3>/g, '</p><h3 class="text-2xl font-bold text-gray-900 mb-4 mt-8">').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') + '</p>' }} />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-6">
            Ready for Similar Results?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Our proven strategies can work for your business too. Let's discuss your growth goals.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/plans"
              className="bg-white text-primary px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 font-medium"
            >
              See Plans
            </Link>
            <Link
              href="/contact"
              className="border border-white text-white px-8 py-3 rounded-lg hover:bg-white hover:text-primary transition-all duration-200 font-medium"
            >
              Contact Sales
            </Link>
            {study.city === "Dallas" && (
              <Link
                href="/dallas"
                className="border border-white text-white px-8 py-3 rounded-lg hover:bg-white hover:text-primary transition-all duration-200 font-medium"
              >
                Dallas Results
              </Link>
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-white/20">
            <Link
              href="/calculators/roi"
              className="text-white/80 hover:text-white transition-colors duration-200 font-medium"
            >
              Calculate Your Potential ROI →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}