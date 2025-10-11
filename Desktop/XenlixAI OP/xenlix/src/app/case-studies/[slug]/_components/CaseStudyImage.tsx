'use client';

import Image from 'next/image';

interface CaseStudyImageProps {
  src: string;
  alt: string;
  fallbackTitle: string;
  fallbackCity: string;
}

export default function CaseStudyImage({
  src,
  alt,
  fallbackTitle,
  fallbackCity,
}: CaseStudyImageProps) {
  return (
    <Image
      src={src}
      alt={alt || `${fallbackTitle} in ${fallbackCity}`}
      width={1200}
      height={600}
      sizes="(max-width: 600px) 100vw, 1200px"
      className="object-cover object-center rounded-xl"
      quality={70}
      priority
      loading="eager"
      style={{ maxWidth: '100%', height: 'auto' }}
      unoptimized={false}
      placeholder="blur"
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        target.nextElementSibling?.classList.remove('hidden');
      }}
    />
  );
}
