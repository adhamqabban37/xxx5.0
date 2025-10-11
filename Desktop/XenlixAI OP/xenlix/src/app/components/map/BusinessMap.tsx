'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { MapPin, AlertCircle, Copy, ExternalLink } from 'lucide-react';
import { defaultMapOptions } from './styles/mapStyles';

/**
 * BusinessMap Component Props
 */
export type BusinessMapProps = {
  lat?: number;
  lng?: number;
  address?: string; // used if lat/lng not provided
  businessName?: string; // used for marker tooltip
  zoom?: number; // default 14
  height?: string; // default '320px'
  showControls?: boolean; // default false (minimal UI)
  className?: string; // additional CSS classes
};

/**
 * Geocoding result interface
 */
interface GeocodeResult {
  lat: number;
  lng: number;
  formatted_address: string;
}

/**
 * Component state interface
 */
interface MapState {
  isLoading: boolean;
  error: string | null;
  coordinates: { lat: number; lng: number } | null;
  formattedAddress: string | null;
  showInfoWindow: boolean;
}

/**
 * Google Maps API libraries to load
 */
const GOOGLE_MAPS_LIBRARIES: ('places' | 'geometry')[] = ['places', 'geometry'];

/**
 * Production-ready Google Maps component with graceful fallbacks
 */
export const BusinessMap: React.FC<BusinessMapProps> = ({
  lat,
  lng,
  address,
  businessName,
  zoom = 14,
  height = '320px',
  showControls = false,
  className = '',
}) => {
  const [state, setState] = useState<MapState>({
    isLoading: false,
    error: null,
    coordinates: null,
    formattedAddress: null,
    showInfoWindow: false,
  });

  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // API key validation
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const isValidApiKey =
    apiKey && apiKey !== 'YOUR_KEY_HERE' && !apiKey.includes('your-') && apiKey.length > 20;

  /**
   * Cache geocoding results in sessionStorage
   */
  const getCachedGeocode = useCallback((address: string): GeocodeResult | null => {
    try {
      const cached = sessionStorage.getItem(`geocode_${address}`);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }, []);

  const setCachedGeocode = useCallback((address: string, result: GeocodeResult) => {
    try {
      sessionStorage.setItem(`geocode_${address}`, JSON.stringify(result));
    } catch {
      // Ignore storage errors
    }
  }, []);

  /**
   * Geocode address to coordinates
   */
  const geocodeAddress = useCallback(
    async (addressToGeocode: string) => {
      if (!geocoderRef.current) {
        geocoderRef.current = new google.maps.Geocoder();
      }

      // Check cache first
      const cached = getCachedGeocode(addressToGeocode);
      if (cached) {
        setState((prev) => ({
          ...prev,
          coordinates: { lat: cached.lat, lng: cached.lng },
          formattedAddress: cached.formatted_address,
          isLoading: false,
          error: null,
        }));
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await new Promise<google.maps.GeocoderResponse>((resolve, reject) => {
          geocoderRef.current!.geocode({ address: addressToGeocode }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              resolve({ results, status } as google.maps.GeocoderResponse);
            } else {
              reject(new Error(status));
            }
          });
        });

        const location = response.results[0].geometry.location;
        const result: GeocodeResult = {
          lat: location.lat(),
          lng: location.lng(),
          formatted_address: response.results[0].formatted_address,
        };

        // Cache the result
        setCachedGeocode(addressToGeocode, result);

        setState((prev) => ({
          ...prev,
          coordinates: { lat: result.lat, lng: result.lng },
          formattedAddress: result.formatted_address,
          isLoading: false,
          error: null,
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        let userMessage = 'Address not found. Please confirm street, city, state, ZIP.';

        if (errorMessage.includes('OVER_QUERY_LIMIT')) {
          userMessage = 'Too many requests. Please try again in a moment.';
        } else if (errorMessage.includes('REQUEST_DENIED')) {
          userMessage = 'Maps service unavailable. Please check API configuration.';
        } else if (errorMessage.includes('ZERO_RESULTS')) {
          userMessage = 'Address not found. Please check the address format.';
        }

        console.error('Geocoding failed:', errorMessage, 'Address:', addressToGeocode);

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: userMessage,
        }));
      }
    },
    [getCachedGeocode, setCachedGeocode]
  );

  /**
   * Debounced geocoding for address changes
   */
  const debouncedGeocode = useCallback(
    (address: string) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(() => {
        geocodeAddress(address);
      }, 300);
    },
    [geocodeAddress]
  );

  /**
   * Initialize map coordinates
   */
  useEffect(() => {
    // Prefer exact coordinates if provided
    if (typeof lat === 'number' && typeof lng === 'number') {
      setState((prev) => ({
        ...prev,
        coordinates: { lat, lng },
        formattedAddress: null,
        isLoading: false,
        error: null,
      }));
      return;
    }

    // Otherwise, try to geocode address
    if (address && address.trim()) {
      debouncedGeocode(address.trim());
      return;
    }

    // No valid input
    setState((prev) => ({
      ...prev,
      coordinates: null,
      formattedAddress: null,
      isLoading: false,
      error: null,
    }));

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [lat, lng, address, debouncedGeocode]);

  /**
   * Copy coordinates to clipboard
   */
  const copyCoordinates = useCallback(async () => {
    if (!state.coordinates) return;

    try {
      await navigator.clipboard.writeText(`${state.coordinates.lat}, ${state.coordinates.lng}`);
    } catch {
      // Fallback for browsers without clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = `${state.coordinates.lat}, ${state.coordinates.lng}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  }, [state.coordinates]);

  /**
   * Open in Google Maps
   */
  const openInGoogleMaps = useCallback(() => {
    const query = state.coordinates
      ? `${state.coordinates.lat},${state.coordinates.lng}`
      : encodeURIComponent(address || '');
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  }, [state.coordinates, address]);

  /**
   * Handle map load
   */
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  /**
   * No API key fallback
   */
  if (!isValidApiKey) {
    return (
      <div
        className={`relative bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg ${className}`}
        style={{ height }}
      >
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Maps Configuration Required
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Google Maps API key needed for interactive maps.
            </p>
            <button
              onClick={openInGoogleMaps}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View in Google Maps
            </button>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Loading state
   */
  if (state.isLoading) {
    return (
      <div
        className={`relative bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg overflow-hidden ${className}`}
        style={{ height }}
      >
        <div className="absolute inset-0 animate-pulse">
          <div className="h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Error state
   */
  if (state.error) {
    return (
      <div
        className={`relative bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg ${className}`}
        style={{ height }}
      >
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">Address Not Found</h3>
            <p className="text-sm text-red-700 mb-4">{state.error}</p>
            <button
              onClick={openInGoogleMaps}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Search in Google Maps
            </button>
          </div>
        </div>
      </div>
    );
  }

  /**
   * No input state
   */
  if (!state.coordinates) {
    return (
      <div
        className={`relative bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-lg ${className}`}
        style={{ height }}
      >
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <MapPin className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-amber-900 mb-2">Location Pending</h3>
            <p className="text-sm text-amber-700 mb-4">
              Add a full address or coordinates to display the business location on the map.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Map options with controls
   */
  const mapOptions: google.maps.MapOptions = {
    ...defaultMapOptions,
    zoomControl: showControls,
    fullscreenControl: showControls,
    mapTypeControl: showControls,
    streetViewControl: showControls,
  };

  /**
   * Marker title
   */
  const markerTitle =
    businessName ||
    state.formattedAddress ||
    `Business Location (${state.coordinates.lat.toFixed(4)}, ${state.coordinates.lng.toFixed(4)})`;

  return (
    <div
      className={`relative border border-gray-200 rounded-lg overflow-hidden ${className}`}
      style={{ height }}
    >
      <LoadScript
        googleMapsApiKey={apiKey!}
        libraries={GOOGLE_MAPS_LIBRARIES}
        loadingElement={
          <div className="h-full bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading map...</p>
            </div>
          </div>
        }
      >
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={state.coordinates}
          zoom={zoom}
          options={mapOptions}
          onLoad={onMapLoad}
        >
          <Marker
            position={state.coordinates}
            title={markerTitle}
            onClick={() => setState((prev) => ({ ...prev, showInfoWindow: !prev.showInfoWindow }))}
          />

          {state.showInfoWindow && (
            <InfoWindow
              position={state.coordinates}
              onCloseClick={() => setState((prev) => ({ ...prev, showInfoWindow: false }))}
            >
              <div className="p-2 max-w-xs">
                <h4 className="font-semibold text-gray-900 mb-1">
                  {businessName || 'Business Location'}
                </h4>
                {state.formattedAddress && (
                  <p className="text-sm text-gray-600 mb-2">{state.formattedAddress}</p>
                )}
                <p className="text-xs text-gray-500 mb-2">
                  {state.coordinates.lat.toFixed(6)}, {state.coordinates.lng.toFixed(6)}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={copyCoordinates}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </button>
                  <button
                    onClick={openInGoogleMaps}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Directions
                  </button>
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>

      {/* Accessibility fallback */}
      <noscript>
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 p-6">
          <div className="text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Interactive Map Unavailable
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              JavaScript is required for interactive maps.
            </p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                address || `${state.coordinates?.lat},${state.coordinates?.lng}` || ''
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View in Google Maps
            </a>
          </div>
        </div>
      </noscript>
    </div>
  );
};

export default BusinessMap;
