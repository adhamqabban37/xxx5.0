// JSON-LD Schema generators for SEO

export interface OrganizationSchema {
  '@context': string;
  '@type': string;
  name: string;
  url?: string;
  logo?: string;
  aggregateRating?: {
    '@type': string;
    ratingValue: string;
    reviewCount: number;
  };
}

export interface ReviewSchema {
  '@context': string;
  '@type': string;
  itemReviewed: {
    '@type': string;
    name: string;
    url?: string;
  };
  reviewRating: {
    '@type': string;
    ratingValue: number;
    bestRating?: number;
  };
  author: {
    '@type': string;
    name: string;
  };
  reviewBody: string;
  datePublished: string;
  url?: string;
  image?: string;
}

export interface ServiceSchema {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  provider: {
    '@type': string;
    name: string;
    url: string;
  };
  areaServed?: {
    '@type': string;
    name: string;
  };
  offers?: {
    '@type': string;
    availability: string;
    price?: string;
    priceCurrency?: string;
  };
}

export function orgAggregateRatingJsonLd(
  avg: number,
  count: number,
  orgName: string = 'XenlixAI',
  orgUrl: string = 'https://xenlix.ai'
): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: orgName,
    url: orgUrl,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: avg.toFixed(1),
      reviewCount: count,
    },
  };
}

export function reviewJsonLd(item: {
  title: string;
  date: string;
  quote: string;
  author: string;
  rating: number;
  url: string;
  image?: string;
}): ReviewSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'CreativeWork',
      name: item.title,
      url: item.url,
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: item.rating,
      bestRating: 5,
    },
    author: {
      '@type': 'Person',
      name: item.author,
    },
    reviewBody: item.quote,
    datePublished: item.date,
    url: item.url,
    image: item.image,
  };
}

export function serviceJsonLd(service: {
  name: string;
  description: string;
  city?: string;
  price?: string;
  availability?: string;
}): ServiceSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description,
    provider: {
      '@type': 'Organization',
      name: 'XenlixAI',
      url: 'https://xenlix.ai',
    },
    ...(service.city && {
      areaServed: {
        '@type': 'City',
        name: service.city,
      },
    }),
    offers: {
      '@type': 'Offer',
      availability: service.availability || 'https://schema.org/InStock',
      ...(service.price && {
        price: service.price,
        priceCurrency: 'USD',
      }),
    },
  };
}

export function localBusinessJsonLd(business: {
  name: string;
  address?: {
    street?: string;
    city: string;
    state: string;
    zip?: string;
  };
  phone?: string;
  url: string;
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.name,
    url: business.url,
    ...(business.address && {
      address: {
        '@type': 'PostalAddress',
        ...(business.address.street && { streetAddress: business.address.street }),
        addressLocality: business.address.city,
        addressRegion: business.address.state,
        ...(business.address.zip && { postalCode: business.address.zip }),
      },
    }),
    ...(business.phone && { telephone: business.phone }),
  };
}

// Helper to calculate aggregate rating from testimonials
export function calculateAggregateRating(testimonials: Array<{ rating: number }>) {
  if (testimonials.length === 0) return { average: 0, count: 0 };

  const total = testimonials.reduce((sum, testimonial) => sum + testimonial.rating, 0);
  const average = total / testimonials.length;

  return {
    average: Math.round(average * 10) / 10, // Round to 1 decimal
    count: testimonials.length,
  };
}
