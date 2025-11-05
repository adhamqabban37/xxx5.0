import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

interface GeocodeResult {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  addressComponents: {
    streetNumber?: string;
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  placeId: string;
  locationType: string;
  formattedAddress: string;
}

interface GeocodeResponse {
  success: boolean;
  results: GeocodeResult[];
  error?: string;
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_GEOCODING_API_KEY;
    if (!apiKey) {
      console.log('Geocoding API key not configured, returning mock data');
      return getMockGeocodeResponse(query);
    }

    console.log(`Geocoding request for: "${query}"`);

    // Make request to Google Geocoding API
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`;

    const response = await fetch(geocodeUrl);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const results: GeocodeResult[] = data.results.slice(0, 5).map((result: any) => ({
        address: result.formatted_address,
        coordinates: {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
        },
        addressComponents: parseAddressComponents(result.address_components),
        placeId: result.place_id,
        locationType: result.geometry.location_type,
        formattedAddress: result.formatted_address,
      }));

      return NextResponse.json({
        success: true,
        results,
      });
    } else {
      console.log('Geocoding API returned no results:', data.status);
      return getMockGeocodeResponse(query);
    }
  } catch (error) {
    console.error('Geocoding API error:', error);
    const query = new URL(request.url).searchParams.get('q') || 'unknown';
    return getMockGeocodeResponse(query);
  }
}

function parseAddressComponents(components: any[]): GeocodeResult['addressComponents'] {
  const parsed: GeocodeResult['addressComponents'] = {};

  components.forEach((component) => {
    const types = component.types;

    if (types.includes('street_number')) {
      parsed.streetNumber = component.long_name;
    } else if (types.includes('route')) {
      parsed.street = component.long_name;
    } else if (types.includes('locality')) {
      parsed.city = component.long_name;
    } else if (types.includes('administrative_area_level_1')) {
      parsed.state = component.short_name;
    } else if (types.includes('postal_code')) {
      parsed.zipCode = component.long_name;
    } else if (types.includes('country')) {
      parsed.country = component.long_name;
    }
  });

  return parsed;
}

function getMockGeocodeResponse(query: string): NextResponse {
  // Generate realistic mock data based on query
  const mockResults: GeocodeResult[] = [];

  if (query.toLowerCase().includes('seattle')) {
    mockResults.push({
      address: 'Seattle, WA, USA',
      coordinates: { lat: 47.6062, lng: -122.3321 },
      addressComponents: {
        city: 'Seattle',
        state: 'WA',
        country: 'United States',
      },
      placeId: 'mock_seattle_place_id',
      locationType: 'APPROXIMATE',
      formattedAddress: 'Seattle, WA, USA',
    });
  } else if (query.toLowerCase().includes('law') || query.toLowerCase().includes('attorney')) {
    mockResults.push({
      address: '123 Business St, Downtown, WA 98101, USA',
      coordinates: { lat: 47.6205, lng: -122.3493 },
      addressComponents: {
        streetNumber: '123',
        street: 'Business St',
        city: 'Downtown',
        state: 'WA',
        zipCode: '98101',
        country: 'United States',
      },
      placeId: 'mock_law_firm_place_id',
      locationType: 'ROOFTOP',
      formattedAddress: '123 Business St, Downtown, WA 98101, USA',
    });
  } else {
    // Generic business location
    mockResults.push({
      address: '456 Main Ave, Business City, WA 98102, USA',
      coordinates: { lat: 47.6097, lng: -122.3331 },
      addressComponents: {
        streetNumber: '456',
        street: 'Main Ave',
        city: 'Business City',
        state: 'WA',
        zipCode: '98102',
        country: 'United States',
      },
      placeId: 'mock_generic_place_id',
      locationType: 'ROOFTOP',
      formattedAddress: '456 Main Ave, Business City, WA 98102, USA',
    });
  }

  return NextResponse.json({
    success: true,
    results: mockResults,
    mock: true,
    message: 'Using mock data - configure GOOGLE_GEOCODING_API_KEY for real results',
  });
}
