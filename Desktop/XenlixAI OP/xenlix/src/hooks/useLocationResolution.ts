/**
 * Non-blocking location resolution hook for free tier
 * Handles geocoding with timeout and caching
 */

import { useState, useEffect } from 'react';

interface UseLocationResult {
  coordinates: { lat: number; lng: number } | null;
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

export function useLocationResolution(
  address?: string,
  initialLat?: number,
  initialLng?: number
): UseLocationResult {
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // If we already have coordinates, don't geocode
    if (coordinates) {
      setSuccess(true);
      return;
    }

    // If no address provided, can't geocode
    if (!address?.trim()) {
      return;
    }

    // Perform non-blocking geocoding
    const resolveLocation = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/location/resolve', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ address }),
        });

        if (!response.ok) {
          if (response.status === 429) {
            throw new Error('Rate limit exceeded. Try again later.');
          }
          if (response.status === 503) {
            throw new Error('Geocoding service unavailable.');
          }
          throw new Error('Failed to resolve location.');
        }

        const data = await response.json();

        if (data.success && data.result) {
          setCoordinates({
            lat: data.result.lat,
            lng: data.result.lng,
          });
          setSuccess(true);
          console.log(
            `✅ Location resolved: ${data.result.lat}, ${data.result.lng} via ${data.result.provider}${data.result.cached ? ' (cached)' : ''}`
          );
        } else {
          throw new Error('Location not found.');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.log(`❌ Location resolution failed: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    };

    // Small delay to prevent immediate API calls on mount
    const timeoutId = setTimeout(() => {
      resolveLocation();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [address, coordinates]);

  return {
    coordinates,
    isLoading,
    error,
    success,
  };
}
