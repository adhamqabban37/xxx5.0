import { NormalizedBusiness, JsonLdBlocks } from '@/types/seo';

/**
 * Build JSON-LD structured data for LocalBusiness
 * Returns array of schema.org blocks for optimal SEO/AEO
 */
export function buildJsonLd(biz: NormalizedBusiness): JsonLdBlocks {
  const blocks: any[] = [];

  // Block A: LocalBusiness or specific subtype
  const businessBlock = buildLocalBusinessBlock(biz);
  if (businessBlock) {
    blocks.push(businessBlock);
  }

  // Block B: AggregateRating (only if both rating and reviewCount exist)
  if (biz.rating !== undefined && biz.reviewCount !== undefined) {
    const ratingBlock = buildAggregateRatingBlock(biz);
    if (ratingBlock) {
      blocks.push(ratingBlock);
    }
  }

  // Block C: FAQPage (only if FAQs exist)
  if (biz.faqs && biz.faqs.length > 0) {
    const faqBlock = buildFAQPageBlock(biz.faqs);
    if (faqBlock) {
      blocks.push(faqBlock);
    }
  }

  return { blocks };
}

function buildLocalBusinessBlock(biz: NormalizedBusiness): any | null {
  if (!biz.name || !biz.name.trim()) {
    return null;
  }

  const baseUrl = biz.url || 'https://example.com';
  const businessType = determineBusinessType(biz);

  const block: any = {
    '@context': 'https://schema.org',
    '@type': businessType,
    '@id': `${baseUrl}#identity`,
    name: biz.name,
    url: baseUrl,
  };

  // Add images (logo and/or hero image)
  const images: string[] = [];
  if (biz.logo) {
    images.push(biz.logo);
    block.logo = biz.logo;
  }
  if (images.length > 0) {
    block.image = images;
  }

  // Add telephone
  if (biz.phone) {
    block.telephone = biz.phone;
  }

  // Add address
  if (biz.address && hasValidAddress(biz.address)) {
    block.address = {
      '@type': 'PostalAddress',
      ...(biz.address.street && { streetAddress: biz.address.street }),
      ...(biz.address.city && { addressLocality: biz.address.city }),
      ...(biz.address.region && { addressRegion: biz.address.region }),
      ...(biz.address.postal && { postalCode: biz.address.postal }),
      ...(biz.address.country && { addressCountry: biz.address.country }),
    };
  }

  // Add geo coordinates
  if (biz.geo && typeof biz.geo.lat === 'number' && typeof biz.geo.lon === 'number') {
    block.geo = {
      '@type': 'GeoCoordinates',
      latitude: biz.geo.lat,
      longitude: biz.geo.lon,
    };
  }

  // Add social profiles
  if (biz.social && biz.social.length > 0) {
    block.sameAs = biz.social;
  }

  // Add opening hours
  if (biz.hours && biz.hours.length > 0) {
    const openingHours = parseOpeningHours(biz.hours);
    if (openingHours.length > 0) {
      block.openingHoursSpecification = openingHours;
    }
  }

  // Add area served (from address city or inferred)
  if (biz.address?.city) {
    block.areaServed = [biz.address.city];
  }

  // Add services as offer catalog
  if (biz.services && biz.services.length > 0) {
    block.hasOfferCatalog = {
      '@type': 'OfferCatalog',
      name: 'Services',
      itemListElement: biz.services.map((service) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: service,
        },
      })),
    };
  }

  return block;
}

function buildAggregateRatingBlock(biz: NormalizedBusiness): any | null {
  if (biz.rating === undefined || biz.reviewCount === undefined) {
    return null;
  }

  const baseUrl = biz.url || 'https://example.com';

  return {
    '@context': 'https://schema.org',
    '@type': 'AggregateRating',
    '@id': `${baseUrl}#rating`,
    ratingValue: biz.rating,
    reviewCount: biz.reviewCount,
    itemReviewed: {
      '@id': `${baseUrl}#identity`,
    },
  };
}

function buildFAQPageBlock(faqs: { q: string; a: string }[]): any | null {
  if (!faqs || faqs.length === 0) {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };
}

function determineBusinessType(biz: NormalizedBusiness): string {
  if (!biz.services) {
    return 'LocalBusiness';
  }

  const services = biz.services.map((s) => s.toLowerCase()).join(' ');

  // Healthcare
  if (services.match(/dental|dentist|orthodont|teeth|oral/i)) {
    return 'Dentist';
  }
  if (services.match(/medical|doctor|physician|clinic|health/i)) {
    return 'MedicalClinic';
  }
  if (services.match(/veterinar|vet|animal|pet/i)) {
    return 'VeterinaryCare';
  }

  // Automotive
  if (services.match(/auto|car|mechanic|repair|automotive|oil change|brake/i)) {
    return 'AutoRepair';
  }
  if (services.match(/dealership|car sales|auto sales/i)) {
    return 'AutoDealer';
  }

  // Beauty & Wellness
  if (services.match(/salon|hair|beauty|nail|spa|massage/i)) {
    return 'BeautySalon';
  }
  if (services.match(/fitness|gym|training|workout/i)) {
    return 'ExerciseGym';
  }

  // Food & Hospitality
  if (services.match(/restaurant|dining|food|cafe|coffee|pizza|burger/i)) {
    return 'Restaurant';
  }
  if (services.match(/hotel|motel|inn|lodging|accommodation/i)) {
    return 'LodgingBusiness';
  }

  // Professional Services
  if (services.match(/legal|lawyer|attorney|law firm/i)) {
    return 'LegalService';
  }
  if (services.match(/accounting|tax|bookkeeping|cpa/i)) {
    return 'AccountingService';
  }
  if (services.match(/real estate|realtor|property|homes/i)) {
    return 'RealEstateAgent';
  }
  if (services.match(/insurance|agent|coverage/i)) {
    return 'InsuranceAgency';
  }
  if (services.match(/financial|advisor|investment|wealth/i)) {
    return 'FinancialService';
  }

  // Home Services
  if (services.match(/plumbing|plumber|pipe|drain/i)) {
    return 'PlumbingService';
  }
  if (services.match(/electric|electrician|wiring/i)) {
    return 'ElectricalService';
  }
  if (services.match(/hvac|heating|cooling|air conditioning/i)) {
    return 'HVACBusiness';
  }
  if (services.match(/cleaning|maid|janitorial/i)) {
    return 'CleaningService';
  }
  if (services.match(/landscaping|lawn|garden|tree/i)) {
    return 'LandscapingBusiness';
  }

  // Technology
  if (services.match(/computer|it|tech|software|web|digital/i)) {
    return 'ProfessionalService';
  }

  // Generic business types
  if (services.match(/consulting|consultant|advisory|professional/i)) {
    return 'ProfessionalService';
  }

  // Default to LocalBusiness
  return 'LocalBusiness';
}

function hasValidAddress(address: any): boolean {
  return address && (address.street || address.city || address.region);
}

function parseOpeningHours(hours: string[]): any[] {
  const openingHours: any[] = [];

  for (const hourString of hours) {
    const parsed = parseHourString(hourString);
    if (parsed) {
      openingHours.push(parsed);
    }
  }

  return openingHours;
}

function parseHourString(hourString: string): any | null {
  if (!hourString || typeof hourString !== 'string') {
    return null;
  }

  const cleaned = hourString.trim().toLowerCase();

  // Handle closed days
  if (cleaned.match(/closed/i)) {
    return null;
  }

  // Try to extract day and time patterns
  const dayPattern =
    /(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)/i;
  const timePattern = /(\d{1,2}):?(\d{2})?\s*(am|pm)?/gi;

  const dayMatch = cleaned.match(dayPattern);
  const timeMatches = [...cleaned.matchAll(timePattern)];

  if (dayMatch && timeMatches.length >= 2) {
    const day = normalizeDayName(dayMatch[1]);
    const openTime = normalizeTime(timeMatches[0]);
    const closeTime = normalizeTime(timeMatches[1]);

    if (day && openTime && closeTime) {
      return {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [day],
        opens: openTime,
        closes: closeTime,
      };
    }
  }

  return null;
}

function normalizeDayName(day: string): string | null {
  const dayMap: { [key: string]: string } = {
    monday: 'Monday',
    mon: 'Monday',
    tuesday: 'Tuesday',
    tue: 'Tuesday',
    wednesday: 'Wednesday',
    wed: 'Wednesday',
    thursday: 'Thursday',
    thu: 'Thursday',
    friday: 'Friday',
    fri: 'Friday',
    saturday: 'Saturday',
    sat: 'Saturday',
    sunday: 'Sunday',
    sun: 'Sunday',
  };

  return dayMap[day.toLowerCase()] || null;
}

function normalizeTime(timeMatch: RegExpMatchArray): string | null {
  if (!timeMatch) return null;

  let hours = parseInt(timeMatch[1]);
  const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
  const ampm = timeMatch[3]?.toLowerCase();

  if (ampm === 'pm' && hours !== 12) {
    hours += 12;
  } else if (ampm === 'am' && hours === 12) {
    hours = 0;
  }

  if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  return null;
}
