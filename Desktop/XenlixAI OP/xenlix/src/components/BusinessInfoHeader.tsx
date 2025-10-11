import React from 'react';
import {
  Globe,
  MapPin,
  Phone,
  Twitter,
  Linkedin,
  Facebook,
  Instagram,
  Youtube,
} from 'lucide-react';

interface BusinessData {
  name: string;
  website: string;
  address?: string;
  phone?: string;
  socials?: {
    twitter?: string;
    linkedin?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
  };
  city?: string;
  state?: string;
  country?: string;
}

interface BusinessInfoHeaderProps {
  businessData: BusinessData;
  businessAddress?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    phone?: string;
  };
  url?: string;
}

const BusinessInfoHeader: React.FC<BusinessInfoHeaderProps> = ({
  businessData,
  businessAddress,
  url,
}) => {
  const { name, website, socials } = businessData;

  // Prioritize businessAddress from enhanced extraction, fallback to businessData
  const finalAddress = businessAddress?.address || businessData.address;
  const finalPhone = businessAddress?.phone || businessData.phone;
  const finalCity = businessAddress?.city || businessData.city;
  const finalState = businessAddress?.state || businessData.state;
  const finalCountry = businessAddress?.country || businessData.country;

  // Helper function to generate Google Maps embed URL from address and business info
  const generateMapEmbedUrl = (): string => {
    if (!finalAddress && !name && !finalCity) return '';

    let query = '';

    // Priority 1: Use full address if available
    if (finalAddress) {
      query = finalAddress;
    }
    // Priority 2: Use city, state combination if available
    else if (finalCity) {
      query = finalCity;
      if (finalState) query += `, ${finalState}`;
      if (finalCountry) query += `, ${finalCountry}`;

      // Add business name for better accuracy
      if (name) query = `${name}, ${query}`;
    }
    // Priority 3: Use business name + location from URL or general location
    else if (name) {
      query = name;

      // Try to extract location from website URL
      if (website || url) {
        try {
          const urlToAnalyze = url || website;
          const urlObj = new URL(urlToAnalyze);
          const pathParts = urlObj.pathname.split('/').filter((p) => p.length > 0);
          const hostParts = urlObj.hostname.split('.');

          // Look for city names in URL path or subdomain
          const locationKeywords = [
            'dallas',
            'houston',
            'austin',
            'san-antonio',
            'fort-worth',
            'miami',
            'tampa',
            'orlando',
            'jacksonville',
            'atlanta',
            'chicago',
            'nyc',
            'newyork',
            'brooklyn',
            'manhattan',
            'losangeles',
            'la',
            'sf',
            'sanfrancisco',
            'sandiego',
            'seattle',
            'portland',
            'denver',
            'phoenix',
            'scottsdale',
            'boston',
            'philadelphia',
            'detroit',
            'charlotte',
            'nashville',
            'vegas',
            'lasvegas',
            'reno',
            'sacramento',
            'fresno',
            'minneapolis',
            'milwaukee',
            'cleveland',
            'columbus',
            'indianapolis',
            'louisville',
            'memphis',
            'birmingham',
          ];

          for (const part of [...pathParts, ...hostParts]) {
            const cleanPart = part.toLowerCase().replace(/[-_]/g, '');
            if (locationKeywords.includes(cleanPart)) {
              query += ` ${part.replace(/[-_]/g, ' ')}`;
              break;
            }
          }
        } catch (e) {
          // Invalid URL, continue with just business name
        }
      }
    }

    if (!query) return '';

    // URL encode the query string
    const encodedQuery = encodeURIComponent(query);

    // Construct the Google Maps embed URL
    return `https://maps.google.com/maps?q=${encodedQuery}&output=embed`;
  };

  const mapEmbedUrl = generateMapEmbedUrl();

  return (
    <section className="bg-slate-50 px-6 py-8 border-b">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column - Information */}
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-6">{name}</h2>

          <div className="space-y-4">
            {/* Website */}
            {website && (
              <div className="flex items-center gap-3">
                <Globe className="text-slate-600 text-lg" />
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                >
                  {website}
                </a>
              </div>
            )}

            {/* Address */}
            {finalAddress && (
              <div className="flex items-center gap-3">
                <MapPin className="text-slate-600 text-lg" />
                <span className="text-slate-700">{finalAddress}</span>
              </div>
            )}

            {/* Phone */}
            {finalPhone && (
              <div className="flex items-center gap-3">
                <Phone className="text-slate-600 text-lg" />
                <a
                  href={`tel:${finalPhone}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                >
                  {finalPhone}
                </a>
              </div>
            )}
          </div>

          {/* Social Media Icons */}
          {socials && Object.keys(socials).length > 0 && (
            <div className="flex items-center gap-4 mt-6">
              {socials.twitter && (
                <a
                  href={socials.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 hover:text-blue-400 transition-colors text-xl"
                >
                  <Twitter />
                </a>
              )}

              {socials.linkedin && (
                <a
                  href={socials.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 hover:text-blue-600 transition-colors text-xl"
                >
                  <Linkedin />
                </a>
              )}

              {socials.facebook && (
                <a
                  href={socials.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 hover:text-blue-500 transition-colors text-xl"
                >
                  <Facebook />
                </a>
              )}

              {socials.instagram && (
                <a
                  href={socials.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 hover:text-pink-500 transition-colors text-xl"
                >
                  <Instagram />
                </a>
              )}

              {socials.youtube && (
                <a
                  href={socials.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 hover:text-red-500 transition-colors text-xl"
                >
                  <Youtube />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Dynamic Map */}
        <div>
          <div className="w-full h-64 md:h-full">
            {mapEmbedUrl ? (
              <iframe
                src={mapEmbedUrl}
                className="w-full h-full min-h-[250px] rounded-xl shadow-md border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Map showing the location of ${name}`}
              />
            ) : (
              <div className="w-full h-full min-h-[250px] rounded-xl shadow-md border border-slate-200 bg-slate-100 flex items-center justify-center">
                <div className="text-center text-slate-500">
                  <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Location map unavailable</p>
                  <p className="text-xs text-slate-400 mt-1">
                    No address information found on website
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BusinessInfoHeader;
