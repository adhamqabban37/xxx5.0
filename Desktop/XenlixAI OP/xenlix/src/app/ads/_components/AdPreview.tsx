'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AdDraftBundle } from '@/types/ads';
import { copyToClipboard } from '@/lib/exporters';

interface AdPreviewProps {
  bundle: AdDraftBundle;
}

interface CharacterCounterProps {
  text: string;
  limit: number;
  className?: string;
}

function CharacterCounter({ text, limit, className = '' }: CharacterCounterProps) {
  const count = text.length;
  const isOverLimit = count > limit;

  return (
    <span className={`text-xs ${isOverLimit ? 'text-red-500' : 'text-gray-500'} ${className}`}>
      {count}/{limit}
    </span>
  );
}

export default function AdPreview({ bundle }: AdPreviewProps) {
  const [activeTab, setActiveTab] = useState<'google' | 'bing' | 'meta' | 'tiktok'>('google');
  const [copiedChannel, setCopiedChannel] = useState<string | null>(null);

  const handleCopyChannel = async (channel: string, data: unknown) => {
    try {
      await copyToClipboard(JSON.stringify(data, null, 2));
      setCopiedChannel(channel);
      setTimeout(() => setCopiedChannel(null), 2000);
    } catch (error) {
      // Failed to copy
    }
  };

  const tabs = [
    { id: 'google', label: 'Google Ads', icon: '🔍' },
    { id: 'bing', label: 'Bing Ads', icon: '🅱️' },
    { id: 'meta', label: 'Meta Ads', icon: '📘' },
    { id: 'tiktok', label: 'TikTok Ads', icon: '🎵' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Ad platform tabs" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`${tab.id}-panel`}
              id={`${tab.id}-tab`}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2" aria-hidden="true">
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div
        className="space-y-4"
        role="tabpanel"
        aria-labelledby={`${activeTab}-tab`}
        id={`${activeTab}-panel`}
      >
        {/* Google Ads Preview */}
        {activeTab === 'google' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Google Ads Preview</h3>
              <button
                onClick={() => handleCopyChannel('google', bundle.google)}
                className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                {copiedChannel === 'google' ? 'Copied!' : 'Copy JSON'}
              </button>
            </div>

            <div className="grid gap-4">
              {/* Headlines */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Headlines</h4>
                <div className="space-y-2">
                  {bundle.google.headlines.map((headline, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white p-2 rounded border"
                    >
                      <span className="text-sm">{headline}</span>
                      <CharacterCounter text={headline} limit={30} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Descriptions */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Descriptions</h4>
                <div className="space-y-2">
                  {bundle.google.descriptions.map((description, index) => (
                    <div key={index} className="bg-white p-2 rounded border">
                      <div className="flex items-start justify-between">
                        <span className="text-sm flex-1">{description}</span>
                        <CharacterCounter
                          text={description}
                          limit={90}
                          className="ml-2 flex-shrink-0"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Long Headline */}
              {bundle.google.longHeadline && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Long Headline</h4>
                  <div className="bg-white p-2 rounded border">
                    <div className="flex items-start justify-between">
                      <span className="text-sm flex-1">{bundle.google.longHeadline}</span>
                      <CharacterCounter
                        text={bundle.google.longHeadline}
                        limit={90}
                        className="ml-2 flex-shrink-0"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Keywords */}
              {bundle.google.keywords && bundle.google.keywords.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {bundle.google.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Callouts */}
              {bundle.google.callouts && bundle.google.callouts.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Callouts</h4>
                  <div className="flex flex-wrap gap-2">
                    {bundle.google.callouts.map((callout, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                      >
                        {callout}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bing Ads Preview */}
        {activeTab === 'bing' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Bing Ads Preview</h3>
              <button
                onClick={() => handleCopyChannel('bing', bundle.bing)}
                className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                {copiedChannel === 'bing' ? 'Copied!' : 'Copy JSON'}
              </button>
            </div>

            <div className="grid gap-4">
              {/* Headlines */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Headlines</h4>
                <div className="space-y-2">
                  {bundle.bing.headlines.map((headline, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white p-2 rounded border"
                    >
                      <span className="text-sm">{headline}</span>
                      <CharacterCounter text={headline} limit={30} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Descriptions */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Descriptions</h4>
                <div className="space-y-2">
                  {bundle.bing.descriptions.map((description, index) => (
                    <div key={index} className="bg-white p-2 rounded border">
                      <div className="flex items-start justify-between">
                        <span className="text-sm flex-1">{description}</span>
                        <CharacterCounter
                          text={description}
                          limit={90}
                          className="ml-2 flex-shrink-0"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Keywords */}
              {bundle.bing.keywords && bundle.bing.keywords.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {bundle.bing.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Meta Ads Preview */}
        {activeTab === 'meta' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Meta Ads Preview</h3>
              <button
                onClick={() => handleCopyChannel('meta', bundle.meta)}
                className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                {copiedChannel === 'meta' ? 'Copied!' : 'Copy JSON'}
              </button>
            </div>

            <div className="grid gap-4">
              {/* Primary Texts */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Primary Text</h4>
                <div className="space-y-2">
                  {bundle.meta.primaryTexts.map((text, index) => (
                    <div key={index} className="bg-white p-3 rounded border">
                      <div className="flex items-start justify-between">
                        <span className="text-sm flex-1">{text}</span>
                        <CharacterCounter text={text} limit={125} className="ml-2 flex-shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Headlines */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Headlines</h4>
                <div className="space-y-2">
                  {bundle.meta.headlines.map((headline, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white p-2 rounded border"
                    >
                      <span className="text-sm">{headline}</span>
                      <CharacterCounter text={headline} limit={40} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Descriptions */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Descriptions</h4>
                <div className="space-y-2">
                  {bundle.meta.descriptions.map((description, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white p-2 rounded border"
                    >
                      <span className="text-sm">{description}</span>
                      <CharacterCounter text={description} limit={30} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Call to Action */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Call to Action</h4>
                <div className="bg-white p-2 rounded border">
                  <span className="inline-block px-3 py-1 bg-blue-600 text-white text-sm rounded-md">
                    {bundle.meta.callToAction.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TikTok Ads Preview */}
        {activeTab === 'tiktok' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">TikTok Ads Preview</h3>
              <button
                onClick={() => handleCopyChannel('tiktok', bundle.tiktok)}
                className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                {copiedChannel === 'tiktok' ? 'Copied!' : 'Copy JSON'}
              </button>
            </div>

            <div className="grid gap-4">
              {/* Hooks */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Hooks</h4>
                <div className="space-y-2">
                  {bundle.tiktok.hooks.map((hook, index) => (
                    <div key={index} className="bg-white p-2 rounded border">
                      <span className="text-lg font-bold text-gray-900">{hook}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Primary Texts */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Video Text</h4>
                <div className="space-y-2">
                  {bundle.tiktok.primaryTexts.map((text, index) => (
                    <div key={index} className="bg-white p-3 rounded border">
                      <span className="text-sm">{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTAs */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Call to Actions</h4>
                <div className="flex flex-wrap gap-2">
                  {bundle.tiktok.ctas.map((cta, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-pink-100 text-pink-800 text-sm rounded-full"
                    >
                      {cta}
                    </span>
                  ))}
                </div>
              </div>

              {/* Hashtags */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Hashtags</h4>
                <div className="flex flex-wrap gap-2">
                  {bundle.tiktok.hashtags.map((hashtag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded-full"
                    >
                      {hashtag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
