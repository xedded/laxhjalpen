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
          content: `Du är en erfaren lärare som skapar faktafrågor för grundskoleelever. Du läser texten noggrant och skapar frågor där svaren är specifika fakta som nämns i texten.`
        },
        {
          role: "user",
          content: `Läs denna text noggrant och skapa 8 faktafrågor baserat på KONKRETA FAKTA som nämns i texten:

"${text}"

VIKTIGA REGLER:
1. Läs texten och identifiera specifika fakta som nämns (namn, platser, antal, vad saker består av, etc.)
2. Skapa frågor där svaret är ett konkret faktum från texten
3. Svaret ska vara 1-3 ord som är direkt nämnda i texten
4. Ignorera meta-information om texten själv - fokusera bara på innehållet

EXEMPEL PÅ BRA FRÅGOR (om texten innehåller denna info):
- Om texten säger "Solen består av väte och helium" → Fråga: "Vad består solen av?" Svar: "Väte och helium"
- Om texten säger "Sverige har 25 landskap" → Fråga: "Hur många landskap har Sverige?" Svar: "25"
- Om texten säger "Fotosyntesen sker i kloroplasterna" → Fråga: "Var sker fotosyntesen?" Svar: "Kloroplasterna"

Returnera JSON:
{
  "subject": "ämne baserat på textinnehållet",
  "difficulty": "Lätt/Medel/Svår",
  "questions": [
    {
      "id": 1,
      "question": "Faktafråga baserad på konkret information i texten",
      "options": ["korrekt svar från texten", "felaktigt alternativ", "felaktigt alternativ", "felaktigt alternativ"],
      "correctAnswer": 0,
      "expectedAnswer": "exakt svar från texten",
      "explanation": "Referens till var i texten svaret finns"
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

    // Simple fallback: use basic text analysis if AI fails
    if (text && text.length > 10) {
      try {
        console.log('🔄 AI generation failed, creating simple fallback questions...');

        // Try to use AI for fallback too, but with simpler prompt
        const fallbackResponse = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "user",
              content: `Text: "${text}"

Skapa 3 enkla faktafrågor från denna text. Svaren ska vara ord/fraser som finns direkt i texten.

Format:
1. [Fråga] - Svar: [ord från texten]
2. [Fråga] - Svar: [ord från texten]
3. [Fråga] - Svar: [ord från texten]`
            }
          ],
          max_tokens: 500,
          temperature: 0.2,
        });

        const fallbackContent = fallbackResponse.choices[0]?.message?.content || '';

        // Parse simple format or create basic questions
        const fallbackQuestions: Question[] = [];

        if (fallbackContent.includes('1.')) {
          const lines = fallbackContent.split('\n').filter(line => /^\d+\./.test(line.trim()));
          lines.slice(0, 3).forEach((line, index) => {
            const parts = line.split(' - Svar: ');
            if (parts.length === 2) {
              const question = parts[0].replace(/^\d+\.\s*/, '').trim();
              const answer = parts[1].trim();

              fallbackQuestions.push({
                id: index + 1,
                question: question,
                options: [answer, "Annat svar", "Information saknas", "Inte nämnt"],
                correctAnswer: 0,
                expectedAnswer: answer,
                explanation: `Svaret finns i texten.`
              });
            }
          });
        }

        // If parsing failed, create very basic questions
        if (fallbackQuestions.length === 0) {
          fallbackQuestions.push({
            id: 1,
            question: "Vad handlar texten om?",
            options: ["Textens innehåll", "Något annat", "Oklart", "Information saknas"],
            correctAnswer: 0,
            expectedAnswer: "Textens innehåll",
            explanation: "Baserat på textens innehåll."
          });
        }

        console.log('✅ Created', fallbackQuestions.length, 'simple fallback questions');

        const shuffledFallbackQuestions = shuffleAnswerOptions(fallbackQuestions);

        return NextResponse.json({
          subject: "Läsförståelse",
          difficulty: "Lätt",
          questions: shuffledFallbackQuestions,
          keywords: [],
          language: "svenska",
          isVocabulary: false
        });
      } catch {
        console.log('🔄 Simple fallback also failed, using demo questions');
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