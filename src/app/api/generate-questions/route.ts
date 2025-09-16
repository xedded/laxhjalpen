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

Skapa EXAKT 8 pedagogiska frågor baserat ENDAST på denna text. Frågorna ska vara lämpliga för grundskoleelever och testa förståelse av innehållet som finns i texten.

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

    // Shuffle answer options to randomize correct answer positions
    const shuffleAnswerOptions = (questions: Question[]): Question[] => {
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
    };

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

    // Fallback to simple questions if AI fails
    if (text && text.length > 3) {
      try {
        const words = text.split(/\s+/).filter((word: string) => word.length > 3).slice(0, 8);
        const fallbackQuestions: Question[] = words.map((word: string, index: number) => ({
          id: index + 1,
          question: `Vad betyder "${word}"?`,
          options: [word, "Annat ord", "Tredje alternativ", "Fjärde alternativ"],
          correctAnswer: 0,
          expectedAnswer: word,
          explanation: `Detta ord finns i texten: ${word}`
        }));

        console.log('🔄 Using fallback questions from text');

        // Shuffle fallback questions too
        const shuffledFallbackQuestions = shuffleAnswerOptions(fallbackQuestions);

        return NextResponse.json({
          subject: "Textanalys",
          difficulty: "Lätt",
          questions: shuffledFallbackQuestions,
          keywords: words,
          language: "svenska",
          isVocabulary: false
        });
      } catch (fallbackError) {
        console.log('🔄 Fallback from text also failed, using demo questions');
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