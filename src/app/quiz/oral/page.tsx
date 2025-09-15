'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavigationHeader from '@/components/NavigationHeader';

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
      <div className="page-container flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="body-md">Laddar förhör...</p>
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
      <div className="page-container flex items-center justify-center">
        <div className="max-w-md mx-auto card text-center">
          <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="heading-lg mb-4">
            Förhör klart!
          </h2>
          <p className="body-lg mb-4">
            Du fick <span className="font-bold text-green-600">{score}</span> av {questions.length} rätt
          </p>
          <p className="body-sm mb-8">
            Totala poäng: <span className="font-bold">{Math.round(totalPoints / questions.length)}</span>/100
          </p>

          <div className="flex flex-col gap-4">
            <button
              onClick={restartQuiz}
              className="btn btn-primary btn-large"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Kör igen
            </button>
            <button
              onClick={() => router.push('/')}
              className="btn btn-secondary btn-large"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Tillbaka hem
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <NavigationHeader />

      <div className="content-container">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h1 className="heading-md">Muntligt förhör</h1>
              <span className="body-md">
                {currentQuestion + 1} / {questions.length}
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="card">
            <div className="text-center mb-8">
              <h2 className="heading-sm mb-6">
                {questions[currentQuestion].question}
              </h2>

              {/* Language indicator for vocabulary questions */}
              {questions[currentQuestion].answerLanguage && questions[currentQuestion].answerLanguage !== 'svenska' && (
                <div className="inline-block mb-6">
                  <span className="badge badge-blue">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    Svara på {questions[currentQuestion].answerLanguage}
                  </span>
                </div>
              )}

              {!feedback && !isAnalyzing && (
                <p className="body-md">
                  Klicka på mikrofonknappen och svara muntligt
                </p>
              )}

              {isAnalyzing && (
                <div className="text-center">
                  <div className="loading-spinner mx-auto mb-3"></div>
                  <p className="body-md text-blue-600">Analyserar ditt svar...</p>
                </div>
              )}

              {transcription && (
                <div className="mb-6 card-compact bg-blue-50 border border-blue-200">
                  <p className="body-sm text-blue-600 font-medium mb-2">Du sa:</p>
                  <p className="body-md text-blue-800">&quot;{transcription}&quot;</p>
                </div>
              )}

              {feedback && (
                <div className={`card-compact border-2 ${
                  feedback.includes('Bra') || feedback.includes('Rätt') || feedback.includes('bra') || feedback.includes('🌟')
                    ? 'feedback-success'
                    : isValidTranslation
                    ? 'feedback-warning'
                    : 'feedback-error'
                }`}>
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      feedback.includes('Bra') || feedback.includes('Rätt') || feedback.includes('bra') || feedback.includes('🌟')
                        ? 'bg-green-100'
                        : isValidTranslation
                        ? 'bg-amber-100'
                        : 'bg-red-100'
                    }">
                      <svg className={`w-6 h-6 ${
                        feedback.includes('Bra') || feedback.includes('Rätt') || feedback.includes('bra') || feedback.includes('🌟')
                          ? 'text-green-600'
                          : isValidTranslation
                          ? 'text-amber-600'
                          : 'text-red-600'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {feedback.includes('Bra') || feedback.includes('Rätt') || feedback.includes('bra') || feedback.includes('🌟')
                          ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          : isValidTranslation
                          ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        }
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="heading-sm mb-2">
                        {feedback.includes('Bra') || feedback.includes('Rätt') || feedback.includes('bra') || feedback.includes('🌟')
                          ? 'Fantastiskt!'
                          : isValidTranslation
                          ? 'Nästan rätt!'
                          : 'Fortsätt träna!'
                        }
                      </p>
                      <p className="body-md">{feedback}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="text-center">
              {!isRecording && !feedback && !isAnalyzing ? (
                <button
                  onClick={startRecording}
                  className="w-20 h-20 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95"
                >
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                    <path d="M19 10v1a7 7 0 0 1-14 0v-1"/>
                    <path d="M12 18v4"/>
                    <path d="M8 22h8"/>
                  </svg>
                </button>
              ) : isRecording ? (
                <button
                  onClick={stopRecording}
                  className="w-20 h-20 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-all shadow-lg animate-pulse active:scale-95"
                >
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="2"/>
                  </svg>
                </button>
              ) : null}

              {isRecording && (
                <div className="mt-4 flex items-center justify-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <p className="body-md text-red-600 font-medium">
                    Spelar in... Klicka på stopp när du är klar
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="body-md">
              Poäng: <span className="font-bold">{score}</span> / {currentQuestion + (feedback ? 1 : 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}