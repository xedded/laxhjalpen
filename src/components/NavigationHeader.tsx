'use client';

import { useRouter } from 'next/navigation';

interface NavigationHeaderProps {
  showBackButton?: boolean;
}

export default function NavigationHeader({ showBackButton = true }: NavigationHeaderProps) {
  const router = useRouter();

  const goHome = () => {
    router.push('/');
  };

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="container mx-auto px-6 py-4 max-w-6xl">
        <div className="flex items-center justify-between">
          {/* Left side - Home button and Logo */}
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <button
                onClick={goHome}
                className="inline-flex items-center justify-center w-10 h-10 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
                aria-label="Tillbaka till startsidan"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>
            )}

            {/* Logo */}
            <div
              className="flex items-center space-x-3 cursor-pointer group"
              onClick={goHome}
            >
              <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg group-hover:bg-blue-700 transition-colors">
                L
              </div>

              <div>
                <h1 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  Läxhjälpen
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  AI-driven studiehjälp
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Optional status */}
          <div className="hidden md:flex items-center">
            <div className="text-sm text-gray-500">
              Redo att analysera
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}