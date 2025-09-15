'use client';

import { useRouter } from 'next/navigation';

export default function QuizSetupPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Välj förhörstyp
            </h1>
            <p className="text-gray-600">
              Baserat på din uppladdade läxa har vi skapat två olika förhör för dig
            </p>
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
                    className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors text-lg font-medium w-full sm:w-auto"
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
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium w-full sm:w-auto"
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