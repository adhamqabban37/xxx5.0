/**
 * Performance Testing Script for AEO Analysis Tool
 * Tests API response times, handles concurrent requests, and measures UX performance
 */

interface PerformanceTestResult {
  url: string;
  responseTime: number;
  success: boolean;
  error?: string;
  timestamp: string;
}

interface LoadTestConfig {
  urls: string[];
  concurrentRequests: number;
  iterations: number;
}

class AEOPerformanceTester {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3002') {
    this.baseUrl = baseUrl;
  }

  /**
   * Test single URL analysis performance
   */
  async testSingleAnalysis(url: string): Promise<PerformanceTestResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🧪 Testing analysis of: ${url}`);
      
      const response = await fetch(`${this.baseUrl}/api/analyze-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        const errorData = await response.json();
        return {
          url,
          responseTime,
          success: false,
          error: errorData.message || 'Analysis failed',
          timestamp: new Date().toISOString(),
        };
      }

      const result = await response.json();
      
      return {
        url,
        responseTime,
        success: true,
        timestamp: new Date().toISOString(),
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        url,
        responseTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Test concurrent requests to measure scalability
   */
  async testConcurrentRequests(config: LoadTestConfig): Promise<PerformanceTestResult[]> {
    console.log(`🚀 Starting load test with ${config.concurrentRequests} concurrent requests`);
    
    const allResults: PerformanceTestResult[] = [];
    
    for (let iteration = 0; iteration < config.iterations; iteration++) {
      console.log(`📊 Iteration ${iteration + 1}/${config.iterations}`);
      
      const promises = [];
      
      for (let i = 0; i < config.concurrentRequests; i++) {
        const url = config.urls[i % config.urls.length];
        promises.push(this.testSingleAnalysis(url));
      }
      
      const results = await Promise.all(promises);
      allResults.push(...results);
      
      // Wait between iterations to avoid overwhelming the server
      if (iteration < config.iterations - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    return allResults;
  }

  /**
   * Analyze performance test results
   */
  analyzeResults(results: PerformanceTestResult[]): {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    successRate: number;
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    p95ResponseTime: number;
    errors: { [key: string]: number };
  } {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    const responseTimes = successful.map(r => r.responseTime).sort((a, b) => a - b);
    
    // Calculate 95th percentile
    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p95ResponseTime = responseTimes[p95Index] || 0;
    
    // Count error types
    const errors: { [key: string]: number } = {};
    failed.forEach(result => {
      const errorType = result.error || 'Unknown error';
      errors[errorType] = (errors[errorType] || 0) + 1;
    });
    
    return {
      totalRequests: results.length,
      successfulRequests: successful.length,
      failedRequests: failed.length,
      successRate: (successful.length / results.length) * 100,
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length || 0,
      minResponseTime: Math.min(...responseTimes) || 0,
      maxResponseTime: Math.max(...responseTimes) || 0,
      p95ResponseTime,
      errors,
    };
  }

  /**
   * Test real-world websites to measure actual performance
   */
  async runRealWorldTest(): Promise<void> {
    console.log('🌐 Running real-world performance test...');
    
    const testUrls = [
      'https://example.com',
      'https://google.com',
      'https://github.com',
      'https://stackoverflow.com',
      'https://wikipedia.org',
    ];
    
    const results: PerformanceTestResult[] = [];
    
    for (const url of testUrls) {
      const result = await this.testSingleAnalysis(url);
      results.push(result);
      console.log(`✅ ${url}: ${result.responseTime}ms ${result.success ? '✅' : '❌'}`);
      
      // Wait between requests to be respectful
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const analysis = this.analyzeResults(results);
    this.printAnalysis(analysis);
  }

  /**
   * Test concurrent load to check scalability
   */
  async runLoadTest(): Promise<void> {
    console.log('⚡ Running concurrent load test...');
    
    const config: LoadTestConfig = {
      urls: ['https://example.com', 'https://httpbin.org/html'],
      concurrentRequests: 5,
      iterations: 3,
    };
    
    const results = await this.testConcurrentRequests(config);
    const analysis = this.analyzeResults(results);
    this.printAnalysis(analysis);
  }

  /**
   * Print performance analysis results
   */
  private printAnalysis(analysis: any): void {
    console.log('\n📊 Performance Analysis Results:');
    console.log('=====================================');
    console.log(`Total Requests: ${analysis.totalRequests}`);
    console.log(`Successful: ${analysis.successfulRequests} (${analysis.successRate.toFixed(2)}%)`);
    console.log(`Failed: ${analysis.failedRequests}`);
    console.log(`Average Response Time: ${analysis.averageResponseTime.toFixed(2)}ms`);
    console.log(`Min Response Time: ${analysis.minResponseTime}ms`);
    console.log(`Max Response Time: ${analysis.maxResponseTime}ms`);
    console.log(`95th Percentile: ${analysis.p95ResponseTime}ms`);
    
    if (Object.keys(analysis.errors).length > 0) {
      console.log('\n❌ Error Breakdown:');
      Object.entries(analysis.errors).forEach(([error, count]) => {
        console.log(`  ${error}: ${count} occurrences`);
      });
    }
    
    console.log('\n🎯 Performance Recommendations:');
    if (analysis.averageResponseTime > 10000) {
      console.log('⚠️  Average response time is high (>10s). Consider optimization.');
    } else if (analysis.averageResponseTime > 5000) {
      console.log('⚠️  Response time is moderate (>5s). Monitor performance.');
    } else {
      console.log('✅ Response time is good (<5s).');
    }
    
    if (analysis.successRate < 95) {
      console.log('⚠️  Success rate is below 95%. Check error handling.');
    } else {
      console.log('✅ Success rate is good (≥95%).');
    }
  }

  /**
   * Test loading states and UX timing
   */
  testLoadingStates(): void {
    console.log('🔄 Testing loading states and UX timing...');
    
    const recommendations = {
      immediate: 'Show loading spinner immediately (0-100ms)',
      short: 'Maintain loading state for quick responses (100ms-2s)',
      medium: 'Add progress indicators for medium responses (2s-8s)',
      long: 'Add detailed progress and option to cancel for long responses (>8s)',
      timeout: 'Implement timeout and retry for responses >30s',
    };
    
    console.log('\n🎨 UX Loading State Recommendations:');
    Object.entries(recommendations).forEach(([timing, rec]) => {
      console.log(`${timing.toUpperCase()}: ${rec}`);
    });
  }
}

// Export for use in other files
export { AEOPerformanceTester, type PerformanceTestResult, type LoadTestConfig };

// CLI usage if run directly
if (typeof window === 'undefined' && require.main === module) {
  const tester = new AEOPerformanceTester();
  
  async function runTests() {
    console.log('🚀 Starting AEO Performance Tests\n');
    
    // Test loading states
    tester.testLoadingStates();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test real-world performance
    await tester.runRealWorldTest();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test concurrent load
    await tester.runLoadTest();
    
    console.log('\n🏁 Performance testing complete!');
  }
  
  runTests().catch(console.error);
}