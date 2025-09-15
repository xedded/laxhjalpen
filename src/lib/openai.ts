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
}

export async function analyzeHomeworkImage(imageBase64: string): Promise<{
  questions: Question[];
  subject: string;
  difficulty: string;
}> {
  try {
    console.log('Attempting GPT-4o-mini Vision analysis...');

    // Try GPT-4 Vision first with optimized settings
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using faster mini model for better timeout handling
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analysera denna läxbild snabbt och skapa 5 frågor baserat på innehållet.

              Returnera JSON:
              {
                "subject": "ämne",
                "difficulty": "Medel",
                "questions": [
                  {
                    "id": 1,
                    "question": "fråga",
                    "options": ["alt1", "alt2", "alt3", "alt4"],
                    "correctAnswer": 0,
                    "expectedAnswer": "kort svar",
                    "explanation": "kort förklaring"
                  }
                ]
              }

              Skapa 5 korta svenska frågor baserat på bildens text/innehåll.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: "low" // Using low detail for faster processing
              }
            }
          ]
        }
      ],
      max_tokens: 1000, // Reduced for faster response
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Inget svar från OpenAI');
    }

    console.log('GPT-4o-mini Vision response received, length:', content.length);

    // Parse JSON response
    const result = JSON.parse(content);

    // Validate structure
    if (!result.questions || !Array.isArray(result.questions) || result.questions.length === 0) {
      throw new Error('Felaktig struktur i AI-svaret');
    }

    console.log('GPT-4o-mini Vision analysis successful, questions generated:', result.questions.length);
    return result;
  } catch (error) {
    console.error('Error analyzing image with GPT-4o-mini Vision, falling back to GPT-3.5:', error);

    // Fallback to GPT-3.5 with generic text analysis
    try {
      console.log('Attempting GPT-3.5 fallback...');

      const fallbackResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Du är en pedagogisk assistent som skapar frågor för svenska elever baserat på läxmaterial."
          },
          {
            role: "user",
            content: `Skapa 5 korta pedagogiska frågor för svenska grundskoleelever.

            Returnera JSON:
            {
              "subject": "Allmänkunskap",
              "difficulty": "Medel",
              "questions": [
                {
                  "id": 1,
                  "question": "kort fråga",
                  "options": ["alt1", "alt2", "alt3", "alt4"],
                  "correctAnswer": 0,
                  "expectedAnswer": "svar",
                  "explanation": "förklaring"
                }
              ]
            }

            Fokusera på matematik, svenska, allmänkunskap.`
          }
        ],
        max_tokens: 1500,
        temperature: 0.4,
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
  expectedAnswer: string
): Promise<{
  isCorrect: boolean;
  feedback: string;
  score: number; // 0-100
}> {
  try {
    // Try GPT-4 first for best quality feedback
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Du är en pedagogisk AI-assistent som bedömer elevers muntliga svar.
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
  "score": nummer mellan 0-100
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