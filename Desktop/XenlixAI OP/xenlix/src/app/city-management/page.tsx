// City Management Dashboard
// Interface for managing local SEO city pages and markets

'use client';

import { useState, useEffect } from 'react';
import {
  MapPin,
  Plus,
  Settings,
  Eye,
  Download,
  Trash2,
  Globe,
  BarChart3,
  Search,
  Filter,
  ArrowUpDown,
} from 'lucide-react';
import { CityMarket, BulkCityPageGeneration, BulkGenerationResult } from '@/types/local-seo';

interface CityManagementDashboardProps {
  className?: string;
}

// Sample cities data - in production, this would come from API
const SAMPLE_CITIES: CityMarket[] = [
  {
    id: '1',
    cityData: {
      name: 'New York',
      state: 'New York',
      stateAbbreviation: 'NY',
      county: 'New York County',
      region: 'Northeast',
      country: 'United States',
      coordinates: { latitude: 40.7128, longitude: -74.006 },
      timezone: 'America/New_York',
      zipCodes: ['10001', '10002', '10003'],
      demographics: {
        population: 8336817,
        medianAge: 36.2,
        medianIncome: 67046,
        householdCount: 3736077,
        businessCount: 285000,
      },
      economy: {
        majorIndustries: ['Financial Services', 'Technology', 'Media'],
        unemploymentRate: 4.2,
        economicGrowthRate: 2.8,
        businessFriendlyRating: 8.5,
      },
      characteristics: {
        localKeywords: ['manhattan', 'brooklyn', 'queens', 'nyc'],
        neighborhoodNames: ['Manhattan', 'Brooklyn', 'Queens'],
        landmarkNames: ['Times Square', 'Central Park', 'Statue of Liberty'],
        events: ["New Year's Eve Ball Drop", 'NYC Marathon'],
        culture: ['Arts and Theater', 'Diverse Cuisine'],
        climate: 'humid subtropical',
      },
    },
    businessLocation: {
      primaryAddress: {
        street: '123 Business Ave',
        city: 'New York',
        state: 'New York',
        zipCode: '10001',
        country: 'United States',
      },
      serviceAreas: {
        cities: ['New York', 'Manhattan', 'Brooklyn'],
        counties: ['New York County'],
        radiusMiles: 25,
        specificZipCodes: ['10001', '10002', '10003'],
      },
      locationSpecific: {
        localCompetitors: [],
        localPartnerships: [],
        communityInvolvement: [],
        localCertifications: [],
        localAwards: [],
      },
    },
    isActive: true,
    priority: 'high',
    competitionLevel: 'high',
    marketPotential: 9,
    lastUpdated: new Date('2024-01-15'),
  },
  {
    id: '2',
    cityData: {
      name: 'Los Angeles',
      state: 'California',
      stateAbbreviation: 'CA',
      county: 'Los Angeles County',
      region: 'West Coast',
      country: 'United States',
      coordinates: { latitude: 34.0522, longitude: -118.2437 },
      timezone: 'America/Los_Angeles',
      zipCodes: ['90001', '90210', '90028'],
      demographics: {
        population: 3971883,
        medianAge: 35.8,
        medianIncome: 62142,
        householdCount: 1456875,
        businessCount: 175000,
      },
      economy: {
        majorIndustries: ['Entertainment', 'Technology', 'Aerospace'],
        unemploymentRate: 4.8,
        economicGrowthRate: 3.2,
        businessFriendlyRating: 7.8,
      },
      characteristics: {
        localKeywords: ['hollywood', 'beverly hills', 'santa monica', 'la'],
        neighborhoodNames: ['Hollywood', 'Beverly Hills', 'Santa Monica'],
        landmarkNames: ['Hollywood Sign', 'Griffith Observatory', 'Santa Monica Pier'],
        events: ['Academy Awards', 'LA Film Festival'],
        culture: ['Entertainment Capital', 'Beach Lifestyle'],
        climate: 'Mediterranean',
      },
    },
    businessLocation: {
      primaryAddress: {
        street: '456 Business Blvd',
        city: 'Los Angeles',
        state: 'California',
        zipCode: '90001',
        country: 'United States',
      },
      serviceAreas: {
        cities: ['Los Angeles', 'Hollywood', 'Beverly Hills'],
        counties: ['Los Angeles County'],
        radiusMiles: 30,
        specificZipCodes: ['90001', '90210', '90028'],
      },
      locationSpecific: {
        localCompetitors: [],
        localPartnerships: [],
        communityInvolvement: [],
        localCertifications: [],
        localAwards: [],
      },
    },
    isActive: true,
    priority: 'high',
    competitionLevel: 'medium',
    marketPotential: 8,
    lastUpdated: new Date('2024-01-10'),
  },
  {
    id: '3',
    cityData: {
      name: 'Chicago',
      state: 'Illinois',
      stateAbbreviation: 'IL',
      county: 'Cook County',
      region: 'Midwest',
      country: 'United States',
      coordinates: { latitude: 41.8781, longitude: -87.6298 },
      timezone: 'America/Chicago',
      zipCodes: ['60601', '60602', '60603'],
      demographics: {
        population: 2693976,
        medianAge: 34.8,
        medianIncome: 58247,
        householdCount: 1061928,
        businessCount: 125000,
      },
      economy: {
        majorIndustries: ['Manufacturing', 'Transportation', 'Finance'],
        unemploymentRate: 4.5,
        economicGrowthRate: 2.4,
        businessFriendlyRating: 8.2,
      },
      characteristics: {
        localKeywords: ['windy city', 'chi-town', 'the loop'],
        neighborhoodNames: ['The Loop', 'River North', 'Lincoln Park'],
        landmarkNames: ['Millennium Park', 'Navy Pier', 'Willis Tower'],
        events: ['Lollapalooza', 'Chicago Marathon'],
        culture: ['Architecture', 'Deep Dish Pizza', 'Blues and Jazz'],
        climate: 'continental',
      },
    },
    businessLocation: {
      primaryAddress: {
        street: '789 Business St',
        city: 'Chicago',
        state: 'Illinois',
        zipCode: '60601',
        country: 'United States',
      },
      serviceAreas: {
        cities: ['Chicago', 'The Loop', 'River North'],
        counties: ['Cook County'],
        radiusMiles: 20,
        specificZipCodes: ['60601', '60602', '60603'],
      },
      locationSpecific: {
        localCompetitors: [],
        localPartnerships: [],
        communityInvolvement: [],
        localCertifications: [],
        localAwards: [],
      },
    },
    isActive: false,
    priority: 'medium',
    competitionLevel: 'medium',
    marketPotential: 7,
    lastUpdated: new Date('2024-01-05'),
  },
];

export default function CityManagementDashboard({ className = '' }: CityManagementDashboardProps) {
  const [cities, setCities] = useState<CityMarket[]>(SAMPLE_CITIES);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'priority' | 'potential' | 'updated'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<BulkGenerationResult | null>(null);
  const [showAddCity, setShowAddCity] = useState(false);

  // Filter and sort cities
  const filteredCities = cities
    .filter((city) => {
      const matchesSearch =
        city.cityData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        city.cityData.state.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter =
        filterStatus === 'all' ||
        (filterStatus === 'active' && city.isActive) ||
        (filterStatus === 'inactive' && !city.isActive);
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.cityData.name;
          bValue = b.cityData.name;
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'potential':
          aValue = a.marketPotential;
          bValue = b.marketPotential;
          break;
        case 'updated':
          aValue = a.lastUpdated.getTime();
          bValue = b.lastUpdated.getTime();
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortOrder === 'asc' ? comparison : -comparison;
      }

      const comparison = aValue - bValue;
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Handle city selection
  const handleCitySelect = (cityId: string) => {
    setSelectedCities((prev) =>
      prev.includes(cityId) ? prev.filter((id) => id !== cityId) : [...prev, cityId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedCities.length === filteredCities.length) {
      setSelectedCities([]);
    } else {
      setSelectedCities(filteredCities.map((city) => city.id));
    }
  };

  // Handle bulk generation
  const handleBulkGeneration = async () => {
    if (selectedCities.length === 0) return;

    setIsGenerating(true);
    try {
      const selectedCityData = cities.filter((city) => selectedCities.includes(city.id));

      const bulkRequest: BulkCityPageGeneration = {
        cities: selectedCityData,
        globalConfig: {
          template: {
            layout: 'hybrid',
            theme: 'professional',
            components: ['hero', 'services', 'testimonials', 'faq', 'cta'],
          },
          seo: {
            enableAEO: true,
            enableVoiceSearch: true,
            targetFeaturedSnippets: true,
            enableLocalSchema: true,
            customMetaTags: {},
          },
          content: {
            autoGenerateFromProfile: true,
            includeTestimonials: true,
            includeCaseStudies: true,
            generateLocalFAQ: true,
            localContentDepth: 'comprehensive',
          },
          performance: {
            enableStaticGeneration: true,
            revalidationInterval: 3600,
            enableImageOptimization: true,
            enableCaching: true,
          },
        },
        generateInParallel: true,
        maxConcurrency: 3,
      };

      const response = await fetch('/api/local-seo', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bulkRequest),
      });

      const result = await response.json();

      if (result.success) {
        setGenerationResult(result.data);
        // Update city statuses
        setCities((prev) =>
          prev.map((city) =>
            selectedCities.includes(city.id) ? { ...city, lastUpdated: new Date() } : city
          )
        );
      } else {
        // Bulk generation failed
      }
    } catch (error) {
      // Bulk generation error
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle toggle city status
  const handleToggleCity = (cityId: string) => {
    setCities((prev) =>
      prev.map((city) =>
        city.id === cityId ? { ...city, isActive: !city.isActive, lastUpdated: new Date() } : city
      )
    );
  };

  // Handle delete city
  const handleDeleteCity = (cityId: string) => {
    setCities((prev) => prev.filter((city) => city.id !== cityId));
    setSelectedCities((prev) => prev.filter((id) => id !== cityId));
  };

  // Priority color mapping
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Competition level color mapping
  const getCompetitionColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Local SEO City Management
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage your local market presence and generate city-focused landing pages
            </p>
          </div>
          <button
            onClick={() => setShowAddCity(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add City
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Cities</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{cities.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Cities</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {cities.filter((city) => city.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">High Priority</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {cities.filter((city) => city.priority === 'high').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Potential</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(
                  cities.reduce((sum, city) => sum + city.marketPotential, 0) / cities.length
                ).toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search cities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Cities</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-gray-400" />
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field as any);
                setSortOrder(order as any);
              }}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="priority-desc">Priority High-Low</option>
              <option value="priority-asc">Priority Low-High</option>
              <option value="potential-desc">Potential High-Low</option>
              <option value="potential-asc">Potential Low-High</option>
              <option value="updated-desc">Recently Updated</option>
              <option value="updated-asc">Oldest Updated</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={
                  selectedCities.length === filteredCities.length && filteredCities.length > 0
                }
                onChange={handleSelectAll}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                Select All ({selectedCities.length}/{filteredCities.length})
              </span>
            </label>
          </div>

          {selectedCities.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkGeneration}
                disabled={isGenerating}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Generate Pages ({selectedCities.length})
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Generation Results */}
      {generationResult && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Generation Results
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{generationResult.successful}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Successful</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{generationResult.failed}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {(generationResult.overallPerformance.totalTime / 1000).toFixed(1)}s
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {(generationResult.overallPerformance.averageTimePerPage / 1000).toFixed(1)}s
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Per Page</div>
            </div>
          </div>

          <div className="space-y-2">
            {generationResult.results.map((result, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <span className="font-medium text-gray-900 dark:text-white">{result.cityName}</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    result.success
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  {result.success ? 'Success' : 'Failed'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cities Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  City
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Competition
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Potential
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCities.map((city) => (
                <tr key={city.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedCities.includes(city.id)}
                        onChange={() => handleCitySelect(city.id)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 mr-3"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {city.cityData.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {city.cityData.state}, {city.cityData.country}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        city.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                      }`}
                    >
                      {city.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(city.priority)}`}
                    >
                      {city.priority.charAt(0).toUpperCase() + city.priority.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getCompetitionColor(city.competitionLevel)}`}
                    >
                      {city.competitionLevel.charAt(0).toUpperCase() +
                        city.competitionLevel.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {city.marketPotential}/10
                      </div>
                      <div className="ml-2 w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${city.marketPotential * 10}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {city.lastUpdated.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() =>
                          window.open(
                            `/${city.cityData.name.toLowerCase().replace(/\s+/g, '-')}`,
                            '_blank'
                          )
                        }
                        className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                        title="View Page"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleCity(city.id)}
                        className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                        title="Toggle Status"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCity(city.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete City"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredCities.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No cities found</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || filterStatus !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Add your first city to get started with local SEO.'}
          </p>
        </div>
      )}
    </div>
  );
}
