import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID,
});

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

    console.log('🔍 Starting fast OCR text extraction...');
    console.log('📊 Base64 data length:', base64Data.length);

    // Fast OCR to extract text only
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extrahera all text från bilden. Returnera som ren text, ordnad rad för rad.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Data}`,
                detail: "low"
              }
            }
          ]
        }
      ],
      max_tokens: 300,
      temperature: 0,
    });

    const extractedText = response.choices[0]?.message?.content || '';

    if (!extractedText.trim()) {
      throw new Error('Ingen text kunde extraheras från bilden');
    }

    console.log('✅ Text extraction completed successfully!');
    console.log('📄 Extracted text length:', extractedText.length);
    console.log('📝 Text preview:', extractedText.substring(0, 100) + '...');

    return NextResponse.json({
      text: extractedText,
      wordCount: extractedText.split(/\s+/).length,
      success: true
    });

  } catch (error) {
    console.error('Text extraction error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);

    return NextResponse.json(
      {
        error: 'Kunde inte extrahera text från bilden',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}