'use client';

import Image from 'next/image';

interface CaseStudyCardImageProps {
  src: string;
  alt: string;
  industry: string;
  city: string;
}

export default function CaseStudyCardImage({ src, alt, industry, city }: CaseStudyCardImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover"
      onError={(e) => {
        // Fallback background with text if image fails
        const target = e.target as HTMLImageElement;
        const parent = target.parentElement;
        if (parent) {
          parent.innerHTML = `
            <div class="w-full h-full flex items-center justify-center bg-gradient-to-r from-primary to-primary/80">
              <div class="text-center text-white p-6">
                <h3 class="text-xl font-bold mb-2">${industry}</h3>
                <p class="text-white/80">${city} Case Study</p>
              </div>
            </div>
          `;
        }
      }}
    />
  );
}
