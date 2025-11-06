/**
 * Company Information Preview Component
 * Shows extracted business information in a clean, organized format
 */

'use client';

import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Star,
  Users,
  Tag,
  ExternalLink,
  Copy,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { BusinessInfo } from '@/lib/business-extractor';
import { toast } from 'react-hot-toast';
import { validateUrl } from '@/lib/url-validation';

interface CompanyPreviewProps {
  businessInfo?: BusinessInfo;
  url?: string;
  isLoading?: boolean;
  onAnalyze?: (url: string) => void;
  className?: string;
}

export function CompanyPreview({
  businessInfo,
  url,
  isLoading = false,
  onAnalyze,
  className = '',
}: CompanyPreviewProps) {
  const [urlInput, setUrlInput] = useState(url || '');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(true);

  const handleAnalyze = () => {
    // Comprehensive URL validation
    const validation = validateUrl(urlInput);

    if (!validation.ok) {
      toast.error(validation.reason || 'Please enter a valid website URL');
      return;
    }

    // Use the fixed URL if one was suggested (e.g., protocol was added)
    const finalUrl = validation.fixed || urlInput;

    if (onAnalyze) {
      onAnalyze(finalUrl);
    }
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const getCompletionPercentage = () => {
    if (!businessInfo) return 0;

    const fields = [
      businessInfo.businessName,
      businessInfo.industry,
      businessInfo.location?.address?.city,
      businessInfo.contact?.phone,
      businessInfo.contact?.email,
      businessInfo.contact?.website,
      businessInfo.services?.length > 0,
      businessInfo.hours?.monday,
      businessInfo.description,
    ];

    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  };

  return (
    <div
      className={`bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg shadow-lg ${className}`}
    >
      {/* Header with URL Input */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-400" />
            Company Preview
          </h2>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 px-3 py-1 text-sm text-slate-300 hover:text-white border border-slate-600 rounded-lg hover:bg-slate-700"
          >
            {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showDetails ? 'Hide' : 'Show'} Details
          </button>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Enter company website URL (e.g., https://company.com)"
              className="w-full px-4 py-3 border border-slate-600 bg-slate-700/50 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={isLoading || !urlInput.trim()}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Globe className="w-5 h-5" />
                Preview Company
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
          <h3 className="text-lg font-medium text-white mb-2">Analyzing Company Information</h3>
          <p className="text-slate-300">
            Extracting business details, contact info, and services...
          </p>
        </div>
      )}

      {/* Company Information Display */}
      {businessInfo && showDetails && (
        <div className="p-6">
          {/* Completion Status */}
          <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-blue-300">Profile Completion</span>
              <span className="text-blue-100 font-bold">{getCompletionPercentage()}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getCompletionPercentage()}%` }}
              ></div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Business Overview */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-400" />
                  Business Overview
                </h3>

                <div className="space-y-4">
                  {/* Business Name */}
                  <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <div>
                      <div className="text-sm text-slate-400">Business Name</div>
                      <div className="font-medium text-white">
                        {businessInfo.businessName || 'Not specified'}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(businessInfo.businessName || '', 'businessName')
                      }
                      className="p-2 text-slate-400 hover:text-slate-200"
                    >
                      {copiedField === 'businessName' ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Industry */}
                  <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <div>
                      <div className="text-sm text-slate-400">Industry</div>
                      <div className="font-medium text-white flex items-center gap-2">
                        <Tag className="w-4 h-4 text-blue-400" />
                        {businessInfo.industry || 'Not specified'}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {businessInfo.description && (
                    <div className="p-3 bg-slate-700/50 rounded-lg">
                      <div className="text-sm text-slate-400 mb-2">Description</div>
                      <div className="text-slate-200 text-sm leading-relaxed">
                        {businessInfo.description}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Services */}
              {businessInfo.services && businessInfo.services.length > 0 && (
                <div>
                  <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-400" />
                    Services Offered
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {businessInfo.services.slice(0, 8).map((service, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-900/30 text-green-300 text-sm rounded-full border border-green-600/30"
                      >
                        {service}
                      </span>
                    ))}
                    {businessInfo.services.length > 8 && (
                      <span className="px-3 py-1 bg-slate-700/50 text-slate-300 text-sm rounded-full">
                        +{businessInfo.services.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-green-400" />
                  Contact Information
                </h3>

                <div className="space-y-3">
                  {/* Phone */}
                  {businessInfo.contact?.phone && (
                    <div className="flex items-center justify-between p-3 bg-green-900/20 border border-green-600/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-green-400" />
                        <div>
                          <div className="text-sm text-slate-400">Phone</div>
                          <div className="font-medium text-white">
                            {formatPhoneNumber(businessInfo.contact.phone)}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(businessInfo.contact.phone!, 'phone')}
                        className="p-2 text-slate-400 hover:text-slate-300"
                      >
                        {copiedField === 'phone' ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Email */}
                  {businessInfo.contact?.email && (
                    <div className="flex items-center justify-between p-3 bg-blue-900/20 border border-blue-600/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-blue-400" />
                        <div>
                          <div className="text-sm text-slate-400">Email</div>
                          <div className="font-medium text-white">{businessInfo.contact.email}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(businessInfo.contact.email!, 'email')}
                        className="p-2 text-slate-400 hover:text-slate-300"
                      >
                        {copiedField === 'email' ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Website */}
                  {businessInfo.contact?.website && (
                    <div className="flex items-center justify-between p-3 bg-purple-900/20 border border-purple-600/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-purple-400" />
                        <div>
                          <div className="text-sm text-slate-400">Website</div>
                          <div className="font-medium text-white flex items-center gap-2">
                            {businessInfo.contact.website}
                            <a
                              href={businessInfo.contact.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-400 hover:text-purple-300"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Location */}
              {businessInfo.location?.address && (
                <div>
                  <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-400" />
                    Location
                  </h4>
                  <div className="p-3 bg-red-900/20 border border-red-600/30 rounded-lg">
                    <div className="space-y-1">
                      {businessInfo.location.address.street && (
                        <div className="text-white">{businessInfo.location.address.street}</div>
                      )}
                      <div className="text-white">
                        {businessInfo.location.address.city}
                        {businessInfo.location.address.state &&
                          `, ${businessInfo.location.address.state}`}
                        {businessInfo.location.address.zipCode &&
                          ` ${businessInfo.location.address.zipCode}`}
                      </div>
                      {businessInfo.location.address.country !== 'US' && (
                        <div className="text-slate-300">
                          {businessInfo.location.address.country}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Business Hours */}
              {businessInfo.hours && Object.keys(businessInfo.hours).length > 0 && (
                <div>
                  <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-400" />
                    Business Hours
                  </h4>
                  <div className="space-y-1">
                    {Object.entries(businessInfo.hours).map(([day, hours]) => (
                      <div
                        key={day}
                        className="flex justify-between p-2 text-sm bg-orange-900/20 rounded border border-orange-600/30"
                      >
                        <span className="font-medium capitalize text-white">{day}</span>
                        <span className="text-slate-300">{hours || 'Closed'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews Summary */}
              {businessInfo.reviews && businessInfo.reviews.length > 0 && (
                <div>
                  <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    Customer Reviews
                  </h4>
                  <div className="p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.round(businessInfo.averageRating || 0)
                                ? 'text-yellow-400 fill-current'
                                : 'text-slate-500'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-medium text-white">
                        {businessInfo.averageRating?.toFixed(1)} ({businessInfo.reviews.length}{' '}
                        reviews)
                      </span>
                    </div>
                    <div className="text-sm text-slate-300">
                      Latest: "{businessInfo.reviews[0]?.text?.substring(0, 100)}..."
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!businessInfo && !isLoading && (
        <div className="p-12 text-center">
          <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Company Information</h3>
          <p className="text-slate-300 mb-6">
            Enter a company website URL above to extract and preview their business information
          </p>
          <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4 text-left max-w-md mx-auto">
            <h4 className="font-medium text-blue-400 mb-2">What we'll extract:</h4>
            <ul className="text-sm text-blue-300 space-y-1">
              <li>• Business name and industry</li>
              <li>• Contact information (phone, email, website)</li>
              <li>• Physical address and location</li>
              <li>• Services and offerings</li>
              <li>• Business hours and reviews</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompanyPreview;
