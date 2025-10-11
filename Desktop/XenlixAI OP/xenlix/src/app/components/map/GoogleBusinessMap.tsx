'use client';

import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';

interface GoogleBusinessMapProps {
  lat?: number;
  lng?: number;
  address?: string;
  businessName?: string;
  zoom?: number;
  height?: string;
  showControls?: boolean;
  className?: string;
}

const libraries: Array<'places' | 'geometry'> = ['places', 'geometry'];

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'on' }],
    },
    {
      featureType: 'transit',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ],
};

export default function GoogleBusinessMap({
  lat,
  lng,
  address,
  businessName,
  zoom = 14,
  height = '300px',
  showControls = true,
  className = '',
}: GoogleBusinessMapProps) {
  const [mapError, setMapError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Default to San Francisco if no coordinates provided
  const defaultLat = lat ?? 37.7749;
  const defaultLng = lng ?? -122.4194;

  const center = {
    lat: defaultLat,
    lng: defaultLng,
  };

  useEffect(() => {
    // Check if Google Maps API key is available
    const checkApiKey = async () => {
      try {
        const response = await fetch('/api/maps-token');
        const data = await response.json();

        if (data.success) {
          setApiKey(data.apiKey);
        } else {
          setMapError(data.error || 'Google Maps API not available');
        }
      } catch (error) {
        setMapError('Failed to load Google Maps configuration');
      } finally {
        setIsLoading(false);
      }
    };

    checkApiKey();
  }, []);

  const onMapLoad = (map: google.maps.Map) => {
    console.log('Google Map loaded successfully');
    // Map is ready, you can add additional setup here
  };

  const onMapError = (error: any) => {
    console.error('Google Maps error:', error);
    setMapError('Failed to load Google Maps');
  };

  const markerContent = () => {
    if (businessName || address) {
      return (
        <div className="p-2 max-w-xs">
          {businessName && <h4 className="font-semibold text-gray-900 mb-1">{businessName}</h4>}
          {address && <p className="text-sm text-gray-600">{address}</p>}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  if (mapError || !apiKey) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={{ height }}
      >
        <div className="text-center p-4">
          <div className="text-red-500 mb-2">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-600 mb-2">{mapError}</p>
          <p className="text-xs text-gray-500">
            Configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable Google Maps
          </p>
        </div>
      </div>
    );
  }

  return (
    <LoadScript googleMapsApiKey={apiKey} libraries={libraries} onError={onMapError}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height }}
        center={center}
        zoom={zoom}
        options={mapOptions}
        onLoad={onMapLoad}
        className={className}
      >
        <Marker
          position={center}
          onClick={() => setShowInfo(true)}
          title={businessName || address || 'Business Location'}
        />

        {showInfo && markerContent() && (
          <InfoWindow position={center} onCloseClick={() => setShowInfo(false)}>
            <div>{markerContent()}</div>
          </InfoWindow>
        )}
      </GoogleMap>
    </LoadScript>
  );
}
