'use client';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">
            📚 Läxhjälpen
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Din personliga assistent för läxor och studier
          </p>
        </header>

        <main className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">
              Kom igång direkt
            </h2>
            <p className="text-gray-600 mb-6">
              Ladda upp din läxa så analyserar AI:n innehållet och skapar personliga förhör baserat på ämnet
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.href = '/upload'}
                className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors text-lg font-medium"
              >
                Ladda upp läxa
              </button>
              <button className="border-2 border-indigo-600 text-indigo-600 px-8 py-3 rounded-lg hover:bg-indigo-50 transition-colors text-lg font-medium">
                Demo förhör
              </button>
            </div>
          </div>
        </main>

        <footer className="text-center mt-12 text-gray-500">
          <p>&copy; 2025 Läxhjälpen - Byggd med Next.js och Tailwind CSS</p>
        </footer>
      </div>
    </div>
  );
}
