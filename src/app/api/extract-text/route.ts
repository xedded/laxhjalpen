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

    console.log('🔍 Starting enhanced OCR text extraction...');
    console.log('📊 Base64 data length:', base64Data.length);

    // Enhanced OCR to extract comprehensive text
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extrahera ALL text från bilden noggrant och komplett. Inkludera:
- All huvudtext och brödtext
- Rubriker och underrubriker
- Bildtexter, faktarutor och sidotexter
- Punktlistor och numrerade listor
- Tabeller och diagram-text
- Fotnoter och referenser

Behåll textens struktur och organisation. Returnera som välformaterad text med tydlig hierarki.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Data}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 1500,
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