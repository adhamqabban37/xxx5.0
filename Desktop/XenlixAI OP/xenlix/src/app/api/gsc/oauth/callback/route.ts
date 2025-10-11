/**
 * Google Search Console OAuth Callback Route
 *
 * Handles OAuth callback and stores encrypted tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';
import { encryptToken } from '@/lib/google-token-encryption';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(new URL('/dashboard?gsc_error=access_denied', request.url));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/dashboard?gsc_error=invalid_request', request.url));
    }

    // Parse state parameter
    let stateData;
    try {
      stateData = JSON.parse(state);
    } catch {
      return NextResponse.redirect(new URL('/dashboard?gsc_error=invalid_state', request.url));
    }

    const { userEmail, timestamp } = stateData;

    // Check state timestamp (prevent replay attacks)
    const stateAge = Date.now() - timestamp;
    if (stateAge > 10 * 60 * 1000) {
      // 10 minutes
      return NextResponse.redirect(new URL('/dashboard?gsc_error=expired_state', request.url));
    }

    // Validate environment variables
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      console.error('Missing Google OAuth environment variables');
      return NextResponse.redirect(
        new URL('/dashboard?gsc_error=configuration_error', request.url)
      );
    }

    // Exchange code for tokens
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      throw new Error('No access token received from Google');
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      return NextResponse.redirect(new URL('/dashboard?gsc_error=user_not_found', request.url));
    }

    // Encrypt tokens
    const encryptedAccessToken = await encryptToken(tokens.access_token);
    const encryptedRefreshToken = tokens.refresh_token
      ? await encryptToken(tokens.refresh_token)
      : null;

    // Get verified sites using the new access token
    oauth2Client.setCredentials(tokens);
    const webmasters = google.webmasters({ version: 'v3', auth: oauth2Client });

    let verifiedSites: string[] = [];
    try {
      const sitesResponse = await webmasters.sites.list();
      verifiedSites = sitesResponse.data.siteEntry?.map((site) => site.siteUrl || '') || [];
    } catch (error) {
      console.warn('Failed to fetch verified sites:', error);
      // Continue without sites - they'll be fetched later
    }

    // Store encrypted tokens in database
    await prisma.googleTokens.upsert({
      where: { userId: user.id },
      update: {
        encryptedAccessToken,
        encryptedRefreshToken,
        tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        grantedScopes: tokens.scope || 'https://www.googleapis.com/auth/webmasters.readonly',
        verifiedSites: verifiedSites,
        lastUsedAt: new Date(),
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        encryptedAccessToken,
        encryptedRefreshToken,
        tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        grantedScopes: tokens.scope || 'https://www.googleapis.com/auth/webmasters.readonly',
        verifiedSites: verifiedSites,
        connectedAt: new Date(),
        lastUsedAt: new Date(),
      },
    });

    console.log(
      `✅ GSC tokens stored for user: ${userEmail}, verified sites: ${verifiedSites.length}`
    );

    // Redirect back to dashboard with success
    return NextResponse.redirect(new URL('/dashboard?gsc_success=connected', request.url));
  } catch (error) {
    console.error('GSC OAuth callback error:', error);

    return NextResponse.redirect(new URL('/dashboard?gsc_error=callback_failed', request.url));
  }
}
