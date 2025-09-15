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

        <main className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="text-3xl mb-4">🧮</div>
              <h2 className="text-xl font-semibold mb-3 text-gray-800">Matematik</h2>
              <p className="text-gray-600 mb-4">
                Få hjälp med algebra, geometri, ekvationer och mer
              </p>
              <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                Börja räkna
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="text-3xl mb-4">🔬</div>
              <h2 className="text-xl font-semibold mb-3 text-gray-800">Naturvetenskap</h2>
              <p className="text-gray-600 mb-4">
                Fysik, kemi, biologi - vi hjälper dig förstå
              </p>
              <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">
                Utforska
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="text-3xl mb-4">📝</div>
              <h2 className="text-xl font-semibold mb-3 text-gray-800">Svenska</h2>
              <p className="text-gray-600 mb-4">
                Grammatik, uppsatser och textanalys
              </p>
              <button className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors">
                Skriv bättre
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">
              Kom igång direkt
            </h2>
            <p className="text-gray-600 mb-6">
              Ställ en fråga eller ladda upp din läxa så hjälper vi dig steg för steg
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors text-lg font-medium">
                Ställ en fråga
              </button>
              <button className="border-2 border-indigo-600 text-indigo-600 px-8 py-3 rounded-lg hover:bg-indigo-50 transition-colors text-lg font-medium">
                Ladda upp läxa
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
