import { NormalizedBusiness } from '@/types/seo';

/**
 * Normalize business profile data from various sources
 * Maps only present fields, never guesses missing data
 */
export function normalizeProfile(input: any): NormalizedBusiness {
  if (!input || typeof input !== 'object') {
    return { name: '' };
  }

  const normalized: NormalizedBusiness = {
    name: typeof input.name === 'string' ? input.name.trim() : '',
  };

  // Optional URL
  if (typeof input.url === 'string' && input.url.trim()) {
    normalized.url = input.url.trim();
  } else if (typeof input.website === 'string' && input.website.trim()) {
    normalized.url = input.website.trim();
  }

  // Optional logo
  if (typeof input.logo === 'string' && input.logo.trim()) {
    normalized.logo = input.logo.trim();
  }

  // Optional phone
  if (typeof input.phone === 'string' && input.phone.trim()) {
    normalized.phone = input.phone.trim();
  }

  // Optional address (support nested object or flat structure)
  if (input.address && typeof input.address === 'object') {
    const addr: any = {};
    if (typeof input.address.street === 'string' && input.address.street.trim()) {
      addr.street = input.address.street.trim();
    }
    if (typeof input.address.city === 'string' && input.address.city.trim()) {
      addr.city = input.address.city.trim();
    }
    if (typeof input.address.region === 'string' && input.address.region.trim()) {
      addr.region = input.address.region.trim();
    }
    if (typeof input.address.postal === 'string' && input.address.postal.trim()) {
      addr.postal = input.address.postal.trim();
    }
    if (typeof input.address.country === 'string' && input.address.country.trim()) {
      addr.country = input.address.country.trim();
    }
    if (Object.keys(addr).length > 0) {
      normalized.address = addr;
    }
  }

  // Optional services array
  if (Array.isArray(input.services)) {
    const services = input.services
      .filter((s: any) => typeof s === 'string' && s.trim())
      .map((s: string) => s.trim());
    if (services.length > 0) {
      normalized.services = services;
    }
  }

  // Optional social array
  if (Array.isArray(input.social)) {
    const social = input.social
      .filter((s: any) => typeof s === 'string' && s.trim())
      .map((s: string) => s.trim());
    if (social.length > 0) {
      normalized.social = social;
    }
  }

  // Optional hours array
  if (Array.isArray(input.hours)) {
    const hours = input.hours
      .filter((h: any) => typeof h === 'string' && h.trim())
      .map((h: string) => h.trim());
    if (hours.length > 0) {
      normalized.hours = hours;
    }
  }

  // Optional rating (number between 0-5)
  if (typeof input.rating === 'number' && input.rating >= 0 && input.rating <= 5) {
    normalized.rating = input.rating;
  } else if (input.reviews && typeof input.reviews.rating === 'number') {
    const rating = input.reviews.rating;
    if (rating >= 0 && rating <= 5) {
      normalized.rating = rating;
    }
  }

  // Optional review count
  if (typeof input.reviewCount === 'number' && input.reviewCount >= 0) {
    normalized.reviewCount = Math.floor(input.reviewCount);
  } else if (input.reviews && typeof input.reviews.count === 'number') {
    const count = input.reviews.count;
    if (count >= 0) {
      normalized.reviewCount = Math.floor(count);
    }
  }

  // Optional geo coordinates
  if (input.geo && typeof input.geo === 'object') {
    const geo: any = {};
    if (typeof input.geo.lat === 'number') {
      geo.lat = input.geo.lat;
    }
    if (typeof input.geo.lon === 'number') {
      geo.lon = input.geo.lon;
    } else if (typeof input.geo.lng === 'number') {
      geo.lon = input.geo.lng;
    }
    if (geo.lat !== undefined && geo.lon !== undefined) {
      normalized.geo = geo;
    }
  }

  // Optional FAQs
  if (Array.isArray(input.faqs)) {
    const faqs = input.faqs
      .filter(
        (faq: any) =>
          faq &&
          typeof faq.q === 'string' &&
          faq.q.trim() &&
          typeof faq.a === 'string' &&
          faq.a.trim()
      )
      .map((faq: any) => ({
        q: faq.q.trim(),
        a: faq.a.trim(),
      }));
    if (faqs.length > 0) {
      normalized.faqs = faqs;
    }
  }

  return normalized;
}
