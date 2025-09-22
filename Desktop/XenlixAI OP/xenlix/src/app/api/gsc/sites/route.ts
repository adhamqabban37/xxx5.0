// API endpoint for Google Search Console sites/properties
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { GSCClient } from '@/lib/gsc-client';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check for Google OAuth tokens
    if (!session.accessToken) {
      return NextResponse.json(
        { 
          error: 'GSC_AUTH_REQUIRED',
          message: 'Google Search Console authentication required. Please sign in with Google.',
          authUrl: '/api/auth/signin?provider=google'
        },
        { status: 401 }
      );
    }

    // Initialize GSC client
    const gscClient = new GSCClient({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
    });

    try {
      // Get user's Search Console properties
      const sites = await gscClient.getSites();
      
      // Filter to only verified properties with at least restricted access
      const verifiedSites = sites.filter(site => 
        ['siteFullUser', 'siteOwner', 'siteRestrictedUser'].includes(site.permissionLevel)
      );

      // Enhance site data with additional metadata
      const enhancedSites = verifiedSites.map(site => ({
        siteUrl: site.siteUrl,
        permissionLevel: site.permissionLevel,
        displayName: formatSiteDisplayName(site.siteUrl),
        siteType: getSiteType(site.siteUrl),
        isCurrentSite: isCurrentSite(site.siteUrl),
      }));

      // Sort sites - current site first, then by permission level, then alphabetically
      enhancedSites.sort((a, b) => {
        if (a.isCurrentSite && !b.isCurrentSite) return -1;
        if (!a.isCurrentSite && b.isCurrentSite) return 1;
        
        const permissionOrder = { 'siteOwner': 0, 'siteFullUser': 1, 'siteRestrictedUser': 2 };
        const aOrder = permissionOrder[a.permissionLevel as keyof typeof permissionOrder] ?? 3;
        const bOrder = permissionOrder[b.permissionLevel as keyof typeof permissionOrder] ?? 3;
        
        if (aOrder !== bOrder) return aOrder - bOrder;
        
        return a.displayName.localeCompare(b.displayName);
      });

      return NextResponse.json({
        sites: enhancedSites,
        totalCount: enhancedSites.length,
        userEmail: session.user.email,
        hasAccess: enhancedSites.length > 0,
      });

    } catch (error) {
      // Handle specific GSC API errors
      if (error instanceof Error) {
        if (error.message === 'GSC_AUTH_REQUIRED') {
          return NextResponse.json(
            { 
              error: 'GSC_AUTH_REQUIRED',
              message: 'Google Search Console authentication has expired. Please re-authenticate.',
              authUrl: '/api/auth/signin?provider=google'
            },
            { status: 401 }
          );
        }
        
        if (error.message === 'GSC_PERMISSION_DENIED') {
          return NextResponse.json(
            { 
              error: 'GSC_PERMISSION_DENIED',
              message: 'Access denied to Google Search Console. Please ensure you have the correct permissions.',
              sites: [],
              totalCount: 0,
              hasAccess: false,
            },
            { status: 403 }
          );
        }
      }

      console.error('GSC sites API error:', error);
      return NextResponse.json(
        { 
          error: 'GSC_API_ERROR',
          message: 'Failed to fetch Search Console properties. Please try again later.',
          sites: [],
          totalCount: 0,
          hasAccess: false,
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('GSC sites endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to format site display name
function formatSiteDisplayName(siteUrl: string): string {
  try {
    // Handle domain properties (sc-domain:example.com)
    if (siteUrl.startsWith('sc-domain:')) {
      return siteUrl.replace('sc-domain:', '') + ' (Domain Property)';
    }
    
    // Handle URL-prefix properties (https://example.com/)
    const url = new URL(siteUrl);
    let displayName = url.hostname;
    
    // Remove www. prefix for cleaner display
    if (displayName.startsWith('www.')) {
      displayName = displayName.substring(4);
    }
    
    // Add path if it's not just root
    if (url.pathname && url.pathname !== '/') {
      displayName += url.pathname;
    }
    
    return displayName + ' (URL Prefix)';
  } catch {
    // Fallback for invalid URLs
    return siteUrl;
  }
}

// Helper function to determine site type
function getSiteType(siteUrl: string): 'domain' | 'url-prefix' {
  return siteUrl.startsWith('sc-domain:') ? 'domain' : 'url-prefix';
}

// Helper function to check if this is the current site
function isCurrentSite(siteUrl: string): boolean {
  const currentSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.xenlixai.com';
  
  try {
    // Handle domain properties
    if (siteUrl.startsWith('sc-domain:')) {
      const domain = siteUrl.replace('sc-domain:', '');
      const currentDomain = new URL(currentSiteUrl).hostname.replace('www.', '');
      return domain === currentDomain || domain === `www.${currentDomain}`;
    }
    
    // Handle URL-prefix properties
    const normalizedSiteUrl = siteUrl.endsWith('/') ? siteUrl : siteUrl + '/';
    const normalizedCurrentUrl = currentSiteUrl.endsWith('/') ? currentSiteUrl : currentSiteUrl + '/';
    
    return normalizedSiteUrl === normalizedCurrentUrl;
  } catch {
    return false;
  }
}