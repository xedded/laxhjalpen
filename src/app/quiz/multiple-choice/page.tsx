'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface QuizData {
  subject: string;
  difficulty: string;
  questions: Question[];
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
  const question = questions[currentQuestion];

  const nextQuestion = () => {
    if (currentQuestion >= questions.length - 1) {
      setShowResults(true);
    } else {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setTimeLeft(null);
    }
  };

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
  }, [showFeedback, timeLeft, currentQuestion, questions.length]);

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Förhör klart!
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Du fick <span className="font-bold text-green-600">{score}</span> av {questions.length} rätt
          </p>

          <div className="mb-6">
            <div className="text-4xl mb-2">
              {score >= 8 ? '🌟' : score >= 6 ? '👍' : score >= 4 ? '😊' : '📚'}
            </div>
            <p className="text-gray-600">
              {score >= 8 ? 'Fantastiskt!' :
               score >= 6 ? 'Bra jobbat!' :
               score >= 4 ? 'Hyggligt resultat!' :
               'Träna lite till!'}
            </p>
          </div>

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-gray-800">Flervalsfrågor</h1>
              <span className="text-gray-600">
                {currentQuestion + 1} / {questions.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                {question.question}
              </h2>

              <div className="space-y-3">
                {question.options.map((option, index) => {
                  let buttonClass = "w-full p-4 text-left border-2 rounded-lg transition-all duration-300 ";

                  if (!showFeedback) {
                    buttonClass += selectedAnswer === index
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300 hover:bg-blue-50";
                  } else {
                    if (index === question.correctAnswer) {
                      buttonClass += "border-green-500 bg-green-100 text-green-800";
                    } else if (index === selectedAnswer && index !== question.correctAnswer) {
                      buttonClass += "border-red-500 bg-red-100 text-red-800";
                    } else {
                      buttonClass += "border-gray-200 bg-gray-50 text-gray-500";
                    }
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      className={`${buttonClass} min-h-[60px] touch-manipulation active:scale-[0.98]`}
                      disabled={showFeedback}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-current flex items-center justify-center text-sm font-bold">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span className="text-left flex-1 text-base">{option}</span>
                        {showFeedback && index === question.correctAnswer && (
                          <span className="ml-auto text-green-600 text-xl">✓</span>
                        )}
                        {showFeedback && index === selectedAnswer && index !== question.correctAnswer && (
                          <span className="ml-auto text-red-600 text-xl">✗</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {showFeedback && (
                <div className="mt-6 p-4 rounded-lg bg-blue-50 border-l-4 border-blue-500">
                  <div className="flex items-start space-x-2">
                    <div className="text-blue-600 text-xl">💡</div>
                    <div>
                      <p className="text-blue-800 font-medium mb-1">
                        {selectedAnswer === question.correctAnswer ? "Rätt svar!" : "Fel svar"}
                      </p>
                      {question.explanation && (
                        <p className="text-blue-700">{question.explanation}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {showFeedback && timeLeft !== null && (
                <div className="mt-4 text-center">
                  <p className="text-gray-600">
                    Nästa fråga om <span className="font-bold text-blue-600">{timeLeft}</span> sekunder...
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Poäng: <span className="font-bold text-green-600">{score}</span> / {currentQuestion + (showFeedback ? 1 : 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}