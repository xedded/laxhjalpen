'use client';

import NavigationHeader from '@/components/NavigationHeader';

export default function Home() {
  return (
    <div className="page-container">
      <NavigationHeader showBackButton={false} />

      <div className="content-container">
        {/* Hero section */}
        <div className="text-center mb-16 pt-12">
          <h1 className="heading-xl mb-6 max-w-4xl mx-auto">
            Personlig AI-assistent för dina studier
          </h1>
          <p className="body-lg max-w-2xl mx-auto mb-12">
            Ladda upp din läxa så analyserar AI:n innehållet och skapar personliga frågor baserat på ämnet.
          </p>

          {/* Main CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => window.location.href = '/upload'}
              className="btn btn-primary btn-large"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Kom igång
            </button>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="card-compact text-center">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="heading-sm mb-3">Bildanalys</h3>
            <p className="body-md">AI läser din läxa och identifierar automatiskt ämnet och svårighetsgrad</p>
          </div>

          <div className="card-compact text-center">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="heading-sm mb-3">Personliga frågor</h3>
            <p className="body-md">Genererar 10 frågor anpassade efter ditt specifika läxmaterial</p>
          </div>

          <div className="card-compact text-center">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className="heading-sm mb-3">Röstförhör</h3>
            <p className="body-md">Öva muntligt med AI-feedback på flera språk för glosor</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center">
            <p className="body-sm">© 2025 Läxhjälpen - Byggd med Next.js och OpenAI</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
