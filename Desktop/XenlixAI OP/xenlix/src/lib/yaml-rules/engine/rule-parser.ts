import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import { RuleSetSchema, type RuleSet } from '../schemas/rule-schema';

export class YAMLRuleParser {
  private static instance: YAMLRuleParser;

  private constructor() {}

  public static getInstance(): YAMLRuleParser {
    if (!YAMLRuleParser.instance) {
      YAMLRuleParser.instance = new YAMLRuleParser();
    }
    return YAMLRuleParser.instance;
  }

  /**
   * Parse a YAML rule file from file system
   */
  public async parseRuleFile(filePath: string): Promise<RuleSet> {
    try {
      const absolutePath = path.resolve(filePath);

      if (!fs.existsSync(absolutePath)) {
        throw new Error(`Rule file not found: ${absolutePath}`);
      }

      const fileContent = fs.readFileSync(absolutePath, 'utf8');
      return this.parseRuleContent(fileContent, filePath);
    } catch (error) {
      throw new Error(`Failed to parse rule file ${filePath}: ${error}`);
    }
  }

  /**
   * Parse YAML rule content from string
   */
  public parseRuleContent(content: string, source = 'string'): RuleSet {
    try {
      // Parse YAML content
      const yamlData = yaml.load(content) as unknown;

      // Validate against schema
      const validationResult = RuleSetSchema.safeParse(yamlData);

      if (!validationResult.success) {
        const errors = validationResult.error.errors
          .map((err) => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        throw new Error(`Schema validation failed: ${errors}`);
      }

      return validationResult.data;
    } catch (error) {
      if (error instanceof yaml.YAMLException) {
        throw new Error(`YAML parsing error in ${source}: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Load multiple rule files from directory
   */
  public async loadRulesFromDirectory(directoryPath: string): Promise<RuleSet[]> {
    try {
      const absolutePath = path.resolve(directoryPath);

      if (!fs.existsSync(absolutePath)) {
        throw new Error(`Rules directory not found: ${absolutePath}`);
      }

      const files = fs
        .readdirSync(absolutePath)
        .filter((file) => file.endsWith('.yaml') || file.endsWith('.yml'))
        .map((file) => path.join(absolutePath, file));

      const ruleSets: RuleSet[] = [];

      for (const filePath of files) {
        try {
          const ruleSet = await this.parseRuleFile(filePath);
          ruleSets.push(ruleSet);
        } catch (error) {
          console.warn(`Failed to load rule file ${filePath}:`, error);
          // Continue loading other files
        }
      }

      return ruleSets;
    } catch (error) {
      throw new Error(`Failed to load rules from directory ${directoryPath}: ${error}`);
    }
  }

  /**
   * Validate rule set structure without full parsing
   */
  public validateRuleStructure(content: string): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Parse YAML
      const yamlData = yaml.load(content) as Record<string, unknown>;

      // Basic structure checks
      if (!yamlData.rule_set) {
        errors.push('Missing required "rule_set" section');
      } else {
        const ruleSet = yamlData.rule_set as Record<string, unknown>;
        if (!ruleSet.name) {
          errors.push('Missing required "rule_set.name"');
        }
        if (!ruleSet.version) {
          errors.push('Missing required "rule_set.version"');
        }
      }

      if (!yamlData.categories) {
        errors.push('Missing required "categories" section');
      } else {
        const categories = yamlData.categories as Record<string, unknown>;
        const categoryCount = Object.keys(categories).length;
        if (categoryCount === 0) {
          warnings.push('No categories defined');
        }

        // Check each category
        for (const [categoryName, category] of Object.entries(categories)) {
          if (!category || typeof category !== 'object') {
            errors.push(`Invalid category structure: ${categoryName}`);
            continue;
          }

          const cat = category as Record<string, unknown>;
          if (!cat.rules || !Array.isArray(cat.rules)) {
            errors.push(`Category "${categoryName}" missing rules array`);
            continue;
          }

          if (cat.rules.length === 0) {
            warnings.push(`Category "${categoryName}" has no rules`);
          }

          // Check each rule
          cat.rules.forEach((rule: unknown, index: number) => {
            const ruleObj = rule as Record<string, unknown>;
            const ruleId = ruleObj.id || `rule-${index}`;

            if (!ruleObj.id) {
              errors.push(`Rule in category "${categoryName}" missing id`);
            }
            if (!ruleObj.name) {
              errors.push(`Rule "${ruleId}" missing name`);
            }
            if (!ruleObj.condition) {
              errors.push(`Rule "${ruleId}" missing condition`);
            }
            if (!ruleObj.severity) {
              warnings.push(`Rule "${ruleId}" missing severity, defaulting to 'warning'`);
            }
          });
        }
      } // Try full schema validation
      const validationResult = RuleSetSchema.safeParse(yamlData);
      if (!validationResult.success) {
        validationResult.error.errors.forEach((err) => {
          errors.push(`Schema validation: ${err.path.join('.')}: ${err.message}`);
        });
      }
    } catch (error) {
      if (error instanceof yaml.YAMLException) {
        errors.push(`YAML syntax error: ${error.message}`);
      } else {
        errors.push(`Validation error: ${error}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get available rule files in the default rules directory
   */
  public getAvailableRuleFiles(): string[] {
    const rulesDir = path.join(process.cwd(), 'src', 'lib', 'yaml-rules', 'rules');

    if (!fs.existsSync(rulesDir)) {
      return [];
    }

    return fs
      .readdirSync(rulesDir)
      .filter((file) => file.endsWith('.yaml') || file.endsWith('.yml'))
      .map((file) => path.join(rulesDir, file));
  }

  /**
   * Generate a template rule set
   */
  public generateTemplate(name: string, industry?: string): string {
    const template = {
      rule_set: {
        name: name,
        version: '1.0.0',
        description: `Custom rules for ${name}`,
        industry: industry || 'general',
        created_at: new Date().toISOString(),
      },
      categories: {
        seo_basics: {
          name: 'SEO Basics',
          description: 'Fundamental SEO validation rules',
          rules: [
            {
              id: 'title_length',
              name: 'Title Length Validation',
              description: 'Ensures page title is within optimal length',
              severity: 'error',
              condition: {
                type: 'length_range',
                target: 'page.title',
                min: 30,
                max: 60,
              },
              message: 'Page title should be between 30-60 characters',
              priority: 9,
            },
            {
              id: 'meta_description',
              name: 'Meta Description Required',
              description: 'Ensures meta description is present and properly sized',
              severity: 'warning',
              condition: {
                type: 'required_and_length',
                target: 'page.meta_description',
                required: true,
                max: 160,
              },
              message: 'Meta description is required and should be under 160 characters',
              priority: 8,
            },
          ],
        },
      },
    };

    return yaml.dump(template, {
      indent: 2,
      lineWidth: 120,
      noRefs: true,
    });
  }
}
