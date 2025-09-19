"use client";

import Image from "next/image";
import Link from "next/link";

interface Testimonial {
  quote: string;
  author: string;
  company: string;
  rating: number;
  logo: string;
}

interface TestimonialCardProps {
  quote: string;
  author: string;
  company: string;
  rating: number;
  logo?: string;
}

// Import testimonials data
const testimonials: Testimonial[] = [
  {
    "quote": "They cracked AI answers for us. Phone hasn't stopped.",
    "author": "Luis R., Owner",
    "company": "Shine Auto Detailing",
    "rating": 5,
    "logo": "/placeholders/generic-48.svg"
  },
  {
    "quote": "From nowhere to top 3 in ChatGPT/Perplexity for core terms.",
    "author": "Dr. Nguyen",
    "company": "Lakeview Dental",
    "rating": 5,
    "logo": "/placeholders/generic-48.svg"
  },
  {
    "quote": "-38% blended CAC after PMax + AEO in 30 days.",
    "author": "Maya S., CMO",
    "company": "NutriCo",
    "rating": 5,
    "logo": "/placeholders/generic-48.svg"
  },
  {
    "quote": "First month: 2x qualified leads, zero ad spend increase.",
    "author": "James Parker, VP Marketing",
    "company": "TechFlow Solutions",
    "rating": 5,
    "logo": "/placeholders/generic-48.svg"
  },
  {
    "quote": "80% of our leads now come from AI search mentions.",
    "author": "Maria Gonzalez, Founder",
    "company": "LocalFresh Markets",
    "rating": 5,
    "logo": "/placeholders/generic-48.svg"
  },
  {
    "quote": "ROI hit 340% after 6 weeks. Best investment we've made.",
    "author": "Tom Wilson, CEO",
    "company": "Apex Consulting",
    "rating": 5,
    "logo": "/placeholders/generic-48.svg"
  }
];

function TestimonialCard({ quote, author, company, rating, logo }: TestimonialCardProps) {
  return (
    <article className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl h-full flex flex-col shadow-lg hover:bg-white/15 transition-all duration-300">
      {/* Company Header */}
      <div className="flex items-center gap-3 mb-4">
        {logo && (
          <div className="relative w-12 h-12 rounded-md overflow-hidden bg-white/20">
            <Image
              src={logo}
              alt={`${company} logo`}
              width={48}
              height={48}
              className="object-cover"
              onError={(e) => {
                // Fallback to initial letter if image fails
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white font-bold text-lg">${company.charAt(0)}</div>`;
                }
              }}
            />
          </div>
        )}
        <div className="text-sm font-medium text-white/80">{company}</div>
      </div>

      {/* Quote */}
      <blockquote className="text-lg leading-relaxed mb-4 flex-grow text-white">
        &ldquo;{quote}&rdquo;
      </blockquote>

      {/* Author and Rating */}
      <footer className="mt-auto">
        <div className="font-semibold text-white mb-2">{author}</div>
        <div 
          aria-label={`Rating ${rating} out of 5 stars`}
          className="text-yellow-400 text-lg"
          role="img"
        >
          {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
        </div>
      </footer>
    </article>
  );
}

export default function Testimonials() {
  return (
    <section 
      aria-labelledby="testimonials-heading" 
      className="relative py-16 px-4 sm:px-6 lg:px-8"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />
      
      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 
            id="testimonials-heading"
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
          >
            What Our Customers Say
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See how businesses across industries are winning with Answer Engine Optimization and AI-powered marketing.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial: Testimonial, index: number) => (
            <TestimonialCard
              key={index}
              quote={testimonial.quote}
              author={testimonial.author}
              company={testimonial.company}
              rating={testimonial.rating}
              logo={testimonial.logo}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link
            href="/case-studies"
            className="inline-flex items-center px-6 py-3 text-lg font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            See Full Case Studies
            <svg 
              className="ml-2 w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}