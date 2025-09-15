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

        // Simple compression for all images to speed up processing
        if (originalSize > 1500) {
          maxWidth = 512;
          quality = 0.6;
        } else {
          maxWidth = 512;
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

      // Call AI analysis API with longer timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for basic analysis

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
          errorMessage = 'Analysen tog för lång tid. Prova att ladda upp bilden igen eller välj en tydligare bild.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Timeout - servern svarar långsamt. Försök igen om en stund.';
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
    <div className="page-container">
      <NavigationHeader />

      <div className="content-container">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="heading-lg mb-4">
              Ladda upp din läxa
            </h1>
            <p className="body-lg">
              Fotografera eller ladda upp en bild av dina glosor eller läxtext
            </p>
          </div>

          {!file ? (
            <div
              className={`upload-zone ${dragActive ? 'active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>

              <h3 className="heading-sm mb-2">
                Dra och släpp din bild här
              </h3>
              <p className="body-md mb-8">
                eller välj en av alternativen nedan
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={takePhoto}
                  className="btn btn-primary"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Ta ett foto
                </button>

                <label className="btn btn-secondary cursor-pointer">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
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
            <div className="card">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="heading-sm mb-3">
                  Bild uppladdad!
                </h3>
                <p className="body-md mb-1">
                  {file.name}
                </p>
                <p className="body-sm">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>

              <div className="mb-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={URL.createObjectURL(file)}
                  alt="Uploaded homework"
                  className="max-w-full max-h-64 mx-auto rounded-xl shadow-sm border border-gray-100"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={analyzeImage}
                  disabled={analyzing}
                  className={`btn btn-large ${
                    analyzing
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'btn-primary'
                  }`}
                >
                  {analyzing ? (
                    <span className="flex items-center gap-3">
                      <div className="loading-spinner"></div>
                      <div className="text-left">
                        <div className="font-semibold">Analyserar...</div>
                        <div className="text-sm opacity-90">{analysisProgress}</div>
                      </div>
                    </span>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Analysera och skapa förhör
                    </>
                  )}
                </button>

                <button
                  onClick={() => setFile(null)}
                  className="btn btn-secondary btn-large"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
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