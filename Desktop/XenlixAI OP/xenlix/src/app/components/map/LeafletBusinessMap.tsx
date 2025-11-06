'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Copy, ExternalLink, AlertCircle, Check } from 'lucide-react';

interface LeafletBusinessMapProps {
  lat?: number;
  lng?: number;
  address?: string;
  businessName?: string;
  zoom?: number;
  height?: string;
  showControls?: boolean;
  className?: string;
  mapMode?: 'free' | 'premium';
}

interface GeocodingResult {
  lat: number;
  lng: number;
  display_name: string;
}

interface MapState {
  isLoading: boolean;
  error: string | null;
  coordinates: { lat: number; lng: number } | null;
  formattedAddress: string | null;
  copied: boolean;
}

/**
 * Production-ready Leaflet BusinessMap component using OpenStreetMap
 * Free alternative to Google Maps with no API key required
 */
export default function LeafletBusinessMap({
  lat,
  lng,
  address,
  businessName,
  zoom = 13,
  height = '320px',
  showControls = true,
  className = '',
  mapMode = 'premium',
}: LeafletBusinessMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [state, setState] = useState<MapState>({
    isLoading: false,
    error: null,
    coordinates: lat && lng ? { lat, lng } : null,
    formattedAddress: null,
    copied: false,
  });

  /**
   * Geocode address using server-side proxy to avoid CORS issues
   */
  const geocodeAddress = useCallback(
    async (addressToGeocode: string): Promise<GeocodingResult | null> => {
      try {
        // Check session cache first
        const cacheKey = `leaflet_geocode_${mapMode}_${addressToGeocode}`;
        const cached = sessionStorage.getItem(cacheKey);

        if (cached) {
          return JSON.parse(cached);
        }

        // Use server-side geocoding proxy (no CORS issues)
        const endpoint = mapMode === 'premium' ? '/api/geocode/osm' : '/api/location/resolve';
        const response = await fetch(`${endpoint}?q=${encodeURIComponent(addressToGeocode)}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (response.status === 429) {
            throw new Error('Geocoding service rate limited');
          }
          if (response.status === 404) {
            throw new Error('Address not found. Please check the address format.');
          }
          throw new Error(errorData.error || 'Geocoding service unavailable');
        }

        const data = await response.json();

        if (!data.lat || !data.lng) {
          throw new Error('Address not found. Please check the address format.');
        }

        const result: GeocodingResult = {
          lat: data.lat,
          lng: data.lng,
          display_name: data.address || data.display_name || `${data.lat}, ${data.lng}`,
        };

        // Cache the result
        sessionStorage.setItem(cacheKey, JSON.stringify(result));

        return result;
      } catch (err) {
        console.error('Geocoding failed:', err);
        throw err;
      }
    },
    [mapMode]
  );

  /**
   * Initialize Leaflet map
   */
  const initializeMap = useCallback(
    async (mapLat: number, mapLng: number, name: string) => {
      if (!mapRef.current) return;

      try {
        // Dynamically import Leaflet to avoid SSR issues
        const L = (await import('leaflet')).default;

        // Import CSS
        await import('leaflet/dist/leaflet.css');

        // Fix for default markers in webpack (Leaflet issue)
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        // Clear existing map
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
        }

        // Create new map
        const map = L.map(mapRef.current).setView([mapLat, mapLng], zoom);

        // Add OpenStreetMap tile layer
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        // Create popup content
        const popupContent = `
        <div style="padding: 8px; min-width: 200px;">
          <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px; color: #1f2937;">${name}</div>
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
            📍 ${mapLat.toFixed(6)}, ${mapLng.toFixed(6)}
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <button 
              onclick="
                navigator.clipboard.writeText('${mapLat}, ${mapLng}').then(() => {
                  this.innerHTML = '✓ Copied!';
                  this.style.backgroundColor = '#10b981';
                  setTimeout(() => {
                    this.innerHTML = '📋 Copy';
                    this.style.backgroundColor = '#3b82f6';
                  }, 2000);
                }).catch(() => {
                  this.innerHTML = 'Copy failed';
                  setTimeout(() => this.innerHTML = '📋 Copy', 2000);
                });
              "
              style="
                font-size: 11px; 
                background-color: #3b82f6; 
                color: white; 
                padding: 4px 8px; 
                border: none; 
                border-radius: 4px; 
                cursor: pointer;
                transition: all 0.2s;
              "
              onmouseover="this.style.backgroundColor='#2563eb'"
              onmouseout="this.style.backgroundColor='#3b82f6'"
            >
              📋 Copy
            </button>
            <a 
              href="https://www.openstreetmap.org/?mlat=${mapLat}&mlon=${mapLng}&zoom=${zoom}" 
              target="_blank" 
              style="
                font-size: 11px; 
                background-color: #059669; 
                color: white; 
                padding: 4px 8px; 
                border-radius: 4px; 
                text-decoration: none;
                transition: all 0.2s;
              "
              onmouseover="this.style.backgroundColor='#047857'"
              onmouseout="this.style.backgroundColor='#059669'"
            >
              🔗 Open
            </a>
          </div>
        </div>
      `;

        // Add marker with popup
        const marker = L.marker([mapLat, mapLng]).addTo(map).bindPopup(popupContent).openPopup();

        // Configure controls
        if (!showControls) {
          map.removeControl(map.zoomControl);
        }

        mapInstanceRef.current = map;
      } catch (err) {
        console.error('Failed to initialize map:', err);
        setState((prev) => ({ ...prev, error: 'Failed to load interactive map' }));
      }
    },
    [zoom, showControls]
  );

  /**
   * Copy coordinates to clipboard
   */
  const copyCoordinates = useCallback(async () => {
    if (!state.coordinates) return;

    const coordString = `${state.coordinates.lat}, ${state.coordinates.lng}`;

    try {
      await navigator.clipboard.writeText(coordString);
      setState((prev) => ({ ...prev, copied: true }));
      setTimeout(() => setState((prev) => ({ ...prev, copied: false })), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = coordString;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setState((prev) => ({ ...prev, copied: true }));
      setTimeout(() => setState((prev) => ({ ...prev, copied: false })), 2000);
    }
  }, [state.coordinates]);

  /**
   * Open location in OpenStreetMap
   */
  const openInOSM = useCallback(() => {
    if (state.coordinates) {
      const url = `https://www.openstreetmap.org/?mlat=${state.coordinates.lat}&mlon=${state.coordinates.lng}&zoom=${zoom}`;
      window.open(url, '_blank');
    } else if (address) {
      const url = `https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`;
      window.open(url, '_blank');
    }
  }, [state.coordinates, address, zoom]);

  /**
   * Main effect to handle coordinate resolution and map initialization
   */
  useEffect(() => {
    const setupMap = async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        let finalCoords = state.coordinates;
        let finalName = businessName || 'Business Location';

        // Prefer exact coordinates if provided
        if (lat && lng) {
          finalCoords = { lat, lng };
          setState((prev) => ({ ...prev, coordinates: finalCoords }));
        }
        // Otherwise try geocoding the address
        else if (address && !finalCoords) {
          const geocodeResult = await geocodeAddress(address);
          if (geocodeResult) {
            finalCoords = { lat: geocodeResult.lat, lng: geocodeResult.lng };
            finalName = businessName || address;
            setState((prev) => ({
              ...prev,
              coordinates: finalCoords,
              formattedAddress: geocodeResult.display_name,
            }));
          } else {
            throw new Error('Address not found. Please check the address format.');
          }
        }

        // If we have coordinates, initialize the map
        if (finalCoords) {
          await initializeMap(finalCoords.lat, finalCoords.lng, finalName);
        }

        setState((prev) => ({ ...prev, isLoading: false }));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load location';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
      }
    };

    setupMap();

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, [lat, lng, address, businessName, geocodeAddress, initializeMap]);

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
          <div className="h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200"></div>
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
            <h3 className="text-lg font-semibold text-red-900 mb-2">Location Error</h3>
            <p className="text-sm text-red-700 mb-4">{state.error}</p>
            <button
              onClick={openInOSM}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Search in OpenStreetMap
            </button>
          </div>
        </div>
      </div>
    );
  }

  /**
   * No location data state
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
   * Map display
   */
  return (
    <div
      className={`relative border border-gray-200 rounded-lg overflow-hidden ${className}`}
      style={{ height }}
    >
      {/* Map container */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Map info bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-90 backdrop-blur-sm border-t border-gray-200 p-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2 text-gray-700">
            <MapPin className="h-4 w-4 text-blue-500" />
            <span>
              {state.coordinates.lat.toFixed(6)}, {state.coordinates.lng.toFixed(6)}
              {state.formattedAddress && (
                <span className="ml-2 text-gray-500">• {businessName || 'Business Location'}</span>
              )}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={copyCoordinates}
              className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              {state.copied ? (
                <>
                  <Check className="h-3 w-3 mr-1 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </>
              )}
            </button>
            <button
              onClick={openInOSM}
              className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Open Map
            </button>
          </div>
        </div>
      </div>

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
              href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(
                address || `${state.coordinates?.lat},${state.coordinates?.lng}` || ''
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View in OpenStreetMap
            </a>
          </div>
        </div>
      </noscript>
    </div>
  );
}
