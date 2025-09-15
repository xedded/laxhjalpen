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
    <header className="bg-indigo-600 shadow-lg border-b border-indigo-700">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Home button and Logo */}
          <div className="flex items-center space-x-3">
            {showBackButton && (
              <button
                onClick={goHome}
                className="bg-indigo-500 hover:bg-indigo-400 text-white p-2 rounded-lg transition-colors"
                aria-label="Tillbaka till startsidan"
              >
                <span className="text-lg">🏠</span>
              </button>
            )}

            {/* Logo */}
            <div
              className="flex items-center space-x-2 cursor-pointer"
              onClick={goHome}
            >
              <div className="text-2xl">📚</div>

              <div className="text-white">
                <h1 className="text-xl md:text-2xl font-bold">
                  Läxhjälpen
                </h1>
                <p className="text-xs text-indigo-200">
                  AI-driven studiehjälp
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}