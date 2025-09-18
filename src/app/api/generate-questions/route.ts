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
          content: `Analysera följande text från elevens läxa och skapa 8 pedagogiska frågor:

"${text}"

INSTRUKTIONER:
• Analysera texten djupt och identifiera nyckelfakta, koncept, samband och teman
• Skapa olika typer av frågor: faktafrågor, förståelsefrågor, analysfrågor och tillämpningsfrågor
• Frågorna ska bygga på textens innehåll men du får vara kreativ i hur du formulerar dem
• Inkludera både enkla faktafrågor och mer komplexa resonemangsfrågor
• Se till att frågorna är pedagogiskt värdefulla och hjälper eleven att lära sig
• Använd varierad svårighetsgrad där det är lämpligt
• Gör svarsalternativen realistiska och trovärdiga

Returnera JSON:
{
  "subject": "identifierat ämne",
  "difficulty": "anpassad svårighetsgrad baserat på textens komplexitet",
  "questions": [
    {
      "id": 1,
      "question": "välformulerad fråga som testar förståelse",
      "options": ["korrekt svar", "plausibelt men felaktigt alternativ", "annat trovärdigt felaktigt alternativ", "tredje realistiskt felaktigt alternativ"],
      "correctAnswer": 0,
      "expectedAnswer": "kort korrekt svar",
      "explanation": "pedagogisk förklaring som hjälper eleven förstå konceptet bättre"
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

    // Intelligent fallback: create questions from text content if AI fails
    if (text && text.length > 10) {
      try {
        console.log('🔄 AI generation failed, creating intelligent fallback questions...');

        // Extract sentences and key concepts for better fallback questions
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10).slice(0, 4);
        const words = text.split(/\s+/).filter(word => word.length > 4 && word.length < 15).slice(0, 8);

        const fallbackQuestions: Question[] = [];
        let questionId = 1;

        // Create context-based questions from sentences
        sentences.forEach((sentence) => {
          const cleanSentence = sentence.trim();
          if (cleanSentence.length > 15 && questionId <= 4) {
            // Extract a key word or concept from the sentence
            const keyWords = cleanSentence.split(/\s+/).filter(w => w.length > 4);
            if (keyWords.length > 0) {
              const keyWord = keyWords[Math.floor(keyWords.length / 2)];
              fallbackQuestions.push({
                id: questionId++,
                question: `Enligt texten, vad nämns om "${keyWord}"?`,
                options: [
                  `Information från texten om ${keyWord}`,
                  `Något som inte nämns i texten`,
                  `Ett annat ämne som inte behandlas`,
                  `Information som inte stämmer`
                ],
                correctAnswer: 0,
                expectedAnswer: `Information från texten`,
                explanation: `Detta baseras på innehållet i texten som handlar om ${keyWord}.`
              });
            }
          }
        });

        // Add vocabulary questions to fill up to 8 questions
        words.slice(0, 8 - fallbackQuestions.length).forEach((word) => {
          fallbackQuestions.push({
            id: questionId++,
            question: `Vilket ord från texten beskriver bäst konceptet som behandlas?`,
            options: [word, "Ett helt annat ämne", "Något som inte nämns", "Information som saknas"],
            correctAnswer: 0,
            expectedAnswer: word,
            explanation: `"${word}" är ett viktigt begrepp i den analyserade texten.`
          });
        });

        // Ensure we have at least some questions
        if (fallbackQuestions.length === 0) {
          fallbackQuestions.push({
            id: 1,
            question: "Vad handlar texten om?",
            options: ["Textens huvudämne", "Något helt annat", "Information som saknas", "Oklart innehåll"],
            correctAnswer: 0,
            expectedAnswer: "Textens huvudämne",
            explanation: "Baserat på den text som analyserats."
          });
        }

        console.log('✅ Created', fallbackQuestions.length, 'intelligent fallback questions');

        // Shuffle fallback questions
        const shuffledFallbackQuestions = shuffleAnswerOptions(fallbackQuestions);

        return NextResponse.json({
          subject: "Textanalys",
          difficulty: "Medel",
          questions: shuffledFallbackQuestions,
          keywords: words,
          language: "svenska",
          isVocabulary: false
        });
      } catch {
        console.log('🔄 Intelligent fallback also failed, using demo questions');
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