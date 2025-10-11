/**
 * Example usage of the generateSchema function
 * This shows how to use the content schema analyzer in different contexts
 */

import * as cheerio from 'cheerio';
import nlp from 'compromise';
import { generateSchema } from '@/lib/content-schema-analyzer';

/**
 * Example 1: Analyzing a webpage for FAQ schema
 */
export async function exampleFAQAnalysis() {
  // Sample HTML content with FAQ structure
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>AEO Optimization Guide</title>
      <meta name="description" content="Learn about AI Engine Optimization">
    </head>
    <body>
      <h1>Complete Guide to AEO Optimization</h1>
      
      <h2>What is AEO?</h2>
      <p>AEO stands for AI Engine Optimization. It is the process of optimizing web content to be found and favored by AI-powered search engines like ChatGPT, Claude, and Perplexity.</p>
      
      <h2>How is AEO different from SEO?</h2>
      <p>While SEO focuses on traditional search engines like Google, AEO focuses more on conversational queries, structured data, and demonstrating expertise for AI summarization and response generation.</p>
      
      <h2>Why is AEO important for businesses?</h2>
      <p>As AI-powered search becomes more prevalent, businesses need to ensure their content is optimized for AI engines to maintain visibility and drive traffic in the evolving search landscape.</p>
      
      <h2>How do I get started with AEO?</h2>
      <p>Start by analyzing your current content structure, implementing proper schema markup, creating conversational content, and focusing on question-answer formats that AI engines prefer.</p>
    </body>
    </html>
  `;

  const $ = cheerio.load(htmlContent);
  const schema = await generateSchema($, nlp);

  console.log('Generated FAQ Schema:', JSON.stringify(schema, null, 2));
  return schema;
}

/**
 * Example 2: Analyzing a blog article for Article schema
 */
export async function exampleArticleAnalysis() {
  // Sample HTML content with article structure
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>The Future of AI in Content Marketing</title>
      <meta name="description" content="Explore how AI is transforming content marketing">
      <meta property="article:published_time" content="2025-09-20T10:00:00Z">
    </head>
    <body>
      <h1>The Future of AI in Content Marketing</h1>
      <div class="author-name">By Sarah Johnson</div>
      <time datetime="2025-09-20">September 20, 2025</time>
      
      <p>Artificial intelligence is revolutionizing the way businesses approach content marketing. From automated content generation to personalized user experiences, AI tools are becoming indispensable for modern marketers.</p>
      
      <h2>AI Content Generation Tools</h2>
      <p>Modern AI writing assistants can help create high-quality content at scale while maintaining brand voice and messaging consistency.</p>
      
      <h2>Personalization at Scale</h2>
      <p>AI enables marketers to deliver personalized content experiences to thousands of users simultaneously, improving engagement and conversion rates.</p>
    </body>
    </html>
  `;

  const $ = cheerio.load(htmlContent);
  const schema = await generateSchema($, nlp);

  console.log('Generated Article Schema:', JSON.stringify(schema, null, 2));
  return schema;
}

/**
 * Example 3: Real-world usage in an API route
 */
export async function analyzeUrlForSchema(url: string) {
  try {
    // In a real implementation, you would fetch the URL content
    // const response = await fetch(url);
    // const html = await response.text();

    // For this example, we'll use sample content
    const html = `<html><body><h1>Sample Page</h1><p>Sample content</p></body></html>`;

    const $ = cheerio.load(html);
    const schema = await generateSchema($, nlp);

    return {
      url,
      schema: schema
        ? {
            type: schema['@type'],
            data: schema,
          }
        : null,
      success: true,
    };
  } catch (error) {
    console.error('Error analyzing URL for schema:', error);
    return {
      url,
      schema: null,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Example 4: Testing the function with edge cases
 */
export async function testEdgeCases() {
  const testCases = [
    {
      name: 'Empty content',
      html: '<html><body></body></html>',
    },
    {
      name: 'Only headings, no content',
      html: '<html><body><h1>Title</h1><h2>Subtitle</h2></body></html>',
    },
    {
      name: 'Mixed content',
      html: `
        <html>
        <body>
          <h1>Mixed Content Page</h1>
          <h2>What is this?</h2>
          <p>This is a test question.</p>
          <h3>Some other heading</h3>
          <p>Regular paragraph content here.</p>
        </body>
        </html>
      `,
    },
  ];

  const results = [];

  for (const testCase of testCases) {
    const $ = cheerio.load(testCase.html);
    const schema = await generateSchema($, nlp);

    results.push({
      testCase: testCase.name,
      schema,
      hasSchema: !!schema,
      schemaType: schema ? schema['@type'] : null,
    });
  }

  console.log('Edge case test results:', results);
  return results;
}

// Export all examples for easy testing
export const examples = {
  faq: exampleFAQAnalysis,
  article: exampleArticleAnalysis,
  url: analyzeUrlForSchema,
  edgeCases: testEdgeCases,
};
