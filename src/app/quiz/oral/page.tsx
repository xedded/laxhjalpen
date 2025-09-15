'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Question {
  id: number;
  question: string;
  expectedAnswer: string;
  explanation?: string;
  questionLanguage?: string;
  answerLanguage?: string;
  vocabularyPair?: {
    word1: string;
    word2: string;
    language1: string;
    language2: string;
  };
}

interface QuizData {
  subject: string;
  difficulty: string;
  questions: Question[];
  language?: string;
  isVocabulary?: boolean;
  vocabularyLanguages?: string[];
  vocabularyPairs?: Array<{
    word1: string;
    word2: string;
    language1: string;
    language2: string;
  }>;
}

export default function OralQuizPage() {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [score, setScore] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [isValidTranslation, setIsValidTranslation] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Get quiz data from sessionStorage
    const storedData = sessionStorage.getItem('quizData');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        setQuizData(data);
      } catch (error) {
        console.error('Error parsing quiz data:', error);
        router.push('/upload');
      }
    } else {
      router.push('/upload');
    }
  }, [router]);

  if (!quizData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar förhör...</p>
        </div>
      </div>
    );
  }

  const questions = quizData.questions;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        processAnswer(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Kunde inte starta inspelningen. Kontrollera att du har gett tillstånd för mikrofon.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsAnalyzing(true);
    }
  };

  const processAnswer = async (audioBlob: Blob) => {
    try {
      const currentQ = questions[currentQuestion];
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      formData.append('question', currentQ.question);
      formData.append('expectedAnswer', currentQ.expectedAnswer || '');
      formData.append('questionLanguage', currentQ.questionLanguage || 'svenska');
      formData.append('answerLanguage', currentQ.answerLanguage || 'svenska');

      // Send vocabulary pair for exact matching if it exists
      if (currentQ.vocabularyPair) {
        formData.append('vocabularyPair', JSON.stringify(currentQ.vocabularyPair));
      }

      const response = await fetch('/api/analyze-speech', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      setTranscription(result.transcription || '');
      setFeedback(result.feedback);
      setIsValidTranslation(result.isValidTranslation || false);
      setIsAnalyzing(false);

      // Add points to total (0-100 per question)
      const points = result.score || 0;
      setTotalPoints(totalPoints + points);

      // Count as correct if score >= 70
      if (points >= 70) {
        setScore(score + 1);
      }

      // Auto-advance after 4 seconds
      setTimeout(() => {
        nextQuestion();
      }, 4000);
    } catch (error) {
      console.error('Error processing answer:', error);
      setFeedback('Teknisk fel - försök igen');
      setIsAnalyzing(false);

      // Auto-advance after 3 seconds on error
      setTimeout(() => {
        nextQuestion();
      }, 3000);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion >= questions.length - 1) {
      setShowResults(true);
    } else {
      setCurrentQuestion(currentQuestion + 1);
      setFeedback(null);
      setTranscription('');
      setIsValidTranslation(false);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setTotalPoints(0);
    setFeedback(null);
    setTranscription('');
    setShowResults(false);
  };

  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Förhör klart!
          </h2>
          <p className="text-lg text-gray-600 mb-4">
            Du fick <span className="font-bold text-green-600">{score}</span> av {questions.length} rätt
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Totala poäng: <span className="font-bold">{Math.round(totalPoints / questions.length)}</span>/100
          </p>

          <div className="flex flex-col gap-4">
            <button
              onClick={restartQuiz}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              10 nya frågor
            </button>
            <button
              onClick={() => router.push('/')}
              className="border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Tillbaka till startsidan
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-200 via-pink-100 to-blue-200">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-gray-800">Muntligt förhör</h1>
              <span className="text-gray-600">
                {currentQuestion + 1} / {questions.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {questions[currentQuestion].question}
              </h2>

              {/* Language indicator for vocabulary questions */}
              {questions[currentQuestion].answerLanguage && questions[currentQuestion].answerLanguage !== 'svenska' && (
                <div className="inline-block mb-4 px-4 py-2 bg-purple-100 border-2 border-purple-300 rounded-xl">
                  <p className="text-purple-700 font-bold text-sm">
                    🗣️ Svara på {questions[currentQuestion].answerLanguage}
                  </p>
                </div>
              )}

              {!feedback && !isAnalyzing && (
                <p className="text-gray-600">
                  Klicka på mikrofonknappen och svara muntligt
                </p>
              )}

              {isAnalyzing && (
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-blue-600">Analyserar ditt svar...</p>
                </div>
              )}

              {transcription && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <p className="text-sm text-blue-600 font-medium mb-1">Du sa:</p>
                  <p className="text-blue-800">&quot;{transcription}&quot;</p>
                </div>
              )}

              {feedback && (
                <div className={`p-6 rounded-2xl border-3 ${
                  feedback.includes('Bra') || feedback.includes('Rätt') || feedback.includes('bra') || feedback.includes('🌟')
                    ? 'bg-green-100 border-green-400 text-green-900'
                    : isValidTranslation
                    ? 'bg-orange-100 border-orange-400 text-orange-900'
                    : 'bg-red-100 border-red-400 text-red-900'
                }`}>
                  <div className="flex items-start space-x-3">
                    <div className="text-3xl">
                      {feedback.includes('Bra') || feedback.includes('Rätt') || feedback.includes('bra') || feedback.includes('🌟')
                        ? '🎉'
                        : isValidTranslation
                        ? '🤔'
                        : '💪'
                      }
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-lg mb-2">
                        {feedback.includes('Bra') || feedback.includes('Rätt') || feedback.includes('bra') || feedback.includes('🌟')
                          ? '🌟 Fantastiskt!'
                          : isValidTranslation
                          ? '🎯 Nästan rätt!'
                          : '💪 Fortsätt träna!'
                        }
                      </p>
                      <p className="text-lg">{feedback}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="text-center">
              {!isRecording && !feedback && !isAnalyzing ? (
                <button
                  onClick={startRecording}
                  className="bg-red-500 hover:bg-red-600 text-white rounded-full w-24 h-24 md:w-20 md:h-20 flex items-center justify-center text-3xl md:text-2xl transition-colors shadow-lg active:scale-95 touch-manipulation"
                >
                  🎤
                </button>
              ) : isRecording ? (
                <button
                  onClick={stopRecording}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-full w-24 h-24 md:w-20 md:h-20 flex items-center justify-center text-3xl md:text-2xl transition-colors shadow-lg animate-pulse active:scale-95 touch-manipulation"
                >
                  ⏹️
                </button>
              ) : null}

              {isRecording && (
                <p className="text-red-600 mt-4 font-medium">
                  🔴 Spelar in... Klicka på stopp när du är klar
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Poäng: <span className="font-bold">{score}</span> / {currentQuestion + (feedback ? 1 : 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}