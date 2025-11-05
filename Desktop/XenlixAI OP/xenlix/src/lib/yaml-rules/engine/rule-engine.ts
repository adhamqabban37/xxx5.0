import { YAMLRuleParser } from './rule-parser';
import { RuleValidator } from './rule-validator';
import {
  type RuleSet,
  type Rule,
  type ValidationTarget,
  type ValidationReport,
  type RuleValidationResult,
  ValidationReportSchema,
} from '../schemas/rule-schema';

export class RuleEngine {
  private parser: YAMLRuleParser;
  private validator: RuleValidator;
  private loadedRuleSets: Map<string, RuleSet> = new Map();

  constructor() {
    this.parser = YAMLRuleParser.getInstance();
    this.validator = RuleValidator.getInstance();
  }

  /**
   * Load a rule set from YAML file
   */
  public async loadRuleSet(filePath: string): Promise<RuleSet> {
    const ruleSet = await this.parser.parseRuleFile(filePath);
    this.loadedRuleSets.set(ruleSet.rule_set.name, ruleSet);
    return ruleSet;
  }

  /**
   * Load a rule set from YAML content string
   */
  public loadRuleSetFromContent(content: string, name?: string): RuleSet {
    const ruleSet = this.parser.parseRuleContent(content);
    const ruleSetName = name || ruleSet.rule_set.name;
    this.loadedRuleSets.set(ruleSetName, ruleSet);
    return ruleSet;
  }

  /**
   * Load all rule sets from a directory
   */
  public async loadRuleSetsFromDirectory(directoryPath: string): Promise<RuleSet[]> {
    const ruleSets = await this.parser.loadRulesFromDirectory(directoryPath);

    for (const ruleSet of ruleSets) {
      this.loadedRuleSets.set(ruleSet.rule_set.name, ruleSet);
    }

    return ruleSets;
  }

  /**
   * Get all loaded rule sets
   */
  public getLoadedRuleSets(): RuleSet[] {
    return Array.from(this.loadedRuleSets.values());
  }

  /**
   * Get a specific rule set by name
   */
  public getRuleSet(name: string): RuleSet | undefined {
    return this.loadedRuleSets.get(name);
  }

  /**
   * Validate a target against a specific rule set
   */
  public validateWithRuleSet(
    ruleSetName: string,
    target: ValidationTarget
  ): ValidationReport | null {
    const ruleSet = this.loadedRuleSets.get(ruleSetName);
    if (!ruleSet) {
      console.warn(`Rule set "${ruleSetName}" not found`);
      return null;
    }

    return this.validateTarget(target, ruleSet);
  }

  /**
   * Validate a target against all loaded rule sets
   */
  public validateWithAllRuleSets(target: ValidationTarget): ValidationReport[] {
    const reports: ValidationReport[] = [];

    for (const ruleSet of this.loadedRuleSets.values()) {
      const report = this.validateTarget(target, ruleSet);
      reports.push(report);
    }

    return reports;
  }

  /**
   * Validate target against a rule set
   */
  public validateTarget(target: ValidationTarget, ruleSet: RuleSet): ValidationReport {
    const allRules = this.extractRulesFromRuleSet(ruleSet);
    const results = this.validator.validateRules(allRules, target);

    return this.generateReport(ruleSet, target, results);
  }

  /**
   * Validate target against specific rules
   */
  public validateWithRules(target: ValidationTarget, rules: Rule[]): RuleValidationResult[] {
    return this.validator.validateRules(rules, target);
  }

  /**
   * Get all rules from categories in a rule set
   */
  private extractRulesFromRuleSet(ruleSet: RuleSet): Rule[] {
    const allRules: Rule[] = [];

    for (const [categoryName, category] of Object.entries(ruleSet.categories)) {
      if (!category.enabled) continue;

      for (const rule of category.rules) {
        if (rule.enabled) {
          // Add category information to rule
          const ruleWithCategory = {
            ...rule,
            category: rule.category || categoryName,
          };
          allRules.push(ruleWithCategory);
        }
      }
    }

    // Sort by priority (higher priority first)
    return allRules.sort((a, b) => (b.priority || 5) - (a.priority || 5));
  }

  /**
   * Generate validation report
   */
  private generateReport(
    ruleSet: RuleSet,
    target: ValidationTarget,
    results: RuleValidationResult[]
  ): ValidationReport {
    const passed = results.filter((r) => r.passed);
    const failed = results.filter((r) => !r.passed);
    const errors = results.filter((r) => !r.passed && r.severity === 'error');
    const warnings = results.filter((r) => !r.passed && r.severity === 'warning');
    const info = results.filter((r) => !r.passed && r.severity === 'info');

    // Calculate overall score (0-100)
    const totalRules = results.length;
    const passedRules = passed.length;

    // Weight score by severity
    let score = 0;
    if (totalRules > 0) {
      const errorWeight = 1.0;
      const warningWeight = 0.5;
      const infoWeight = 0.1;

      const maxPossibleScore = results.reduce((sum, result) => {
        switch (result.severity) {
          case 'error':
            return sum + errorWeight;
          case 'warning':
            return sum + warningWeight;
          case 'info':
            return sum + infoWeight;
          default:
            return sum + warningWeight;
        }
      }, 0);

      const achievedScore = results.reduce((sum, result) => {
        if (!result.passed) return sum;

        switch (result.severity) {
          case 'error':
            return sum + errorWeight;
          case 'warning':
            return sum + warningWeight;
          case 'info':
            return sum + infoWeight;
          default:
            return sum + warningWeight;
        }
      }, 0);

      score = Math.round((achievedScore / maxPossibleScore) * 100);
    }

    const report: ValidationReport = {
      rule_set_name: ruleSet.rule_set.name,
      rule_set_version: ruleSet.rule_set.version,
      validation_date: new Date().toISOString(),
      target_url: target.url,
      total_rules: totalRules,
      passed_rules: passedRules,
      failed_rules: failed.length,
      warning_rules: warnings.length,
      error_rules: errors.length,
      overall_score: score,
      results: results,
      summary: {
        errors: errors,
        warnings: warnings,
        info: info,
      },
    };

    // Validate report structure
    const validationResult = ValidationReportSchema.safeParse(report);
    if (!validationResult.success) {
      console.warn('Generated report validation failed:', validationResult.error);
    }

    return report;
  }

  /**
   * Get validation statistics
   */
  public getValidationStats(reports: ValidationReport[]): {
    totalRules: number;
    totalPassed: number;
    totalFailed: number;
    totalErrors: number;
    totalWarnings: number;
    averageScore: number;
    worstScore: number;
    bestScore: number;
  } {
    if (reports.length === 0) {
      return {
        totalRules: 0,
        totalPassed: 0,
        totalFailed: 0,
        totalErrors: 0,
        totalWarnings: 0,
        averageScore: 0,
        worstScore: 0,
        bestScore: 0,
      };
    }

    const totalRules = reports.reduce((sum, report) => sum + report.total_rules, 0);
    const totalPassed = reports.reduce((sum, report) => sum + report.passed_rules, 0);
    const totalFailed = reports.reduce((sum, report) => sum + report.failed_rules, 0);
    const totalErrors = reports.reduce((sum, report) => sum + report.error_rules, 0);
    const totalWarnings = reports.reduce((sum, report) => sum + report.warning_rules, 0);

    const scores = reports.map((report) => report.overall_score);
    const averageScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    const worstScore = Math.min(...scores);
    const bestScore = Math.max(...scores);

    return {
      totalRules,
      totalPassed,
      totalFailed,
      totalErrors,
      totalWarnings,
      averageScore,
      worstScore,
      bestScore,
    };
  }

  /**
   * Filter results by criteria
   */
  public filterResults(
    results: RuleValidationResult[],
    criteria: {
      severity?: 'error' | 'warning' | 'info';
      passed?: boolean;
      category?: string;
      minPriority?: number;
    }
  ): RuleValidationResult[] {
    return results.filter((result) => {
      if (criteria.severity && result.severity !== criteria.severity) return false;
      if (criteria.passed !== undefined && result.passed !== criteria.passed) return false;
      if (criteria.category && result.category !== criteria.category) return false;
      if (criteria.minPriority !== undefined && result.priority < criteria.minPriority)
        return false;
      return true;
    });
  }

  /**
   * Clear all loaded rule sets
   */
  public clearRuleSets(): void {
    this.loadedRuleSets.clear();
  }

  /**
   * Remove a specific rule set
   */
  public removeRuleSet(name: string): boolean {
    return this.loadedRuleSets.delete(name);
  }
}
