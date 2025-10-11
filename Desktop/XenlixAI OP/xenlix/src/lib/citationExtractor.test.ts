/**
 * Citation Extractor Test Suite
 *
 * Comprehensive tests for citation extraction functionality
 */

import { CitationExtractor, CitationType, ExtractedCitation } from '../lib/citationExtractor';

describe('CitationExtractor', () => {
  describe('URL Normalization', () => {
    test('should normalize URLs correctly', () => {
      const testCases = [
        {
          input: 'https://Example.COM/path?utm_source=test&real_param=value#fragment',
          expected: 'https://example.com/path?real_param=value',
        },
        {
          input: 'www.github.com/user/repo',
          expected: 'https://www.github.com/user/repo',
        },
        {
          input: 'https://news.ycombinator.com/item?id=123&utm_campaign=test',
          expected: 'https://news.ycombinator.com/item?id=123',
        },
        {
          input: 'stackoverflow.com',
          expected: 'https://stackoverflow.com',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = CitationExtractor.normalizeUrl(input);
        expect(result).toBe(expected);
      });
    });

    test('should handle IDN domains', () => {
      const result = CitationExtractor.normalizeUrl('https://münchen.de/path');
      expect(result).toContain('xn--');
    });

    test('should return null for invalid URLs', () => {
      expect(CitationExtractor.normalizeUrl('not-a-url')).toBeNull();
      expect(CitationExtractor.normalizeUrl('')).toBeNull();
    });
  });

  describe('Direct URL Extraction', () => {
    test('should extract direct URLs from text', () => {
      const text = `
        According to https://example.com/article and also 
        see https://github.com/user/repo for more details.
        Another source is http://stackoverflow.com/questions/123
      `;

      const citations = CitationExtractor.extractCitations(text);

      expect(citations).toHaveLength(3);
      expect(citations[0]).toMatchObject({
        citationType: 'url',
        domain: 'example.com',
        confidenceScore: expect.any(Number),
      });
      expect(citations[1]).toMatchObject({
        citationType: 'url',
        domain: 'github.com',
      });
      expect(citations[2]).toMatchObject({
        citationType: 'url',
        domain: 'stackoverflow.com',
      });
    });
  });

  describe('Footnote Citation Extraction', () => {
    test('should extract footnote citations', () => {
      const text = `
        This is a claim [1]: https://example.com/source1
        Another claim [2]: Visit https://github.com/user/repo for details
        Final reference [3]: See "Article Title" on https://medium.com/@author/post
      `;

      const citations = CitationExtractor.extractCitations(text);

      // Should find both direct URLs and footnote patterns
      expect(citations.length).toBeGreaterThan(0);

      const footnoteCitations = citations.filter((c) => c.citationType === 'footnote');
      expect(footnoteCitations.length).toBeGreaterThan(0);

      const firstFootnote = footnoteCitations[0];
      expect(firstFootnote.rawCitation).toContain('[');
      expect(firstFootnote.confidenceScore).toBeGreaterThan(0.5);
    });
  });

  describe('Inline Citation Extraction', () => {
    test('should extract inline citations', () => {
      const text = `
        Machine learning advances (Source: https://arxiv.org/abs/2023.12345)
        Recent study shows improvements (Ref: https://pubmed.ncbi.nlm.nih.gov/12345)
      `;

      const citations = CitationExtractor.extractCitations(text);
      const inlineCitations = citations.filter((c) => c.citationType === 'inline');

      expect(inlineCitations.length).toBe(2);
      expect(inlineCitations[0]).toMatchObject({
        domain: 'arxiv.org',
        citationType: 'inline',
      });
    });
  });

  describe('Numbered Citation Extraction', () => {
    test('should extract numbered list citations', () => {
      const text = `
        References:
        1. Example Study - https://example.com/study
        2. GitHub Repository: https://github.com/user/awesome-repo
        3. Technical Documentation at https://docs.example.com
      `;

      const citations = CitationExtractor.extractCitations(text);
      const numberedCitations = citations.filter((c) => c.citationType === 'numbered');

      expect(numberedCitations.length).toBe(3);
      expect(numberedCitations[0]).toMatchObject({
        citationType: 'numbered',
        rawCitation: expect.stringContaining('1.'),
      });
    });
  });

  describe('JSON Citation Extraction', () => {
    test('should extract structured JSON citations', () => {
      const text = `
        {"source": "https://api.example.com/data"}
        {"citation": "https://research.example.org/paper"}
        {"url": "https://github.com/user/project"}
      `;

      const citations = CitationExtractor.extractCitations(text);
      const jsonCitations = citations.filter((c) => c.citationType === 'structured');

      expect(jsonCitations.length).toBe(3);
      expect(jsonCitations[0]).toMatchObject({
        citationType: 'structured',
        confidenceScore: expect.any(Number),
      });
    });
  });

  describe('Complex Mixed Citations', () => {
    test('should handle AI answer with mixed citation formats', () => {
      const aiAnswer = `
        Based on recent research, artificial intelligence is advancing rapidly. 
        
        Key findings include:
        
        1. Performance improvements in language models (Source: https://arxiv.org/abs/2023.12345)
        2. Breakthrough in computer vision https://github.com/openai/clip
        3. Commercial applications expanding [1]: https://techcrunch.com/2023/ai-market-growth
        
        References:
        [1]: "AI Market Reaches $100B" - TechCrunch Analysis
        [2]: For implementation details, see https://huggingface.co/docs/transformers
        
        Additional resources:
        {"url": "https://pytorch.org/tutorials/"}
        {"citation": "https://www.nature.com/articles/s41586-023-12345-6"}
      `;

      const citations = CitationExtractor.extractCitations(aiAnswer);

      expect(citations.length).toBeGreaterThan(5);

      // Should have multiple citation types
      const types = new Set(citations.map((c) => c.citationType));
      expect(types.size).toBeGreaterThan(2);

      // Should have proper ranking
      citations.forEach((citation, index) => {
        expect(citation.rank).toBe(index + 1);
      });

      // Should normalize domains correctly
      const domains = citations.map((c) => c.domain);
      expect(domains).toContain('arxiv.org');
      expect(domains).toContain('github.com');
      expect(domains).toContain('techcrunch.com');
    });
  });

  describe('Deduplication', () => {
    test('should deduplicate identical URLs', () => {
      const text = `
        See https://example.com/article for details.
        Also check https://example.com/article?utm_source=twitter
        Reference: https://EXAMPLE.COM/article#section1
      `;

      const citations = CitationExtractor.extractCitations(text);

      // Should deduplicate to single citation since they normalize to same URL
      expect(citations.length).toBe(1);
      expect(citations[0].domain).toBe('example.com');
    });
  });

  describe('Confidence Scoring', () => {
    test('should assign higher confidence to well-formed citations', () => {
      const text = `
        Low quality: example.com/???invalid
        High quality: https://github.com/microsoft/typescript
        Medium quality: [1] See research at https://unknown-domain.xyz
      `;

      const citations = CitationExtractor.extractCitations(text);

      const githubCitation = citations.find((c) => c.domain === 'github.com');
      const unknownCitation = citations.find((c) => c.domain === 'unknown-domain.xyz');

      if (githubCitation && unknownCitation) {
        expect(githubCitation.confidenceScore).toBeGreaterThan(unknownCitation.confidenceScore);
      }
    });

    test('should filter low confidence citations', () => {
      const text = 'Vague reference to some-invalid-domain.fake';

      const citations = CitationExtractor.extractCitations(text, {
        confidenceThreshold: 0.8,
      });

      expect(citations.length).toBe(0);
    });
  });

  describe('Title Extraction', () => {
    test('should extract titles from citation text', () => {
      const text = `
        [1]: "Machine Learning Fundamentals" - https://example.com/ml-guide
        [2]: Research Paper | Advanced AI Techniques: https://arxiv.org/abs/2023.12345  
        [3]: "The Future of Computing" on https://medium.com/@author/post
      `;

      const citations = CitationExtractor.extractCitations(text, {
        extractTitles: true,
      });

      const titledCitations = citations.filter((c) => c.title);
      expect(titledCitations.length).toBeGreaterThan(0);

      const titles = titledCitations.map((c) => c.title);
      expect(titles).toContain('Machine Learning Fundamentals');
      expect(titles).toContain('Advanced AI Techniques');
    });
  });

  describe('Statistics', () => {
    test('should calculate citation statistics correctly', () => {
      const mockCitations: ExtractedCitation[] = [
        {
          rawCitation: 'https://github.com/user/repo',
          normalizedUrl: 'https://github.com/user/repo',
          url: 'https://github.com/user/repo',
          domain: 'github.com',
          rank: 1,
          confidenceScore: 0.95,
          citationType: 'url',
          title: 'Repository Title',
        },
        {
          rawCitation: '[1] https://example.com/article',
          normalizedUrl: 'https://example.com/article',
          url: 'https://example.com/article',
          domain: 'example.com',
          rank: 2,
          confidenceScore: 0.85,
          citationType: 'footnote',
        },
        {
          rawCitation: '[2] https://github.com/other/repo',
          normalizedUrl: 'https://github.com/other/repo',
          url: 'https://github.com/other/repo',
          domain: 'github.com',
          rank: 3,
          confidenceScore: 0.75,
          citationType: 'footnote',
        },
      ];

      const stats = CitationExtractor.getCitationStats(mockCitations);

      expect(stats).toMatchObject({
        total: 3,
        uniqueDomains: 2,
        highConfidenceCitations: 2, // >0.8 confidence
        withTitles: 1,
        averageConfidence: expect.closeTo(0.85, 2),
      });

      expect(stats.byType).toMatchObject({
        url: 1,
        footnote: 2,
      });

      expect(stats.domains).toContain('github.com');
      expect(stats.domains).toContain('example.com');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty input', () => {
      const citations = CitationExtractor.extractCitations('');
      expect(citations).toHaveLength(0);
    });

    test('should handle text with no citations', () => {
      const text = 'This is just regular text without any citations or references.';
      const citations = CitationExtractor.extractCitations(text);
      expect(citations).toHaveLength(0);
    });

    test('should handle malformed URLs gracefully', () => {
      const text = `
        Invalid: htp://broken-protocol.com
        Partial: ://missing-protocol.com
        Malformed: https://[invalid-brackets].com
      `;

      const citations = CitationExtractor.extractCitations(text, {
        includeInvalidUrls: false,
      });

      // Should filter out invalid URLs
      expect(citations.length).toBe(0);
    });

    test('should respect maxCitations limit', () => {
      const urls = Array.from({ length: 20 }, (_, i) => `https://example${i}.com/article`).join(
        ' '
      );

      const citations = CitationExtractor.extractCitations(urls, {
        maxCitations: 5,
      });

      expect(citations.length).toBe(5);
    });

    test('should handle very long citation text', () => {
      const longCitation = `[1]: ${'a'.repeat(500)} https://example.com/article`;

      const citations = CitationExtractor.extractCitations(longCitation);

      // Should still extract but with reduced confidence
      expect(citations.length).toBe(1);
      expect(citations[0].confidenceScore).toBeLessThan(0.9);
    });
  });

  describe('Real-world AI Answer Examples', () => {
    test('should handle ChatGPT-style responses', () => {
      const chatgptAnswer = `
        Based on the latest research in artificial intelligence, several key trends are emerging:

        1. **Large Language Models**: Recent advances show significant improvements in reasoning capabilities ([Nature AI, 2023](https://nature.com/articles/s42256-023-12345)).

        2. **Multimodal AI**: Integration of text and vision is advancing rapidly (Source: https://arxiv.org/abs/2023.54321).

        3. **Efficiency Improvements**: New architectures reduce computational costs by up to 50% [[1]](#ref1).

        ### References
        1. <a id="ref1"></a> "Efficient Transformers" - https://huggingface.co/papers/efficient-transformers
        2. For implementation details, see the official documentation: https://pytorch.org/docs/stable/
      `;

      const citations = CitationExtractor.extractCitations(chatgptAnswer);

      expect(citations.length).toBeGreaterThan(3);
      expect(citations.map((c) => c.domain)).toContain('nature.com');
      expect(citations.map((c) => c.domain)).toContain('arxiv.org');
      expect(citations.map((c) => c.domain)).toContain('huggingface.co');
    });

    test('should handle Perplexity-style responses', () => {
      const perplexityAnswer = `
        Machine learning has made significant strides in 2023, with breakthrough developments in several key areas.

        **Large Language Models**
        The field has seen remarkable progress with models like GPT-4 and Claude showing improved reasoning capabilities[^1]. These models demonstrate better performance across diverse tasks[^2].

        **Computer Vision** 
        Recent advances in vision transformers have led to state-of-the-art results in image classification and object detection[^3].

        ---
        [^1]: https://openai.com/research/gpt-4
        [^2]: https://www.anthropic.com/news/claude-2
        [^3]: https://arxiv.org/abs/2010.11929
      `;

      const citations = CitationExtractor.extractCitations(perplexityAnswer);

      expect(citations.length).toBe(3);
      expect(citations.map((c) => c.domain)).toContain('openai.com');
      expect(citations.map((c) => c.domain)).toContain('anthropic.com');
      expect(citations.map((c) => c.domain)).toContain('arxiv.org');
    });
  });
});
