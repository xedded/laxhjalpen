import { NextRequest, NextResponse } from 'next/server';
import { analyzeHomeworkImage } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      console.error('No image provided');
      return NextResponse.json(
        { error: 'Bild krävs' },
        { status: 400 }
      );
    }

    // Remove data:image/jpeg;base64, prefix if present
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    console.log('🔍 Starting image analysis');
    console.log('📊 Base64 data length:', base64Data.length);
    console.log('📸 Estimated image size:', Math.round((base64Data.length * 3) / (4 * 1024)), 'KB');

    const analysis = await analyzeHomeworkImage(base64Data);

    console.log('✅ Image analysis completed successfully!');
    console.log('📚 Subject identified:', analysis.subject);
    console.log('❓ Questions generated:', analysis.questions.length);
    console.log('🗣️ Is vocabulary:', analysis.isVocabulary || false);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Image analysis error in route:', error);

    // Return detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';

    console.error('Error details:', { message: errorMessage, stack: errorStack });

    return NextResponse.json(
      {
        error: 'Kunde inte analysera bilden',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}