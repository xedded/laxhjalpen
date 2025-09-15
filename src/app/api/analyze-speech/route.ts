import { NextRequest, NextResponse } from 'next/server';
import { analyzeOralAnswer } from '@/lib/openai';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const question = formData.get('question') as string;
    const expectedAnswer = formData.get('expectedAnswer') as string;

    if (!audioFile || !question || !expectedAnswer) {
      return NextResponse.json(
        { error: 'Audio, fråga och förväntat svar krävs' },
        { status: 400 }
      );
    }

    // Convert audio to text using OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'sv', // Swedish
      response_format: 'text',
    });

    // Analyze the transcribed answer
    const analysis = await analyzeOralAnswer(
      question,
      transcription,
      expectedAnswer
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