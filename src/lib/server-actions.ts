'use server';

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

interface AnalysisResult {
  subject: string;
  difficulty: string;
  questions: Question[];
  keywords: string[];
  language: string;
  isVocabulary: boolean;
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

export async function extractTextFromImage(imageBase64: string): Promise<{
  text: string;
  wordCount: number;
  success: boolean;
  error?: string;
}> {
  try {
    // Remove data:image/jpeg;base64, prefix if present
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    console.log('🔍 Starting server action OCR text extraction...');
    console.log('📊 Base64 data length:', base64Data.length);

    // Fast OCR to extract text only
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extrahera all text från bilden. Returnera som ren text, ordnad rad för rad.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Data}`,
                detail: "low"
              }
            }
          ]
        }
      ],
      max_tokens: 300,
      temperature: 0,
    });

    const extractedText = response.choices[0]?.message?.content || '';

    if (!extractedText.trim()) {
      throw new Error('Ingen text kunde extraheras från bilden');
    }

    console.log('✅ Server action text extraction completed!');
    console.log('📄 Extracted text length:', extractedText.length);

    return {
      text: extractedText,
      wordCount: extractedText.split(/\s+/).length,
      success: true
    };

  } catch (error) {
    console.error('Server action text extraction error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      text: '',
      wordCount: 0,
      success: false,
      error: errorMessage
    };
  }
}

export async function generateQuestionsFromText(text: string): Promise<{
  result?: AnalysisResult;
  success: boolean;
  error?: string;
}> {
  try {
    if (!text || typeof text !== 'string') {
      throw new Error('Text krävs');
    }

    console.log('🔍 Starting server action question generation...');
    console.log('📊 Text length:', text.length);

    // Generate pedagogical questions from extracted text
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Du är en erfaren lärare som skapar pedagogiska förståelsefrågor för svenska grundskoleelever. Basera frågorna på textinnehållet men gör dem utmanande och lärorika. Fokusera på förståelse, samband och analys - inte på enkla ordmeaningar. Skapa trovärdiga svarsalternativ."
        },
        {
          role: "user",
          content: `Text från elevens läxa: "${text}"

VIKTIGA REGLER FÖR FRÅGORNA:
- Skapa EXAKT 8 pedagogiska frågor baserat på textinnehållet
- Fråga om FÖRSTÅELSE av innehållet, inte ordmening
- Skapa frågor om: huvudbudskap, samband, orsaker, följder, slutsatser
- Använd begrepp och fakta som finns i texten
- Skapa TROVÄRDIGA felaktiga alternativ (inte "annat ord", "tredje alternativ")

EXEMPEL PÅ BRA FRÅGOR:
- "Vad är huvudorsaken till... (enligt texten)?"
- "Vilket resultat beskrivs när...?"
- "Hur förklarar texten sambandet mellan X och Y?"

SVARSALTERNATIV:
- Ett korrekt svar från texten
- Tre rimliga men felaktiga alternativ (kan vara från texten men fel sammanhang, eller logiska men felaktiga påståenden)

Returnera JSON:
{
  "subject": "identifierat ämne baserat på textinnehåll",
  "difficulty": "Lätt/Medel/Svår",
  "questions": [
    {
      "id": 1,
      "question": "pedagogisk förståelsefråga om textinnehållet",
      "options": ["korrekt svar från text", "rimligt felaktigt alternativ", "annat rimligt felaktigt", "tredje rimligt felaktigt"],
      "correctAnswer": 0,
      "expectedAnswer": "kort korrekt svar",
      "explanation": "förklaring varför detta stämmer enligt texten"
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
      throw new Error('JSON parsing failed');
    }

    // Validate structure
    if (!result.questions || !Array.isArray(result.questions) || result.questions.length === 0) {
      throw new Error('Felaktig struktur i AI-svaret');
    }

    // Extract keywords from text
    const keywords = text
      .split(/[,\s\n\.\!\?]+/)
      .filter(word => word.length > 3)
      .slice(0, 10);

    console.log('✅ Server action question generation completed!');

    // Shuffle answer options to randomize correct answer positions
    const shuffledQuestions = shuffleAnswerOptions(result.questions);

    const analysisResult: AnalysisResult = {
      subject: result.subject || "Allmänbildning",
      difficulty: result.difficulty || "Medel",
      questions: shuffledQuestions,
      keywords,
      language: "svenska",
      isVocabulary: false
    };

    return {
      result: analysisResult,
      success: true
    };

  } catch (error) {
    console.error('Server action question generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Fallback to fact-based questions if AI fails
    if (text && text.length > 3) {
      try {
        // Clean text by removing likely headers and noise
        const cleanedText = text
          .replace(/^.{1,50}$/gm, '') // Remove short lines (likely headers)
          .replace(/^\d+\.?\s*/gm, '') // Remove numbered list prefixes
          .replace(/^[-•*]\s*/gm, '') // Remove bullet points
          .trim();

        // Extract meaningful sentences with facts
        const sentences = cleanedText
          .split(/[.!?]+/)
          .map(s => s.trim())
          .filter(s => s.length > 20 && s.length < 200) // Focus on substantial sentences
          .filter(s => /\w+.*\w+/.test(s)) // Must contain multiple words
          .slice(0, 12); // Get more sentences to work with

        const fallbackQuestions: Question[] = [];

        // Create fact-based questions from sentences
        for (let i = 0; i < Math.min(sentences.length, 8); i++) {
          const sentence = sentences[i];

          // Extract key facts from sentence
          const numbers = sentence.match(/\d+/g) || [];
          const capitalized = sentence.match(/\b[A-ZÅÄÖ][a-zåäö]+\b/g) || [];
          const keyWords = sentence.split(/\s+/)
            .filter(word => word.length > 4)
            .filter(word => !/^(att|och|eller|för|med|till|från|som|när|där|det|den|dem|denna|detta|dessa)$/i.test(word));

          if (numbers.length > 0) {
            // Numeric fact question
            const number = numbers[0];
            const context = sentence.replace(number, '___');
            fallbackQuestions.push({
              id: i + 1,
              question: `Vilket tal nämns i: "${context.substring(0, 60)}..."?`,
              options: [number, (parseInt(number) + 1).toString(), (parseInt(number) - 1).toString(), (parseInt(number) * 2).toString()],
              correctAnswer: 0,
              expectedAnswer: number,
              explanation: `Enligt texten är talet ${number}`
            });
          } else if (capitalized.length > 0) {
            // Name/proper noun question
            const name = capitalized[0];
            const context = sentence.replace(name, '___');
            fallbackQuestions.push({
              id: i + 1,
              question: `Vad heter det som nämns i: "${context.substring(0, 60)}..."?`,
              options: [name, "Ett annat namn", "Något liknande", "Okänt namn"],
              correctAnswer: 0,
              expectedAnswer: name,
              explanation: `Enligt texten heter det ${name}`
            });
          } else if (keyWords.length > 0) {
            // Key concept question
            const keyWord = keyWords[0];
            const context = sentence.replace(keyWord, '___');
            fallbackQuestions.push({
              id: i + 1,
              question: `Vilket begrepp passar här: "${context.substring(0, 60)}..."?`,
              options: [keyWord, "Ett annat begrepp", "Något relaterat", "Inget av ovan"],
              correctAnswer: 0,
              expectedAnswer: keyWord,
              explanation: `Enligt texten är begreppet ${keyWord}`
            });
          }
        }

        // Ensure we have 8 questions
        while (fallbackQuestions.length < 8 && fallbackQuestions.length > 0) {
          const existingQ = fallbackQuestions[fallbackQuestions.length % fallbackQuestions.length];
          fallbackQuestions.push({
            ...existingQ,
            id: fallbackQuestions.length + 1,
            question: existingQ.question.replace('Vilket', 'Vad')
          });
        }

        console.log('🔄 Using fallback questions from text');

        // Shuffle fallback questions too
        const shuffledFallbackQuestions = shuffleAnswerOptions(fallbackQuestions);

        const fallbackResult: AnalysisResult = {
          subject: "Textanalys",
          difficulty: "Lätt",
          questions: shuffledFallbackQuestions,
          keywords: text.split(/\s+/).filter((word: string) => word.length > 3).slice(0, 10),
          language: "svenska",
          isVocabulary: false
        };

        return {
          result: fallbackResult,
          success: true
        };
      } catch (fallbackError) {
        console.log('🔄 Fallback also failed');
      }
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}