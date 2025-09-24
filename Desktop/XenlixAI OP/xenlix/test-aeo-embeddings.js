#!/usr/bin/env node

/**
 * Comprehensive AEO Embedding Pipeline Test
 * Demonstrates real HuggingFace embeddings with sample URL + queries
 * Shows similarity matrices and cosine scores
 */

const { performance } = require('perf_hooks');

// Test configuration
const SAMPLE_URL = 'https://example-business.com';
const TEST_QUERIES = [
  'What are your business hours?',
  'How can I contact customer support?',
  'What services do you offer?',
  'Where are you located?',
  'Do you offer free consultations?'
];

const AEO_API_BASE = 'http://localhost:3000/api';
const HEALTH_ENDPOINT = `${AEO_API_BASE}/health`;
const AEO_SCORE_ENDPOINT = `${AEO_API_BASE}/aeo-score`;

/**
 * Test utilities
 */
class TestRunner {
  constructor() {
    this.results = {
      healthCheck: null,
      aeoAnalysis: null,
      errors: [],
      performance: {},
      validation: {}
    };
  }

  log(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
    if (data && typeof data === 'object') {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  error(message, error = null) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR: ${message}`);
    if (error) {
      console.error(error);
      this.results.errors.push({
        message,
        error: error.message || error,
        timestamp
      });
    }
  }

  async makeRequest(url, options = {}) {
    const startTime = performance.now();
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });
      
      const responseTime = Math.round(performance.now() - startTime);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return { data, responseTime, status: response.status };
      
    } catch (error) {
      const responseTime = Math.round(performance.now() - startTime);
      throw { error, responseTime };
    }
  }

  /**
   * Step 1: Health Check - Verify all services are running
   */
  async testHealthCheck() {
    this.log('🔍 Testing system health...');
    
    try {
      const { data, responseTime } = await this.makeRequest(HEALTH_ENDPOINT);
      this.results.healthCheck = { data, responseTime };
      
      // Validate health response
      const isHealthy = data.ok && data.status === 'healthy';
      const hfHealthy = data.services?.huggingface?.status === 'healthy';
      
      this.log(`✅ Health check completed in ${responseTime}ms`);
      this.log('📊 System Status:', {
        overall: data.status,
        huggingface: data.services?.huggingface?.status,
        database: data.services?.database?.connected ? 'connected' : 'disconnected',
        redis: data.services?.redis?.status,
        firebase: data.services?.firebase?.status
      });
      
      if (!isHealthy) {
        throw new Error('System is not healthy');
      }
      
      if (!hfHealthy) {
        throw new Error('HuggingFace service is not healthy');
      }
      
      // Check recommendations
      if (data.recommendations && data.recommendations.length > 0) {
        this.log('⚠️  Health Recommendations:');
        data.recommendations.forEach(rec => {
          this.log(`  ${rec.type.toUpperCase()}: ${rec.message}`);
        });
      }
      
      return true;
      
    } catch ({ error, responseTime }) {
      this.error('Health check failed', error);
      this.results.performance.healthCheck = responseTime;
      return false;
    }
  }

  /**
   * Step 2: AEO Analysis - Test real embeddings with sample data
   */
  async testAeoAnalysis() {
    this.log('🤖 Testing AEO analysis with real embeddings...');
    this.log(`📍 Sample URL: ${SAMPLE_URL}`);
    this.log(`🔍 Test Queries: ${TEST_QUERIES.join(', ')}`);
    
    try {
      const requestPayload = {
        url: SAMPLE_URL,
        queries: TEST_QUERIES
      };
      
      const startTime = performance.now();
      const { data, responseTime } = await this.makeRequest(AEO_SCORE_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify(requestPayload)
      });
      
      this.results.aeoAnalysis = { data, responseTime };
      this.results.performance.aeoAnalysis = responseTime;
      
      this.log(`✅ AEO analysis completed in ${responseTime}ms`);
      
      // Validate and display key metrics
      this.validateAndDisplayResults(data);
      
      return true;
      
    } catch ({ error, responseTime }) {
      this.error('AEO analysis failed', error);
      this.results.performance.aeoAnalysis = responseTime;
      return false;
    }
  }

  /**
   * Validate and display AEO results
   */
  validateAndDisplayResults(data) {
    this.log('📊 AEO Analysis Results:');
    
    // Overall scores
    this.log('🎯 Overall Scores:', {
      aeoScore: data.overallAeoScore,
      technicalScore: data.technicalAeoScore,
      semanticScore: data.semanticRelevanceScore
    });
    
    // Query performance
    if (data.queryPerformance) {
      this.log('🔍 Query Performance:', {
        totalQueries: data.queryPerformance.totalQueries,
        queriesAnswered: data.queryPerformance.queriesAnswered,
        answerCoverage: `${data.queryPerformance.answerCoverage}%`,
        avgConfidence: data.queryPerformance.averageConfidence
      });
      
      // Validate query count matches input
      this.results.validation.queryCount = data.queryPerformance.totalQueries === TEST_QUERIES.length;
      if (!this.results.validation.queryCount) {
        this.error(`Query count mismatch: expected ${TEST_QUERIES.length}, got ${data.queryPerformance.totalQueries}`);
      }
    }
    
    // Similarity matrices (key requirement)
    if (data.similarityMatrices) {
      this.log('🧮 Similarity Matrices Found:');
      Object.keys(data.similarityMatrices).forEach(query => {
        const matrix = data.similarityMatrices[query];
        this.log(`  Query: "${query}"`);
        this.log(`  Matrix dimensions: ${matrix.length}x${matrix[0]?.length || 0}`);
        
        // Show top similarities
        const flatScores = matrix.flat().filter(score => score < 0.99); // Exclude self-similarity
        const topScores = flatScores.sort((a, b) => b - a).slice(0, 3);
        this.log(`  Top cosine scores: ${topScores.map(s => s.toFixed(4)).join(', ')}`);
      });
      
      this.results.validation.similarityMatrices = true;
    } else {
      this.error('Similarity matrices missing from response');
      this.results.validation.similarityMatrices = false;
    }
    
    // Top matching content
    if (data.topMatchingContent && data.topMatchingContent.length > 0) {
      this.log('🎯 Top Content Matches:');
      data.topMatchingContent.slice(0, 5).forEach((match, idx) => {
        this.log(`  ${idx + 1}. Query: "${match.query}"`);
        this.log(`     Score: ${match.score.toFixed(4)}`);
        this.log(`     Content: "${match.content.substring(0, 100)}..."`);
        this.log(`     Type: ${match.type}`);
      });
      
      this.results.validation.topMatches = true;
    }
    
    // Technical metrics
    if (data.technicalMetrics) {
      this.log('🔧 Technical AEO Metrics:', {
        schemaCompliance: data.technicalMetrics.schemaCompliance,
        snippetOptimization: data.technicalMetrics.snippetOptimization,
        faqStructure: data.technicalMetrics.faqStructure,
        voiceSearchReadiness: data.technicalMetrics.voiceSearchReadiness,
        localOptimization: data.technicalMetrics.localOptimization
      });
    }
    
    // Embedding metadata
    if (data.embeddingMetadata) {
      this.log('🤖 Embedding Pipeline Metadata:', {
        model: data.embeddingMetadata.modelUsed,
        contentChunks: data.embeddingMetadata.contentChunksAnalyzed,
        embeddingDimensions: data.embeddingMetadata.embeddingDimensions,
        processingTime: data.embeddingMetadata.processingTime,
        retryCount: data.embeddingMetadata.retryCount || 0
      });
      
      // Validate embedding model
      this.results.validation.correctModel = data.embeddingMetadata.modelUsed === 'sentence-transformers/all-MiniLM-L6-v2';
      if (!this.results.validation.correctModel) {
        this.error(`Incorrect model: expected all-MiniLM-L6-v2, got ${data.embeddingMetadata.modelUsed}`);
      }
      
      // Validate embedding dimensions
      this.results.validation.correctDimensions = data.embeddingMetadata.embeddingDimensions === 384;
      if (!this.results.validation.correctDimensions) {
        this.error(`Incorrect embedding dimensions: expected 384, got ${data.embeddingMetadata.embeddingDimensions}`);
      }
    }
    
    // Recommendations
    if (data.recommendations && data.recommendations.length > 0) {
      this.log('💡 AEO Recommendations:');
      data.recommendations.forEach((rec, idx) => {
        this.log(`  ${idx + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
        this.log(`     ${rec.description}`);
        this.log(`     Impact: ${rec.impact}`);
      });
    }
  }

  /**
   * Generate comprehensive test report
   */
  generateReport() {
    this.log('📋 Generating Test Report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      testConfiguration: {
        sampleUrl: SAMPLE_URL,
        testQueries: TEST_QUERIES,
        endpoints: {
          health: HEALTH_ENDPOINT,
          aeoScore: AEO_SCORE_ENDPOINT
        }
      },
      results: {
        healthCheck: {
          passed: !!this.results.healthCheck,
          responseTime: this.results.healthCheck?.responseTime
        },
        aeoAnalysis: {
          passed: !!this.results.aeoAnalysis,
          responseTime: this.results.performance.aeoAnalysis
        },
        validation: {
          queryCountMatched: this.results.validation.queryCount,
          similarityMatricesPresent: this.results.validation.similarityMatrices,
          correctModelUsed: this.results.validation.correctModel,
          correctDimensions: this.results.validation.correctDimensions,
          topMatchesFound: this.results.validation.topMatches
        }
      },
      performance: {
        totalTestTime: this.results.performance.aeoAnalysis + (this.results.healthCheck?.responseTime || 0),
        healthCheckTime: this.results.healthCheck?.responseTime,
        aeoAnalysisTime: this.results.performance.aeoAnalysis
      },
      errors: this.results.errors,
      success: this.results.errors.length === 0 && this.results.healthCheck && this.results.aeoAnalysis
    };
    
    // Display summary
    this.log('');
    this.log('🎉 TEST SUMMARY');
    this.log('===============');
    this.log(`Overall Result: ${report.success ? '✅ PASSED' : '❌ FAILED'}`);
    this.log(`Total Test Time: ${report.performance.totalTestTime}ms`);
    this.log(`Health Check: ${report.results.healthCheck.passed ? '✅' : '❌'} (${report.results.healthCheck.responseTime}ms)`);
    this.log(`AEO Analysis: ${report.results.aeoAnalysis.passed ? '✅' : '❌'} (${report.results.aeoAnalysis.responseTime}ms)`);
    
    this.log('');
    this.log('🔍 VALIDATION RESULTS');
    this.log('====================');
    Object.entries(report.results.validation).forEach(([key, passed]) => {
      const emoji = passed ? '✅' : '❌';
      const label = key.replace(/([A-Z])/g, ' $1').toLowerCase();
      this.log(`${emoji} ${label}`);
    });
    
    if (this.results.errors.length > 0) {
      this.log('');
      this.log('❌ ERRORS ENCOUNTERED');
      this.log('====================');
      this.results.errors.forEach((error, idx) => {
        this.log(`${idx + 1}. ${error.message}`);
        this.log(`   ${error.error}`);
      });
    }
    
    return report;
  }

  /**
   * Main test runner
   */
  async run() {
    this.log('🚀 Starting AEO Embedding Pipeline Test');
    this.log('=====================================');
    
    try {
      // Step 1: Health check
      const healthPassed = await this.testHealthCheck();
      if (!healthPassed) {
        this.log('⚠️  Continuing with AEO test despite health check failure...');
      }
      
      this.log('');
      
      // Step 2: AEO analysis
      await this.testAeoAnalysis();
      
      this.log('');
      
      // Generate final report
      const report = this.generateReport();
      
      return report;
      
    } catch (error) {
      this.error('Test runner failed', error);
      return this.generateReport();
    }
  }
}

/**
 * Run the test if called directly
 */
if (require.main === module) {
  const runner = new TestRunner();
  
  runner.run()
    .then(report => {
      process.exit(report.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner crashed:', error);
      process.exit(1);
    });
}

module.exports = { TestRunner, SAMPLE_URL, TEST_QUERIES };