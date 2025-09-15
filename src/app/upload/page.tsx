'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import NavigationHeader from '@/components/NavigationHeader';

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState('');
  const router = useRouter();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const uploadedFile = e.dataTransfer.files[0];
      if (uploadedFile.type.startsWith('image/')) {
        setFile(uploadedFile);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // Smart scaling based on original image size
        let maxWidth: number;
        let quality: number;

        const originalSize = Math.max(img.width, img.height);

        if (originalSize > 3000) {
          // Very large images (>3000px) - aggressive compression
          maxWidth = 600;
          quality = 0.4;
        } else if (originalSize > 2000) {
          // Large images (>2000px) - strong compression
          maxWidth = 650;
          quality = 0.5;
        } else if (originalSize > 1200) {
          // Medium images (>1200px) - moderate compression
          maxWidth = 700;
          quality = 0.6;
        } else {
          // Small images (<1200px) - light compression
          maxWidth = 800;
          quality = 0.7;
        }

        // Calculate new dimensions
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        const newWidth = img.width * ratio;
        const newHeight = img.height * ratio;

        // Set canvas size
        canvas.width = newWidth;
        canvas.height = newHeight;

        // Draw and compress
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);

        console.log(`Image compressed: ${originalSize}px → ${Math.max(newWidth, newHeight)}px, quality: ${quality}`);
        resolve(compressedBase64);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const analyzeImage = async () => {
    if (!file) return;

    setAnalyzing(true);
    setAnalysisProgress('Analyserar bildstorlek...');

    try {
      // Smart compression based on image size
      setAnalysisProgress('Optimerar bild för snabb analys...');
      const compressedBase64 = await compressImage(file);

      setAnalysisProgress('Skickar till AI för analys...');

      // Call AI analysis API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000); // 35 second timeout with better compression

      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: compressedBase64,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      setAnalysisProgress('AI analyserar innehållet...');
      const analysis = await response.json();

      setAnalysisProgress('Skapar förhör...');

      // Store analysis in sessionStorage for quiz pages
      sessionStorage.setItem('quizData', JSON.stringify(analysis));

      // Navigate to quiz selection page
      router.push('/quiz-setup');
    } catch (error) {
      console.error('Analysis error:', error);
      let errorMessage = 'Okänt fel';

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Analysen tog för lång tid - prova med en enklare bild eller försök igen';
        } else {
          errorMessage = error.message;
        }
      }

      alert(`Kunde inte analysera bilden: ${errorMessage}`);
      setAnalyzing(false);
      setAnalysisProgress('');
    }
  };

  const takePhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        setFile(target.files[0]);
      }
    };
    input.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-200 via-pink-100 to-blue-200">
      <NavigationHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Ladda upp din läxa
            </h1>
            <p className="text-gray-600">
              Fotografera eller ladda upp en bild av dina glosor eller läxtext
            </p>
          </div>

          {!file ? (
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-300 bg-white hover:border-indigo-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="text-6xl mb-4">📷</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Dra och släpp din bild här
              </h3>
              <p className="text-gray-500 mb-6">
                eller välj en av alternativen nedan
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={takePhoto}
                  className="bg-indigo-600 text-white px-6 py-4 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-3 text-lg font-medium min-h-[60px] justify-center"
                >
                  <span className="text-2xl">📱</span>
                  Ta ett foto
                </button>

                <label className="bg-white border-2 border-indigo-600 text-indigo-600 px-6 py-4 rounded-xl hover:bg-indigo-50 transition-colors cursor-pointer flex items-center gap-3 text-lg font-medium min-h-[60px] justify-center">
                  <span className="text-2xl">📁</span>
                  Välj fil
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">✅</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Bild uppladdad!
                </h3>
                <p className="text-gray-600">
                  {file.name}
                </p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>

              <div className="mb-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={URL.createObjectURL(file)}
                  alt="Uploaded homework"
                  className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={analyzeImage}
                  disabled={analyzing}
                  className={`px-8 py-3 rounded-lg text-white font-medium transition-colors ${
                    analyzing
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {analyzing ? (
                    <span className="flex items-center gap-3">
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                      <div className="text-left">
                        <div className="font-bold">Analyserar...</div>
                        <div className="text-sm opacity-90">{analysisProgress}</div>
                      </div>
                    </span>
                  ) : (
                    'Analysera och skapa förhör'
                  )}
                </button>

                <button
                  onClick={() => setFile(null)}
                  className="border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Välj annan bild
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}