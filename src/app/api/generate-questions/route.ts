import { NextRequest, NextResponse } from 'next/server';
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

// Function to shuffle answer options and update correct answer index
function shuffleAnswerOptions(questions: Question[]): Question[] {
  return questions.map(question => {
    if (!question.options || question.options.length === 0) {
      return question;
    }

    // Find the correct answer text
    const correctAnswerText = question.options[question.correctAnswer];

    // Create array of options with their original indices
    const optionsWithIndex = question.options.map((option, index) => ({
      option,
      originalIndex: index
    }));

    // Shuffle the options array
    for (let i = optionsWithIndex.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [optionsWithIndex[i], optionsWithIndex[j]] = [optionsWithIndex[j], optionsWithIndex[i]];
    }

    // Extract shuffled options and find new correct answer index
    const shuffledOptions = optionsWithIndex.map(item => item.option);
    const newCorrectAnswerIndex = shuffledOptions.findIndex(option => option === correctAnswerText);

    return {
      ...question,
      options: shuffledOptions,
      correctAnswer: newCorrectAnswerIndex
    };
  });
}

export async function POST(request: NextRequest) {
  let text: string = '';

  try {
    const requestData = await request.json();
    text = requestData.text;

    if (!text || typeof text !== 'string') {
      console.error('No text provided');
      return NextResponse.json(
        { error: 'Text krävs' },
        { status: 400 }
      );
    }

    console.log('🔍 Starting question generation from text...');
    console.log('📊 Text length:', text.length);
    console.log('📝 Text preview:', text.substring(0, 100) + '...');

    // Generate comprehensive pedagogical questions from extracted text
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Du är en erfaren pedagog och lärare som är expert på att skapa engagerande och lärorika frågor för svenska grundskole- och gymnasieelever. Du skapar varierade frågor som verkligen testar förståelse och uppmuntrar reflektion.`
        },
        {
          role: "user",
          content: `Analysera följande text från elevens läxa och skapa 8 faktafrågor:

"${text}"

INSTRUKTIONER FÖR FAKTAFRÅGOR:
• Alla frågor ska vara direkta faktafrågor där svaren finns explicit i texten
• Frågorna ska vara formulerade så att svaret kan ges i 1-3 ord (för muntligt förhör)
• Fokusera på konkreta fakta som namn, platser, antal, vad något består av, vad något är
• Exempel på bra frågor: "Vad består en galax av?", "Vilka ämnen ingår i NO?", "Hur många ben har en spindel?"
• Svaren ska vara konkreta fakta som finns i texten, inte tolkningar eller analyser
• Alla svarsalternativ måste vara korta och faktabaserade
• Skapa trovärdiga felaktiga alternativ som också är korta fakta

VIKTIGT: Varje fråga måste ha ett svar som finns direkt i den givna texten!

Returnera JSON:
{
  "subject": "identifierat ämne",
  "difficulty": "anpassad svårighetsgrad baserat på textens komplexitet",
  "questions": [
    {
      "id": 1,
      "question": "konkret faktafråga med svar som finns i texten",
      "options": ["kort korrekt svar från texten", "kort felaktigt alternativ", "kort felaktigt alternativ", "kort felaktigt alternativ"],
      "correctAnswer": 0,
      "expectedAnswer": "kort svar (1-3 ord)",
      "explanation": "varför detta svar är korrekt enligt texten"
    }
  ]
}`
        }
      ],
      max_tokens: 2000,
      temperature: 0.4,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Inget svar från OpenAI');
    }

    console.log('🤖 AI response received, length:', content.length);

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
      console.error('Failed to parse content:', cleanContent);
      throw new Error(`JSON parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
    }

    // Validate structure
    if (!result.questions || !Array.isArray(result.questions) || result.questions.length === 0) {
      console.error('Invalid result structure:', result);
      throw new Error('Felaktig struktur i AI-svaret');
    }

    // Extract keywords from text for additional context
    const keywords = text
      .split(/[,\s\n\.\!\?]+/)
      .filter(word => word.length > 3)
      .slice(0, 10);

    console.log('✅ Question generation completed successfully!');

    // Apply shuffling to questions
    result.questions = shuffleAnswerOptions(result.questions);
    console.log('📚 Subject identified:', result.subject);
    console.log('❓ Questions generated:', result.questions.length);
    console.log('🔑 Keywords extracted:', keywords.length);

    return NextResponse.json({
      subject: result.subject || "Allmänbildning",
      difficulty: result.difficulty || "Medel",
      questions: result.questions,
      keywords,
      language: "svenska",
      isVocabulary: false
    });

  } catch (error) {
    console.error('Question generation error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);

    // Fact-based fallback: create questions from text content if AI fails
    if (text && text.length > 10) {
      try {
        console.log('🔄 AI generation failed, creating fact-based fallback questions...');

        // Look for factual patterns in the text
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
        const fallbackQuestions: Question[] = [];
        let questionId = 1;

        // Look for patterns that suggest facts
        const factPatterns = [
          /(\w+) består av ([\w\s,]+)/gi,  // "X består av Y"
          /(\w+) är ([\w\s]+)/gi,          // "X är Y"
          /det finns (\d+) ([\w\s]+)/gi,   // "det finns X antal Y"
          /([\w\s]+) innehåller ([\w\s,]+)/gi, // "X innehåller Y"
          /(\w+) kallas ([\w\s]+)/gi,      // "X kallas Y"
          /([\w\s]+) bildas av ([\w\s,]+)/gi   // "X bildas av Y"
        ];

        sentences.forEach((sentence) => {
          if (questionId > 6) return; // Max 6 fact-based questions

          factPatterns.forEach((pattern) => {
            const matches = pattern.exec(sentence);
            if (matches && questionId <= 6) {
              const [, subject, answer] = matches;
              if (subject && answer && answer.length < 30) {
                const cleanAnswer = answer.trim().replace(/\.$/, '');
                fallbackQuestions.push({
                  id: questionId++,
                  question: `Vad ${subject.toLowerCase().trim()}?`,
                  options: [
                    cleanAnswer,
                    "Något annat",
                    "Information som saknas",
                    "Inte specificerat"
                  ],
                  correctAnswer: 0,
                  expectedAnswer: cleanAnswer,
                  explanation: `Enligt texten: ${sentence.trim()}`
                });
              }
            }
          });
        });

        // If no fact patterns found, create basic questions from key terms
        if (fallbackQuestions.length < 3) {
          const keyTerms = text.split(/\s+/).filter(word =>
            word.length > 3 &&
            word.length < 15 &&
            /^[A-ZÅÄÖ]/.test(word) // Starts with capital letter
          ).slice(0, 5);

          keyTerms.forEach((term) => {
            if (questionId <= 8) {
              fallbackQuestions.push({
                id: questionId++,
                question: `Vad nämns i texten om ${term}?`,
                options: [
                  "Information från texten",
                  "Inte nämnt",
                  "Oklart",
                  "Annat ämne"
                ],
                correctAnswer: 0,
                expectedAnswer: "Information från texten",
                explanation: `${term} nämns i den analyserade texten.`
              });
            }
          });
        }

        // Ensure we have at least some questions
        if (fallbackQuestions.length === 0) {
          fallbackQuestions.push({
            id: 1,
            question: "Vad handlar huvudsakligen texten om?",
            options: ["Textens huvudämne", "Något annat", "Oklart", "Inte specificerat"],
            correctAnswer: 0,
            expectedAnswer: "Huvudämnet",
            explanation: "Baserat på textens innehåll."
          });
        }

        console.log('✅ Created', fallbackQuestions.length, 'fact-based fallback questions');

        // Shuffle fallback questions
        const shuffledFallbackQuestions = shuffleAnswerOptions(fallbackQuestions);

        return NextResponse.json({
          subject: "Faktatexter",
          difficulty: "Medel",
          questions: shuffledFallbackQuestions,
          keywords: [],
          language: "svenska",
          isVocabulary: false
        });
      } catch {
        console.log('🔄 Fact-based fallback also failed, using demo questions');
      }
    }

    // Final fallback with demo questions
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
        }
      ];

    // Shuffle demo questions too
    const shuffledDemoQuestions = shuffleAnswerOptions(demoQuestions);

    return NextResponse.json({
      subject: "Allmänkunskap",
      difficulty: "Lätt",
      questions: shuffledDemoQuestions,
      keywords: ["matematik", "astronomi"],
      language: "svenska",
      isVocabulary: false
    });
  }
}