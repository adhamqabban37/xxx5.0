import { z } from 'zod';

// Rule severity levels
export const RuleSeveritySchema = z.enum(['error', 'warning', 'info']);
export type RuleSeverity = z.infer<typeof RuleSeveritySchema>;

// Rule condition types
export const RuleConditionTypeSchema = z.enum([
  'length_range',
  'required',
  'required_and_length',
  'regex_match',
  'numeric_range',
  'exists',
  'not_exists',
  'contains',
  'not_contains',
  'equals',
  'not_equals',
  'min_count',
  'max_count',
  'xpath_exists',
  'css_selector_exists',
]);
export type RuleConditionType = z.infer<typeof RuleConditionTypeSchema>;

// Base rule condition schema
export const BaseRuleConditionSchema = z.object({
  type: RuleConditionTypeSchema,
  target: z.string(),
  message: z.string().optional(),
});

// Length range condition
export const LengthRangeConditionSchema = BaseRuleConditionSchema.extend({
  type: z.literal('length_range'),
  min: z.number().optional(),
  max: z.number().optional(),
});

// Required condition
export const RequiredConditionSchema = BaseRuleConditionSchema.extend({
  type: z.literal('required'),
  required: z.boolean().default(true),
});

// Required and length condition
export const RequiredAndLengthConditionSchema = BaseRuleConditionSchema.extend({
  type: z.literal('required_and_length'),
  required: z.boolean().default(true),
  min: z.number().optional(),
  max: z.number().optional(),
});

// Regex match condition
export const RegexMatchConditionSchema = BaseRuleConditionSchema.extend({
  type: z.literal('regex_match'),
  pattern: z.string(),
  flags: z.string().optional(),
});

// Numeric range condition
export const NumericRangeConditionSchema = BaseRuleConditionSchema.extend({
  type: z.literal('numeric_range'),
  min: z.number().optional(),
  max: z.number().optional(),
});

// Generic condition (for simple checks)
export const GenericConditionSchema = BaseRuleConditionSchema.extend({
  value: z.any().optional(),
  count: z.number().optional(),
  selector: z.string().optional(),
  xpath: z.string().optional(),
});

// Union of all condition types
export const RuleConditionSchema = z.discriminatedUnion('type', [
  LengthRangeConditionSchema,
  RequiredConditionSchema,
  RequiredAndLengthConditionSchema,
  RegexMatchConditionSchema,
  NumericRangeConditionSchema,
  GenericConditionSchema,
]);
export type RuleCondition = z.infer<typeof RuleConditionSchema>;

// Individual rule schema
export const RuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  severity: RuleSeveritySchema,
  condition: RuleConditionSchema,
  message: z.string(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  priority: z.number().min(1).max(10).default(5),
  enabled: z.boolean().default(true),
});
export type Rule = z.infer<typeof RuleSchema>;

// Rule category schema
export const RuleCategorySchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  rules: z.array(RuleSchema),
  enabled: z.boolean().default(true),
});
export type RuleCategory = z.infer<typeof RuleCategorySchema>;

// Rule set metadata
export const RuleSetMetadataSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string(),
  author: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  industry: z.string().optional(),
  tags: z.array(z.string()).optional(),
});
export type RuleSetMetadata = z.infer<typeof RuleSetMetadataSchema>;

// Complete rule set schema
export const RuleSetSchema = z.object({
  rule_set: RuleSetMetadataSchema,
  categories: z.record(z.string(), RuleCategorySchema),
});
export type RuleSet = z.infer<typeof RuleSetSchema>;

// Rule validation result
export const RuleValidationResultSchema = z.object({
  rule_id: z.string(),
  rule_name: z.string(),
  severity: RuleSeveritySchema,
  passed: z.boolean(),
  message: z.string(),
  details: z.any().optional(),
  target: z.string(),
  value_checked: z.any().optional(),
  category: z.string().optional(),
  priority: z.number(),
});
export type RuleValidationResult = z.infer<typeof RuleValidationResultSchema>;

// Validation report
export const ValidationReportSchema = z.object({
  rule_set_name: z.string(),
  rule_set_version: z.string(),
  validation_date: z.string(),
  target_url: z.string(),
  total_rules: z.number(),
  passed_rules: z.number(),
  failed_rules: z.number(),
  warning_rules: z.number(),
  error_rules: z.number(),
  overall_score: z.number().min(0).max(100),
  results: z.array(RuleValidationResultSchema),
  summary: z.object({
    errors: z.array(RuleValidationResultSchema),
    warnings: z.array(RuleValidationResultSchema),
    info: z.array(RuleValidationResultSchema),
  }),
});
export type ValidationReport = z.infer<typeof ValidationReportSchema>;

// Target data for validation (what we validate against)
export interface ValidationTarget {
  url: string;
  page: {
    title?: string;
    meta_description?: string;
    h1?: string[];
    h2?: string[];
    h3?: string[];
    content?: string;
    word_count?: number;
    images?: Array<{
      src: string;
      alt?: string;
      title?: string;
    }>;
    links?: Array<{
      href: string;
      text: string;
      rel?: string;
    }>;
  };
  technical: {
    status_code?: number;
    response_time?: number;
    page_size?: number;
    lighthouse_scores?: {
      performance?: number;
      accessibility?: number;
      best_practices?: number;
      seo?: number;
    };
  };
  schema?: {
    structured_data?: Record<string, unknown>[];
    canonical_url?: string;
    og_tags?: Record<string, string>;
    twitter_tags?: Record<string, string>;
  };
}
