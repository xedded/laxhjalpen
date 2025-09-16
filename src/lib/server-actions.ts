'use server';

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID,
});

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  expectedAnswer: string;
  explanation: string;
}

interface AnalysisResult {
  subject: string;
  difficulty: string;
  questions: Question[];
  keywords: string[];
  language: string;
  isVocabulary: boolean;
}

export async function extractTextFromImage(imageBase64: string): Promise<{
  text: string;
  wordCount: number;
  success: boolean;
  error?: string;
}> {
  try {
    // Remove data:image/jpeg;base64, prefix if present
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    console.log('🔍 Starting server action OCR text extraction...');
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

    console.log('✅ Server action text extraction completed!');
    console.log('📄 Extracted text length:', extractedText.length);

    return {
      text: extractedText,
      wordCount: extractedText.split(/\s+/).length,
      success: true
    };

  } catch (error) {
    console.error('Server action text extraction error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      text: '',
      wordCount: 0,
      success: false,
      error: errorMessage
    };
  }
}

export async function generateQuestionsFromText(text: string): Promise<{
  result?: AnalysisResult;
  success: boolean;
  error?: string;
}> {
  try {
    if (!text || typeof text !== 'string') {
      throw new Error('Text krävs');
    }

    console.log('🔍 Starting server action question generation...');
    console.log('📊 Text length:', text.length);

    // Generate pedagogical questions from extracted text
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Du är en pedagogisk AI som skapar lämpliga frågor för svenska grundskoleelever baserat på textinnehåll."
        },
        {
          role: "user",
          content: `Text från elevens läxa: "${text}"

Skapa 5 pedagogiska frågor baserat på denna text. Frågorna ska vara lämpliga för grundskoleelever och testa förståelse av innehållet.

Returnera JSON:
{
  "subject": "identifierat ämne (t.ex. Matematik, Svenska, Historia, etc.)",
  "difficulty": "Lätt/Medel/Svår",
  "questions": [
    {
      "id": 1,
      "question": "tydlig fråga om textinnehållet",
      "options": ["rätt svar", "felaktigt alternativ 1", "felaktigt alternativ 2", "felaktigt alternativ 3"],
      "correctAnswer": 0,
      "expectedAnswer": "kort rätt svar",
      "explanation": "pedagogisk förklaring varför detta är rätt"
    }
  ]
}`
        }
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Inget svar från OpenAI');
    }

    // Clean and parse JSON response
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    }
    if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    let result;
    try {
      result = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('JSON parsing failed');
    }

    // Validate structure
    if (!result.questions || !Array.isArray(result.questions) || result.questions.length === 0) {
      throw new Error('Felaktig struktur i AI-svaret');
    }

    // Extract keywords from text
    const keywords = text
      .split(/[,\s\n\.\!\?]+/)
      .filter(word => word.length > 3)
      .slice(0, 10);

    console.log('✅ Server action question generation completed!');

    const analysisResult: AnalysisResult = {
      subject: result.subject || "Allmänbildning",
      difficulty: result.difficulty || "Medel",
      questions: result.questions,
      keywords,
      language: "svenska",
      isVocabulary: false
    };

    return {
      result: analysisResult,
      success: true
    };

  } catch (error) {
    console.error('Server action question generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Fallback to simple questions if AI fails
    if (text && text.length > 3) {
      try {
        const words = text.split(/\s+/).filter((word: string) => word.length > 3).slice(0, 5);
        const fallbackQuestions: Question[] = words.map((word: string, index: number) => ({
          id: index + 1,
          question: `Vad betyder "${word}"?`,
          options: [word, "Annat ord", "Tredje alternativ", "Fjärde alternativ"],
          correctAnswer: 0,
          expectedAnswer: word,
          explanation: `Detta ord finns i texten: ${word}`
        }));

        console.log('🔄 Using fallback questions from text');

        const fallbackResult: AnalysisResult = {
          subject: "Textanalys",
          difficulty: "Lätt",
          questions: fallbackQuestions,
          keywords: words,
          language: "svenska",
          isVocabulary: false
        };

        return {
          result: fallbackResult,
          success: true
        };
      } catch (fallbackError) {
        console.log('🔄 Fallback also failed');
      }
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}