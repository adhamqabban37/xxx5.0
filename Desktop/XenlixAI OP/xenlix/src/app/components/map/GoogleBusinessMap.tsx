'use client';

import { useMemo } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

const libs = ['places', 'geometry'] as const;

export interface GoogleBusinessMapProps {
  center?: {
    lat: number;
    lng: number;
  };
  lat?: number;
  lng?: number;
  address?: string;
  businessName?: string;
  zoom?: number;
  mapContainerStyle?: {
    width: string;
    height: string | number;
  };
  height?: string;
  showControls?: boolean;
  className?: string;
  mapMode?: 'free' | 'premium';
}

export default function GoogleBusinessMap({
  center,
  lat,
  lng,
  address,
  businessName,
  zoom = 14,
  mapContainerStyle,
  height = '300px',
  showControls = true,
  className = '',
  mapMode = 'premium',
  ...props
}: GoogleBusinessMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: libs,
  });

  const mapOptions = useMemo(
    () => ({
      disableDefaultUI: !showControls,
      clickableIcons: true,
      scrollwheel: true,
    }),
    [showControls]
  );

  // Use provided center or fallback to lat/lng or default coordinates
  const mapCenter = useMemo(() => {
    if (center) return center;
    if (lat !== undefined && lng !== undefined) return { lat, lng };
    return { lat: 37.7749, lng: -122.4194 }; // Default to San Francisco
  }, [center, lat, lng]);

  const containerStyle = useMemo(() => {
    if (mapContainerStyle) return mapContainerStyle;
    return { width: '100%', height: typeof height === 'string' ? height : `${height}px` };
  }, [mapContainerStyle, height]);

  if (loadError) {
    console.error('Google Maps loadError:', loadError);
    return <div className="text-red-600">Failed to load Google Maps</div>;
  }

  if (!isLoaded || typeof window === 'undefined') {
    return <div>Loading map…</div>;
  }

  return (
    <div className={className}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={zoom}
        options={mapOptions}
        {...props}
      >
        <Marker position={mapCenter} />
      </GoogleMap>
    </div>
  );
}
