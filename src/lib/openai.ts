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
    console.log('Attempting GPT-4o Vision analysis...');

    // Validate base64 input
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      throw new Error('Invalid base64 image data provided');
    }

    console.log('Making GPT-4o Vision API call...');

    // Try GPT-4o Vision with comprehensive error handling
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analysera denna läxbild och identifiera ämnet och skapa relevanta frågor.

              VIKTIGT: Returnera enbart giltig JSON utan extra text:
              {
                "subject": "identifierat ämne (t.ex. Matematik, Fysik, Historia, Svenska)",
                "difficulty": "Medel",
                "questions": [
                  {
                    "id": 1,
                    "question": "specifik fråga baserat på bildinnehållet",
                    "options": ["svar1", "svar2", "svar3", "svar4"],
                    "correctAnswer": 0,
                    "expectedAnswer": "kort svar",
                    "explanation": "förklaring"
                  }
                ]
              }

              Skapa exakt 5 frågor baserat på vad du ser i bilden. Om du ser text, math-problem, diagram etc, basera frågorna på det specifika innehållet.`
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
      max_tokens: 1500,
      temperature: 0.1,
    });

    console.log('GPT-4o Vision API call completed successfully');

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Inget svar från OpenAI');
    }

    console.log('GPT-4o Vision response received, length:', content.length);
    console.log('Raw response content:', content.substring(0, 200) + '...');

    // Clean and parse JSON response
    let cleanContent = content.trim();
    // Remove potential markdown code blocks
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
      console.error('Failed to parse content:', cleanContent);
      throw new Error(`JSON parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
    }

    // Validate structure
    if (!result.questions || !Array.isArray(result.questions) || result.questions.length === 0) {
      console.error('Invalid result structure:', result);
      throw new Error('Felaktig struktur i AI-svaret');
    }

    console.log('GPT-4o Vision analysis successful!');
    console.log('Subject identified:', result.subject);
    console.log('Questions generated:', result.questions.length);
    console.log('First question:', result.questions[0]?.question);

    return result;
  } catch (error) {
    console.error('Error analyzing image with GPT-4o Vision:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      type: typeof error,
      errorObject: error
    });
    console.log('Falling back to GPT-3.5...');

    // Fallback to GPT-3.5 with generic text analysis
    try {
      console.log('Attempting GPT-3.5 fallback...');

      // Since Vision failed, we'll create subject-agnostic questions that could work for most homework
      const fallbackResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Du är en pedagogisk assistent. Skapa frågor som kan hjälpa elever träna studieteknik och förståelse."
          },
          {
            role: "user",
            content: `Bilden kunde inte analyseras med Vision AI. Skapa 5 studieteknik-frågor som hjälper eleven träna:

            Returnera JSON:
            {
              "subject": "Studieteknik",
              "difficulty": "Medel",
              "questions": [
                {
                  "id": 1,
                  "question": "Vad är ett bra sätt att sammanfatta det du lärt dig?",
                  "options": ["Bara läsa igen", "Skriva egna anteckningar", "Titta på telefonen", "Hoppa över"],
                  "correctAnswer": 1,
                  "expectedAnswer": "skriva egna anteckningar",
                  "explanation": "Att skriva egna sammanfattningar hjälper hjärnan att bearbeta informationen"
                }
              ]
            }

            Fokusera på hur man lär sig effektivt, lästekniker, minnesmetoder och studievanor.`
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