import React from 'react';
import { MapPin, Phone, Mail, Clock, ExternalLink } from 'lucide-react';

interface NAPData {
  name: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  hours: string[];
  googleBusinessUrl?: string;
}

interface NAPDisplayProps {
  data?: Partial<NAPData>;
  variant?: 'full' | 'compact' | 'footer';
  showSchema?: boolean;
  className?: string;
}

// Default/placeholder NAP data - should be updated with actual business information
const DEFAULT_NAP: NAPData = {
  name: "XenlixAI",
  streetAddress: "TBD - Contact for Address",
  city: "Dallas",
  state: "TX",
  postalCode: "TBD",
  country: "US",
  phone: "+1-TBD-TBD-TBDD",
  email: "info@xenlixai.com",
  hours: [
    "Monday - Friday: 9:00 AM - 5:00 PM CST",
    "Saturday - Sunday: Closed"
  ],
  googleBusinessUrl: "https://business.google.com/[TO-BE-UPDATED]"
};

export function NAPDisplay({ 
  data = {}, 
  variant = 'full', 
  showSchema = true, 
  className = "" 
}: NAPDisplayProps) {
  const napData = { ...DEFAULT_NAP, ...data };
  
  const fullAddress = `${napData.streetAddress}, ${napData.city}, ${napData.state} ${napData.postalCode}`;
  const phoneLink = `tel:${napData.phone.replace(/[^+\d]/g, '')}`;
  const emailLink = `mailto:${napData.email}`;
  
  // Schema markup for local business
  const localBusinessSchema = showSchema ? {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": napData.name,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": napData.streetAddress,
      "addressLocality": napData.city,
      "addressRegion": napData.state,
      "postalCode": napData.postalCode,
      "addressCountry": napData.country
    },
    "telephone": napData.phone,
    "email": napData.email,
    "openingHours": [
      "Mo-Fr 09:00-17:00"
    ]
  } : null;

  if (variant === 'compact') {
    return (
      <div className={`flex flex-col space-y-2 ${className}`}>
        {showSchema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(localBusinessSchema),
            }}
          />
        )}
        <div className="flex items-center space-x-2 text-sm">
          <MapPin className="w-4 h-4 text-gray-600" />
          <span>{napData.city}, {napData.state}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <Phone className="w-4 h-4 text-gray-600" />
          <a href={phoneLink} className="hover:text-blue-600 transition-colors">
            {napData.phone}
          </a>
        </div>
      </div>
    );
  }

  if (variant === 'footer') {
    return (
      <div className={`space-y-3 ${className}`}>
        {showSchema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(localBusinessSchema),
            }}
          />
        )}
        <h3 className="text-lg font-semibold text-white">{napData.name}</h3>
        
        <div className="space-y-2 text-sm text-gray-300">
          <div className="flex items-start space-x-2">
            <MapPin className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
            <div>
              <div>{napData.streetAddress}</div>
              <div>{napData.city}, {napData.state} {napData.postalCode}</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Phone className="w-4 h-4 text-gray-400" />
            <a href={phoneLink} className="hover:text-white transition-colors">
              {napData.phone}
            </a>
          </div>
          
          <div className="flex items-center space-x-2">
            <Mail className="w-4 h-4 text-gray-400" />
            <a href={emailLink} className="hover:text-white transition-colors">
              {napData.email}
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {showSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessSchema),
          }}
        />
      )}
      
      <h3 className="text-xl font-bold text-gray-900 mb-4">{napData.name}</h3>
      
      <div className="space-y-4">
        {/* Address */}
        <div className="flex items-start space-x-3">
          <MapPin className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <div className="font-medium text-gray-900">Address</div>
            <div className="text-gray-600">
              <div>{napData.streetAddress}</div>
              <div>{napData.city}, {napData.state} {napData.postalCode}</div>
              <div>{napData.country}</div>
            </div>
            {napData.googleBusinessUrl && napData.googleBusinessUrl !== "https://business.google.com/[TO-BE-UPDATED]" && (
              <a
                href={napData.googleBusinessUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm mt-1"
              >
                <ExternalLink className="w-3 h-3" />
                <span>View on Google Maps</span>
              </a>
            )}
          </div>
        </div>

        {/* Phone */}
        <div className="flex items-start space-x-3">
          <Phone className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
          <div>
            <div className="font-medium text-gray-900">Phone</div>
            <a 
              href={phoneLink} 
              className="text-gray-600 hover:text-green-600 transition-colors"
            >
              {napData.phone}
            </a>
          </div>
        </div>

        {/* Email */}
        <div className="flex items-start space-x-3">
          <Mail className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
          <div>
            <div className="font-medium text-gray-900">Email</div>
            <a 
              href={emailLink} 
              className="text-gray-600 hover:text-purple-600 transition-colors"
            >
              {napData.email}
            </a>
          </div>
        </div>

        {/* Business Hours */}
        <div className="flex items-start space-x-3">
          <Clock className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
          <div>
            <div className="font-medium text-gray-900">Business Hours</div>
            <div className="text-gray-600 space-y-1">
              {napData.hours.map((hour, index) => (
                <div key={index}>{hour}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for getting NAP data (can be extended to fetch from CMS/API)
export function useNAPData(): NAPData {
  // In the future, this could fetch from a CMS or API
  return DEFAULT_NAP;
}

// Utility function for formatting phone numbers
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    const match = cleaned.match(/^1(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
  }
  return phone;
}

// Utility function for creating structured data
export function createLocalBusinessSchema(napData: NAPData) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": napData.name,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": napData.streetAddress,
      "addressLocality": napData.city,
      "addressRegion": napData.state,
      "postalCode": napData.postalCode,
      "addressCountry": napData.country
    },
    "telephone": napData.phone,
    "email": napData.email,
    "url": "https://www.xenlixai.com",
    "openingHours": [
      "Mo-Fr 09:00-17:00"
    ],
    "sameAs": [
      napData.googleBusinessUrl,
      "https://x.com/xenlixai",
      "https://www.linkedin.com/company/xenlixai"
    ].filter(url => url && !url.includes('[TO-BE-UPDATED]'))
  };
}