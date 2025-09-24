import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// PDF Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 20,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 2,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scoreText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#16A34A',
    marginRight: 15,
  },
  column: {
    flexDirection: 'column',
    flex: 1,
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  subsectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
    marginTop: 8,
  },
  text: {
    fontSize: 10,
    lineHeight: 1.4,
    color: '#4B5563',
    marginBottom: 5,
  },
  bulletPoint: {
    fontSize: 10,
    lineHeight: 1.4,
    color: '#4B5563',
    marginBottom: 3,
    marginLeft: 10,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F3F4F6',
  },
  metricLabel: {
    fontSize: 10,
    color: '#6B7280',
    flex: 1,
  },
  metricValue: {
    fontSize: 10,
    color: '#1F2937',
    fontWeight: 'bold',
    width: 60,
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    textAlign: 'center',
    fontSize: 8,
    color: '#9CA3AF',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
  },
});

// Helper function to safely get text content
const safeText = (value: any): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
};

// Helper function to safely get numeric value
const safeNumber = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }
  return 0;
};

// Helper function to get color based on score
const getScoreColor = (score: number): string => {
  if (score >= 80) return '#16A34A'; // Green
  if (score >= 60) return '#D97706'; // Orange
  return '#DC2626'; // Red
};

// PDF Document Component
export const AEOReportPDF: React.FC<{ data: any; url: string; reportTitle: string }> = ({ 
  data, 
  url, 
  reportTitle 
}) => {
  const { overallScore, aeoScore, crawlData, lighthouseAudit, timestamp } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{reportTitle}</Text>
          <Text style={styles.subtitle}>Website: {url}</Text>
          <Text style={styles.subtitle}>Generated: {new Date(timestamp).toLocaleString()}</Text>
          <Text style={styles.subtitle}>Powered by XenlixAI AEO Platform</Text>
        </View>

        {/* Overall Score */}
        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreText, { color: getScoreColor(safeNumber(overallScore)) }]}>
            {safeNumber(overallScore)}
          </Text>
          <View style={styles.column}>
            <Text style={styles.scoreLabel}>Overall AEO</Text>
            <Text style={styles.scoreLabel}>Readiness Score</Text>
          </View>
        </View>

        {/* AEO Score Details */}
        {aeoScore && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AEO Score Analysis</Text>
            
            {aeoScore.semanticScore && (
              <View>
                <Text style={styles.subsectionTitle}>Semantic Analysis</Text>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Semantic Relevance</Text>
                  <Text style={styles.metricValue}>{safeNumber(aeoScore.semanticScore)}%</Text>
                </View>
              </View>
            )}

            {aeoScore.contentQuality && (
              <View>
                <Text style={styles.subsectionTitle}>Content Quality</Text>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Content Score</Text>
                  <Text style={styles.metricValue}>{safeNumber(aeoScore.contentQuality)}%</Text>
                </View>
              </View>
            )}

            {aeoScore.recommendations && Array.isArray(aeoScore.recommendations) && (
              <View>
                <Text style={styles.subsectionTitle}>Recommendations</Text>
                {aeoScore.recommendations.slice(0, 5).map((rec: any, index: number) => (
                  <Text key={index} style={styles.bulletPoint}>
                    • {safeText(rec.message || rec)}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Lighthouse Audit Results */}
        {lighthouseAudit && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance & Technical Audit</Text>
            
            {lighthouseAudit.categories && (
              <>
                {lighthouseAudit.categories.performance && (
                  <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>Performance</Text>
                    <Text style={[styles.metricValue, { 
                      color: getScoreColor(safeNumber(lighthouseAudit.categories.performance.score) * 100)
                    }]}>
                      {Math.round(safeNumber(lighthouseAudit.categories.performance.score) * 100)}%
                    </Text>
                  </View>
                )}

                {lighthouseAudit.categories.accessibility && (
                  <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>Accessibility</Text>
                    <Text style={[styles.metricValue, { 
                      color: getScoreColor(safeNumber(lighthouseAudit.categories.accessibility.score) * 100)
                    }]}>
                      {Math.round(safeNumber(lighthouseAudit.categories.accessibility.score) * 100)}%
                    </Text>
                  </View>
                )}

                {lighthouseAudit.categories.seo && (
                  <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>SEO</Text>
                    <Text style={[styles.metricValue, { 
                      color: getScoreColor(safeNumber(lighthouseAudit.categories.seo.score) * 100)
                    }]}>
                      {Math.round(safeNumber(lighthouseAudit.categories.seo.score) * 100)}%
                    </Text>
                  </View>
                )}

                {lighthouseAudit.categories['best-practices'] && (
                  <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>Best Practices</Text>
                    <Text style={[styles.metricValue, { 
                      color: getScoreColor(safeNumber(lighthouseAudit.categories['best-practices'].score) * 100)
                    }]}>
                      {Math.round(safeNumber(lighthouseAudit.categories['best-practices'].score) * 100)}%
                    </Text>
                  </View>
                )}
              </>
            )}

            {lighthouseAudit.audits && lighthouseAudit.audits['first-contentful-paint'] && (
              <View>
                <Text style={styles.subsectionTitle}>Core Web Vitals</Text>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>First Contentful Paint</Text>
                  <Text style={styles.metricValue}>
                    {safeText(lighthouseAudit.audits['first-contentful-paint'].displayValue) || 'N/A'}
                  </Text>
                </View>
                
                {lighthouseAudit.audits['largest-contentful-paint'] && (
                  <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>Largest Contentful Paint</Text>
                    <Text style={styles.metricValue}>
                      {safeText(lighthouseAudit.audits['largest-contentful-paint'].displayValue) || 'N/A'}
                    </Text>
                  </View>
                )}

                {lighthouseAudit.audits['cumulative-layout-shift'] && (
                  <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>Cumulative Layout Shift</Text>
                    <Text style={styles.metricValue}>
                      {safeText(lighthouseAudit.audits['cumulative-layout-shift'].displayValue) || 'N/A'}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Crawl Data Summary */}
        {crawlData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Content Analysis Summary</Text>
            
            {crawlData.structured_data && (
              <View>
                <Text style={styles.subsectionTitle}>Structured Data</Text>
                <Text style={styles.text}>
                  Found {Object.keys(crawlData.structured_data).length} structured data types
                </Text>
              </View>
            )}

            {crawlData.word_count && (
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Word Count</Text>
                <Text style={styles.metricValue}>{safeText(crawlData.word_count)}</Text>
              </View>
            )}

            {crawlData.images && (
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Images Found</Text>
                <Text style={styles.metricValue}>{crawlData.images.length || 0}</Text>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Generated by XenlixAI AEO Platform - Professional Answer Engine Optimization Analysis
        </Text>
      </Page>
    </Document>
  );
};