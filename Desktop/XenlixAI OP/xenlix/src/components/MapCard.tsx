'use client';

// components/MapCard.tsx
// Env var: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (browser key). Restart dev server after adding.
// If you later switch to a JS-rendered map, keep this probe/fallback pattern to avoid blank maps.
"use client";
import { useEffect, useMemo, useState } from "react";
import { motion } from 'framer-motion';
import { MapPin, Navigation } from 'lucide-react';

type Props = {
  address?: string;
  lat?: number;
  lng?: number;
  businessName?: string;
  className?: string; // allow styling from parent
};

export default function MapCard({ address, lat, lng, businessName, className }: Props) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [useFallback, setUseFallback] = useState<boolean>(!key);
  const hasCoordinates = typeof lat === "number" && typeof lng === "number";
  
  const q = useMemo(() => {
    if (hasCoordinates) return `${lat},${lng}`;
    return (address || "").trim();
  }, [address, lat, lng, hasCoordinates]);

  useEffect(() => {
    if (!key) return; // no key -> fallback already enabled
    // Probe JS API to validate the key before using Embed v1
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}`;
    s.async = true;
    s.onload = () => setUseFallback(false);   // key looks valid
    s.onerror = () => {
      console.warn("[MapCard] Google Maps key invalid or blocked by referrer; using fallback iframe.");
      setUseFallback(true);
    };
    document.head.appendChild(s);
    return () => {
      if (document.head.contains(s)) {
        document.head.removeChild(s);
      }
    };
  }, [key]);

  // Build src for fallback consumer embed (no API key needed)
  const fallbackSrc = useMemo(() => {
    const query = encodeURIComponent(q || "");
    return `https://www.google.com/maps?q=${query}&z=14&output=embed`;
  }, [q]);

  // Build src for official Embed API v1 when key is valid
  const embedSrc = useMemo(() => {
    const place = encodeURIComponent(q || "");
    return `https://www.google.com/maps/embed/v1/place?key=${key}&q=${place}`;
  }, [key, q]);

  if (!q) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className={`bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 ${className || ""}`}
      >
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Location & Visibility</h3>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-sm text-gray-600">Pending</span>
            </div>
          </div>
        </div>
        
        <div className="relative h-64 bg-gray-50">
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="text-center">
              <div className="relative mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#4F46E5] to-[#06B6D4] rounded-full flex items-center justify-center mx-auto">
                  <Navigation className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-yellow-600 rounded-full animate-pulse"></div>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">Location pending</p>
              <p className="text-xs text-gray-500 max-w-48 mx-auto leading-relaxed">
                Address information needed for location mapping
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-white/30 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-gray-600">
              <MapPin className="h-4 w-4 text-[#06B6D4]" />
              <span>Coordinates not available</span>
            </div>
          </div>
        </div>
        
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#4F46E5]/10 via-[#06B6D4]/10 to-[#F97316]/10 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className={`bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 ${className || ""}`}
    >
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Location & Visibility</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${hasCoordinates ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span className="text-sm text-gray-600">
              {hasCoordinates ? 'Located' : 'Pending'}
            </span>
          </div>
        </div>

        {address && (
          <div className="flex items-start space-x-2 mb-4 p-3 bg-white/60 rounded-lg border border-gray-100">
            <MapPin className="h-4 w-4 text-[#F97316] flex-shrink-0 mt-0.5" />
            <span className="text-sm text-gray-700 leading-relaxed">{address}</span>
          </div>
        )}
      </div>

      {/* Map iframe - always renders with fallback */}
      <div className="relative h-64 bg-gray-50">
        <iframe
          title="Business location"
          aria-label="Business location map"
          className="w-full h-64 border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={useFallback ? fallbackSrc : embedSrc}
          width="100%"
          height="256"
          allowFullScreen
        />
      </div>

      {/* Map actions */}
      <div className="p-4 bg-white/30 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2 text-gray-600">
            <MapPin className="h-4 w-4 text-[#06B6D4]" />
            <span>
              {hasCoordinates 
                ? `${lat?.toFixed(4)}, ${lng?.toFixed(4)}`
                : 'Address based location'
              }
            </span>
          </div>
          
          <a
            href={hasCoordinates ? `https://www.google.com/maps?q=${lat},${lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-[#4F46E5] to-[#06B6D4] text-white text-xs font-medium rounded-full hover:scale-105 transition-transform"
          >
            <Navigation className="h-3 w-3 mr-1" />
            Open in Maps
          </a>
        </div>
      </div>

      {/* Gradient border effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#4F46E5]/10 via-[#06B6D4]/10 to-[#F97316]/10 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </motion.div>
  );
}