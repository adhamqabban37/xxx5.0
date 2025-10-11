'use client';

import React, { useState, useCallback } from 'react';
import { Autocomplete, LoadScript } from '@react-google-maps/api';
import { BusinessMap } from './BusinessMap';
import { Search, MapPin, Copy, Check } from 'lucide-react';

/**
 * Enhanced BusinessMap with address autocomplete input
 */
export interface BusinessMapWithAutocompleteProps {
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
  businessName?: string;
  zoom?: number;
  height?: string;
  showControls?: boolean;
  className?: string;
  onLocationChange?: (location: { lat: number; lng: number; address: string }) => void;
}

/**
 * Google Maps API libraries for autocomplete
 */
const AUTOCOMPLETE_LIBRARIES: 'places'[] = ['places'];

/**
 * BusinessMap with Places API autocomplete input
 */
export const BusinessMapWithAutocomplete: React.FC<BusinessMapWithAutocompleteProps> = ({
  initialLat,
  initialLng,
  initialAddress = '',
  businessName,
  zoom = 14,
  height = '320px',
  showControls = false,
  className = '',
  onLocationChange,
}) => {
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [address, setAddress] = useState(initialAddress);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );
  const [copied, setCopied] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const isValidApiKey =
    apiKey && apiKey !== 'YOUR_KEY_HERE' && !apiKey.includes('your-') && apiKey.length > 20;

  /**
   * Handle autocomplete load
   */
  const onAutocompleteLoad = useCallback((autocomplete: google.maps.places.Autocomplete) => {
    setAutocomplete(autocomplete);
  }, []);

  /**
   * Handle place selection from autocomplete
   */
  const onPlaceChanged = useCallback(() => {
    if (!autocomplete) return;

    const place = autocomplete.getPlace();
    if (!place.geometry?.location) return;

    const newLat = place.geometry.location.lat();
    const newLng = place.geometry.location.lng();
    const newAddress = place.formatted_address || place.name || '';

    setAddress(newAddress);
    setCoordinates({ lat: newLat, lng: newLng });

    // Notify parent component
    onLocationChange?.({
      lat: newLat,
      lng: newLng,
      address: newAddress,
    });
  }, [autocomplete, onLocationChange]);

  /**
   * Copy coordinates to clipboard
   */
  const copyCoordinates = useCallback(async () => {
    if (!coordinates) return;

    const coordinateString = `${coordinates.lat}, ${coordinates.lng}`;

    try {
      await navigator.clipboard.writeText(coordinateString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = coordinateString;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [coordinates]);

  if (!isValidApiKey) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="relative">
          <input
            type="text"
            placeholder="Google Maps API key required for autocomplete..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
            disabled
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
        <BusinessMap
          lat={initialLat}
          lng={initialLng}
          address={address}
          businessName={businessName}
          zoom={zoom}
          height={height}
          showControls={showControls}
        />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Address Search Input */}
      <LoadScript googleMapsApiKey={apiKey!} libraries={AUTOCOMPLETE_LIBRARIES}>
        <div className="relative">
          <Autocomplete
            onLoad={onAutocompleteLoad}
            onPlaceChanged={onPlaceChanged}
            options={{
              types: ['establishment', 'geocode'],
              componentRestrictions: { country: 'US' }, // Adjust as needed
            }}
          >
            <input
              type="text"
              placeholder="Search for an address or business..."
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              defaultValue={address}
            />
          </Autocomplete>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />

          {/* Copy Coordinates Button */}
          {coordinates && (
            <button
              onClick={copyCoordinates}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Copy coordinates"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </button>
          )}
        </div>
      </LoadScript>

      {/* Map Component */}
      <BusinessMap
        lat={coordinates?.lat || initialLat}
        lng={coordinates?.lng || initialLng}
        address={!coordinates ? address : undefined}
        businessName={businessName}
        zoom={zoom}
        height={height}
        showControls={showControls}
      />

      {/* Location Info */}
      {coordinates && (
        <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-blue-500" />
            <span>
              Location: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
            </span>
          </div>
          <button
            onClick={copyCoordinates}
            className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 mr-1" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 mr-1" />
                Copy Coordinates
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default BusinessMapWithAutocomplete;
