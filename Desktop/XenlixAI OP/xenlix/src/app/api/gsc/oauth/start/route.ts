/**
 * Google Search Console OAuth Start Route
 *
 * Initiates OAuth flow for Google Search Console access
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate environment variables
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      console.error('Missing Google OAuth environment variables');
      return NextResponse.json(
        {
          error: 'Google OAuth not configured properly',
        },
        { status: 500 }
      );
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    // Generate authorization URL
    const scopes = ['https://www.googleapis.com/auth/webmasters.readonly'];

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent', // Force consent screen to get refresh token
      state: JSON.stringify({
        userEmail: session.user.email,
        timestamp: Date.now(),
      }),
    });

    console.log(`🚀 GSC OAuth flow started for user: ${session.user.email}`);

    return NextResponse.json({
      success: true,
      authUrl: url,
      message: 'Redirect to Google for authorization',
    });
  } catch (error) {
    console.error('GSC OAuth start error:', error);

    return NextResponse.json(
      {
        error: 'Failed to start OAuth flow',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
