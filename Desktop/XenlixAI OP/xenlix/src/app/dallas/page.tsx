import { LocalHero } from "../(components)/LocalHero";
import { StatsGrid } from "../(components)/Stat";
import { Faq, localSeoFaqItems } from "../(components)/Faq";
import JsonLd from "../(components)/JsonLd";
import { serviceJsonLd, localBusinessJsonLd } from "../(lib)/schema";
import { metadata } from "./metadata";
import Link from "next/link";
import { NAPDisplay } from "../../components/NAPDisplay";
import { Footer } from "../../components/Footer";

export { metadata };

export default function DallasPage() {
  // JSON-LD schemas for local SEO
  const serviceSchema = serviceJsonLd({
    name: "Answer-Engine Optimization & AI Ads — Dallas",
    description: "Get found in ChatGPT, Gemini, Copilot and Google with AI-optimized marketing for Dallas businesses",
    city: "Dallas",
    price: "2400",
    availability: "https://schema.org/InStock"
  });

  const localBusinessSchema = localBusinessJsonLd({
    name: "XenlixAI Dallas",
    address: {
      city: "Dallas",
      state: "TX"
    },
    url: "https://xenlix.ai/dallas"
  });

  // Local stats for Dallas market
  const dallasStats = [
    {
      value: "+38%",
      label: "AI-surfaced traffic",
      sublabel: "from AEO improvements",
      trend: "up" as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    },
    {
      value: "-27%",
      label: "Blended CAC",
      sublabel: "after PMax + AEO",
      trend: "down" as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      )
    },
    {
      value: "14 days",
      label: "Time to first lift",
      sublabel: "pilot playbook",
      trend: "neutral" as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen">
      <JsonLd data={serviceSchema} id="dallas-service-schema" />
      <JsonLd data={localBusinessSchema} id="dallas-business-schema" />

      {/* Hero Section */}
      <LocalHero
        city="Dallas"
        title="AI SEO & Ads for Dallas Businesses"
        subtitle="Answer-Engine Optimization (AEO) + high-intent ads to win in DFW."
        heroImage="https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=1200&h=600&fit=crop"
      />

      {/* Why Dallas Needs AEO */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Dallas Needs AEO
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The DFW market is evolving fast. Your customers are asking AI assistants for recommendations, 
              and your competitors are getting mentioned instead of you.
            </p>
          </div>

          <StatsGrid stats={dallasStats} className="mb-12" />

          <div className="text-center">
            <Link
              href="/case-studies/auto-detailing-dallas"
              className="inline-flex items-center text-primary hover:text-primary/80 font-medium"
            >
              See How a Dallas Auto Shop Tripled Their Leads →
            </Link>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              What You Get
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to dominate AI search and local advertising in Dallas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "AEO Checklist",
                description: "15-point optimization framework to get mentioned by ChatGPT, Gemini, and Copilot",
                icon: "✓"
              },
              {
                title: "GBP/Bing/Apple Optimization",
                description: "Complete local search optimization across all major platforms and AI engines",
                icon: "📍"
              },
              {
                title: "Review Engine",
                description: "Automated system to generate and optimize customer reviews for AI consumption",
                icon: "⭐"
              },
              {
                title: "AI Ad Creator",
                description: "Google PMax, Search, Bing, Meta, and TikTok campaigns optimized for Dallas market",
                icon: "🎯"
              },
              {
                title: "14-Day Ramp Plan",
                description: "Proven playbook to see initial AI mentions and traffic lift within 2 weeks",
                icon: "🚀"
              },
              {
                title: "Local Content Strategy",
                description: "Dallas-specific content that resonates with DFW customers and AI assistants",
                icon: "📝"
              }
            ].map((item, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Results in Dallas */}
      <section className="py-16 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8">
            Results in Dallas
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-white">
              <div className="text-4xl font-bold mb-2">217%</div>
              <div className="text-white/90">lead increase for auto detailing</div>
            </div>
            <div className="text-white">
              <div className="text-4xl font-bold mb-2">Top 3</div>
              <div className="text-white/90">ChatGPT rankings achieved</div>
            </div>
            <div className="text-white">
              <div className="text-4xl font-bold mb-2">64%</div>
              <div className="text-white/90">cost per lead reduction</div>
            </div>
          </div>

          <Link
            href="/case-studies/auto-detailing-dallas"
            className="inline-flex items-center bg-white text-primary px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 font-medium"
          >
            Read Full Dallas Case Study
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* CTA Band */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">
            Ready to Dominate Dallas Search?
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/calculators/roi"
              className="bg-primary text-white px-8 py-4 rounded-lg hover:bg-primary/90 transition-colors duration-200 font-medium"
            >
              Run ROI Calculator
            </Link>
            <Link
              href="/contact"
              className="border border-white text-white px-8 py-4 rounded-lg hover:bg-white hover:text-gray-900 transition-all duration-200 font-medium"
            >
              Book Dallas Strategy Call
            </Link>
          </div>
        </div>
      </section>

      {/* Local Dallas Business Contact */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Located in the Heart of Dallas
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We understand the Dallas market because we're part of it. Local expertise meets AI innovation.
            </p>
          </div>
          
          {/* Dallas-specific NAP Display */}
          <div className="max-w-4xl mx-auto">
            <NAPDisplay 
              variant="full"
              data={{
                name: "XenlixAI Dallas",
                streetAddress: "Contact for Dallas Address",
                city: "Dallas",
                state: "TX",
                postalCode: "TBD",
                phone: "+1-TBD-TBD-TBDD",
                email: "dallas@xenlixai.com"
              }} 
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Faq items={localSeoFaqItems} />
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-12 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">
            Book a Demo
          </h3>
          <p className="text-white/90 mb-6">
            See exactly how we'll get your Dallas business found in AI search results
          </p>
          <Link
            href="/contact"
            className="bg-white text-primary px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 font-medium"
          >
            Schedule Your Demo
          </Link>
        </div>
      </section>

      {/* Site Footer with NAP Information */}
      <Footer />
    </div>
  );
}