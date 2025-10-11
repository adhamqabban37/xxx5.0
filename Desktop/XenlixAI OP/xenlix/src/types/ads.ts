// Shared types for ad generation
export type Channel = 'google' | 'bing' | 'meta' | 'tiktok';
export type CampaignGoal = 'leads' | 'sales' | 'visibility';
export type BudgetPlan = {
  dailyUSD: number;
  durationDays: number;
};

// Customer Profile (aligned with store structure)
export interface CustomerProfile {
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

// Platform-specific ad drafts
export type GoogleDraft = {
  headlines: string[];
  descriptions: string[];
  longHeadline?: string;
  sitelinks?: { text: string; url: string }[];
  callouts?: string[];
  assets?: { image?: string; logo?: string; video?: string }[];
  keywords?: string[];
};

export type BingDraft = {
  headlines: string[];
  descriptions: string[];
  assets?: { image?: string; logo?: string }[];
  keywords?: string[];
};

export type MetaDraft = {
  primaryTexts: string[];
  headlines: string[];
  descriptions: string[];
  callToAction: 'LEARN_MORE' | 'SIGN_UP' | 'CONTACT_US' | 'SHOP_NOW';
};

export type TikTokDraft = {
  primaryTexts: string[];
  hooks: string[];
  ctas: string[];
  hashtags: string[];
};

export type AdDraftBundle = {
  google: GoogleDraft;
  bing: BingDraft;
  meta: MetaDraft;
  tiktok: TikTokDraft;
  budget: BudgetPlan;
  campaignObjective: CampaignGoal;
};

// API Input/Output types
export interface GenerateAdsRequest {
  profile: CustomerProfile;
  objective: CampaignGoal;
  budget: BudgetPlan;
  competitors?: string[];
  usp?: string[];
  promos?: string[];
  landingUrl?: string;
}

export interface GenerateAdsResponse {
  success: boolean;
  data?: AdDraftBundle;
  error?: string;
}
