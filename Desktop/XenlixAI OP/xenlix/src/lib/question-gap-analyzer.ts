/**
 * Analyzes question gaps by identifying questions a page answers and discovering
 * popular questions it's missing through People Also Ask (PAA) analysis
 */

import { CheerioAPI } from 'cheerio';

interface QuestionGapAnalysis {
  answeredQuestions: string[];
  missingQuestions: string[];
  analysisMetrics: {
    totalAnsweredQuestions: number;
    totalMissingQuestions: number;
    coveragePercentage: number;
    opportunityScore: number;
  };
}

/**
 * Analyzes question gaps for content optimization opportunities
 * @param $ Cheerio object loaded with the target page's HTML
 * @param primaryKeyword Primary keyword to search for related PAA questions
 * @returns Object containing answered questions, missing questions, and analysis metrics
 */
export async function analyzeQuestionGaps(
  $: CheerioAPI,
  primaryKeyword: string
): Promise<QuestionGapAnalysis> {
  try {
    // Step 1: Identify questions already answered on the page
    const answeredQuestions = identifyAnsweredQuestions($);
    
    // Step 2: Fetch People Also Ask (PAA) questions for the primary keyword
    const paaQuestions = await fetchPAA(primaryKeyword);
    
    // Step 3: Perform gap analysis to find missing questions
    const missingQuestions = findMissingQuestions(answeredQuestions, paaQuestions);
    
    // Step 4: Calculate analysis metrics
    const analysisMetrics = calculateAnalysisMetrics(answeredQuestions, missingQuestions, paaQuestions);
    
    return {
      answeredQuestions,
      missingQuestions,
      analysisMetrics
    };
  } catch (error) {
    console.error('Error analyzing question gaps:', error);
    return {
      answeredQuestions: [],
      missingQuestions: [],
      analysisMetrics: {
        totalAnsweredQuestions: 0,
        totalMissingQuestions: 0,
        coveragePercentage: 0,
        opportunityScore: 0
      }
    };
  }
}

/**
 * Identifies questions/topics already answered on the page
 */
function identifyAnsweredQuestions($: CheerioAPI): string[] {
  const answeredQuestions: string[] = [];
  
  // Extract questions from headings (h2, h3)
  const headings = $('h2, h3').toArray();
  
  for (const heading of headings) {
    const $heading = $(heading);
    const headingText = $heading.text().trim();
    
    // Skip empty or very short headings
    if (!headingText || headingText.length < 5) continue;
    
    // Clean up the heading text
    const cleanedText = cleanHeadingText(headingText);
    
    if (cleanedText) {
      answeredQuestions.push(cleanedText);
    }
  }
  
  // Also check for FAQ sections or structured Q&A content
  const faqQuestions = extractFAQQuestions($);
  answeredQuestions.push(...faqQuestions);
  
  // Remove duplicates and return
  return [...new Set(answeredQuestions)];
}

/**
 * Extracts questions from FAQ sections or structured Q&A content
 */
function extractFAQQuestions($: CheerioAPI): string[] {
  const faqQuestions: string[] = [];
  
  // Look for FAQ sections
  const faqSelectors = [
    '[class*="faq"]',
    '[id*="faq"]',
    '.questions',
    '.q-a',
    '.question-answer',
    'dt', // Definition list terms (often used for FAQs)
    '.accordion-header',
    '.toggle-header'
  ];
  
  for (const selector of faqSelectors) {
    const elements = $(selector).toArray();
    
    for (const element of elements) {
      const $element = $(element);
      const text = $element.text().trim();
      
      // Check if it looks like a question
      if (isQuestionLike(text)) {
        const cleanedText = cleanHeadingText(text);
        if (cleanedText) {
          faqQuestions.push(cleanedText);
        }
      }
    }
  }
  
  return faqQuestions;
}

/**
 * Mock function to fetch People Also Ask (PAA) questions
 * In production, this would be replaced with real search API calls
 */
async function fetchPAA(primaryKeyword: string): Promise<string[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Mock PAA questions based on common topics
  const paaQuestions = generateMockPAAQuestions(primaryKeyword);
  
  return paaQuestions;
}

/**
 * Generates mock PAA questions based on the primary keyword
 * This simulates what a real search API would return
 */
function generateMockPAAQuestions(keyword: string): string[] {
  const lowerKeyword = keyword.toLowerCase();
  
  // Common question patterns for different topics
  const questionTemplates = {
    // AEO/SEO related
    aeo: [
      'What are the best AEO tools?',
      'How do you optimize for Google SGE?',
      'Does voice search use AEO?',
      'What is the difference between AEO and traditional SEO?',
      'How to measure AEO success?',
      'What are AEO best practices?',
      'How long does AEO take to work?',
      'Is AEO worth the investment?',
      'What are common AEO mistakes?',
      'How to get started with AEO?'
    ],
    
    // Marketing related
    marketing: [
      'What are the best marketing tools?',
      'How to create a marketing strategy?',
      'What is digital marketing ROI?',
      'How to measure marketing success?',
      'What are marketing automation benefits?',
      'How to target the right audience?',
      'What is content marketing strategy?',
      'How to improve conversion rates?',
      'What are social media best practices?',
      'How to create engaging content?'
    ],
    
    // Business related
    business: [
      'How to start a business?',
      'What are business growth strategies?',
      'How to improve business efficiency?',
      'What is business process optimization?',
      'How to increase revenue?',
      'What are key business metrics?',
      'How to scale a business?',
      'What is competitive analysis?',
      'How to manage business finances?',
      'What are leadership best practices?'
    ],
    
    // Technology related
    technology: [
      'What are the latest technology trends?',
      'How to implement new technology?',
      'What is digital transformation?',
      'How to improve cybersecurity?',
      'What are cloud computing benefits?',
      'How to choose the right software?',
      'What is artificial intelligence?',
      'How to automate business processes?',
      'What are data analytics tools?',
      'How to optimize system performance?'
    ]
  };
  
  // Determine which category the keyword falls into
  let relevantQuestions: string[] = [];
  
  if (lowerKeyword.includes('aeo') || lowerKeyword.includes('seo') || lowerKeyword.includes('optimization')) {
    relevantQuestions = questionTemplates.aeo;
  } else if (lowerKeyword.includes('marketing') || lowerKeyword.includes('advertising')) {
    relevantQuestions = questionTemplates.marketing;
  } else if (lowerKeyword.includes('business') || lowerKeyword.includes('company')) {
    relevantQuestions = questionTemplates.business;
  } else if (lowerKeyword.includes('tech') || lowerKeyword.includes('software') || lowerKeyword.includes('digital')) {
    relevantQuestions = questionTemplates.technology;
  } else {
    // Default to a mix of general questions
    relevantQuestions = [
      ...questionTemplates.aeo.slice(0, 3),
      ...questionTemplates.marketing.slice(0, 3),
      ...questionTemplates.business.slice(0, 2),
      ...questionTemplates.technology.slice(0, 2)
    ];
  }
  
  // Add some keyword-specific questions
  const keywordSpecificQuestions = [
    `What is ${keyword}?`,
    `How does ${keyword} work?`,
    `What are ${keyword} benefits?`,
    `How to implement ${keyword}?`,
    `What are ${keyword} best practices?`,
    `How much does ${keyword} cost?`,
    `What are ${keyword} alternatives?`,
    `How to get started with ${keyword}?`
  ];
  
  // Combine and shuffle questions
  const allQuestions = [...relevantQuestions, ...keywordSpecificQuestions];
  const shuffledQuestions = shuffleArray(allQuestions);
  
  // Return a realistic number of PAA questions (typically 8-12)
  return shuffledQuestions.slice(0, 10);
}

/**
 * Finds questions that are missing from the current page content
 */
function findMissingQuestions(answeredQuestions: string[], paaQuestions: string[]): string[] {
  const missingQuestions: string[] = [];
  
  for (const paaQuestion of paaQuestions) {
    const hasMatch = answeredQuestions.some(answered => 
      areQuestionsRelated(answered, paaQuestion)
    );
    
    if (!hasMatch) {
      missingQuestions.push(paaQuestion);
    }
  }
  
  return missingQuestions;
}

/**
 * Determines if two questions are related/similar enough to be considered covered
 */
function areQuestionsRelated(question1: string, question2: string): boolean {
  const q1Lower = question1.toLowerCase();
  const q2Lower = question2.toLowerCase();
  
  // Extract keywords from both questions
  const q1Keywords = extractKeywords(q1Lower);
  const q2Keywords = extractKeywords(q2Lower);
  
  // Calculate keyword overlap
  const commonKeywords = q1Keywords.filter(keyword => 
    q2Keywords.some(q2Keyword => 
      q2Keyword.includes(keyword) || keyword.includes(q2Keyword)
    )
  );
  
  // Consider questions related if they share at least 2 meaningful keywords
  // or if one question's keywords are substantially covered by the other
  const overlapRatio = commonKeywords.length / Math.min(q1Keywords.length, q2Keywords.length);
  
  return overlapRatio >= 0.4 || commonKeywords.length >= 2;
}

/**
 * Extracts meaningful keywords from a question
 */
function extractKeywords(question: string): string[] {
  // Remove common question words and stop words
  const stopWords = new Set([
    'what', 'how', 'why', 'when', 'where', 'who', 'which', 'can', 'is', 'are', 
    'do', 'does', 'will', 'would', 'should', 'could', 'the', 'a', 'an', 'and', 
    'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
    'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above',
    'below', 'between', 'among', 'across', 'against', 'toward', 'towards'
  ]);
  
  const words = question
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/)
    .map(word => word.toLowerCase())
    .filter(word => word.length > 2 && !stopWords.has(word));
  
  return words;
}

/**
 * Cleans and normalizes heading text
 */
function cleanHeadingText(text: string): string {
  return text
    .replace(/^\d+\.\s*/, '') // Remove numbering (1. 2. etc.)
    .replace(/^[-•*]\s*/, '') // Remove bullet points
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Determines if text looks like a question
 */
function isQuestionLike(text: string): boolean {
  const lowerText = text.toLowerCase();
  
  // Direct question indicators
  if (lowerText.includes('?')) return true;
  
  // Question word starters
  const questionWords = ['what', 'how', 'why', 'when', 'where', 'who', 'which', 'can', 'is', 'are', 'do', 'does', 'will', 'would', 'should'];
  const startsWithQuestion = questionWords.some(word => lowerText.startsWith(word + ' '));
  
  return startsWithQuestion;
}

/**
 * Calculates analysis metrics for the question gap analysis
 */
function calculateAnalysisMetrics(
  answeredQuestions: string[],
  missingQuestions: string[],
  totalPAAQuestions: string[]
): QuestionGapAnalysis['analysisMetrics'] {
  const totalAnswered = answeredQuestions.length;
  const totalMissing = missingQuestions.length;
  const totalPAA = totalPAAQuestions.length;
  
  // Coverage percentage: how many PAA questions are already covered
  const coveragePercentage = totalPAA > 0 ? Math.round(((totalPAA - totalMissing) / totalPAA) * 100) : 0;
  
  // Opportunity score: weighted score based on missing questions and current coverage
  // Higher score means more opportunity for improvement
  const opportunityScore = Math.min(100, Math.round(
    (totalMissing * 10) + // Base score from missing questions
    (totalMissing > totalAnswered ? 20 : 0) + // Bonus if more missing than answered
    (coveragePercentage < 50 ? 15 : 0) // Bonus for low coverage
  ));
  
  return {
    totalAnsweredQuestions: totalAnswered,
    totalMissingQuestions: totalMissing,
    coveragePercentage,
    opportunityScore
  };
}

/**
 * Shuffles an array randomly
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Export individual functions for testing
export {
  identifyAnsweredQuestions,
  findMissingQuestions,
  areQuestionsRelated,
  extractKeywords,
  generateMockPAAQuestions
};