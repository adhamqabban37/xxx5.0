'use client';

import { useState } from 'react';
import { SchemaGenerator } from '@/lib/schema-generator';
import {
  BusinessProfileForSchema,
  FAQData,
  SchemaGeneratorOptions,
  SchemaOutput,
} from '@/types/schema';

export default function SchemaGeneratorPage() {
  const [businessProfile, setBusinessProfile] = useState<BusinessProfileForSchema>({
    businessName: '',
    description: '',
    industry: '',
    services: [],
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US',
    },
    contact: {
      phone: '',
      email: '',
      website: '',
    },
    socialMedia: {
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: '',
    },
    hours: {
      monday: { open: '09:00', close: '17:00' },
      tuesday: { open: '09:00', close: '17:00' },
      wednesday: { open: '09:00', close: '17:00' },
      thursday: { open: '09:00', close: '17:00' },
      friday: { open: '09:00', close: '17:00' },
      saturday: { open: '10:00', close: '16:00' },
      sunday: { open: '', close: '' },
    },
    rating: {
      value: 4.5,
      count: 0,
      reviews: [],
    },
  });

  const [faqData, setFaqData] = useState<FAQData>({
    questions: [{ question: '', answer: '' }],
  });

  const [options, setOptions] = useState<SchemaGeneratorOptions>({
    includeLocalBusiness: true,
    includeServices: true,
    includeFAQ: false,
    includeWebsite: true,
    includeOrganization: false,
    minifyOutput: false,
    validateSchema: true,
  });

  const [generatedSchemas, setGeneratedSchemas] = useState<SchemaOutput | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'faq' | 'options' | 'output'>('profile');
  const [copySuccess, setCopySuccess] = useState<string>('');

  const generateSchemas = () => {
    const generator = new SchemaGenerator(options);
    const schemas = generator.generateSchemas(
      businessProfile,
      options.includeFAQ ? faqData : undefined
    );
    setGeneratedSchemas(schemas);
    setActiveTab('output');
  };

  const copyToClipboard = async (content: string, type: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopySuccess(`${type} copied to clipboard!`);
      setTimeout(() => setCopySuccess(''), 3000);
    } catch (err) {
      setCopySuccess('Failed to copy');
      setTimeout(() => setCopySuccess(''), 3000);
    }
  };

  const downloadSchema = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const loadSampleData = () => {
    setBusinessProfile({
      businessName: 'Elite Auto Detailing',
      description:
        'Professional automotive detailing services with eco-friendly products and premium care for your vehicle.',
      industry: 'automotive',
      services: ['Car Wash', 'Paint Protection', 'Ceramic Coating', 'Interior Detailing'],
      address: {
        street: '123 Auto Care Drive',
        city: 'Austin',
        state: 'Texas',
        zipCode: '78701',
        country: 'US',
      },
      contact: {
        phone: '+1-512-555-0123',
        email: 'info@eliteautodetailing.com',
        website: 'https://eliteautodetailing.com',
      },
      socialMedia: {
        facebook: 'https://facebook.com/eliteautodetailing',
        instagram: 'https://instagram.com/eliteautodetailing',
        linkedin: 'https://linkedin.com/company/eliteautodetailing',
      },
      hours: {
        monday: { open: '08:00', close: '18:00' },
        tuesday: { open: '08:00', close: '18:00' },
        wednesday: { open: '08:00', close: '18:00' },
        thursday: { open: '08:00', close: '18:00' },
        friday: { open: '08:00', close: '18:00' },
        saturday: { open: '09:00', close: '17:00' },
        sunday: { open: '', close: '' },
      },
      rating: {
        value: 4.8,
        count: 127,
        reviews: [
          {
            author: 'John Smith',
            rating: 5,
            text: 'Excellent service! My car looks brand new.',
            date: '2024-09-01',
          },
          {
            author: 'Sarah Johnson',
            rating: 4,
            text: 'Professional work and great attention to detail.',
            date: '2024-08-28',
          },
        ],
      },
      coordinates: {
        latitude: 30.2672,
        longitude: -97.7431,
      },
      foundingDate: '2020-01-01',
      founder: 'Mike Rodriguez',
      employeeCount: 8,
      slogan: 'Where your car gets the royal treatment',
    });

    setFaqData({
      questions: [
        {
          question: 'How long does a full detail take?',
          answer:
            'A complete exterior and interior detail typically takes 3-4 hours, depending on the vehicle size and condition.',
        },
        {
          question: 'Do you offer mobile detailing services?',
          answer:
            'Yes, we provide mobile detailing services throughout the Austin metro area for your convenience.',
        },
        {
          question: 'What products do you use?',
          answer:
            'We use only premium, eco-friendly detailing products that are safe for your vehicle and the environment.',
        },
      ],
    });
  };

  const handleServiceChange = (services: string) => {
    const serviceArray = services
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    setBusinessProfile((prev) => ({ ...prev, services: serviceArray }));
  };

  const addFaqQuestion = () => {
    setFaqData((prev) => ({
      questions: [...prev.questions, { question: '', answer: '' }],
    }));
  };

  const updateFaqQuestion = (index: number, field: 'question' | 'answer', value: string) => {
    setFaqData((prev) => ({
      questions: prev.questions.map((q, i) => (i === index ? { ...q, [field]: value } : q)),
    }));
  };

  const removeFaqQuestion = (index: number) => {
    setFaqData((prev) => ({
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Schema.org JSON-LD Generator</h1>
          <p className="text-lg text-gray-600">
            Generate structured data markup for better SEO and rich snippets
          </p>
          <button
            onClick={loadSampleData}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
          >
            Load Sample Data
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-gray-200">
            {[
              { id: 'profile', label: 'Business Profile' },
              { id: 'faq', label: 'FAQ Data' },
              { id: 'options', label: 'Schema Options' },
              { id: 'output', label: 'Generated Schema' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Business Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Business Profile Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    value={businessProfile.businessName}
                    onChange={(e) =>
                      setBusinessProfile((prev) => ({ ...prev, businessName: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={businessProfile.description}
                    onChange={(e) =>
                      setBusinessProfile((prev) => ({ ...prev, description: e.target.value }))
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                  <select
                    value={businessProfile.industry}
                    onChange={(e) =>
                      setBusinessProfile((prev) => ({ ...prev, industry: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Industry</option>
                    <option value="automotive">Automotive</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="retail">Retail</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="legal">Legal</option>
                    <option value="fitness">Fitness</option>
                    <option value="beauty">Beauty</option>
                    <option value="technology">Technology</option>
                    <option value="real estate">Real Estate</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="electrical">Electrical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Services (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={businessProfile.services?.join(', ')}
                    onChange={(e) => handleServiceChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Service 1, Service 2, Service 3"
                  />
                </div>
              </div>

              {/* Contact & Location */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Contact & Location</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={businessProfile.contact?.phone}
                    onChange={(e) =>
                      setBusinessProfile((prev) => ({
                        ...prev,
                        contact: { ...prev.contact!, phone: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={businessProfile.contact?.email}
                    onChange={(e) =>
                      setBusinessProfile((prev) => ({
                        ...prev,
                        contact: { ...prev.contact!, email: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    type="url"
                    value={businessProfile.contact?.website}
                    onChange={(e) =>
                      setBusinessProfile((prev) => ({
                        ...prev,
                        contact: { ...prev.contact!, website: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={businessProfile.address?.street}
                    onChange={(e) =>
                      setBusinessProfile((prev) => ({
                        ...prev,
                        address: { ...prev.address!, street: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={businessProfile.address?.city}
                      onChange={(e) =>
                        setBusinessProfile((prev) => ({
                          ...prev,
                          address: { ...prev.address!, city: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      value={businessProfile.address?.state}
                      onChange={(e) =>
                        setBusinessProfile((prev) => ({
                          ...prev,
                          address: { ...prev.address!, state: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setActiveTab('faq')}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
              >
                Next: FAQ Data →
              </button>
            </div>
          </div>
        )}

        {/* FAQ Tab */}
        {activeTab === 'faq' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">FAQ Data (Optional)</h2>
              <button
                onClick={addFaqQuestion}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
              >
                Add Question
              </button>
            </div>

            <div className="space-y-4">
              {faqData.questions.map((faq, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">Question {index + 1}</h4>
                    {faqData.questions.length > 1 && (
                      <button
                        onClick={() => removeFaqQuestion(index)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Question
                      </label>
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => updateFaqQuestion(index, 'question', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your question..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
                      <textarea
                        value={faq.answer}
                        onChange={(e) => updateFaqQuestion(index, 'answer', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter the answer..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setActiveTab('profile')}
                className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700"
              >
                ← Back: Profile
              </button>
              <button
                onClick={() => setActiveTab('options')}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
              >
                Next: Options →
              </button>
            </div>
          </div>
        )}

        {/* Options Tab */}
        {activeTab === 'options' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Schema Generation Options</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">Include Schema Types</h3>

                  {[
                    { key: 'includeLocalBusiness', label: 'Local Business' },
                    { key: 'includeServices', label: 'Services' },
                    { key: 'includeFAQ', label: 'FAQ Page' },
                    { key: 'includeWebsite', label: 'Website' },
                    { key: 'includeOrganization', label: 'Organization' },
                  ].map((option) => (
                    <label key={option.key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={options[option.key as keyof SchemaGeneratorOptions] as boolean}
                        onChange={(e) =>
                          setOptions((prev) => ({
                            ...prev,
                            [option.key]: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>

                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">Output Options</h3>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={options.minifyOutput}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          minifyOutput: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Minify Output</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={options.validateSchema}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          validateSchema: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Validate Schema</span>
                  </label>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Custom Business Type
                    </label>
                    <input
                      type="text"
                      value={options.customBusinessType || ''}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          customBusinessType: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Restaurant, AutoRepair"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setActiveTab('faq')}
                className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700"
              >
                ← Back: FAQ
              </button>
              <button
                onClick={generateSchemas}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
              >
                Generate Schema →
              </button>
            </div>
          </div>
        )}

        {/* Output Tab */}
        {activeTab === 'output' && generatedSchemas && (
          <div className="space-y-6">
            {copySuccess && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3 text-green-800 text-sm">
                {copySuccess}
              </div>
            )}

            {/* Combined Schema */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Complete Schema Markup</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => copyToClipboard(generatedSchemas.combined!, 'Complete schema')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() =>
                      downloadSchema(generatedSchemas.combined!, 'schema-complete.html')
                    }
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
                  >
                    Download
                  </button>
                </div>
              </div>
              <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto text-sm">
                <code>{generatedSchemas.combined}</code>
              </pre>
            </div>

            {/* Individual Schemas */}
            {Object.entries(generatedSchemas).map(([key, schema]) => {
              if (key === 'combined' || !schema) return null;

              const content = JSON.stringify(schema, null, 2);
              const title = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');

              return (
                <div key={key} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">{title} Schema</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => copyToClipboard(content, title)}
                        className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm"
                      >
                        Copy
                      </button>
                      <button
                        onClick={() => downloadSchema(content, `schema-${key}.json`)}
                        className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 text-sm"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                  <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto text-sm max-h-96">
                    <code>{content}</code>
                  </pre>
                </div>
              );
            })}

            <div className="text-center">
              <button
                onClick={() => setActiveTab('options')}
                className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700"
              >
                ← Back to Options
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
