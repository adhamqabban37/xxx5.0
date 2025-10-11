'use client';

import Image from 'next/image';

interface Logo {
  name: string;
  src: string;
  width?: number;
  height?: number;
}

interface LogoRowProps {
  title?: string;
  logos?: Logo[];
  className?: string;
}

const defaultLogos: Logo[] = [
  { name: 'Shine Auto Detailing', src: '/placeholders/shine-auto.svg', width: 120, height: 40 },
  { name: 'Lakeview Dental', src: '/placeholders/lakeview-dental.svg', width: 140, height: 40 },
  { name: 'NutriCo', src: '/placeholders/nutricorp.svg', width: 100, height: 40 },
  { name: 'TechFlow Solutions', src: '/placeholders/techflow.svg', width: 160, height: 40 },
  { name: 'LocalFresh Markets', src: '/placeholders/localfresh.svg', width: 150, height: 40 },
  { name: 'Apex Consulting', src: '/placeholders/apex.svg', width: 130, height: 40 },
];

export default function LogoRow({
  title = 'Trusted by Growing Businesses',
  logos = defaultLogos,
  className = '',
}: LogoRowProps) {
  return (
    <section className={`py-12 ${className}`} aria-labelledby="clients-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        {title && (
          <h2 id="clients-heading" className="text-center text-lg font-semibold text-gray-600 mb-8">
            {title}
          </h2>
        )}

        {/* Logo Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center justify-items-center">
          {logos.map((logo, index) => (
            <div key={index} className="relative group transition-all duration-300 hover:scale-105">
              <Image
                src={logo.src}
                alt={`${logo.name} logo`}
                width={logo.width || 120}
                height={logo.height || 40}
                className="h-10 w-auto object-contain opacity-60 group-hover:opacity-100 transition-opacity duration-300 filter grayscale group-hover:grayscale-0"
                onError={(e) => {
                  // Fallback to text if image fails
                  const target = e.target as HTMLImageElement;
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div class="flex items-center justify-center h-10 px-4 text-sm font-medium text-gray-400 bg-gray-100 rounded border">
                        ${logo.name}
                      </div>
                    `;
                  }
                }}
              />
            </div>
          ))}
        </div>

        {/* Animated Background Pattern */}
        <div className="relative mt-8 overflow-hidden">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-4 text-sm text-gray-500">
              and many more growing businesses
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// Simplified version for hero sections
export function LogoMarquee({ logos = defaultLogos }: { logos?: Logo[] }) {
  return (
    <div className="flex items-center justify-center space-x-8 overflow-hidden">
      <div className="flex animate-marquee space-x-8">
        {[...logos, ...logos].map((logo, index) => (
          <div key={index} className="flex-shrink-0">
            <Image
              src={logo.src}
              alt={`${logo.name} logo`}
              width={logo.width || 100}
              height={logo.height || 32}
              className="h-8 w-auto object-contain opacity-50"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
