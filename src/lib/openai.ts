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
    console.log('🔍 Starting hybrid OCR + fast analysis...');
    console.log('📊 Image data length:', imageBase64.length);

    // Validate base64 input
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      throw new Error('Invalid base64 image data provided');
    }

    console.log('🚀 Step 1: OCR text extraction...');

    // Step 1: Fast OCR to extract text
    const ocrResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extrahera all text från bilden. Returnera som ren text.`
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
      max_tokens: 200,
      temperature: 0,
    });

    const extractedText = ocrResponse.choices[0]?.message?.content || '';
    console.log('Extracted text:', extractedText.substring(0, 100) + '...');

    if (!extractedText.trim()) {
      throw new Error('Ingen text kunde extraheras från bilden');
    }

    console.log('🚀 Step 2: Fast question generation...');

    // Step 2: Generate questions from text (no image needed)
    const questionsResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `Text från bild: "${extractedText}"

Skapa 5 pedagogiska frågor baserat på texten. Returnera JSON:
{
  "subject": "identifierat ämne",
  "questions": [
    {
      "id": 1,
      "question": "fråga om innehållet",
      "options": ["rätt svar", "fel 1", "fel 2", "fel 3"],
      "correctAnswer": 0,
      "expectedAnswer": "rätt svar",
      "explanation": "förklaring"
    }
  ]
}`
        }
      ],
      max_tokens: 800,
      temperature: 0.3,
    });

    const questionsContent = questionsResponse.choices[0]?.message?.content;
    if (!questionsContent) {
      throw new Error('Kunde inte generera frågor från texten');
    }

    console.log('Questions response:', questionsContent.substring(0, 100) + '...');

    // Parse questions
    let result;
    try {
      let cleanContent = questionsContent.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      }
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      result = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Kunde inte tolka AI-svaret');
    }

    if (!result.questions || !Array.isArray(result.questions) || result.questions.length === 0) {
      throw new Error('Inga frågor genererades');
    }

    // Extract keywords from text
    const keywords = extractedText
      .split(/[,\s\n\.\!\?]+/)
      .filter(word => word.length > 3)
      .slice(0, 10);

    console.log('✅ Analysis complete!');
    console.log('Subject:', result.subject);
    console.log('Questions:', result.questions.length);
    console.log('Keywords:', keywords.length);

    return {
      subject: result.subject || "Textanalys",
      difficulty: "Medel",
      keywords,
      questions: result.questions
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

            OBS! Målordet kan innehålla flera alternativ separerade med komma, semikolon, eller "eller".
            T.ex. "hund, valp" eller "bil; fordon" eller "gå eller springa".
            Om målordet har flera alternativ räcker det att eleven svarar ETT av dem korrekt.

            Bedöm svaret enligt följande kriterier:
            1. Om svaret matchar ETT av alternativen i målordet → isCorrect: true, score: 90-100
            2. Om svaret är en korrekt översättning men inte något av målordsalternativen → isCorrect: false, isValidTranslation: true, score: 40-60
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

      // Final fallback: enhanced keyword matching with multiple alternatives
      const lowerAnswer = transcribedAnswer.toLowerCase().trim();

      // Split expected answer by common separators to handle multiple valid answers
      const expectedAlternatives = expectedAnswer.toLowerCase()
        .split(/[,;]|\s+eller\s+|\s+or\s+|\s*\/\s*/)
        .map(alt => alt.trim())
        .filter(alt => alt.length > 0);

      // Check if the answer matches any of the alternatives
      const isCorrect = expectedAlternatives.some(alternative => {
        return lowerAnswer.includes(alternative) ||
               alternative.includes(lowerAnswer) ||
               lowerAnswer === alternative;
      });

      const score = isCorrect ? 85 : 30;
      const feedback = isCorrect
        ? "Bra jobbat! Ditt svar är korrekt."
        : expectedAlternatives.length > 1
          ? `Inte helt rätt. Rätt svar kan vara: ${expectedAlternatives.join(' eller ')}. Försök igen!`
          : `Inte helt rätt. Rätt svar är: ${expectedAnswer}. Försök igen!`;

      return {
        isCorrect,
        feedback,
        score
      };
    }
  }
}