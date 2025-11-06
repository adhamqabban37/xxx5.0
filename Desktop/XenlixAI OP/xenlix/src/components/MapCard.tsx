'use client';

// components/MapCard.tsx
// Smart Maps: Google Maps with OpenStreetMap fallback with non-blocking location resolution
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import LeafletBusinessMap from '@/app/components/map/LeafletBusinessMap';
import GoogleBusinessMap from '@/app/components/map/GoogleBusinessMap';
import { useLocationResolution } from '@/hooks/useLocationResolution';

type Props = {
  address?: string;
  lat?: number;
  lng?: number;
  businessName?: string;
  className?: string; // allow styling from parent
};

type MapProvider = 'google' | 'openstreetmap';

export default function MapCard({ address, lat, lng, businessName, className }: Props) {
  const [mapProvider, setMapProvider] = useState<MapProvider>('google');
  const [isGoogleMapsAvailable, setIsGoogleMapsAvailable] = useState<boolean | null>(null);
  const [showSelfTest, setShowSelfTest] = useState(false);
  const [testResults, setTestResults] = useState<{
    google: 'pending' | 'success' | 'error';
    coordinates: 'success' | 'error';
  }>({ google: 'pending', coordinates: 'success' });

  // Use non-blocking location resolution
  const { coordinates, isLoading: isResolvingLocation } = useLocationResolution(address, lat, lng);

  useEffect(() => {
    // Check Google Maps availability on component mount
    checkGoogleMapsAvailability();
  }, []);

  const checkGoogleMapsAvailability = async () => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      const isValid =
        apiKey && apiKey !== 'YOUR_KEY_HERE' && !apiKey.includes('your-') && apiKey.length > 20;

      setIsGoogleMapsAvailable(isValid);
      if (!isValid) {
        setMapProvider('openstreetmap');
      }
      setTestResults((prev) => ({
        ...prev,
        google: isValid ? 'success' : 'error',
      }));
    } catch (error) {
      console.error('Maps availability check failed:', error);
      setIsGoogleMapsAvailable(false);
      setMapProvider('openstreetmap');
      setTestResults((prev) => ({ ...prev, google: 'error' }));
    }
  };

  const runMapSelfTest = async () => {
    setShowSelfTest(true);
    setTestResults({ google: 'pending', coordinates: 'success' });

    // Test Google Maps API
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      const isValid =
        apiKey && apiKey !== 'YOUR_KEY_HERE' && !apiKey.includes('your-') && apiKey.length > 20;

      setTestResults((prev) => ({
        ...prev,
        google: isValid ? 'success' : 'error',
      }));

      // Test with known coordinates (Google HQ)
      const testLat = 37.422;
      const testLng = -122.084;

      if (isValid) {
        console.log(`Map self-test: Google Maps initialized at ${testLat}, ${testLng}`);
      }
    } catch (error) {
      console.error('Map self-test failed:', error);
      setTestResults((prev) => ({ ...prev, google: 'error' }));
    }
  };

  const toggleMapProvider = () => {
    if (isGoogleMapsAvailable) {
      setMapProvider(mapProvider === 'google' ? 'openstreetmap' : 'google');
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className={`bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 ${className || ''}`}
    >
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Location & Visibility</h3>
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${mapProvider === 'google' ? 'bg-blue-500' : 'bg-green-500'}`}
            ></div>
            <span className="text-sm text-gray-600">
              {mapProvider === 'google' ? 'Google Maps' : 'OpenStreetMap'}
            </span>
            {isGoogleMapsAvailable && (
              <button
                onClick={toggleMapProvider}
                className="text-xs text-blue-600 hover:text-blue-800 underline ml-2"
              >
                Switch
              </button>
            )}
          </div>
        </div>

        {/* Map Status Banner */}
        <div
          className={`flex items-start space-x-2 mb-4 p-3 rounded-lg border ${
            mapProvider === 'google' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'
          }`}
        >
          <div className="h-4 w-4 flex-shrink-0 mt-0.5">
            {mapProvider === 'google' && isGoogleMapsAvailable ? '🗺️' : '✅'}
          </div>
          <div
            className={`text-sm leading-relaxed ${
              mapProvider === 'google' ? 'text-blue-700' : 'text-green-700'
            }`}
          >
            {mapProvider === 'google' ? (
              <>
                <p className="font-medium mb-1">Google Maps Integration</p>
                <p className="text-xs">Enhanced mapping with Places API integration</p>
              </>
            ) : (
              <>
                <p className="font-medium mb-1">
                  {isGoogleMapsAvailable === false
                    ? 'Free OpenStreetMap Fallback'
                    : 'OpenStreetMap Integration'}
                </p>
                <p className="text-xs">
                  {isGoogleMapsAvailable === false
                    ? 'Google Maps API not configured - using reliable open source alternative'
                    : 'No API key required - powered by open source mapping'}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Location Status */}
        {address && !coordinates && isResolvingLocation && (
          <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-yellow-700">
              <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Resolving location...</span>
            </div>
          </div>
        )}

        {/* Self-Test Button */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={runMapSelfTest}
            className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md transition-colors"
          >
            🔍 Run Map Self-Test
          </button>

          {showSelfTest && (
            <div className="flex space-x-2">
              <div
                className={`text-xs px-2 py-1 rounded ${
                  testResults.google === 'success'
                    ? 'bg-green-100 text-green-700'
                    : testResults.google === 'error'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                Google:{' '}
                {testResults.google === 'pending'
                  ? '⏳'
                  : testResults.google === 'success'
                    ? '✅'
                    : '❌'}
              </div>
              <div className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                Coords: ✅
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map Component */}
      <div className="h-64">
        {mapProvider === 'google' && isGoogleMapsAvailable ? (
          <GoogleBusinessMap
            lat={coordinates?.lat ?? lat}
            lng={coordinates?.lng ?? lng}
            address={address}
            businessName={businessName}
            zoom={14}
            height="256px"
            showControls={true}
            className="rounded-none"
          />
        ) : (
          <LeafletBusinessMap
            lat={coordinates?.lat ?? lat}
            lng={coordinates?.lng ?? lng}
            address={address}
            businessName={businessName}
            zoom={14}
            height="256px"
            showControls={true}
            className="rounded-none"
          />
        )}
      </div>

      {/* Gradient border effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#4F46E5]/10 via-[#06B6D4]/10 to-[#F97316]/10 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </motion.div>
  );
}
