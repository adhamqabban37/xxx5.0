import React from 'react';
import { BusinessMap } from '../components/map/BusinessMap';
import { BusinessMapWithAutocomplete } from '../components/map/BusinessMapWithAutocomplete';
import { MapPin, Settings, Code, Search } from 'lucide-react';

/**
 * Demo page showcasing BusinessMap component usage examples
 */
export default function MapDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            BusinessMap Component Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Production-ready Google Maps integration with geocoding, error handling, and graceful
            fallbacks for Next.js applications.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Geocoding</h3>
            <p className="text-gray-600">
              Automatically converts addresses to coordinates with caching and error handling.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Graceful Fallbacks</h3>
            <p className="text-gray-600">
              Handles missing API keys, invalid addresses, and network errors elegantly.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Code className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Developer Friendly</h3>
            <p className="text-gray-600">
              TypeScript support, comprehensive props, and clear error messages.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Address Search</h3>
            <p className="text-gray-600">
              Places API autocomplete with smart suggestions and coordinate copying.
            </p>
          </div>
        </div>

        {/* Examples */}
        <div className="space-y-16">
          {/* Example 1: Exact Coordinates */}
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Example 1: Exact Coordinates
              </h2>
              <p className="text-gray-600 mb-4">
                When you have precise latitude and longitude coordinates, the map renders
                immediately without geocoding.
              </p>
              <div className="bg-gray-100 rounded-lg p-4 text-sm font-mono text-gray-800">
                {
                  '<BusinessMap lat={32.7767} lng={-96.7970} zoom={15} height="380px" showControls={true} />'
                }
              </div>
            </div>
            <div className="max-w-4xl">
              <BusinessMap
                lat={32.7767}
                lng={-96.797}
                businessName="Dallas City Center"
                zoom={15}
                height="380px"
                showControls={true}
                className="shadow-lg rounded-lg"
              />
              <p className="text-sm text-gray-600 mt-2">
                📍 Precise coordinates: 32.7767, -96.7970 (Dallas, TX)
              </p>
            </div>
          </div>

          {/* Example 2: Address Geocoding */}
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Example 2: Address Geocoding
              </h2>
              <p className="text-gray-600 mb-4">
                Provide an address string and the component will automatically geocode it to
                coordinates. Results are cached to avoid repeated API calls.
              </p>
              <div className="bg-gray-100 rounded-lg p-4 text-sm font-mono text-gray-800">
                {
                  '<BusinessMap address="123 Main Street, Dallas, TX 75201" businessName="Business Location" />'
                }
              </div>
            </div>
            <div className="max-w-4xl">
              <BusinessMap
                address="123 Main Street, Dallas, TX 75201"
                businessName="Sample Business Location"
                zoom={16}
                height="320px"
                className="shadow-md rounded-lg"
              />
              <p className="text-sm text-gray-600 mt-2">
                📍 Address: 123 Main Street, Dallas, TX 75201 (Geocoded automatically)
              </p>
            </div>
          </div>

          {/* Example 3: No Location Data */}
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Example 3: Location Pending State
              </h2>
              <p className="text-gray-600 mb-4">
                When no coordinates or address are provided, the component shows a helpful pending
                state with instructions for users.
              </p>
              <div className="bg-gray-100 rounded-lg p-4 text-sm font-mono text-gray-800">
                {'<BusinessMap height="280px" />'}
              </div>
            </div>
            <div className="max-w-4xl">
              <BusinessMap height="280px" className="shadow-sm rounded-lg" />
              <p className="text-sm text-gray-600 mt-2">
                ⚠️ No location data provided - shows pending state with instructions
              </p>
            </div>
          </div>

          {/* Example 4: Invalid Address */}
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Example 4: Invalid Address Handling
              </h2>
              <p className="text-gray-600 mb-4">
                When geocoding fails (invalid address, network error, etc.), the component shows a
                clear error message with fallback options.
              </p>
              <div className="bg-gray-100 rounded-lg p-4 text-sm font-mono text-gray-800">
                {'<BusinessMap address="Invalid Address 123XYZ" height="280px" />'}
              </div>
            </div>
            <div className="max-w-4xl">
              <BusinessMap
                address="Invalid Address 123XYZ Nowhere City"
                height="280px"
                className="shadow-sm rounded-lg"
              />
              <p className="text-sm text-gray-600 mt-2">
                ❌ Invalid address - shows error state with helpful message
              </p>
            </div>
          </div>

          {/* Example 5: Address Autocomplete */}
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Example 5: Address Autocomplete (Enhanced)
              </h2>
              <p className="text-gray-600 mb-4">
                Interactive address search with Places API autocomplete, coordinate copying, and
                real-time map updates.
              </p>
              <div className="bg-gray-100 rounded-lg p-4 text-sm font-mono text-gray-800">
                {
                  '<BusinessMapWithAutocomplete initialAddress="Dallas, TX" height="320px" showControls={true} />'
                }
              </div>
            </div>
            <div className="max-w-4xl">
              <BusinessMapWithAutocomplete
                initialAddress="Dallas, TX"
                businessName="Search Result"
                zoom={13}
                height="320px"
                showControls={true}
                className="shadow-lg rounded-lg"
                onLocationChange={(location) => console.log('Location changed:', location)}
              />
              <p className="text-sm text-gray-600 mt-2">
                🔍 Try searching for businesses, addresses, or landmarks
              </p>
            </div>
          </div>

          {/* Example 6: Custom Styling */}
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Example 6: Custom Styling & Controls
              </h2>
              <p className="text-gray-600 mb-4">
                Customize the map appearance with different heights, controls, and styling options.
              </p>
              <div className="bg-gray-100 rounded-lg p-4 text-sm font-mono text-gray-800">
                {
                  '<BusinessMap lat={32.7831} lng={-96.8067} zoom={12} height="240px" showControls={false} />'
                }
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Minimal Controls</h4>
                <BusinessMap
                  lat={32.7831}
                  lng={-96.8067}
                  businessName="Minimal View"
                  zoom={12}
                  height="240px"
                  showControls={false}
                  className="shadow-md rounded-lg"
                />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Full Controls</h4>
                <BusinessMap
                  lat={32.7831}
                  lng={-96.8067}
                  businessName="Full Controls"
                  zoom={12}
                  height="240px"
                  showControls={true}
                  className="shadow-md rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Props Documentation */}
        <div className="mt-16 bg-white border border-gray-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Component Props</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Prop</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Default</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-3 px-4 font-mono text-blue-600">lat</td>
                  <td className="py-3 px-4 text-gray-600">number?</td>
                  <td className="py-3 px-4 text-gray-500">-</td>
                  <td className="py-3 px-4 text-gray-700">
                    Latitude coordinate (takes priority over address)
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono text-blue-600">lng</td>
                  <td className="py-3 px-4 text-gray-600">number?</td>
                  <td className="py-3 px-4 text-gray-500">-</td>
                  <td className="py-3 px-4 text-gray-700">
                    Longitude coordinate (takes priority over address)
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono text-blue-600">address</td>
                  <td className="py-3 px-4 text-gray-600">string?</td>
                  <td className="py-3 px-4 text-gray-500">-</td>
                  <td className="py-3 px-4 text-gray-700">
                    Address to geocode (used if lat/lng not provided)
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono text-blue-600">businessName</td>
                  <td className="py-3 px-4 text-gray-600">string?</td>
                  <td className="py-3 px-4 text-gray-500">-</td>
                  <td className="py-3 px-4 text-gray-700">Name shown in marker tooltip</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono text-blue-600">zoom</td>
                  <td className="py-3 px-4 text-gray-600">number?</td>
                  <td className="py-3 px-4 text-gray-500">14</td>
                  <td className="py-3 px-4 text-gray-700">Map zoom level (1-20)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono text-blue-600">height</td>
                  <td className="py-3 px-4 text-gray-600">string?</td>
                  <td className="py-3 px-4 text-gray-500">'320px'</td>
                  <td className="py-3 px-4 text-gray-700">CSS height value</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono text-blue-600">showControls</td>
                  <td className="py-3 px-4 text-gray-600">boolean?</td>
                  <td className="py-3 px-4 text-gray-500">false</td>
                  <td className="py-3 px-4 text-gray-700">Show zoom and other map controls</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono text-blue-600">className</td>
                  <td className="py-3 px-4 text-gray-600">string?</td>
                  <td className="py-3 px-4 text-gray-500">''</td>
                  <td className="py-3 px-4 text-gray-700">Additional CSS classes</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
