import { NextRequest, NextResponse } from 'next/server';
import { RuleEngine, type ValidationTarget } from '@/lib/yaml-rules';
import path from 'path';

// Initialize rule engine with default rules
const ruleEngine = new RuleEngine();
let rulesLoaded = false;

async function ensureRulesLoaded() {
  if (!rulesLoaded) {
    try {
      const rulesPath = path.join(process.cwd(), 'src', 'lib', 'yaml-rules', 'rules');
      await ruleEngine.loadRuleSetsFromDirectory(rulesPath);
      rulesLoaded = true;
      console.log('YAML Rules loaded successfully');
    } catch (error) {
      console.error('Failed to load YAML rules:', error);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureRulesLoaded();

    const body = await request.json();
    const { target, ruleSetName } = body;

    // Validate required fields
    if (!target || !target.url) {
      return NextResponse.json({ error: 'Missing required field: target.url' }, { status: 400 });
    }

    // Create validation target with defaults
    const validationTarget: ValidationTarget = {
      url: target.url,
      page: {
        title: target.page?.title,
        meta_description: target.page?.meta_description,
        h1: target.page?.h1 || [],
        h2: target.page?.h2 || [],
        h3: target.page?.h3 || [],
        content: target.page?.content,
        word_count: target.page?.word_count,
        images: target.page?.images || [],
        links: target.page?.links || [],
      },
      technical: {
        status_code: target.technical?.status_code,
        response_time: target.technical?.response_time,
        page_size: target.technical?.page_size,
        lighthouse_scores: target.technical?.lighthouse_scores,
      },
      schema: {
        structured_data: target.schema?.structured_data || [],
        canonical_url: target.schema?.canonical_url,
        og_tags: target.schema?.og_tags || {},
        twitter_tags: target.schema?.twitter_tags || {},
      },
    };

    let reports;

    if (ruleSetName) {
      // Validate with specific rule set
      const report = ruleEngine.validateWithRuleSet(ruleSetName, validationTarget);
      if (!report) {
        return NextResponse.json({ error: `Rule set "${ruleSetName}" not found` }, { status: 404 });
      }
      reports = [report];
    } else {
      // Validate with all loaded rule sets
      reports = ruleEngine.validateWithAllRuleSets(validationTarget);
    }

    // Get validation statistics
    const stats = ruleEngine.getValidationStats(reports);

    return NextResponse.json({
      success: true,
      data: {
        reports,
        statistics: stats,
        target_url: validationTarget.url,
        validation_date: new Date().toISOString(),
        rule_sets_used: reports.map((r) => r.rule_set_name),
      },
    });
  } catch (error) {
    console.error('YAML Rules validation error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await ensureRulesLoaded();

    const loadedRuleSets = ruleEngine.getLoadedRuleSets();

    const ruleSetInfo = loadedRuleSets.map((ruleSet) => ({
      name: ruleSet.rule_set.name,
      version: ruleSet.rule_set.version,
      description: ruleSet.rule_set.description,
      industry: ruleSet.rule_set.industry,
      categories: Object.keys(ruleSet.categories),
      total_rules: Object.values(ruleSet.categories).reduce(
        (sum, category) => sum + category.rules.length,
        0
      ),
    }));

    return NextResponse.json({
      message: 'YAML Rules Engine API',
      available_rule_sets: ruleSetInfo,
      endpoints: {
        validate: 'POST /api/yaml-rules/validate',
        info: 'GET /api/yaml-rules/validate',
      },
      example_request: {
        target: {
          url: 'https://example.com',
          page: {
            title: 'Example Page Title',
            meta_description: 'This is an example meta description',
            h1: ['Main Heading'],
            h2: ['Subheading 1', 'Subheading 2'],
            content: 'Page content here...',
            word_count: 300,
            images: [{ src: '/image.jpg', alt: 'Example image' }],
          },
          technical: {
            status_code: 200,
            response_time: 150,
            lighthouse_scores: {
              performance: 85,
              accessibility: 92,
              best_practices: 88,
              seo: 91,
            },
          },
          schema: {
            canonical_url: 'https://example.com/page',
            og_tags: {
              title: 'Example Page',
            },
          },
        },
        ruleSetName: 'SEO Validation Rules', // Optional - omit to use all rule sets
      },
    });
  } catch (error) {
    console.error('Failed to load rule engine information:', error);
    return NextResponse.json({ error: 'Failed to load rule engine information' }, { status: 500 });
  }
}
