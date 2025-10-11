import { NextRequest, NextResponse } from 'next/server';

type Strategy = 'exact' | 'normalized' | 'fuzzy';

function normalize(str: string) {
  return str.replace(/\r/g, '').replace(/\n+/g, '\n').replace(/\s+/g, ' ').trim().toLowerCase();
}

function fuzzyScore(snippet: string, html: string) {
  // Token-based containment style scoring (lightweight, no external deps)
  const snippetTokens = Array.from(new Set(snippet.toLowerCase().match(/[a-z0-9@._-]+/g) || []));
  const htmlTokens = new Set(html.toLowerCase().match(/[a-z0-9@._-]+/g) || []);
  if (snippetTokens.length === 0) return { score: 0, matchedTokens: 0, totalTokens: 0 };
  let matched = 0;
  for (const t of snippetTokens) {
    if (htmlTokens.has(t)) matched++;
  }
  const score = matched / snippetTokens.length;
  return { score, matchedTokens: matched, totalTokens: snippetTokens.length };
}

export async function POST(req: NextRequest) {
  const {
    targetUrl,
    snippet,
    strategy = 'exact',
    threshold = 0.85,
  } = (await req.json()) as {
    targetUrl?: string;
    snippet?: string;
    strategy?: Strategy;
    threshold?: number;
  };
  if (!targetUrl || !snippet) {
    return NextResponse.json({ status: 'fail', error: 'Missing parameters' }, { status: 400 });
  }
  if (!['exact', 'normalized', 'fuzzy'].includes(strategy)) {
    return NextResponse.json({ status: 'fail', error: 'Invalid strategy' }, { status: 400 });
  }
  try {
    const res = await fetch(targetUrl, { headers: { 'User-Agent': 'XenlixValidator/1.0' } });
    if (!res.ok) {
      return NextResponse.json(
        { status: 'fail', error: `Fetch status ${res.status}` },
        { status: 502 }
      );
    }
    const html = await res.text();

    let pass = false;
    let score: number | undefined;
    let diagnostics: any = {};

    if (strategy === 'exact') {
      pass = html.includes(snippet);
    } else if (strategy === 'normalized') {
      pass = normalize(html).includes(normalize(snippet));
    } else {
      const { score: s, matchedTokens, totalTokens } = fuzzyScore(snippet, html);
      score = s;
      diagnostics = { matchedTokens, totalTokens, threshold };
      pass = s >= threshold;
    }

    return NextResponse.json({
      status: pass ? 'pass' : 'fail',
      strategy,
      score,
      threshold: strategy === 'fuzzy' ? threshold : undefined,
      diagnostics: Object.keys(diagnostics).length ? diagnostics : undefined,
    });
  } catch (e: any) {
    return NextResponse.json(
      { status: 'fail', error: 'Fetch error', detail: e?.message },
      { status: 500 }
    );
  }
}
