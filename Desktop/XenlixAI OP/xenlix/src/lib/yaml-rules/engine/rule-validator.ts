import {
  type Rule,
  type RuleCondition,
  type RuleValidationResult,
  type ValidationTarget,
} from '../schemas/rule-schema';

export class RuleValidator {
  private static instance: RuleValidator;

  private constructor() {}

  public static getInstance(): RuleValidator {
    if (!RuleValidator.instance) {
      RuleValidator.instance = new RuleValidator();
    }
    return RuleValidator.instance;
  }

  /**
   * Validate a single rule against target data
   */
  public validateRule(rule: Rule, target: ValidationTarget): RuleValidationResult {
    const result: RuleValidationResult = {
      rule_id: rule.id,
      rule_name: rule.name,
      severity: rule.severity,
      passed: false,
      message: rule.message,
      target: rule.condition.target,
      category: rule.category,
      priority: rule.priority,
    };

    try {
      // Skip disabled rules
      if (!rule.enabled) {
        result.passed = true;
        result.message = 'Rule disabled - skipped';
        return result;
      }

      // Get the value from target using the condition target path
      const targetValue = this.getTargetValue(target, rule.condition.target);
      result.value_checked = targetValue;

      // Validate based on condition type
      result.passed = this.evaluateCondition(rule.condition, targetValue, target);

      // Add details if validation failed
      if (!result.passed) {
        result.details = {
          expected: this.getExpectedValue(rule.condition),
          actual: targetValue,
          condition_type: rule.condition.type,
        };
      }
    } catch (error) {
      result.passed = false;
      result.message = `Validation error: ${error}`;
      result.details = { error: String(error) };
    }

    return result;
  }

  /**
   * Validate multiple rules against target data
   */
  public validateRules(rules: Rule[], target: ValidationTarget): RuleValidationResult[] {
    return rules.map((rule) => this.validateRule(rule, target));
  }

  /**
   * Get value from target object using dot notation path
   */
  private getTargetValue(target: ValidationTarget, path: string): unknown {
    const parts = path.split('.');
    let current: any = target;

    for (const part of parts) {
      if (current == null) {
        return undefined;
      }

      // Handle array indices
      if (part.includes('[') && part.includes(']')) {
        const [key, indexStr] = part.split('[');
        const index = parseInt(indexStr.replace(']', ''), 10);
        current = current[key];
        if (Array.isArray(current) && index >= 0 && index < current.length) {
          current = current[index];
        } else {
          return undefined;
        }
      } else {
        current = current[part];
      }
    }

    return current;
  }

  /**
   * Evaluate a condition against a value
   */
  private evaluateCondition(
    condition: RuleCondition,
    value: unknown,
    target: ValidationTarget
  ): boolean {
    switch (condition.type) {
      case 'required':
        return this.evaluateRequired(value, condition.required ?? true);

      case 'length_range':
        return this.evaluateLengthRange(value, condition.min, condition.max);

      case 'required_and_length':
        const isRequired = this.evaluateRequired(value, condition.required ?? true);
        if (!isRequired) return false;
        return this.evaluateLengthRange(value, condition.min, condition.max);

      case 'regex_match':
        return this.evaluateRegexMatch(value, condition.pattern, condition.flags);

      case 'numeric_range':
        return this.evaluateNumericRange(value, condition.min, condition.max);

      case 'exists':
        return value !== undefined && value !== null;

      case 'not_exists':
        return value === undefined || value === null;

      case 'contains':
        return this.evaluateContains(value, condition.value);

      case 'not_contains':
        return !this.evaluateContains(value, condition.value);

      case 'equals':
        return value === condition.value;

      case 'not_equals':
        return value !== condition.value;

      case 'min_count':
        return this.evaluateMinCount(value, condition.count ?? 1);

      case 'max_count':
        return this.evaluateMaxCount(value, condition.count ?? 1);

      case 'css_selector_exists':
        return this.evaluateCSSSelector(target, condition.selector);

      case 'xpath_exists':
        return this.evaluateXPath(target, condition.xpath);

      default:
        throw new Error(`Unknown condition type: ${(condition as any).type}`);
    }
  }

  /**
   * Evaluate required condition
   */
  private evaluateRequired(value: unknown, required: boolean): boolean {
    if (!required) return true;

    if (value === undefined || value === null) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;

    return true;
  }

  /**
   * Evaluate length range condition
   */
  private evaluateLengthRange(value: unknown, min?: number, max?: number): boolean {
    let length: number;

    if (typeof value === 'string') {
      length = value.length;
    } else if (Array.isArray(value)) {
      length = value.length;
    } else if (value === null || value === undefined) {
      length = 0;
    } else {
      length = String(value).length;
    }

    if (min !== undefined && length < min) return false;
    if (max !== undefined && length > max) return false;

    return true;
  }

  /**
   * Evaluate regex match condition
   */
  private evaluateRegexMatch(value: unknown, pattern: string, flags?: string): boolean {
    if (typeof value !== 'string') return false;

    try {
      const regex = new RegExp(pattern, flags);
      return regex.test(value);
    } catch (error) {
      console.warn(`Invalid regex pattern: ${pattern}`, error);
      return false;
    }
  }

  /**
   * Evaluate numeric range condition
   */
  private evaluateNumericRange(value: unknown, min?: number, max?: number): boolean {
    const numValue = typeof value === 'number' ? value : parseFloat(String(value));

    if (isNaN(numValue)) return false;

    if (min !== undefined && numValue < min) return false;
    if (max !== undefined && numValue > max) return false;

    return true;
  }

  /**
   * Evaluate contains condition
   */
  private evaluateContains(value: unknown, searchValue: unknown): boolean {
    if (typeof value === 'string' && typeof searchValue === 'string') {
      return value.toLowerCase().includes(searchValue.toLowerCase());
    }

    if (Array.isArray(value)) {
      return value.includes(searchValue);
    }

    return false;
  }

  /**
   * Evaluate minimum count condition
   */
  private evaluateMinCount(value: unknown, minCount: number): boolean {
    if (Array.isArray(value)) {
      return value.length >= minCount;
    }

    if (typeof value === 'string') {
      return value.length >= minCount;
    }

    return false;
  }

  /**
   * Evaluate maximum count condition
   */
  private evaluateMaxCount(value: unknown, maxCount: number): boolean {
    if (Array.isArray(value)) {
      return value.length <= maxCount;
    }

    if (typeof value === 'string') {
      return value.length <= maxCount;
    }

    return false;
  }

  /**
   * Evaluate CSS selector condition (simplified - would need DOM parsing in real implementation)
   */
  private evaluateCSSSelector(target: ValidationTarget, selector?: string): boolean {
    // This is a simplified implementation
    // In a real scenario, you'd parse the HTML content and use a DOM query
    if (!selector || !target.page.content) return false;

    // Basic selector matching for common cases
    if (selector.startsWith('#')) {
      const id = selector.substring(1);
      return target.page.content.includes(`id="${id}"`);
    }

    if (selector.startsWith('.')) {
      const className = selector.substring(1);
      return (
        target.page.content.includes(`class="${className}"`) ||
        target.page.content.includes(`class='${className}'`)
      );
    }

    // Tag selectors
    return target.page.content.includes(`<${selector}`);
  }

  /**
   * Evaluate XPath condition (simplified implementation)
   */
  private evaluateXPath(target: ValidationTarget, xpath?: string): boolean {
    // This is a placeholder - real XPath evaluation would require XML/HTML parsing
    if (!xpath || !target.page.content) return false;

    // Very basic XPath-like matching
    if (xpath.includes('//title')) {
      return !!target.page.title;
    }

    if (xpath.includes('//h1')) {
      return !!(target.page.h1 && target.page.h1.length > 0);
    }

    return false;
  }

  /**
   * Get expected value description for error messages
   */
  private getExpectedValue(condition: RuleCondition): string {
    switch (condition.type) {
      case 'required':
        return 'value should be present';

      case 'length_range':
        if (condition.min !== undefined && condition.max !== undefined) {
          return `length between ${condition.min} and ${condition.max}`;
        } else if (condition.min !== undefined) {
          return `minimum length of ${condition.min}`;
        } else if (condition.max !== undefined) {
          return `maximum length of ${condition.max}`;
        }
        return 'valid length';

      case 'required_and_length':
        let expected = 'value should be present';
        if (condition.min !== undefined && condition.max !== undefined) {
          expected += ` and length between ${condition.min} and ${condition.max}`;
        } else if (condition.min !== undefined) {
          expected += ` and minimum length of ${condition.min}`;
        } else if (condition.max !== undefined) {
          expected += ` and maximum length of ${condition.max}`;
        }
        return expected;

      case 'regex_match':
        return `should match pattern: ${condition.pattern}`;

      case 'numeric_range':
        if (condition.min !== undefined && condition.max !== undefined) {
          return `number between ${condition.min} and ${condition.max}`;
        } else if (condition.min !== undefined) {
          return `number >= ${condition.min}`;
        } else if (condition.max !== undefined) {
          return `number <= ${condition.max}`;
        }
        return 'valid number';

      default:
        return 'valid value';
    }
  }
}
