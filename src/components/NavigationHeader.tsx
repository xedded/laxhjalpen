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
    <header className="bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 shadow-2xl border-b-4 border-purple-300">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Home button and Logo */}
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <button
                onClick={goHome}
                className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-xl transition-all transform hover:scale-110 shadow-lg"
                aria-label="Tillbaka till startsidan"
              >
                <span className="text-2xl">🏠</span>
              </button>
            )}

            {/* Cool Logo */}
            <div
              className="flex items-center space-x-3 cursor-pointer group"
              onClick={goHome}
            >
              <div className="relative">
                {/* Logo icon with glow effect */}
                <div className="text-4xl group-hover:animate-bounce">🧠</div>
                <div className="absolute -top-1 -right-1 text-lg">✨</div>
              </div>

              <div className="text-white">
                <h1 className="text-2xl md:text-3xl font-bold tracking-wider">
                  <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                    Läx
                  </span>
                  <span className="text-white">hjälpen</span>
                </h1>
                <p className="text-xs md:text-sm text-purple-100 font-medium">
                  AI-driven lärande för alla! 🚀
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Status/Progress indicator (optional) */}
          <div className="hidden md:flex items-center space-x-2">
            <div className="bg-white/20 px-4 py-2 rounded-xl">
              <span className="text-white font-bold text-sm">🎯 Redo att lära!</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}