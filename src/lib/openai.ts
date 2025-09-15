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
    // For now, return demo questions since GPT-4 Vision requires billing
    // TODO: Replace with actual image analysis when billing is set up
    console.log('Using demo mode - no image analysis performed');

    const demoQuestions: Question[] = [
      {
        id: 1,
        question: "Vad är 5 + 3?",
        options: ["6", "7", "8", "9"],
        correctAnswer: 2,
        expectedAnswer: "åtta",
        explanation: "5 + 3 = 8"
      },
      {
        id: 2,
        question: "Vilken färg får du om du blandar gul och blå?",
        options: ["Grön", "Lila", "Orange", "Rosa"],
        correctAnswer: 0,
        expectedAnswer: "grön",
        explanation: "Gul + blå = grön"
      },
      {
        id: 3,
        question: "Hur många dagar har en vecka?",
        options: ["5", "6", "7", "8"],
        correctAnswer: 2,
        expectedAnswer: "sju",
        explanation: "En vecka har 7 dagar"
      },
      {
        id: 4,
        question: "Vad heter Sveriges huvudstad?",
        options: ["Göteborg", "Stockholm", "Malmö", "Uppsala"],
        correctAnswer: 1,
        expectedAnswer: "Stockholm",
        explanation: "Stockholm är Sveriges huvudstad"
      },
      {
        id: 5,
        question: "Vad är 10 - 4?",
        options: ["5", "6", "7", "8"],
        correctAnswer: 1,
        expectedAnswer: "sex",
        explanation: "10 - 4 = 6"
      },
      {
        id: 6,
        question: "Vilket djur säger 'muu'?",
        options: ["Hund", "Katt", "Ko", "Gris"],
        correctAnswer: 2,
        expectedAnswer: "ko",
        explanation: "Kor säger 'muu'"
      },
      {
        id: 7,
        question: "Hur många månader har ett år?",
        options: ["10", "11", "12", "13"],
        correctAnswer: 2,
        expectedAnswer: "tolv",
        explanation: "Ett år har 12 månader"
      },
      {
        id: 8,
        question: "Vad är 2 × 4?",
        options: ["6", "7", "8", "9"],
        correctAnswer: 2,
        expectedAnswer: "åtta",
        explanation: "2 × 4 = 8"
      },
      {
        id: 9,
        question: "Vilken säsong kommer efter sommaren?",
        options: ["Vinter", "Vår", "Höst", "Sommar"],
        correctAnswer: 2,
        expectedAnswer: "höst",
        explanation: "Hösten kommer efter sommaren"
      },
      {
        id: 10,
        question: "Vad används för att skriva på tavlan?",
        options: ["Penna", "Krita", "Pensel", "Suddgummi"],
        correctAnswer: 1,
        expectedAnswer: "krita",
        explanation: "Krita används för att skriva på tavlan"
      }
    ];

    return {
      questions: demoQuestions,
      subject: "Allmänkunskap",
      difficulty: "Lätt"
    };

    /* Original GPT-4 Vision code - uncomment when billing is set up:
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
    */
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
      model: "gpt-3.5-turbo", // Using cheaper model
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
    // Fallback response with simple keyword matching
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