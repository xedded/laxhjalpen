'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import NavigationHeader from '@/components/NavigationHeader';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
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

export default function MultipleChoicePage() {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const router = useRouter();

  const nextQuestion = useCallback(() => {
    if (currentQuestion >= (quizData?.questions.length || 0) - 1) {
      setShowResults(true);
    } else {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setTimeLeft(null);
    }
  }, [currentQuestion, quizData?.questions.length]);

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

  useEffect(() => {
    if (showFeedback && timeLeft === null) {
      setTimeLeft(3);
    }

    if (timeLeft !== null && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      nextQuestion();
    }
  }, [showFeedback, timeLeft, nextQuestion]);

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
  const question = questions[currentQuestion];

  const handleAnswerSelect = (answerIndex: number) => {
    if (showFeedback) return;

    setSelectedAnswer(answerIndex);
    setShowFeedback(true);

    if (answerIndex === question.correctAnswer) {
      setScore(score + 1);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setScore(0);
    setShowResults(false);
    setTimeLeft(null);
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
          <p className="body-lg mb-6">
            Du fick <span className="font-bold text-green-600">{score}</span> av {questions.length} rätt!
          </p>

          <div className="card-compact mb-8">
            <p className="body-md">
              {score >= 8 ? 'Fantastiskt jobbat! Du är en riktig stjärna!' :
               score >= 6 ? 'Bra jobbat! Du är på rätt väg!' :
               score >= 4 ? 'Hyggligt! Fortsätt träna så blir du ännu bättre!' :
               'Träna lite till så blir du en expert!'}
            </p>
          </div>

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
              <h1 className="heading-md">Flervalsfrågor</h1>
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
            <div className="mb-8">
              <h2 className="heading-sm mb-6">
                {question.question}
              </h2>

              <div className="space-y-3">
                {question.options.map((option, index) => {
                  let buttonClass = "w-full p-4 text-left border-2 rounded-xl transition-all font-medium ";

                  if (!showFeedback) {
                    buttonClass += selectedAnswer === index
                      ? "border-blue-500 bg-blue-50 text-blue-900"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-900";
                  } else {
                    if (index === question.correctAnswer) {
                      buttonClass += "border-green-500 bg-green-50 text-green-900";
                    } else if (index === selectedAnswer && index !== question.correctAnswer) {
                      buttonClass += "border-red-500 bg-red-50 text-red-900";
                    } else {
                      buttonClass += "border-gray-200 bg-gray-50 text-gray-600";
                    }
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      className={`${buttonClass} min-h-[60px]`}
                      disabled={showFeedback}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-current flex items-center justify-center font-semibold">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span className="text-left flex-1 body-md">{option}</span>
                        {showFeedback && index === question.correctAnswer && (
                          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        {showFeedback && index === selectedAnswer && index !== question.correctAnswer && (
                          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {showFeedback && (
                <div className={`mt-6 card-compact border-2 ${
                  selectedAnswer === question.correctAnswer
                    ? 'feedback-success'
                    : 'feedback-warning'
                }`}>
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      selectedAnswer === question.correctAnswer
                        ? 'bg-green-100'
                        : 'bg-amber-100'
                    }`}>
                      <svg className={`w-6 h-6 ${
                        selectedAnswer === question.correctAnswer
                          ? 'text-green-600'
                          : 'text-amber-600'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {selectedAnswer === question.correctAnswer
                          ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        }
                      </svg>
                    </div>
                    <div>
                      <p className="heading-sm mb-2">
                        {selectedAnswer === question.correctAnswer ? "Rätt svar!" : "Inte rätt den här gången"}
                      </p>
                      {question.explanation && (
                        <p className="body-md">
                          {question.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {showFeedback && timeLeft !== null && (
                <div className="mt-6 text-center card-compact">
                  <p className="body-md">
                    Nästa fråga om <span className="font-semibold">{timeLeft}</span> sekunder...
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 text-center">
            <div className="card-compact inline-block">
              <p className="body-md">
                Poäng: <span className="font-bold">{score}</span> / {currentQuestion + (showFeedback ? 1 : 0)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}