'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import NavigationHeader from '@/components/NavigationHeader';

interface Question {
  id: number;
  question: string;
  options?: string[];
  correctAnswer?: number;
  expectedAnswer?: string;
  explanation?: string;
  questionLanguage?: string;
  answerLanguage?: string;
  vocabularyPair?: {
    word1: string;
    word2: string;
    language1: string;
    language2: string;
  };
}

interface QuizData {
  subject: string;
  difficulty: string;
  questions: Question[];
  language?: string;
  isVocabulary?: boolean;
  vocabularyLanguages?: string[];
  vocabularyPairs?: Array<{
    word1: string;
    word2: string;
    language1: string;
    language2: string;
  }>;
}

export default function QuizSetupPage() {
  const router = useRouter();
  const [quizData, setQuizData] = useState<QuizData | null>(null);

  useEffect(() => {
    // Get quiz data from sessionStorage
    const storedData = sessionStorage.getItem('quizData');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        setQuizData(data);
      } catch (error) {
        console.error('Error parsing quiz data:', error);
        router.push('/upload');
      }
    } else {
      // No quiz data, redirect to upload
      router.push('/upload');
    }
  }, [router]);

  if (!quizData) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="body-md">Förbereder ditt förhör...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <NavigationHeader />

      <div className="content-container">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="heading-lg mb-4">
              Välj förhörstyp
            </h1>
            <p className="body-lg mb-8">
              Baserat på din uppladdade läxa har vi skapat två olika förhör för dig
            </p>

            <div className="card-compact mb-8">
              <div className="flex flex-wrap justify-center gap-3">
                <span className="badge badge-blue">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  {quizData.subject}
                </span>
                <span className="badge badge-green">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  {quizData.difficulty}
                </span>
                <span className="badge badge-gray">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {quizData.questions.length} frågor
                </span>
                {quizData.isVocabulary && quizData.vocabularyLanguages && (
                  <span className="badge badge-blue">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    {quizData.vocabularyLanguages.join(' ↔ ')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card">
              <div className="flex items-start space-x-6">
                <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="heading-md mb-3">
                    Muntligt förhör
                  </h2>
                  <p className="body-md mb-4">
                    Svara muntligt på frågorna. AI:n analyserar dina svar och ger omedelbar feedback.
                  </p>
                  <ul className="body-sm space-y-1 mb-6">
                    <li>• Klicka på mikrofonknappen för att börja svara</li>
                    <li>• Klicka på stopp när du är klar med svaret</li>
                    <li>• Få direkt feedback på ditt svar</li>
                  </ul>
                  <button
                    onClick={() => router.push('/quiz/oral')}
                    className="btn btn-primary btn-large w-full"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    Starta muntligt förhör
                  </button>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-start space-x-6">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="heading-md mb-3">
                    Flervalsfrågor
                  </h2>
                  <p className="body-md mb-4">
                    Välj rätt svar från alternativen. Få omedelbar visuell feedback.
                  </p>
                  <ul className="body-sm space-y-1 mb-6">
                    <li>• Välj mellan flera svarsalternativ</li>
                    <li>• Se direkt om svaret var rätt eller fel</li>
                    <li>• Automatisk övergång till nästa fråga</li>
                  </ul>
                  <button
                    onClick={() => router.push('/quiz/multiple-choice')}
                    className="btn btn-primary btn-large w-full"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Starta flervalsfrågor
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <button
              onClick={() => router.push('/upload')}
              className="btn btn-secondary"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Ladda upp annan bild
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}