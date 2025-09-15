import { NextRequest, NextResponse } from 'next/server';
import { analyzeOralAnswer } from '@/lib/openai';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Map language names to Whisper language codes
function getWhisperLanguageCode(language: string): string {
  const languageMap: Record<string, string> = {
    'svenska': 'sv',
    'engelska': 'en',
    'spanska': 'es',
    'tyska': 'de',
    'franska': 'fr',
    'italienska': 'it'
  };
  return languageMap[language.toLowerCase()] || 'sv';
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const question = formData.get('question') as string;
    const expectedAnswer = formData.get('expectedAnswer') as string;
    const questionLanguage = (formData.get('questionLanguage') as string) || 'svenska';
    const answerLanguage = (formData.get('answerLanguage') as string) || 'svenska';

    if (!audioFile || !question || !expectedAnswer) {
      return NextResponse.json(
        { error: 'Audio, fråga och förväntat svar krävs' },
        { status: 400 }
      );
    }

    // Determine which language to use for speech recognition
    // For vocabulary questions, use the answer language since that's what the student will speak
    const speechLanguage = answerLanguage !== 'svenska' ? answerLanguage : questionLanguage;
    const whisperLanguageCode = getWhisperLanguageCode(speechLanguage);

    console.log(`Using speech language: ${speechLanguage} (Whisper code: ${whisperLanguageCode})`);

    // Convert audio to text using OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: whisperLanguageCode,
      response_format: 'text',
    });

    // Analyze the transcribed answer
    const analysis = await analyzeOralAnswer(
      question,
      transcription,
      expectedAnswer,
      questionLanguage,
      answerLanguage
    );

    return NextResponse.json({
      transcription,
      ...analysis,
    });
  } catch (error) {
    console.error('Speech analysis error:', error);
    return NextResponse.json(
      {
        error: 'Kunde inte analysera talet',
        transcription: '',
        isCorrect: false,
        feedback: 'Teknisk fel - försök igen',
        score: 0
      },
      { status: 500 }
    );
  }
}