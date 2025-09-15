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
    // Try GPT-4 Vision first
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analysera denna läxbild och skapa 10 frågor baserat på innehållet.

              Returnera resultatet som JSON med denna struktur:
              {
                "subject": "ämne på svenska (t.ex. Matematik, Svenska, Historia)",
                "difficulty": "svårighetsgrad (Lätt, Medel, Svår)",
                "questions": [
                  {
                    "id": 1,
                    "question": "frågan på svenska",
                    "options": ["alternativ 1", "alternativ 2", "alternativ 3", "alternativ 4"],
                    "correctAnswer": 0,
                    "expectedAnswer": "förväntat svar för muntligt förhör",
                    "explanation": "förklaring av svaret"
                  }
                ]
              }

              Instruktioner:
              - Skapa exakt 10 frågor
              - Alla frågor ska vara på svenska
              - För flervalsfrågor: lägg till 4 alternativ, ange rätt svar som index (0-3)
              - För muntliga svar: expectedAnswer ska vara det förväntade svaret
              - Anpassa svårighetsgrad efter innehållet
              - Fokusera på det viktigaste innehållet i bilden`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Inget svar från OpenAI');
    }

    // Parse JSON response
    const result = JSON.parse(content);

    // Validate structure
    if (!result.questions || !Array.isArray(result.questions) || result.questions.length === 0) {
      throw new Error('Felaktig struktur i AI-svaret');
    }

    return result;
  } catch (error) {
    console.error('Error analyzing image with GPT-4 Vision, falling back to GPT-3.5:', error);

    // Fallback to GPT-3.5 with generic text analysis
    try {
      const fallbackResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Du är en pedagogisk assistent som skapar frågor för svenska elever baserat på läxmaterial."
          },
          {
            role: "user",
            content: `Skapa 10 pedagogiska frågor för svenska grundskoleelever.

            Returnera JSON med denna struktur:
            {
              "subject": "Allmänkunskap",
              "difficulty": "Medel",
              "questions": [
                {
                  "id": 1,
                  "question": "fråga på svenska",
                  "options": ["alt1", "alt2", "alt3", "alt4"],
                  "correctAnswer": 0,
                  "expectedAnswer": "kort svar",
                  "explanation": "förklaring"
                }
              ]
            }

            Fokusera på grundläggande kunskaper inom matematik, svenska och allmänkunskap.`
          }
        ],
        max_tokens: 1500,
        temperature: 0.4,
      });

      const fallbackContent = fallbackResponse.choices[0]?.message?.content;
      if (!fallbackContent) {
        throw new Error('Inget svar från fallback-modell');
      }

      return JSON.parse(fallbackContent);
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);

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
          explanation: "Merkurius är den planet som ligger närmast solen"
        },
        {
          id: 3,
          question: "Vad kallas en grupp fåglar?",
          options: ["Hjord", "Flock", "Skara", "Hop"],
          correctAnswer: 1,
          expectedAnswer: "flock",
          explanation: "En grupp fåglar kallas flock"
        },
        {
          id: 4,
          question: "Hur många sidor har en triangel?",
          options: ["2", "3", "4", "5"],
          correctAnswer: 1,
          expectedAnswer: "tre",
          explanation: "En triangel har alltid tre sidor"
        },
        {
          id: 5,
          question: "Vad är huvudstaden i Norge?",
          options: ["Bergen", "Trondheim", "Oslo", "Stavanger"],
          correctAnswer: 2,
          expectedAnswer: "Oslo",
          explanation: "Oslo är Norges huvudstad"
        },
        {
          id: 6,
          question: "Vad är 15 ÷ 3?",
          options: ["3", "4", "5", "6"],
          correctAnswer: 2,
          expectedAnswer: "fem",
          explanation: "15 ÷ 3 = 5"
        },
        {
          id: 7,
          question: "Vilket organ pumpar blod i kroppen?",
          options: ["Lungor", "Hjärta", "Lever", "Njurar"],
          correctAnswer: 1,
          expectedAnswer: "hjärtat",
          explanation: "Hjärtat pumpar blod genom kroppen"
        },
        {
          id: 8,
          question: "Vad kallas den längsta floden i Sverige?",
          options: ["Dalälven", "Göta älv", "Klarälven", "Torneälv"],
          correctAnswer: 0,
          expectedAnswer: "Dalälven",
          explanation: "Dalälven är Sveriges längsta flod"
        },
        {
          id: 9,
          question: "Hur många ben har en spindel?",
          options: ["6", "7", "8", "10"],
          correctAnswer: 2,
          expectedAnswer: "åtta",
          explanation: "Spindlar har åtta ben"
        },
        {
          id: 10,
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