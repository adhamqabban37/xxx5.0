/**
 * Automatically generates JSON-LD schema for FAQPage or Article based on crawled HTML content
 * Prioritizes FAQPage detection, falls back to Article schema
 */

import { CheerioAPI } from 'cheerio';

interface QuestionAnswer {
  question: string;
  answer: string;
}

interface FAQPageSchema {
  '@context': string;
  '@type': 'FAQPage';
  mainEntity: Array<{
    '@type': 'Question';
    name: string;
    acceptedAnswer: {
      '@type': 'Answer';
      text: string;
    };
  }>;
}

interface ArticleSchema {
  '@context': string;
  '@type': 'Article';
  headline: string;
  author?: {
    '@type': 'Person';
    name: string;
  };
  datePublished?: string;
  description?: string;
}

/**
 * Generates schema markup for a webpage based on its content
 * @param $ Cheerio object loaded with the target page's HTML
 * @param nlp Compromise NLP object for text analysis
 * @returns FAQPage schema, Article schema, or null if neither can be determined
 */
export async function generateSchema(
  $: CheerioAPI,
  nlp: any
): Promise<FAQPageSchema | ArticleSchema | null> {
  try {
    // First, try to detect FAQPage schema
    const faqSchema = await detectFAQPage($, nlp);
    if (faqSchema) {
      return faqSchema;
    }

    // Fallback to Article schema
    const articleSchema = await detectArticle($, nlp);
    if (articleSchema) {
      return articleSchema;
    }

    return null;
  } catch (error) {
    console.error('Error generating schema:', error);
    return null;
  }
}

/**
 * Detects and generates FAQPage schema from HTML content
 */
async function detectFAQPage($: CheerioAPI, nlp: any): Promise<FAQPageSchema | null> {
  const questionAnswerPairs: QuestionAnswer[] = [];
  
  // Look for FAQ patterns in h2 and h3 tags
  const headings = $('h2, h3').toArray();
  
  for (const heading of headings) {
    const $heading = $(heading);
    const headingText = $heading.text().trim();
    
    // Skip if heading is empty or too short
    if (!headingText || headingText.length < 10) continue;
    
    // Check if heading looks like a question
    const isQuestion = isQuestionLike(headingText, nlp);
    
    if (isQuestion) {
      // Look for the answer in the next sibling element
      const nextElement = $heading.next();
      
      if (nextElement.is('p, div, ul, ol')) {
        const answerText = nextElement.text().trim();
        
        // Validate answer content
        if (answerText && answerText.length >= 20 && answerText.length <= 1000) {
          questionAnswerPairs.push({
            question: cleanText(headingText),
            answer: cleanText(answerText)
          });
        }
      }
    }
  }
  
  // Also check for explicit FAQ sections
  const faqSections = $('[class*="faq"], [id*="faq"], .questions, .q-a').toArray();
  
  for (const section of faqSections) {
    const $section = $(section);
    const sectionPairs = extractQAFromSection($section, $, nlp);
    questionAnswerPairs.push(...sectionPairs);
  }
  
  // Remove duplicates based on question similarity
  const uniquePairs = removeDuplicateQuestions(questionAnswerPairs, nlp);
  
  // Need at least 2 Q&A pairs for FAQPage schema
  if (uniquePairs.length >= 2) {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: uniquePairs.map(pair => ({
        '@type': 'Question',
        name: pair.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: pair.answer
        }
      }))
    };
  }
  
  return null;
}

/**
 * Detects and generates Article schema from HTML content
 */
async function detectArticle($: CheerioAPI, nlp: any): Promise<ArticleSchema | null> {
  // Get headline from h1 tag
  const headline = $('h1').first().text().trim();
  
  if (!headline || headline.length < 10) {
    return null;
  }
  
  const schema: ArticleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: cleanText(headline)
  };
  
  // Try to find author information
  const author = findAuthor($);
  if (author) {
    schema.author = {
      '@type': 'Person',
      name: author
    };
  }
  
  // Try to find publication date
  const datePublished = findPublicationDate($);
  if (datePublished) {
    schema.datePublished = datePublished;
  }
  
  // Generate description from first paragraph or meta description
  const description = findDescription($);
  if (description) {
    schema.description = description;
  }
  
  return schema;
}

/**
 * Determines if text looks like a question using various heuristics
 */
function isQuestionLike(text: string, nlp: any): boolean {
  const lowerText = text.toLowerCase();
  
  // Direct question indicators
  if (lowerText.includes('?')) return true;
  
  // Question word starters
  const questionWords = ['what', 'how', 'why', 'when', 'where', 'who', 'which', 'can', 'is', 'are', 'do', 'does', 'will', 'would', 'should'];
  const startsWithQuestion = questionWords.some(word => lowerText.startsWith(word + ' '));
  
  if (startsWithQuestion) return true;
  
  // Use NLP to detect interrogative sentences
  try {
    const doc = nlp(text);
    const questions = doc.questions();
    return questions.length > 0;
  } catch (error) {
    // Fallback if NLP fails
    return false;
  }
}

/**
 * Extracts Q&A pairs from a specific FAQ section
 */
function extractQAFromSection($section: any, $: CheerioAPI, nlp: any): QuestionAnswer[] {
  const pairs: QuestionAnswer[] = [];
  
  // Look for various FAQ patterns within the section
  const items = $section.find('dt, .question, [class*="question"], h3, h4, h5, h6').toArray();
  
  for (const item of items) {
    const $item = $(item);
    const questionText = $item.text().trim();
    
    if (isQuestionLike(questionText, nlp)) {
      let answerText = '';
      
      // Look for answer in next sibling or specific selectors
      const nextSibling = $item.next();
      if (nextSibling.is('dd, .answer, [class*="answer"], p, div')) {
        answerText = nextSibling.text().trim();
      } else {
        // Try to find answer within the same parent
        const answerElement = $item.parent().find('.answer, [class*="answer"]').first();
        if (answerElement.length) {
          answerText = answerElement.text().trim();
        }
      }
      
      if (answerText && answerText.length >= 20) {
        pairs.push({
          question: cleanText(questionText),
          answer: cleanText(answerText)
        });
      }
    }
  }
  
  return pairs;
}

/**
 * Removes duplicate questions based on similarity
 */
function removeDuplicateQuestions(pairs: QuestionAnswer[], nlp: any): QuestionAnswer[] {
  const uniquePairs: QuestionAnswer[] = [];
  
  for (const pair of pairs) {
    const isDuplicate = uniquePairs.some(existing => {
      // Simple similarity check based on word overlap
      const similarity = calculateTextSimilarity(pair.question, existing.question, nlp);
      return similarity > 0.8; // 80% similarity threshold
    });
    
    if (!isDuplicate) {
      uniquePairs.push(pair);
    }
  }
  
  return uniquePairs;
}

/**
 * Calculates similarity between two text strings
 */
function calculateTextSimilarity(text1: string, text2: string, nlp: any): number {
  try {
    const doc1 = nlp(text1.toLowerCase());
    const doc2 = nlp(text2.toLowerCase());
    
    const words1: string[] = doc1.terms().out('array');
    const words2: string[] = doc2.terms().out('array');
    
    const intersection = words1.filter((word: string) => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length;
  } catch (error) {
    // Fallback to simple string comparison
    return text1.toLowerCase() === text2.toLowerCase() ? 1 : 0;
  }
}

/**
 * Finds author information from the page
 */
function findAuthor($: CheerioAPI): string | null {
  // Look for common author patterns
  const authorSelectors = [
    '.author-name',
    '.author',
    '.byline',
    '[rel="author"]',
    '.post-author',
    '.article-author'
  ];
  
  for (const selector of authorSelectors) {
    const authorElement = $(selector).first();
    if (authorElement.length) {
      const authorText = authorElement.text().trim();
      if (authorText && authorText.length < 100) {
        return cleanText(authorText);
      }
    }
  }
  
  // Look for "By [Author Name]" pattern in text
  const bodyText = $('body').text();
  const byAuthorMatch = bodyText.match(/by\s+([a-zA-Z\s]+)/i);
  if (byAuthorMatch && byAuthorMatch[1] && byAuthorMatch[1].trim().length < 50) {
    return cleanText(byAuthorMatch[1].trim());
  }
  
  return null;
}

/**
 * Finds publication date from the page
 */
function findPublicationDate($: CheerioAPI): string | null {
  // Look for time elements
  const timeElement = $('time[datetime]').first();
  if (timeElement.length) {
    const datetime = timeElement.attr('datetime');
    if (datetime) {
      return datetime;
    }
  }
  
  // Look for date patterns in meta tags
  const dateMetaSelectors = [
    'meta[property="article:published_time"]',
    'meta[name="date"]',
    'meta[name="publish-date"]',
    'meta[property="datePublished"]'
  ];
  
  for (const selector of dateMetaSelectors) {
    const metaElement = $(selector).first();
    if (metaElement.length) {
      const content = metaElement.attr('content');
      if (content) {
        return content;
      }
    }
  }
  
  // Look for date patterns in text
  const bodyText = $('body').text();
  const dateRegex = /(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\w+ \d{1,2}, \d{4})/;
  const dateMatch = bodyText.match(dateRegex);
  if (dateMatch) {
    return formatDate(dateMatch[1]);
  }
  
  return null;
}

/**
 * Finds description for the article
 */
function findDescription($: CheerioAPI): string | null {
  // Try meta description first
  const metaDescription = $('meta[name="description"]').attr('content');
  if (metaDescription && metaDescription.trim().length > 20) {
    return cleanText(metaDescription.trim());
  }
  
  // Try first paragraph
  const firstParagraph = $('p').first().text().trim();
  if (firstParagraph && firstParagraph.length >= 50 && firstParagraph.length <= 300) {
    return cleanText(firstParagraph);
  }
  
  return null;
}

/**
 * Formats date string to ISO format
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
    }
  } catch (error) {
    // Return original string if parsing fails
  }
  
  return dateString;
}

/**
 * Cleans text by removing extra whitespace and normalizing
 */
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .replace(/[^\w\s\?\!\.\,\-\:\'\"]/g, '') // Remove special characters except basic punctuation
    .trim();
}