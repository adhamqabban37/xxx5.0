'use client';

import { motion } from 'framer-motion';
import { MapPin, Phone, Globe, Clock, Users } from 'lucide-react';

interface BusinessInfo {
  name: string;
  address?: string;
  phone?: string;
  website: string;
  socials: string[];
  hours?: string[];
  lat?: number;
  lng?: number;
}

interface BusinessInfoCardProps {
  data: BusinessInfo;
}

export default function BusinessInfoCard({ data }: BusinessInfoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{data.name}</h3>
          <div className="flex items-center text-sm text-gray-600">
            <Globe className="h-4 w-4 mr-2 text-[#4F46E5]" />
            <span className="truncate">{data.website}</span>
          </div>
        </div>
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-[#4F46E5] to-[#06B6D4] rounded-xl flex items-center justify-center">
            <Users className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Address */}
        {data.address && (
          <div className="flex items-start space-x-3 p-3 bg-white/60 rounded-lg border border-gray-100">
            <MapPin className="h-5 w-5 text-[#F97316] flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-gray-900">Address</div>
              <div className="text-sm text-gray-600 leading-relaxed">{data.address}</div>
            </div>
          </div>
        )}

        {/* Phone */}
        {data.phone && (
          <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-lg border border-gray-100">
            <Phone className="h-5 w-5 text-[#06B6D4] flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-gray-900">Phone</div>
              <a
                href={`tel:${data.phone}`}
                className="text-sm text-[#4F46E5] hover:text-[#4F46E5]/80 font-medium transition-colors"
              >
                {data.phone}
              </a>
            </div>
          </div>
        )}

        {/* Business Hours */}
        {data.hours && data.hours.length > 0 && (
          <div className="flex items-start space-x-3 p-3 bg-white/60 rounded-lg border border-gray-100">
            <Clock className="h-5 w-5 text-[#F97316] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 mb-2">Business Hours</div>
              <div className="space-y-1">
                {data.hours.slice(0, 3).map((hour, index) => (
                  <div key={index} className="text-sm text-gray-600">
                    {hour}
                  </div>
                ))}
                {data.hours.length > 3 && (
                  <div className="text-xs text-gray-500 italic">
                    + {data.hours.length - 3} more days
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Social Media */}
        {data.socials && data.socials.length > 0 && (
          <div className="flex items-start space-x-3 p-3 bg-white/60 rounded-lg border border-gray-100">
            <Users className="h-5 w-5 text-[#06B6D4] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 mb-2">Social Media</div>
              <div className="flex flex-wrap gap-2">
                {data.socials.slice(0, 3).map((social, index) => {
                  const domain = new URL(social).hostname.replace('www.', '');
                  return (
                    <a
                      key={index}
                      href={social}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-[#4F46E5] to-[#06B6D4] text-white text-xs font-medium rounded-full hover:scale-105 transition-transform"
                    >
                      {domain}
                    </a>
                  );
                })}
                {data.socials.length > 3 && (
                  <div className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                    +{data.socials.length - 3} more
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Gradient border effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#4F46E5]/10 via-[#06B6D4]/10 to-[#F97316]/10 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </motion.div>
  );
}
