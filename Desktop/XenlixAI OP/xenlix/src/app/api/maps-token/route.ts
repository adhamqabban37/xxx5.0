import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Google Maps API key not configured',
          fallback: 'openstreetmap',
        },
        { status: 404 }
      );
    }

    // Basic API key validation (check format)
    if (!apiKey.startsWith('AIza') || apiKey.length < 30) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid Google Maps API key format',
          fallback: 'openstreetmap',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      apiKey: apiKey,
      libraries: ['places', 'geometry'],
      message: 'Google Maps API key available',
    });
  } catch (error) {
    console.error('[Maps Token] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        fallback: 'openstreetmap',
      },
      { status: 500 }
    );
  }
}
