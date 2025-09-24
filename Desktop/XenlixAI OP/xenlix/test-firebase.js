const { firebaseClient } = require('./src/lib/firebase-client');
const { 
  crawlResultsService,
  embeddingScoresService, 
  lighthouseAuditsService,
  pdfExportService,
  initializeFirestoreIndexes
} = require('./src/lib/firestore-services');

// Test data
const testCrawlResult = {
  id: '',
  url: 'https://example.com',
  title: 'Test Page',
  content: 'This is test content for Firebase integration testing.',
  metadata: {
    crawledAt: new Date(),
    contentType: 'text/html',
    statusCode: 200,
    responseTime: 150,
  },
  analysis: {
    wordCount: 10,
    headings: ['Test Heading 1', 'Test Heading 2'],
    links: 5,
    images: 3,
  },
};

const testEmbeddingScore = {
  id: '',
  crawlResultId: '', // Will be set after creating crawl result
  content: 'Test content for embedding',
  embedding: Array.from({ length: 768 }, () => Math.random()),
  metadata: {
    model: 'sentence-transformers/all-MiniLM-L6-v2',
    createdAt: new Date(),
    dimensions: 768,
  },
};

const testLighthouseAudit = {
  id: '',
  url: 'https://example.com',
  scores: {
    performance: 85,
    accessibility: 92,
    bestPractices: 88,
    seo: 95,
    pwa: 78,
  },
  metrics: {
    firstContentfulPaint: 1200,
    largestContentfulPaint: 2100,
    cumulativeLayoutShift: 0.05,
    timeToInteractive: 2800,
  },
  opportunities: [
    {
      id: 'unused-css-rules',
      title: 'Remove unused CSS',
      description: 'Reduce unused CSS to improve load time',
      score: 75,
      savings: 450,
    },
  ],
  metadata: {
    auditedAt: new Date(),
    lighthouseVersion: '10.4.0',
    deviceType: 'desktop',
  },
};

const testPDFExport = {
  id: '',
  reportType: 'full-analysis',
  associatedIds: [], // Will be populated with test IDs
  fileName: 'test-report.pdf',
  fileSize: 1024 * 500, // 500KB
  generatedAt: new Date(),
  downloadCount: 0,
  metadata: {
    pageCount: 5,
    includeCharts: true,
    includeRaw: false,
  },
};

// Test functions
async function testFirebaseConnection() {
  console.log('\n🔥 Testing Firebase Connection...');
  try {
    const health = await firebaseClient.healthCheck();
    console.log('Firebase Health Check:', JSON.stringify(health, null, 2));
    
    if (health.status === 'healthy') {
      console.log('✅ Firebase connection successful');
      return true;
    } else {
      console.log('❌ Firebase connection failed:', health.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Firebase connection error:', error.message);
    return false;
  }
}

async function testCrawlResultsService() {
  console.log('\n📄 Testing Crawl Results Service...');
  try {
    // Create
    const crawlId = await crawlResultsService.create(testCrawlResult);
    console.log('✅ Created crawl result:', crawlId);
    
    // Read
    const crawlResult = await crawlResultsService.getById(crawlId);
    console.log('✅ Retrieved crawl result:', crawlResult?.url);
    
    // Update
    await crawlResultsService.update(crawlId, { 
      analysis: { ...testCrawlResult.analysis, wordCount: 15 } 
    });
    console.log('✅ Updated crawl result');
    
    // Search by URL
    const urlResults = await crawlResultsService.getByUrl(testCrawlResult.url);
    console.log('✅ Found by URL:', urlResults.length, 'results');
    
    // Get recent
    const recentResults = await crawlResultsService.getRecent(5);
    console.log('✅ Recent crawl results:', recentResults.length, 'found');
    
    return crawlId;
  } catch (error) {
    console.error('❌ Crawl Results Service error:', error.message);
    throw error;
  }
}

async function testEmbeddingScoresService(crawlResultId) {
  console.log('\n🧠 Testing Embedding Scores Service...');
  try {
    // Set the crawl result ID
    testEmbeddingScore.crawlResultId = crawlResultId;
    
    // Create
    const embeddingId = await embeddingScoresService.create(testEmbeddingScore);
    console.log('✅ Created embedding score:', embeddingId);
    
    // Get by crawl result ID
    const embeddings = await embeddingScoresService.getByCrawlResultId(crawlResultId);
    console.log('✅ Found embeddings for crawl result:', embeddings.length);
    
    // Test similarity search (basic)
    const similarEmbeddings = await embeddingScoresService.findSimilar(
      testEmbeddingScore.embedding, 
      0.5, 
      5
    );
    console.log('✅ Similar embeddings found:', similarEmbeddings.length);
    
    return embeddingId;
  } catch (error) {
    console.error('❌ Embedding Scores Service error:', error.message);
    throw error;
  }
}

async function testLighthouseAuditsService() {
  console.log('\n💡 Testing Lighthouse Audits Service...');
  try {
    // Create
    const auditId = await lighthouseAuditsService.create(testLighthouseAudit);
    console.log('✅ Created lighthouse audit:', auditId);
    
    // Get by URL
    const audits = await lighthouseAuditsService.getByUrl(testLighthouseAudit.url);
    console.log('✅ Found audits for URL:', audits.length);
    
    // Get by score range
    const performanceAudits = await lighthouseAuditsService.getByScoreRange(
      'performance', 
      80, 
      100
    );
    console.log('✅ High performance audits:', performanceAudits.length);
    
    // Get performance metrics
    const metrics = await lighthouseAuditsService.getPerformanceMetrics();
    console.log('✅ Performance metrics:', JSON.stringify(metrics, null, 2));
    
    return auditId;
  } catch (error) {
    console.error('❌ Lighthouse Audits Service error:', error.message);
    throw error;
  }
}

async function testPDFExportService(crawlId, auditId) {
  console.log('\n📊 Testing PDF Export Service...');
  try {
    // Set associated IDs
    testPDFExport.associatedIds = [crawlId, auditId];
    
    // Create
    const pdfId = await pdfExportService.create(testPDFExport);
    console.log('✅ Created PDF export:', pdfId);
    
    // Get by type
    const pdfExports = await pdfExportService.getByType('full-analysis');
    console.log('✅ PDF exports by type:', pdfExports.length);
    
    // Increment download count
    await pdfExportService.incrementDownloadCount(pdfId);
    console.log('✅ Incremented download count');
    
    // Get statistics
    const stats = await pdfExportService.getStatistics();
    console.log('✅ PDF export statistics:', JSON.stringify(stats, null, 2));
    
    return pdfId;
  } catch (error) {
    console.error('❌ PDF Export Service error:', error.message);
    throw error;
  }
}

async function testDataRetrieval() {
  console.log('\n🔍 Testing Data Retrieval...');
  try {
    // Test pagination
    const page1 = await crawlResultsService.getAll(2);
    console.log('✅ Page 1 crawl results:', page1.length);
    
    if (page1.length > 0) {
      const page2 = await crawlResultsService.getAll(2, page1[page1.length - 1].id);
      console.log('✅ Page 2 crawl results:', page2.length);
    }
    
    // Test search functionality
    const searchResults = await crawlResultsService.searchByContent('Test');
    console.log('✅ Search results:', searchResults.length);
    
  } catch (error) {
    console.error('❌ Data Retrieval error:', error.message);
    throw error;
  }
}

async function testCleanup(crawlId, embeddingId, auditId, pdfId) {
  console.log('\n🧹 Cleaning up test data...');
  try {
    // Delete in reverse order to handle dependencies
    if (pdfId) {
      await pdfExportService.delete(pdfId);
      console.log('✅ Deleted PDF export');
    }
    
    if (embeddingId) {
      await embeddingScoresService.delete(embeddingId);
      console.log('✅ Deleted embedding score');
    }
    
    if (auditId) {
      await lighthouseAuditsService.delete(auditId);
      console.log('✅ Deleted lighthouse audit');
    }
    
    if (crawlId) {
      await crawlResultsService.delete(crawlId);
      console.log('✅ Deleted crawl result');
    }
    
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
  }
}

// Performance test
async function performanceTest() {
  console.log('\n⚡ Running Performance Test...');
  
  const iterations = 10;
  const startTime = Date.now();
  
  try {
    // Create multiple records
    const promises = [];
    for (let i = 0; i < iterations; i++) {
      const testData = {
        ...testCrawlResult,
        url: `https://example-${i}.com`,
        title: `Test Page ${i}`,
      };
      promises.push(crawlResultsService.create(testData));
    }
    
    const ids = await Promise.all(promises);
    const createTime = Date.now() - startTime;
    console.log(`✅ Created ${iterations} records in ${createTime}ms`);
    
    // Read multiple records
    const readStartTime = Date.now();
    const readPromises = ids.map(id => crawlResultsService.getById(id));
    await Promise.all(readPromises);
    const readTime = Date.now() - readStartTime;
    console.log(`✅ Read ${iterations} records in ${readTime}ms`);
    
    // Cleanup performance test data
    const deletePromises = ids.map(id => crawlResultsService.delete(id));
    await Promise.all(deletePromises);
    console.log('✅ Performance test cleanup completed');
    
    // Performance summary
    console.log('\n📊 Performance Summary:');
    console.log(`- Average create time: ${(createTime / iterations).toFixed(2)}ms per record`);
    console.log(`- Average read time: ${(readTime / iterations).toFixed(2)}ms per record`);
    
  } catch (error) {
    console.error('❌ Performance test error:', error.message);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Firebase Integration Tests...');
  console.log('============================================');
  
  let crawlId, embeddingId, auditId, pdfId;
  
  try {
    // Test Firebase connection
    const connected = await testFirebaseConnection();
    if (!connected) {
      console.log('❌ Cannot proceed without Firebase connection');
      process.exit(1);
    }
    
    // Show Firestore index information
    await initializeFirestoreIndexes();
    
    // Run service tests
    crawlId = await testCrawlResultsService();
    embeddingId = await testEmbeddingScoresService(crawlId);
    auditId = await testLighthouseAuditsService();
    pdfId = await testPDFExportService(crawlId, auditId);
    
    // Test data retrieval
    await testDataRetrieval();
    
    // Performance test
    await performanceTest();
    
    console.log('\n✅ All Firebase tests completed successfully!');
    console.log('\n📊 Firebase Metrics:');
    console.log(JSON.stringify(firebaseClient.getMetrics(), null, 2));
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    // Cleanup test data
    await testCleanup(crawlId, embeddingId, auditId, pdfId);
    
    // Graceful shutdown
    await firebaseClient.disconnect();
    console.log('\n🏁 Firebase test suite finished');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testFirebaseConnection,
  testCrawlResultsService,
  testEmbeddingScoresService,
  testLighthouseAuditsService,
  testPDFExportService,
};