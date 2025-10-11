'use client';

import React, { useState } from 'react';

interface FaqItem {
  q: string;
  a: string;
}

interface FaqProps {
  items: FaqItem[];
  title?: string;
  className?: string;
}

export function Faq({ items, title = 'Frequently Asked Questions', className = '' }: FaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className={`max-w-4xl mx-auto ${className}`}>
      {title && (
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-gray-900">{title}</h2>
      )}

      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <button
              className="w-full px-6 py-4 text-left bg-white hover:bg-gray-50 focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset transition-colors duration-200"
              onClick={() => toggleItem(index)}
              aria-expanded={openIndex === index}
              aria-controls={`faq-answer-${index}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 pr-4">{item.q}</h3>
                <div
                  className={`flex-shrink-0 transition-transform duration-200 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                >
                  <svg
                    className="w-5 h-5 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </button>

            <div
              id={`faq-answer-${index}`}
              className={`transition-all duration-300 ease-in-out ${
                openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              } overflow-hidden`}
            >
              <div className="px-6 pb-4 pt-2 bg-gray-50">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{item.a}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// Preset FAQ data for local SEO pages
export const localSeoFaqItems: FaqItem[] = [
  {
    q: 'What is AEO (Answer Engine Optimization)?',
    a: 'AEO is the practice of optimizing your content to appear in AI assistant responses like ChatGPT, Gemini, and Copilot. Unlike traditional SEO which focuses on search rankings, AEO ensures your business gets mentioned when people ask AI assistants questions about your industry or location.',
  },
  {
    q: 'How is AEO different from SEO?',
    a: 'While SEO focuses on ranking high in search results, AEO focuses on being the source AI assistants cite in their responses. AEO requires structured data, entity optimization, and content that directly answers questions. Think of it as optimizing for conversations rather than searches.',
  },
  {
    q: 'How fast can we see results?',
    a: 'Most clients see initial improvements within 2-4 weeks. AEO results can appear faster than traditional SEO because AI assistants update their knowledge more frequently. However, full optimization and consistent mentions typically take 6-12 weeks.',
  },
  {
    q: 'Do you run ads too?',
    a: 'Yes! We run high-intent ads on Google (Search & Performance Max), Bing, Meta, and TikTok. Our approach combines AEO for organic AI mentions with targeted ads to capture immediate demand while your AEO builds momentum.',
  },
  {
    q: 'Do you work beyond this city?',
    a: 'Absolutely! While this page focuses on local expertise, we work with businesses nationwide. We create location-specific strategies for each market while leveraging our proven AEO and advertising frameworks.',
  },
];
