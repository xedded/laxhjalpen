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
    console.error('Error analyzing image:', error);
    throw new Error('Kunde inte analysera bilden. Försök igen.');
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
    console.error('Error analyzing oral answer:', error);
    // Fallback response
    return {
      isCorrect: false,
      feedback: "Kunde inte analysera svaret just nu. Försök igen.",
      score: 0
    };
  }
}