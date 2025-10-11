/**
 * AI Visibility System Types
 * Common types and interfaces for the AI search engine visibility system
 */

export interface EngineAnswer {
  engine: 'perplexity' | 'chatgpt' | string;
  prompt_id: string | number;
  query_text: string;
  locale: string;
  collected_at: string;
  answer_text: string;
  cited_links?: CitedLink[];
  raw_payload?: any;
  html_snapshot_path?: string;
}

export interface CitedLink {
  url: string;
  title?: string;
  rank?: number;
}

export interface BrandConfig {
  name: string;
  domain: string;
  aliases: string[];
}

export interface CompetitorConfig extends BrandConfig {}

export interface BrandMention {
  brand_id: string;
  position?: number; // Position in answer if ranked
  sentiment?: number; // -1, 0, 1
  matched_text: string; // The actual text that matched
}

export interface ParsedAnswer {
  answer: EngineAnswer;
  mentions: BrandMention[];
  citations: {
    url: string;
    domain: string;
    title?: string;
    rank?: number;
  }[];
}

export interface AIVisibilityScore {
  mentioned: number; // 0 or 1
  primary_citation: number; // 0 or 1
  position_term: number; // 1/position or 0.5
  sentiment_score: number; // -1 to 1
  overall_score: number; // Weighted combination
}

export interface AIVisibilityMetrics {
  brand_id: string;
  date: string;
  ai_visibility_index: number; // Average AI_VISIBILITY across prompts
  ai_coverage: number; // % of prompts where mentioned
  ai_source_share: number; // % of answers citing brand domain
  total_prompts: number;
  mentioned_prompts: number;
  cited_prompts: number;
  average_position?: number;
  average_sentiment?: number;
}

export interface CollectorConfig {
  timeout: number;
  retries: number;
  retry_delay: number;
  headless: boolean;
  user_agent?: string;
}

export interface CollectorError extends Error {
  engine: string;
  prompt_id: string | number;
  retry_count: number;
  is_timeout: boolean;
}
