import { create } from 'zustand';

interface Profile {
  businessName?: string;
  industry?: string;
  targetAudience?: string;
  currentWebsite?: string;
  services?: string[];
  city?: string;
  reviews?: {
    rating: number;
    count: number;
  };
  urls?: {
    website?: string;
  };
}

interface AppState {
  profile: Profile | null;
  setProfile: (data: Profile) => void;
}

export const useAppStore = create<AppState>((set) => ({
  profile: {
    businessName: 'XenlixAI Solutions',
    industry: 'AI Marketing',
    targetAudience: 'Small to medium businesses',
    currentWebsite: 'https://xenlixai.com',
    services: ['AI Marketing Automation', 'Website Optimization', 'SEO Services'],
    city: 'Dallas',
    reviews: {
      rating: 4.8,
      count: 127,
    },
    urls: {
      website: 'https://xenlixai.com',
    },
  },
  setProfile: (data: Profile) => set({ profile: data }),
}));
