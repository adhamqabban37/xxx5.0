/**
 * AEO Rules Evaluation Engine
 * Supports: eq, lte, gte, includes, any, all, between operators
 * Optimized for <50ms evaluation time
 */

import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// Type definitions
export interface RuleCondition {
  type: string;
  target: string;
  operator: 'eq' | 'lte' | 'gte' | 'includes' | 'any' | 'all' | 'between';
  value?: any;
  min?: number;
  max?: number;
}

export interface AEORule {
  id: string;
  name: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  condition: RuleCondition;
  message: string;
  recommendation: string;
  score_impact: number;
}

export interface RuleCategory {
  name: string;
  description: string;
  rules: AEORule[];
}

export interface AEOConfig {
  name: string;
  description: string;
  version: string;
  weights: Record<string, number>;
  categories: Record<string, RuleCategory>;
  scoring: {
    total_possible: number;
    passing_scores: Record<string, number>;
    grade_mapping: Record<string, string>;
  };
  api_responses: {
    free: {
      include_keys: string[];
      max_rules_shown: number;
      include_evidence: boolean;
      include_recommendations: boolean;
    };
    premium: {
      include_keys: string[];
      max_rules_shown: number;
      include_evidence: boolean;
      include_recommendations: boolean;
    };
  };
}

export interface PageData {
  url: string;
  core_web_vitals?: {
    lcp: number;
    fid: number;
    cls: number;
  };
  mobile?: {
    friendly: boolean;
  };
  security?: {
    https: boolean;
  };
  structured_data?: {
    types: string[];
  };
  headings?: {
    h1: number;
    hierarchy: string;
  };
  meta?: {
    description: string;
  };
  content?: {
    word_count: number;
    readability_score: number;
    question_answers: number;
    conversational_score: number;
    long_tail_coverage: number;
    intent_match_score: number;
    published_date: string;
  };
  author?: {
    info: boolean;
  };
  links?: {
    external_citations: number;
  };
  site?: {
    contact_page: boolean;
    privacy_policy: boolean;
  };
  [key: string]: any;
}

export interface RuleResult {
  rule_id: string;
  name: string;
  passed: boolean;
  score_impact: number;
  message?: string;
  recommendation?: string;
  evidence?: any;
  actual_value?: any;
}

export interface CategoryResult {
  name: string;
  score: number;
  max_score: number;
  passed_rules: number;
  total_rules: number;
  results: RuleResult[];
}

export interface EvaluationResult {
  overall_score: number;
  grade: string;
  category_scores: Record<string, CategoryResult>;
  critical_issues: RuleResult[];
  all_rules?: RuleResult[];
  evidence?: Record<string, any>;
  recommendations?: string[];
  evaluation_time_ms: number;
}

// Cache for configuration
let configCache: AEOConfig | null = null;
let configCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Load AEO configuration with caching
 */
export function loadAEOConfig(): AEOConfig {
  const now = Date.now();

  // Return cached config if still valid
  if (configCache && now - configCacheTime < CACHE_TTL) {
    return configCache;
  }

  try {
    const configPath = path.join(process.cwd(), 'config', 'rules', 'aeo.yml');
    const configContent = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(configContent) as AEOConfig;

    // Cache the configuration
    configCache = config;
    configCacheTime = now;

    return config;
  } catch (error) {
    console.error('Error loading AEO config:', error);
    throw new Error('Failed to load AEO configuration');
  }
}

/**
 * Get value from nested object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

/**
 * Evaluate a single rule condition
 */
function evaluateCondition(
  condition: RuleCondition,
  pageData: PageData
): { passed: boolean; actualValue: any } {
  const actualValue = getNestedValue(pageData, condition.target);

  // Handle missing values
  if (actualValue === undefined || actualValue === null) {
    return { passed: false, actualValue: null };
  }

  switch (condition.operator) {
    case 'eq':
      return {
        passed: actualValue === condition.value,
        actualValue,
      };

    case 'lte':
      return {
        passed: typeof actualValue === 'number' && actualValue <= (condition.value as number),
        actualValue,
      };

    case 'gte':
      return {
        passed: typeof actualValue === 'number' && actualValue >= (condition.value as number),
        actualValue,
      };

    case 'includes':
      if (Array.isArray(actualValue) && Array.isArray(condition.value)) {
        return {
          passed: condition.value.some((val) => actualValue.includes(val)),
          actualValue,
        };
      }
      if (typeof actualValue === 'string' && typeof condition.value === 'string') {
        return {
          passed: actualValue.includes(condition.value),
          actualValue,
        };
      }
      return { passed: false, actualValue };

    case 'any':
      if (Array.isArray(condition.value)) {
        return {
          passed: condition.value.includes(actualValue),
          actualValue,
        };
      }
      return { passed: false, actualValue };

    case 'all':
      if (Array.isArray(actualValue) && Array.isArray(condition.value)) {
        return {
          passed: condition.value.every((val) => actualValue.includes(val)),
          actualValue,
        };
      }
      return { passed: false, actualValue };

    case 'between':
      if (
        typeof actualValue === 'number' &&
        condition.min !== undefined &&
        condition.max !== undefined
      ) {
        return {
          passed: actualValue >= condition.min && actualValue <= condition.max,
          actualValue,
        };
      }
      if (
        typeof actualValue === 'string' &&
        condition.min !== undefined &&
        condition.max !== undefined
      ) {
        const length = actualValue.length;
        return {
          passed: length >= condition.min && length <= condition.max,
          actualValue: length,
        };
      }
      return { passed: false, actualValue };

    default:
      console.warn(`Unknown operator: ${condition.operator}`);
      return { passed: false, actualValue };
  }
}

/**
 * Evaluate a single rule
 */
function evaluateRule(
  rule: AEORule,
  pageData: PageData,
  includeEvidence: boolean = false
): RuleResult {
  const { passed, actualValue } = evaluateCondition(rule.condition, pageData);

  const result: RuleResult = {
    rule_id: rule.id,
    name: rule.name,
    passed,
    score_impact: passed ? 0 : rule.score_impact,
    actual_value: actualValue,
  };

  if (!passed) {
    result.message = rule.message.replace('{value}', String(actualValue));
    if (includeEvidence) {
      result.recommendation = rule.recommendation;
      result.evidence = {
        target: rule.condition.target,
        expected: rule.condition.value || { min: rule.condition.min, max: rule.condition.max },
        actual: actualValue,
        operator: rule.condition.operator,
      };
    }
  }

  return result;
}

/**
 * Calculate grade based on score
 */
function calculateGrade(score: number, gradeMapping: Record<string, string>): string {
  for (const [range, grade] of Object.entries(gradeMapping)) {
    const [min, max] = range.split('-').map((n) => parseInt(n));
    if (max && score >= min && score <= max) {
      return grade;
    } else if (!max && score >= min) {
      return grade;
    }
  }
  return 'Unknown';
}

/**
 * Main evaluation function
 */
export function evaluateRules(
  pageData: PageData,
  tier: 'free' | 'premium' = 'free'
): EvaluationResult {
  const startTime = Date.now();

  try {
    const config = loadAEOConfig();
    const apiConfig = config.api_responses[tier];

    const categoryResults: Record<string, CategoryResult> = {};
    const allRuleResults: RuleResult[] = [];
    const criticalIssues: RuleResult[] = [];

    // Evaluate each category
    for (const [categoryKey, category] of Object.entries(config.categories)) {
      const categoryWeight = config.weights[categoryKey] || 0;
      const results: RuleResult[] = [];
      let totalPossibleScore = 0;
      let actualScore = 0;
      let passedRules = 0;

      // Evaluate each rule in the category
      for (const rule of category.rules) {
        const result = evaluateRule(rule, pageData, apiConfig.include_evidence);
        results.push(result);
        allRuleResults.push(result);

        // Calculate scores
        const maxImpact = Math.abs(rule.score_impact);
        totalPossibleScore += maxImpact;

        if (result.passed) {
          actualScore += maxImpact;
          passedRules++;
        } else {
          // Add to critical issues if it's a critical rule
          if (rule.priority === 'critical') {
            criticalIssues.push(result);
          }
        }
      }

      // Calculate category score as percentage
      const categoryScore = totalPossibleScore > 0 ? (actualScore / totalPossibleScore) * 100 : 100;

      categoryResults[categoryKey] = {
        name: category.name,
        score: Math.round(categoryScore),
        max_score: 100,
        passed_rules: passedRules,
        total_rules: category.rules.length,
        results: apiConfig.include_evidence ? results : [],
      };
    }

    // Calculate overall score using weighted categories
    let overallScore = 0;
    for (const [categoryKey, result] of Object.entries(categoryResults)) {
      const weight = config.weights[categoryKey] || 0;
      overallScore += (result.score / 100) * weight;
    }
    overallScore = Math.round(overallScore * 100);

    // Build response based on tier
    const evaluationResult: EvaluationResult = {
      overall_score: overallScore,
      grade: calculateGrade(overallScore, config.scoring.grade_mapping),
      category_scores: categoryResults,
      critical_issues: criticalIssues.slice(
        0,
        apiConfig.max_rules_shown > 0 ? apiConfig.max_rules_shown : criticalIssues.length
      ),
      evaluation_time_ms: Date.now() - startTime,
    };

    // Add premium-only fields
    if (tier === 'premium' && apiConfig.include_evidence) {
      evaluationResult.all_rules = allRuleResults;
      evaluationResult.evidence = {
        page_data_snapshot: pageData,
        evaluation_timestamp: new Date().toISOString(),
        config_version: config.version,
      };
      evaluationResult.recommendations = allRuleResults
        .filter((r) => !r.passed && r.recommendation)
        .map((r) => r.recommendation!)
        .slice(0, 10); // Top 10 recommendations
    }

    return evaluationResult;
  } catch (error) {
    console.error('Error evaluating rules:', error);
    return {
      overall_score: 0,
      grade: 'Error',
      category_scores: {},
      critical_issues: [],
      evaluation_time_ms: Date.now() - startTime,
    };
  }
}

/**
 * Validate page data against schema
 */
const PageDataSchema = z
  .object({
    url: z.string().url(),
    core_web_vitals: z
      .object({
        lcp: z.number().min(0),
        fid: z.number().min(0),
        cls: z.number().min(0),
      })
      .optional(),
    mobile: z
      .object({
        friendly: z.boolean(),
      })
      .optional(),
    security: z
      .object({
        https: z.boolean(),
      })
      .optional(),
    // ... other fields as needed
  })
  .passthrough(); // Allow additional fields

export function validatePageData(data: any): PageData {
  try {
    return PageDataSchema.parse(data);
  } catch (error) {
    console.error('Invalid page data:', error);
    throw new Error('Invalid page data format');
  }
}

// Export types for use in API routes
export type { AEOConfig, PageData, EvaluationResult, RuleResult, CategoryResult };
