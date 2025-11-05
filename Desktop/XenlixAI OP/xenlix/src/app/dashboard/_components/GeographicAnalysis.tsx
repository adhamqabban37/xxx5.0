'use client';

import { MapPin, Users, TrendingUp, Building, Target } from 'lucide-react';

interface LocationData {
  coordinates: {
    lat: number;
    lng: number;
  };
  formattedAddress: string;
  addressComponents: {
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  placeId: string;
}

interface GeographicAnalysisProps {
  locationData?: LocationData;
  isLiveData?: boolean;
}

export default function GeographicAnalysis({
  locationData,
  isLiveData = false,
}: GeographicAnalysisProps) {
  // Mock competitive and demographic data - would be replaced with real API data
  const mockCompetitorData = [
    { name: 'Downtown Legal Partners', distance: 0.2, bearing: 'NE', rating: 4.3 },
    { name: 'City Law Associates', distance: 0.5, bearing: 'SW', rating: 4.1 },
    { name: 'Metro Business Law', distance: 0.8, bearing: 'N', rating: 4.5 },
  ];

  const mockMarketData = {
    population: '750,000',
    medianIncome: '$85,000',
    businessDensity: 'High',
    competitorCount: 23,
    marketOpportunity: 'Strong',
  };

  const mockServiceArea = {
    primaryRadius: '5 miles',
    secondaryRadius: '15 miles',
    coversCities: ['Seattle', 'Bellevue', 'Redmond', 'Tacoma'],
  };

  if (!locationData) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 mb-8">
        <div className="text-center py-8">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">Geographic Analysis</h3>
          <p className="text-gray-500">Use location-based scan to unlock geographic insights</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            🌍 Geographic Market Analysis
          </h2>
          {locationData && (
            <div className="text-blue-200 text-sm mt-1">
              Location analysis for:{' '}
              <span className="font-mono text-blue-100">{locationData.formattedAddress}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isLiveData ? (
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              Live Location Data
            </span>
          ) : (
            <span className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              Demo Location Data
            </span>
          )}
          <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            Geo Intelligence
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Location Details */}
        <div className="bg-blue-900/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Building className="w-5 h-5 mr-2" />
            Business Location
          </h3>
          <div className="space-y-3">
            <div>
              <div className="text-blue-200 text-sm">Address</div>
              <div className="text-white font-mono text-sm">{locationData.formattedAddress}</div>
            </div>
            <div>
              <div className="text-blue-200 text-sm">Coordinates</div>
              <div className="text-white font-mono text-sm">
                {locationData.coordinates.lat.toFixed(6)}, {locationData.coordinates.lng.toFixed(6)}
              </div>
            </div>
            {locationData.addressComponents.city && (
              <div>
                <div className="text-blue-200 text-sm">Market Area</div>
                <div className="text-white">
                  {locationData.addressComponents.city}, {locationData.addressComponents.state}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Market Demographics */}
        <div className="bg-green-900/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Market Demographics
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-green-200">Population (10mi)</span>
              <span className="text-white font-semibold">{mockMarketData.population}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-200">Median Income</span>
              <span className="text-white font-semibold">{mockMarketData.medianIncome}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-200">Business Density</span>
              <span className="text-white font-semibold">{mockMarketData.businessDensity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-200">Market Opportunity</span>
              <span className="text-green-400 font-semibold">
                {mockMarketData.marketOpportunity}
              </span>
            </div>
          </div>
        </div>

        {/* Competitor Proximity */}
        <div className="bg-orange-900/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Nearby Competitors
          </h3>
          <div className="space-y-3">
            {mockCompetitorData.map((competitor, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-black/20 rounded-lg"
              >
                <div>
                  <div className="text-white font-medium">{competitor.name}</div>
                  <div className="text-orange-200 text-sm">
                    {competitor.distance} mi {competitor.bearing} • ⭐ {competitor.rating}
                  </div>
                </div>
                <div className="text-orange-400 font-semibold">
                  {competitor.distance < 0.5 ? 'High Impact' : 'Medium Impact'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Service Area Analysis */}
        <div className="bg-purple-900/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Service Area Coverage
          </h3>
          <div className="space-y-4">
            <div>
              <div className="text-purple-200 text-sm mb-2">Primary Service Radius</div>
              <div className="text-white text-lg font-semibold">
                {mockServiceArea.primaryRadius}
              </div>
            </div>
            <div>
              <div className="text-purple-200 text-sm mb-2">Secondary Coverage</div>
              <div className="text-white text-lg font-semibold">
                {mockServiceArea.secondaryRadius}
              </div>
            </div>
            <div>
              <div className="text-purple-200 text-sm mb-2">Covered Cities</div>
              <div className="flex flex-wrap gap-2">
                {mockServiceArea.coversCities.map((city, index) => (
                  <span
                    key={index}
                    className="bg-purple-600/30 text-purple-200 px-2 py-1 rounded text-sm"
                  >
                    {city}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location-Based Recommendations */}
      <div className="mt-6 bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          📋 Location-Based AEO Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-green-400 text-sm">✅ Opportunities</div>
            <ul className="text-green-200 text-sm space-y-1">
              <li>• Prime downtown location advantage</li>
              <li>• High foot traffic potential</li>
              <li>• Strong demographic match</li>
              <li>• Multiple city coverage area</li>
            </ul>
          </div>
          <div className="space-y-2">
            <div className="text-orange-400 text-sm">⚠️ Considerations</div>
            <ul className="text-orange-200 text-sm space-y-1">
              <li>• High competitor density nearby</li>
              <li>• Premium location = higher expectations</li>
              <li>• Need strong local SEO strategy</li>
              <li>• Focus on location-specific content</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
