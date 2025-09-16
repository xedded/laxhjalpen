import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID,
});

export interface Question {
  id: number;
  question: string;
  options?: string[];
  correctAnswer?: number;
  expectedAnswer?: string;
  explanation?: string;
  questionLanguage?: string;
  answerLanguage?: string;
  vocabularyPair?: {
    word1: string;
    word2: string;
    language1: string;
    language2: string;
  };
}

export async function analyzeHomeworkImage(imageBase64: string): Promise<{
  questions: Question[];
  subject: string;
  difficulty: string;
  keywords?: string[];
  language?: string;
  isVocabulary?: boolean;
  vocabularyLanguages?: string[];
  vocabularyPairs?: Array<{
    word1: string;
    word2: string;
    language1: string;
    language2: string;
  }>;
}> {
  try {
    console.log('🔍 Starting ultra-fast OCR analysis...');
    console.log('📊 Image data length:', imageBase64.length);

    // Validate base64 input
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      throw new Error('Invalid base64 image data provided');
    }

    console.log('🚀 Making single OCR API call...');

    // Ultra-minimal OCR approach for Vercel timeout
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Läs bara text från bilden. Returnera ord separerade med komma.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: "low"
              }
            }
          ]
        }
      ],
      max_tokens: 100,
      temperature: 0,
    });

    const content = response.choices[0]?.message?.content || '';
    console.log('OCR result:', content);

    // Extract keywords from the text
    const keywords = content
      .split(/[,\s\n]+/)
      .filter(word => word.length > 2)
      .slice(0, 8);

    console.log('Keywords extracted:', keywords);

    // Generate simple questions locally (no AI)
    const questions = keywords.slice(0, 5).map((keyword: string, index: number) => ({
      id: index + 1,
      question: `Vad betyder "${keyword}"?`,
      expectedAnswer: keyword,
      explanation: `Detta ord hittas i texten: ${keyword}`
    }));

    return {
      subject: "Textanalys",
      difficulty: "Lätt",
      keywords,
      questions
    };
  } catch (error) {
    console.error('❌ GPT-4o Vision analysis failed!');
    console.error('📋 Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      type: typeof error,
      isTimeoutError: error instanceof Error && (error.message.includes('timeout') || error.message.includes('AbortError')),
      isRateLimitError: error instanceof Error && error.message.includes('rate_limit'),
      isContentError: error instanceof Error && error.message.includes('content_policy')
    });

    // Check if it's a timeout or rate limit issue
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('AbortError')) {
        console.log('⏰ Vision API timeout - image might be too complex or service overloaded');
      } else if (error.message.includes('rate_limit')) {
        console.log('🚦 Rate limit hit - too many requests');
      } else if (error.message.includes('content_policy')) {
        console.log('🚫 Content policy violation');
      } else {
        console.log('🔧 Other API error:', error.message);
      }
    }

    console.log('🔄 Falling back to GPT-3.5 (no vision)...');

    // Fallback to GPT-3.5 with generic text analysis
    try {
      console.log('Attempting GPT-3.5 fallback...');

      // Create educational questions without image analysis
      console.log('💡 Creating educational questions without image analysis...');
      const fallbackResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Du är en pedagogisk assistent som skapar lämpliga frågor för grundskoleelever. Skapa varierade, pedagogiska frågor inom olika ämnen."
          },
          {
            role: "user",
            content: `Bildanalysen misslyckades, men skapa ändå 10 bra pedagogiska frågor för en svensk grundskoleelev.

            Returnera JSON:
            {
              "subject": "Allmänbildning",
              "difficulty": "Medel",
              "isVocabulary": false,
              "questions": [
                {
                  "id": 1,
                  "question": "pedagogisk fråga inom matematik, svenska, naturvetenskap eller historia",
                  "options": ["alternativ 1", "alternativ 2", "alternativ 3", "alternativ 4"],
                  "correctAnswer": 0,
                  "expectedAnswer": "kort svar",
                  "explanation": "pedagogisk förklaring"
                }
              ]
            }

            Skapa varierande frågor inom olika ämnen som matematik, svenska, naturvetenskap, geografi och historia. Gör dem lämpliga för ålder 10-15 år.`
          }
        ],
        max_tokens: 1500,
        temperature: 0.3,
      });

      const fallbackContent = fallbackResponse.choices[0]?.message?.content;
      if (!fallbackContent) {
        throw new Error('Inget svar från fallback-modell');
      }

      console.log('GPT-3.5 fallback successful');
      return JSON.parse(fallbackContent);
    } catch (fallbackError) {
      console.error('GPT-3.5 fallback also failed, using demo questions:', fallbackError);

      // Final fallback to demo questions
      const demoQuestions: Question[] = [
        {
          id: 1,
          question: "Vad är 7 + 5?",
          options: ["10", "11", "12", "13"],
          correctAnswer: 2,
          expectedAnswer: "tolv",
          explanation: "7 + 5 = 12"
        },
        {
          id: 2,
          question: "Vilken planet är närmast solen?",
          options: ["Venus", "Merkurius", "Mars", "Jorden"],
          correctAnswer: 1,
          expectedAnswer: "Merkurius",
          explanation: "Merkurius ligger närmast solen"
        },
        {
          id: 3,
          question: "Hur många sidor har en triangel?",
          options: ["2", "3", "4", "5"],
          correctAnswer: 1,
          expectedAnswer: "tre",
          explanation: "En triangel har alltid tre sidor"
        },
        {
          id: 4,
          question: "Vad är huvudstaden i Norge?",
          options: ["Bergen", "Trondheim", "Oslo", "Stavanger"],
          correctAnswer: 2,
          expectedAnswer: "Oslo",
          explanation: "Oslo är Norges huvudstad"
        },
        {
          id: 5,
          question: "Vad blir 4 × 6?",
          options: ["20", "22", "24", "26"],
          correctAnswer: 2,
          expectedAnswer: "tjugofyra",
          explanation: "4 × 6 = 24"
        },
        {
          id: 6,
          question: "Vilket år upptäcktes Amerika?",
          options: ["1490", "1491", "1492", "1493"],
          correctAnswer: 2,
          expectedAnswer: "fjortonhundranittiotvå",
          explanation: "Kristofer Columbus kom till Amerika 1492"
        },
        {
          id: 7,
          question: "Vad kallas djur som äter både växter och kött?",
          options: ["Köttätare", "Växtätare", "Allätare", "Fiskätare"],
          correctAnswer: 2,
          expectedAnswer: "allätare",
          explanation: "Allätare äter både växter och kött"
        },
        {
          id: 8,
          question: "Hur många månader har 31 dagar?",
          options: ["5", "6", "7", "8"],
          correctAnswer: 2,
          expectedAnswer: "sju",
          explanation: "Jan, mars, maj, juli, aug, okt, dec har 31 dagar"
        },
        {
          id: 9,
          question: "Vad heter Sveriges huvudstad?",
          options: ["Göteborg", "Stockholm", "Malmö", "Uppsala"],
          correctAnswer: 1,
          expectedAnswer: "Stockholm",
          explanation: "Stockholm är Sveriges huvudstad"
        },
        {
          id: 10,
          question: "Vad blir 12 ÷ 3?",
          options: ["3", "4", "5", "6"],
          correctAnswer: 1,
          expectedAnswer: "fyra",
          explanation: "12 delat med 3 är 4"
        }
      ];

      return {
        questions: demoQuestions,
        subject: "Allmänkunskap",
        difficulty: "Medel"
      };
    }
  }
}

export async function analyzeOralAnswer(
  question: string,
  transcribedAnswer: string,
  expectedAnswer: string,
  questionLanguage: string = 'svenska',
  answerLanguage: string = 'svenska',
  vocabularyPair?: {
    word1: string;
    word2: string;
    language1: string;
    language2: string;
  }
): Promise<{
  isCorrect: boolean;
  feedback: string;
  score: number; // 0-100
  isValidTranslation?: boolean; // true if it's a correct translation but not the target word
}> {
  try {
    // Try GPT-4 first for best quality feedback
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Du är en pedagogisk AI-assistent som bedömer elevers muntliga svar.
          Frågan är på ${questionLanguage} och svaret förväntas vara på ${answerLanguage}.

          ${vocabularyPair ?
            `VIKTIGT: Detta är en glosfråga baserad på exakt ordpar från elevens läxbild.
            Målordet från glosorna: "${expectedAnswer}" (från ordparet: ${vocabularyPair.word1} ↔ ${vocabularyPair.word2})

            Bedöm svaret enligt följande kriterier:
            1. Om svaret är exakt målordet eller mycket nära variant (plural/singular) → isCorrect: true, score: 90-100
            2. Om svaret är en korrekt översättning men INTE målordet → isCorrect: false, isValidTranslation: true, score: 40-60
            3. Om svaret är helt fel → isCorrect: false, isValidTranslation: false, score: 0-30

            För scenario 2, ge pedagogisk feedback som förklarar att svaret är en bra översättning men inte det ord eleven ska lära sig från glosorna.`
            :
            'För icke-glosfrågor, acceptera korrekta svar och nära varianter.'
          }

          Ge konstruktiv feedback på svenska och bedöm svaret på en skala 0-100.
          Var uppmuntrande men ärlig i din bedömning.`
        },
        {
          role: "user",
          content: `Fråga: ${question}

Elevens svar: ${transcribedAnswer}

Förväntat svar: ${expectedAnswer}

Bedöm elevens svar och returnera JSON:
{
  "isCorrect": true/false,
  "feedback": "pedagogisk feedback på svenska",
  "score": nummer mellan 0-100,
  "isValidTranslation": true/false // endast för glosfrågor där svaret är korrekt översättning men inte målordet
}

Kriterier för bedömning:
- Helt rätt svar: 90-100p
- Mestadels rätt: 70-89p
- Delvis rätt: 50-69p
- Nära men fel: 30-49p
- Helt fel: 0-29p`
        }
      ],
      max_tokens: 300,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Inget svar från OpenAI');
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Error with GPT-4, falling back to GPT-3.5:', error);

    // Fallback to GPT-3.5
    try {
      const fallbackResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `Du bedömer elevers svar. Ge feedback på svenska och poäng 0-100.`
          },
          {
            role: "user",
            content: `Fråga: ${question}
Elevens svar: ${transcribedAnswer}
Rätt svar: ${expectedAnswer}

Returnera JSON med isCorrect (boolean), feedback (text) och score (0-100).`
          }
        ],
        max_tokens: 200,
        temperature: 0.3,
      });

      const fallbackContent = fallbackResponse.choices[0]?.message?.content;
      if (!fallbackContent) {
        throw new Error('Inget svar från fallback');
      }

      return JSON.parse(fallbackContent);
    } catch (fallbackError) {
      console.error('All AI models failed, using keyword matching:', fallbackError);

      // Final fallback: simple keyword matching
      const lowerAnswer = transcribedAnswer.toLowerCase();
      const lowerExpected = expectedAnswer.toLowerCase();

      const isCorrect = lowerAnswer.includes(lowerExpected) ||
                       lowerExpected.includes(lowerAnswer) ||
                       lowerAnswer === lowerExpected;

      const score = isCorrect ? 85 : 30;
      const feedback = isCorrect
        ? "Bra jobbat! Ditt svar är korrekt."
        : `Inte helt rätt. Rätt svar är: ${expectedAnswer}. Försök igen!`;

      return {
        isCorrect,
        feedback,
        score
      };
    }
  }
}