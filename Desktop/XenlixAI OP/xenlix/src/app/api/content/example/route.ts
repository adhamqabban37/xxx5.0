// Example API route demonstrating IndexNow auto-triggers
// This shows how to integrate IndexNow submissions when content changes

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { triggerServerSideIndexNow } from '@/lib/indexnow-triggers';

// Example: Content update API route
export async function PUT(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { url, content, type } = body;

    // Validate input
    if (!url || !content) {
      return NextResponse.json(
        { error: 'URL and content are required' },
        { status: 400 }
      );
    }

    // TODO: Update content in database
    // await updateContent(url, content);

    // Determine trigger priority based on content type
    const isHighPriority = type === 'homepage' || type === 'landing-page' || type === 'product-page';
    
    // Auto-trigger IndexNow submission
    await triggerServerSideIndexNow(url, {
      immediate: isHighPriority,
      priority: isHighPriority ? 'high' : 'normal',
      reason: 'updated'
    });

    return NextResponse.json({
      success: true,
      message: 'Content updated successfully',
      indexNowTriggered: true,
      url
    });

  } catch (error) {
    console.error('Content update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Example: Content creation API route
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { url, content, type } = body;

    if (!url || !content) {
      return NextResponse.json(
        { error: 'URL and content are required' },
        { status: 400 }
      );
    }

    // TODO: Create content in database
    // await createContent(url, content);

    // Auto-trigger IndexNow submission for new content (high priority)
    await triggerServerSideIndexNow(url, {
      immediate: true,
      priority: 'high',
      reason: 'created'
    });

    // If it's a new page, also submit sitemap
    if (type === 'page') {
      const sitemapUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`;
      await triggerServerSideIndexNow(sitemapUrl, {
        immediate: false,
        priority: 'normal',
        reason: 'updated'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Content created successfully',
      indexNowTriggered: true,
      url
    });

  } catch (error) {
    console.error('Content creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Example: Content deletion API route
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      );
    }

    // TODO: Delete content from database
    // await deleteContent(url);

    // Auto-trigger IndexNow submission for deleted content
    await triggerServerSideIndexNow(url, {
      immediate: true,
      priority: 'normal',
      reason: 'deleted'
    });

    // Update sitemap since page was removed
    const sitemapUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`;
    await triggerServerSideIndexNow(sitemapUrl, {
      immediate: false,
      priority: 'normal',
      reason: 'updated'
    });

    return NextResponse.json({
      success: true,
      message: 'Content deleted successfully',
      indexNowTriggered: true,
      url
    });

  } catch (error) {
    console.error('Content deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}