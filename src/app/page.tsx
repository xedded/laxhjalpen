'use client';

import NavigationHeader from '@/components/NavigationHeader';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-200 via-pink-100 to-blue-200">
      <NavigationHeader showBackButton={false} />
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <p className="text-2xl text-purple-700 max-w-2xl mx-auto font-semibold">
            Din AI-assistent som gör läxor roligare! 🚀
          </p>
        </header>

        <main className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-10 text-center border-4 border-purple-300">
            <h2 className="text-3xl font-bold mb-6 text-purple-800">
              🎯 Kom igång direkt! 🎯
            </h2>
            <p className="text-purple-700 mb-8 text-xl font-semibold">
              Ladda upp din läxa så analyserar AI:n innehållet och skapar 10 coola frågor baserat på ämnet! 🧠✨
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button
                onClick={() => window.location.href = '/upload'}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-10 py-4 rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg text-xl font-bold"
              >
                📸 Ladda upp läxa 🚀
              </button>
              <button className="border-3 border-purple-500 text-purple-700 px-10 py-4 rounded-2xl hover:bg-purple-50 transition-all transform hover:scale-105 shadow-md text-xl font-bold">
                🎮 Demo förhör
              </button>
            </div>
          </div>
        </main>

        <footer className="text-center mt-12 text-purple-600">
          <p className="font-semibold">🤖 &copy; 2025 Läxhjälpen - Byggd med AI-magi! ✨</p>
        </footer>
      </div>
    </div>
  );
}
