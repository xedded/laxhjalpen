'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
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

  const analyzeImage = async () => {
    if (!file) return;

    setAnalyzing(true);

    // Simulate AI analysis - in real app this would call your AI service
    setTimeout(() => {
      setAnalyzing(false);
      // Navigate to quiz selection page
      router.push('/quiz-setup');
    }, 2000);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Ladda upp din läxa
            </h1>
            <p className="text-gray-600">
              Fotografera eller ladda upp en bild av dina glosor eller faktatext
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
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <span>📱</span>
                  Ta ett foto
                </button>

                <label className="bg-white border-2 border-indigo-600 text-indigo-600 px-6 py-3 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer flex items-center gap-2">
                  <span>📁</span>
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
              </div>

              <div className="mb-6">
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
                    <span className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Analyserar...
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

          <div className="mt-8 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              ← Tillbaka till startsidan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}