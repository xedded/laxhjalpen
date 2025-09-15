import { NextRequest, NextResponse } from 'next/server';
import { analyzeHomeworkImage } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Bild krävs' },
        { status: 400 }
      );
    }

    // Remove data:image/jpeg;base64, prefix if present
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const analysis = await analyzeHomeworkImage(base64Data);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Image analysis error:', error);
    return NextResponse.json(
      { error: 'Kunde inte analysera bilden' },
      { status: 500 }
    );
  }
}