/**
 * Sitemap Generator for Dynamic URL Discovery
 * 
 * This module handles dynamic sitemap generation with canonical URL normalization
 * and integration with the canonical normalization system.
 */

import { CityData } from '@/types/local-seo'

// Import the CITY_DATABASE from the city page component (in production, this would come from a database)
export async function getCityDatabase(): Promise<{ [slug: string]: CityData }> {
  // This is the same city database from the [city]/page.tsx file
  // In production, this would be fetched from a database
  const CITY_DATABASE: { [slug: string]: CityData } = {
    'new-york': {
      name: "New York",
      state: "New York",
      stateAbbreviation: "NY",
      county: "New York County",
      region: "Northeast",
      country: "United States",
      coordinates: {
        latitude: 40.7128,
        longitude: -74.0060
      },
      timezone: "America/New_York",
      zipCodes: ["10001", "10002", "10003", "10004", "10005"],
      demographics: {
        population: 8336817,
        medianAge: 36.2,
        medianIncome: 67046,
        householdCount: 3736077,
        businessCount: 285000
      },
      economy: {
        majorIndustries: [
          "Financial Services",
          "Technology",
          "Media",
          "Tourism",
          "Real Estate",
          "Healthcare"
        ],
        unemploymentRate: 4.2,
        economicGrowthRate: 2.8,
        businessFriendlyRating: 8.5
      },
      characteristics: {
        localKeywords: [
          "manhattan",
          "brooklyn",
          "queens",
          "bronx",
          "staten island",
          "nyc",
          "big apple"
        ],
        neighborhoodNames: [
          "Manhattan",
          "Brooklyn",
          "Queens",
          "Bronx",
          "Staten Island",
          "Upper East Side",
          "Greenwich Village",
          "SoHo",
          "Tribeca",
          "Williamsburg"
        ],
        landmarkNames: [
          "Times Square",
          "Central Park",
          "Statue of Liberty",
          "Empire State Building",
          "Brooklyn Bridge",
          "Wall Street"
        ],
        events: [
          "New Year's Eve Ball Drop",
          "NYC Marathon",
          "Fashion Week",
          "Summer Streets"
        ],
        culture: [
          "Arts and Theater",
          "Diverse Cuisine",
          "Fashion Hub",
          "Financial Center"
        ],
        climate: "humid subtropical"
      }
    },
    'los-angeles': {
      name: "Los Angeles",
      state: "California",
      stateAbbreviation: "CA",
      county: "Los Angeles County",
      region: "West Coast",
      country: "United States",
      coordinates: {
        latitude: 34.0522,
        longitude: -118.2437
      },
      timezone: "America/Los_Angeles",
      zipCodes: ["90001", "90210", "90028", "90069", "90291"],
      demographics: {
        population: 3971883,
        medianAge: 35.8,
        medianIncome: 62142,
        householdCount: 1456875,
        businessCount: 175000
      },
      economy: {
        majorIndustries: [
          "Entertainment",
          "Technology",
          "Aerospace",
          "Fashion",
          "Tourism",
          "International Trade"
        ],
        unemploymentRate: 4.8,
        economicGrowthRate: 3.2,
        businessFriendlyRating: 7.8
      },
      characteristics: {
        localKeywords: [
          "hollywood",
          "beverly hills",
          "santa monica",
          "venice",
          "downtown la",
          "la",
          "city of angels"
        ],
        neighborhoodNames: [
          "Hollywood",
          "Beverly Hills",
          "Santa Monica",
          "Venice",
          "Downtown LA",
          "West Hollywood",
          "Silver Lake",
          "Los Feliz",
          "Brentwood",
          "Manhattan Beach"
        ],
        landmarkNames: [
          "Hollywood Sign",
          "Griffith Observatory",
          "Santa Monica Pier",
          "Getty Center",
          "Venice Beach",
          "Rodeo Drive"
        ],
        events: [
          "Academy Awards",
          "LA Film Festival",
          "Rose Parade",
          "LA Marathon"
        ],
        culture: [
          "Entertainment Capital",
          "Beach Lifestyle",
          "Diverse Communities",
          "Innovation Hub"
        ],
        climate: "Mediterranean"
      }
    },
    'chicago': {
      name: "Chicago",
      state: "Illinois",
      stateAbbreviation: "IL",
      county: "Cook County",
      region: "Midwest",
      country: "United States",
      coordinates: {
        latitude: 41.8781,
        longitude: -87.6298
      },
      timezone: "America/Chicago",
      zipCodes: ["60601", "60602", "60603", "60604", "60605"],
      demographics: {
        population: 2693976,
        medianAge: 34.8,
        medianIncome: 58247,
        householdCount: 1061928,
        businessCount: 125000
      },
      economy: {
        majorIndustries: [
          "Manufacturing",
          "Transportation",
          "Finance",
          "Technology",
          "Healthcare",
          "Food Processing"
        ],
        unemploymentRate: 4.5,
        economicGrowthRate: 2.4,
        businessFriendlyRating: 8.2
      },
      characteristics: {
        localKeywords: [
          "windy city",
          "chi-town",
          "the loop",
          "magnificent mile",
          "north shore",
          "second city"
        ],
        neighborhoodNames: [
          "The Loop",
          "River North",
          "Lincoln Park",
          "Wicker Park",
          "Gold Coast",
          "Old Town",
          "Bucktown",
          "Logan Square",
          "Ukrainian Village",
          "Pilsen"
        ],
        landmarkNames: [
          "Millennium Park",
          "Navy Pier",
          "Willis Tower",
          "Art Institute",
          "Wrigley Field",
          "Lincoln Park Zoo"
        ],
        events: [
          "Lollapalooza",
          "Chicago Marathon",
          "Air and Water Show",
          "Taste of Chicago"
        ],
        culture: [
          "Architecture",
          "Deep Dish Pizza",
          "Blues and Jazz",
          "Sports Culture"
        ],
        climate: "continental"
      }
    }
  }

  return CITY_DATABASE
}

/**
 * Generate dynamic sitemap URLs for all discoverable content
 */
export async function generateDynamicSitemapUrls(baseUrl: string): Promise<Array<{
  url: string
  lastModified: Date
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority: number
}>> {
  const urls: Array<{
    url: string
    lastModified: Date
    changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
    priority: number
  }> = []

  try {
    // Get city database
    const cityDatabase = await getCityDatabase()
    
    // Generate city URLs
    Object.keys(cityDatabase).forEach(citySlug => {
      urls.push({
        url: `${baseUrl}/${citySlug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8
      })
    })

    return urls
  } catch (error) {
    console.error('Error generating dynamic sitemap URLs:', error)
    return []
  }
}

/**
 * Count total URLs for sitemap pagination
 */
export async function countSitemapUrls(): Promise<number> {
  try {
    const cityDatabase = await getCityDatabase()
    
    // Core pages count
    const corePageCount = 18 // Based on current core pages
    
    // Dynamic city pages
    const cityPageCount = Object.keys(cityDatabase).length
    
    // Case study pages
    const caseStudyCount = 5 // Based on current case studies
    
    return corePageCount + cityPageCount + caseStudyCount
  } catch (error) {
    console.error('Error counting sitemap URLs:', error)
    return 0
  }
}

/**
 * Generate sitemap index if URLs exceed limit
 */
export function shouldGenerateSitemapIndex(urlCount: number, maxUrlsPerSitemap: number = 50000): boolean {
  return urlCount > maxUrlsPerSitemap
}