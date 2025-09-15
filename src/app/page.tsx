'use client';

import NavigationHeader from '@/components/NavigationHeader';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-200 via-pink-100 to-blue-200">
      <NavigationHeader showBackButton={false} />
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Din AI-assistent för personlig studiehjälp
          </p>
        </header>

        <main className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Kom igång direkt
            </h2>
            <p className="text-gray-600 mb-6 text-lg">
              Ladda upp din läxa så analyserar AI:n innehållet och skapar personliga frågor baserat på ämnet.
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => window.location.href = '/upload'}
                className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors text-lg font-medium"
              >
                Ladda upp läxa
              </button>
            </div>
          </div>
        </main>

        <footer className="text-center mt-12 text-gray-500">
          <p>&copy; 2025 Läxhjälpen - Byggd med Next.js och OpenAI</p>
        </footer>
      </div>
    </div>
  );
}
