import { NextRequest, NextResponse } from 'next/server';
import { HuggingFaceClient } from '@/lib/huggingface-client';

export async function GET() {
  try {
    console.log('🧪 Testing HuggingFace integration...');

    const hfClient = HuggingFaceClient.getInstance();

    // Test health check
    const health = await hfClient.healthCheck();
    console.log('Health check result:', health);

    return NextResponse.json({
      success: true,
      health: health,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ HuggingFace test failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { texts } = await request.json();

    if (!texts || !Array.isArray(texts)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please provide an array of texts to test embedding generation',
        },
        { status: 400 }
      );
    }

    console.log('🧪 Testing HuggingFace embedding generation...');

    const hfClient = HuggingFaceClient.getInstance();

    // Test embedding generation
    const embeddings = await hfClient.generateEmbeddings(texts);
    console.log('Embedding generation result:', {
      inputTexts: texts.length,
      outputEmbeddings: embeddings.embeddings?.length || 0,
      model: embeddings.model,
    });

    return NextResponse.json({
      success: true,
      embeddings: embeddings,
      inputCount: texts.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ HuggingFace embedding test failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
