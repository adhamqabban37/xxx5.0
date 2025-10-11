import * as cheerio from 'cheerio';

export interface JsonLdBlock {
  type: string | string[];
  context?: string;
  data: any;
  valid: boolean;
  parseError?: string;
}

export interface SchemaExtraction {
  jsonLdBlocks: JsonLdBlock[];
  hasMicrodata: boolean;
  detectedTypes: string[];
  totalBlocks: number;
}

/**
 * Extract all JSON-LD blocks from HTML content
 */
export function extractJsonLdBlocks($: cheerio.CheerioAPI): JsonLdBlock[] {
  const blocks: JsonLdBlock[] = [];

  $('script[type="application/ld+json"]').each((_, element) => {
    const content = $(element).html();
    if (!content?.trim()) return;

    try {
      const parsed = JSON.parse(content);
      const normalized = Array.isArray(parsed) ? parsed : [parsed];

      for (const item of normalized) {
        if (!item || typeof item !== 'object') continue;

        const type = item['@type'];
        const context = item['@context'];

        blocks.push({
          type: type || 'Unknown',
          context: typeof context === 'string' ? context : undefined,
          data: item,
          valid: true,
        });
      }
    } catch (error) {
      blocks.push({
        type: 'Invalid',
        data: content,
        valid: false,
        parseError: error instanceof Error ? error.message : 'Parse error',
      });
    }
  });

  return blocks;
}

/**
 * Detect microdata attributes in HTML
 */
export function detectMicrodata($: cheerio.CheerioAPI): boolean {
  // Check for microdata attributes
  const microdataSelectors = ['[itemscope]', '[itemtype]', '[itemprop]', '[itemref]', '[itemid]'];

  for (const selector of microdataSelectors) {
    if ($(selector).length > 0) {
      return true;
    }
  }

  return false;
}

/**
 * Extract unique schema types from JSON-LD blocks
 */
export function extractSchemaTypes(blocks: JsonLdBlock[]): string[] {
  const types = new Set<string>();

  for (const block of blocks) {
    if (!block.valid) continue;

    if (Array.isArray(block.type)) {
      block.type.forEach((t) => types.add(t));
    } else if (typeof block.type === 'string') {
      types.add(block.type);
    }
  }

  return Array.from(types).sort();
}

/**
 * Main extraction function
 */
export function extractSchemaData($: cheerio.CheerioAPI): SchemaExtraction {
  const jsonLdBlocks = extractJsonLdBlocks($);
  const hasMicrodata = detectMicrodata($);
  const detectedTypes = extractSchemaTypes(jsonLdBlocks);

  return {
    jsonLdBlocks,
    hasMicrodata,
    detectedTypes,
    totalBlocks: jsonLdBlocks.length,
  };
}
