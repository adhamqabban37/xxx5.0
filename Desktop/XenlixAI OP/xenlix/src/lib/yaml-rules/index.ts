// Main exports for YAML Rules Engine
export { RuleEngine } from './engine/rule-engine';
export { YAMLRuleParser } from './engine/rule-parser';
export { RuleValidator } from './engine/rule-validator';

// Schema exports
export {
  type Rule,
  type RuleSet,
  type RuleCategory,
  type RuleCondition,
  type RuleValidationResult,
  type ValidationReport,
  type ValidationTarget,
  type RuleSeverity,
  type RuleConditionType,
  RuleSchema,
  RuleSetSchema,
  ValidationReportSchema,
  RuleSeveritySchema,
  RuleConditionTypeSchema,
} from './schemas/rule-schema';

// Convenience function to create a new rule engine
export const createRuleEngine = () => new RuleEngine();

// Default rule sets paths
export const DEFAULT_RULES_PATH = './src/lib/yaml-rules/rules';

// Utility functions
export const parseYAMLRules = (content: string) => {
  const parser = YAMLRuleParser.getInstance();
  return parser.parseRuleContent(content);
};

export const validateYAMLStructure = (content: string) => {
  const parser = YAMLRuleParser.getInstance();
  return parser.validateRuleStructure(content);
};

export const generateRuleTemplate = (name: string, industry?: string) => {
  const parser = YAMLRuleParser.getInstance();
  return parser.generateTemplate(name, industry);
};
