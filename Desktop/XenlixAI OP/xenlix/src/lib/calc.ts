// Calculator utility functions - pure, unit-testable

export type RoiInput = {
  monthlyAdSpend: number; // USD
  cpc: number; // cost per click
  cr: number; // site conversion rate (0..1)
  aov: number; // avg order value OR lead value
  closeRate: number; // for lead-gen; if ecom, set to 1
  aeoLift: number; // expected uplift from AEO (0..1)
};

export type RoiOutput = {
  clicks: number;
  conversions: number; // orders or qualified leads
  revenue: number; // conversions * aov * closeRate
  cac: number; // adSpend / conversions
  roi: number; // (revenue - adSpend) / adSpend
  withAeo: {
    clicks: number;
    conversions: number;
    revenue: number;
    cac: number;
    roi: number;
  };
};

export function calcRoi(i: RoiInput): RoiOutput {
  const clicks = i.cpc > 0 ? i.monthlyAdSpend / i.cpc : 0;
  const conversions = clicks * i.cr;
  const revenue = conversions * i.aov * i.closeRate;
  const cac = conversions > 0 ? i.monthlyAdSpend / conversions : Infinity;
  const roi = i.monthlyAdSpend > 0 ? (revenue - i.monthlyAdSpend) / i.monthlyAdSpend : 0;

  // AEO lift applies to traffic (keep simple: traffic only)
  const clicks2 = clicks * (1 + i.aeoLift);
  const conv2 = clicks2 * i.cr;
  const rev2 = conv2 * i.aov * i.closeRate;
  const cac2 = conv2 > 0 ? i.monthlyAdSpend / conv2 : Infinity;
  const roi2 = i.monthlyAdSpend > 0 ? (rev2 - i.monthlyAdSpend) / i.monthlyAdSpend : 0;

  return {
    clicks,
    conversions,
    revenue,
    cac,
    roi,
    withAeo: {
      clicks: clicks2,
      conversions: conv2,
      revenue: rev2,
      cac: cac2,
      roi: roi2,
    },
  };
}

export type PricingInput = {
  plan: 'basic' | 'pro' | 'growth';
  seats: number; // team members
  aiRuns: number; // AI guidance/ad generations per month
  addOns: {
    whiteLabel: boolean;
    prioritySupport: boolean;
    auditsPerQuarter: number;
  };
};

export type PricingOutput = {
  base: number;
  addOns: number;
  total: number;
  breakdown: { name: string; price: number }[];
};

export function calcPricing(i: PricingInput): PricingOutput {
  const baseMap = { basic: 49, pro: 149, growth: 399 };
  const seatFee = Math.max(0, i.seats - 1) * 15; // first seat included
  const aiBlocks = Math.ceil(Math.max(0, i.aiRuns - 50) / 50) * 19; // 50 runs included, +$19/50
  const wl = i.addOns.whiteLabel ? 99 : 0;
  const ps = i.addOns.prioritySupport ? 49 : 0;
  const audits = i.addOns.auditsPerQuarter * 129; // one-time per quarter, show prorated monthly
  const addOns = seatFee + aiBlocks + wl + ps + audits / 3; // prorate quarterly audits to monthly
  const base = baseMap[i.plan];
  const total = base + addOns;

  return {
    base,
    addOns,
    total,
    breakdown: [
      { name: 'Base plan', price: base },
      { name: 'Extra seats', price: seatFee },
      { name: 'AI runs', price: aiBlocks },
      { name: 'White-label', price: wl },
      { name: 'Priority support', price: ps },
      { name: 'Audits (prorated)', price: audits / 3 },
    ],
  };
}

// ROI Presets for common business types
export const roiPresets = {
  ecommerce: {
    monthlyAdSpend: 5000,
    cpc: 1.5,
    cr: 0.025,
    aov: 85,
    closeRate: 1.0,
    aeoLift: 0.25,
  },
  'local-service': {
    monthlyAdSpend: 2000,
    cpc: 3.5,
    cr: 0.08,
    aov: 250,
    closeRate: 0.4,
    aeoLift: 0.35,
  },
  'b2b-leadgen': {
    monthlyAdSpend: 8000,
    cpc: 4.0,
    cr: 0.05,
    aov: 1200,
    closeRate: 0.15,
    aeoLift: 0.3,
  },
} as const;

// Utility functions for formatting
export function formatCurrency(value: number): string {
  if (!isFinite(value)) return '∞';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number): string {
  if (!isFinite(value)) return '∞%';
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatNumber(value: number): string {
  if (!isFinite(value)) return '∞';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
