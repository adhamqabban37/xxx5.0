'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GenerateAdsRequest, CustomerProfile } from '@/types/ads';

const formSchema = z.object({
  objective: z.enum(['leads', 'sales', 'visibility']),
  dailyUSD: z.number().min(5).max(5000),
  durationDays: z.number().min(7).max(90),
  usp: z.string().optional(),
  promos: z.string().optional(),
  competitors: z.string().optional(),
  landingUrl: z.string().url().optional().or(z.literal('')),
});

type FormData = z.infer<typeof formSchema>;

interface InputsFormProps {
  profile: CustomerProfile;
  onSubmit: (data: GenerateAdsRequest) => void;
  isLoading: boolean;
}

export default function InputsForm({ profile, onSubmit, isLoading }: InputsFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      objective: 'leads',
      dailyUSD: 50,
      durationDays: 30,
      usp: '',
      promos: '',
      competitors: '',
      landingUrl: profile.urls?.website || profile.currentWebsite || '',
    },
    mode: 'onChange',
  });

  const handleFormSubmit = (data: FormData) => {
    const requestData: GenerateAdsRequest = {
      profile,
      objective: data.objective,
      budget: {
        dailyUSD: data.dailyUSD,
        durationDays: data.durationDays,
      },
      usp: data.usp
        ? data.usp
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      promos: data.promos
        ? data.promos
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      competitors: data.competitors
        ? data.competitors
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      landingUrl: data.landingUrl || undefined,
    };

    onSubmit(requestData);
  };

  const dailyBudget = watch('dailyUSD');
  const duration = watch('durationDays');
  const totalBudget = dailyBudget * duration;

  return (
    <div className="space-y-6 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Campaign Details</h2>
        <p className="text-sm text-gray-600">Configure your ad campaign parameters</p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Campaign Objective */}
        <div>
          <label htmlFor="objective" className="block text-sm font-medium text-gray-700 mb-1">
            Campaign Objective
          </label>
          <select
            {...register('objective')}
            id="objective"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="leads">Generate Leads</option>
            <option value="sales">Drive Sales</option>
            <option value="visibility">Increase Visibility</option>
          </select>
          {errors.objective && (
            <p className="mt-1 text-sm text-red-600">{errors.objective.message}</p>
          )}
        </div>

        {/* Budget Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="dailyUSD" className="block text-sm font-medium text-gray-700 mb-1">
              Daily Budget (USD)
            </label>
            <input
              {...register('dailyUSD', { valueAsNumber: true })}
              type="number"
              id="dailyUSD"
              min="5"
              max="5000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.dailyUSD && (
              <p className="mt-1 text-sm text-red-600">{errors.dailyUSD.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="durationDays" className="block text-sm font-medium text-gray-700 mb-1">
              Duration (Days)
            </label>
            <input
              {...register('durationDays', { valueAsNumber: true })}
              type="number"
              id="durationDays"
              min="7"
              max="90"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.durationDays && (
              <p className="mt-1 text-sm text-red-600">{errors.durationDays.message}</p>
            )}
          </div>
        </div>

        {/* Total Budget Display */}
        <div className="p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Total Campaign Budget: </span>$
            {totalBudget.toLocaleString()} over {duration} days
          </p>
        </div>

        {/* Landing URL */}
        <div>
          <label htmlFor="landingUrl" className="block text-sm font-medium text-gray-700 mb-1">
            Landing Page URL (Optional)
          </label>
          <input
            {...register('landingUrl')}
            type="url"
            id="landingUrl"
            placeholder="https://your-website.com/landing-page"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.landingUrl && (
            <p className="mt-1 text-sm text-red-600">{errors.landingUrl.message}</p>
          )}
        </div>

        {/* Unique Selling Points */}
        <div>
          <label htmlFor="usp" className="block text-sm font-medium text-gray-700 mb-1">
            Unique Selling Points (Optional)
          </label>
          <input
            {...register('usp')}
            type="text"
            id="usp"
            placeholder="Fast delivery, 24/7 support, money-back guarantee"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">Separate multiple points with commas</p>
        </div>

        {/* Promotions */}
        <div>
          <label htmlFor="promos" className="block text-sm font-medium text-gray-700 mb-1">
            Current Promotions (Optional)
          </label>
          <input
            {...register('promos')}
            type="text"
            id="promos"
            placeholder="20% off, Free consultation, Limited time offer"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">Separate multiple promotions with commas</p>
        </div>

        {/* Competitors */}
        <div>
          <label htmlFor="competitors" className="block text-sm font-medium text-gray-700 mb-1">
            Key Competitors (Optional)
          </label>
          <input
            {...register('competitors')}
            type="text"
            id="competitors"
            placeholder="Competitor A, Competitor B, Competitor C"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">Separate multiple competitors with commas</p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isValid || isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-describedby={isLoading ? 'loading-status' : undefined}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div
                className="motion-safe:animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
                aria-hidden="true"
              ></div>
              <span id="loading-status">Generating Ads...</span>
            </div>
          ) : (
            'Generate Ad Drafts'
          )}
        </button>
      </form>
    </div>
  );
}
