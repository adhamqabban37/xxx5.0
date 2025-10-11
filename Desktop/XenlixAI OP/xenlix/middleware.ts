import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default withAuth(
  function middleware(req: NextRequest) {
    const { pathname, searchParams, protocol, host } = req.nextUrl;

    // HTTPS Enforcement (in production)
    if (process.env.NODE_ENV === 'production' && protocol === 'http:') {
      const httpsUrl = new URL(req.url);
      httpsUrl.protocol = 'https:';
      return NextResponse.redirect(httpsUrl, 301);
    }

    // Handle URL routing optimization redirects

    // Redirect query-based results URLs to path-based URLs
    if (pathname === '/aeo/results' && searchParams.has('id')) {
      const id = searchParams.get('id');
      const newUrl = new URL(`/aeo/results/${id}`, req.url);

      // Preserve other query parameters (except 'id')
      searchParams.delete('id');
      newUrl.search = searchParams.toString();

      return NextResponse.redirect(newUrl, 301);
    }

    if (pathname === '/seo/results' && searchParams.has('id')) {
      const id = searchParams.get('id');
      const newUrl = new URL(`/seo/results/${id}`, req.url);

      // Preserve other query parameters (except 'id')
      searchParams.delete('id');
      newUrl.search = searchParams.toString();

      return NextResponse.redirect(newUrl, 301);
    }

    // Redirect legacy aeo-results route to new structure
    if (pathname.startsWith('/aeo-results/')) {
      const auditId = pathname.split('/aeo-results/')[1];
      if (auditId) {
        const newUrl = new URL(`/aeo/results/${auditId}`, req.url);
        return NextResponse.redirect(newUrl, 301);
      }
    }

    // Additional legacy path redirects
    const legacyRedirects: Record<string, string> = {
      // Old tool paths → new tool paths
      '/tools/schema': '/tools/json-ld',
      '/tools/schema-generator': '/tools/json-ld',
      '/json-ld': '/tools/json-ld',
      '/schema': '/tools/json-ld',

      // Old calculator paths → new calculator paths
      '/roi': '/calculators/roi',
      '/pricing': '/calculators/pricing',
      '/calculator': '/calculators',
      '/calculators/conversion': '/calculators/roi', // Redirect old conversion calc to ROI

      // Old audit paths → new audit paths
      '/audit': '/seo/audit',
      '/seo-audit': '/seo/audit',
      '/aeo-audit': '/aeo',
      '/scan': '/aeo',

      // Analytics and dashboard legacy paths
      '/dashboard/analytics': '/analytics',
      '/admin': '/dashboard',

      // Contact and signup legacy paths
      '/contact-us': '/contact',
      '/get-started': '/signup',
      '/register': '/signup',
      '/login': '/signin',

      // Business and city legacy paths
      '/local-seo': '/dallas', // Redirect generic local SEO to Dallas (main city)
      '/texas-seo': '/dallas',
    };

    // Apply legacy redirects
    if (legacyRedirects[pathname]) {
      const newUrl = new URL(legacyRedirects[pathname], req.url);
      // Preserve query parameters
      newUrl.search = searchParams.toString();
      return NextResponse.redirect(newUrl, 301);
    }

    // Handle trailing slash inconsistencies (except for root)
    if (pathname !== '/' && pathname.endsWith('/')) {
      const newUrl = new URL(pathname.slice(0, -1), req.url);
      newUrl.search = searchParams.toString();
      return NextResponse.redirect(newUrl, 301);
    }

    // Additional security response headers
    const response = NextResponse.next();

    // Add security headers for HTTPS enforcement
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return response;

    // Add any additional middleware logic here if needed
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/checkout/:path*',
    '/aeo/results',
    '/seo/results',
    '/aeo-results/:path*',
  ],
};
