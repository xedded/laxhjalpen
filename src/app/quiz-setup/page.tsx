'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Question {
  id: number;
  question: string;
  options?: string[];
  correctAnswer?: number;
  expectedAnswer?: string;
  explanation?: string;
}

interface QuizData {
  subject: string;
  difficulty: string;
  questions: Question[];
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Förbereder ditt förhör...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-200 via-pink-100 to-blue-200">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-purple-800 mb-4">
              🎯 Välj förhörstyp 🎯
            </h1>
            <p className="text-purple-700 mb-6 text-lg font-semibold">
              Baserat på din uppladdade läxa har vi skapat två coola förhör för dig! 🚀
            </p>
            <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                  📚 {quizData.subject}
                </span>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
                  📊 {quizData.difficulty}
                </span>
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                  ❓ {quizData.questions.length} frågor
                </span>
                {quizData.isVocabulary && quizData.vocabularyLanguages && (
                  <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full">
                    🗣️ {quizData.vocabularyLanguages.join(' ↔ ')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="text-4xl">🎤</div>
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-3">
                    Muntligt förhör
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Svara muntligt på frågorna. AI:n analyserar dina svar och ger omedelbar feedback.
                  </p>
                  <ul className="text-sm text-gray-500 mb-6 space-y-1">
                    <li>• Klicka på mikrofonknappen för att börja svara</li>
                    <li>• Klicka på stopp när du är klar med svaret</li>
                    <li>• Få direkt feedback på ditt svar</li>
                  </ul>
                  <button
                    onClick={() => router.push('/quiz/oral')}
                    className="bg-green-600 text-white px-8 py-4 rounded-xl hover:bg-green-700 transition-colors text-lg font-medium w-full min-h-[60px] active:scale-[0.98] touch-manipulation"
                  >
                    Starta muntligt förhör
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="text-4xl">✅</div>
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-3">
                    Flervalsfrågor
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Välj rätt svar från alternativen. Få omedelbar visuell feedback.
                  </p>
                  <ul className="text-sm text-gray-500 mb-6 space-y-1">
                    <li>• Välj mellan flera svarsalternativ</li>
                    <li>• Se direkt om svaret var rätt eller fel</li>
                    <li>• Automatisk övergång till nästa fråga</li>
                  </ul>
                  <button
                    onClick={() => router.push('/quiz/multiple-choice')}
                    className="bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition-colors text-lg font-medium w-full min-h-[60px] active:scale-[0.98] touch-manipulation"
                  >
                    Starta flervalsfrågor
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => router.push('/upload')}
              className="text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              ← Ladda upp annan bild
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}