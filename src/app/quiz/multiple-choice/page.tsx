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
      <div className="min-h-screen bg-gradient-to-br from-purple-200 via-pink-100 to-blue-200 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-3xl shadow-2xl p-10 text-center border-4 border-purple-300">
          <div className="text-8xl mb-6 animate-bounce">
            {score >= 8 ? '🎉' : score >= 6 ? '🎊' : score >= 4 ? '👏' : '💪'}
          </div>
          <h2 className="text-3xl font-bold text-purple-800 mb-6">
            🎯 Förhör klart! 🎯
          </h2>
          <p className="text-xl text-purple-700 mb-8 font-semibold">
            Du fick <span className="font-bold text-green-600 text-2xl bg-green-100 px-3 py-1 rounded-full">{score}</span> av <span className="font-bold text-purple-600">{questions.length}</span> rätt!
          </p>

          <div className="mb-8 p-6 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl border-2 border-purple-200">
            <div className="text-6xl mb-4">
              {score >= 8 ? '🌟⭐🌟' : score >= 6 ? '🎖️👍🎖️' : score >= 4 ? '😊🎈😊' : '📚💪📚'}
            </div>
            <p className="text-purple-800 font-bold text-xl">
              {score >= 8 ? 'FANTASTISKT JOBBAT! Du är en riktig stjärna! ⭐' :
               score >= 6 ? 'BRA JOBBAT! Du är på rätt väg! 🚀' :
               score >= 4 ? 'HYGGLIGT! Fortsätt träna så blir du ännu bättre! 💪' :
               'Träna lite till så blir du en expert! 🎯'}
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <button
              onClick={restartQuiz}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-lg font-bold text-lg"
            >
              🔄 10 nya frågor 🚀
            </button>
            <button
              onClick={() => router.push('/')}
              className="border-3 border-purple-400 text-purple-700 px-8 py-4 rounded-2xl hover:bg-purple-50 transition-all transform hover:scale-105 shadow-md font-bold text-lg"
            >
              🏠 Tillbaka till startsidan
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-200 via-pink-100 to-blue-200">
      <NavigationHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-purple-800">🧠 Flervalsfrågor 🎯</h1>
              <span className="text-purple-700 font-bold text-lg">
                {currentQuestion + 1} / {questions.length} 🚀
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full transition-all duration-500 shadow-lg"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8 border-4 border-purple-200">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-purple-900 mb-6 leading-relaxed">
                🤔 {question.question}
              </h2>

              <div className="space-y-3">
                {question.options.map((option, index) => {
                  let buttonClass = "w-full p-5 text-left border-3 rounded-2xl transition-all duration-300 font-semibold text-lg ";

                  if (!showFeedback) {
                    buttonClass += selectedAnswer === index
                      ? "border-purple-500 bg-purple-100 text-purple-900 shadow-lg transform scale-105"
                      : "border-purple-200 hover:border-purple-400 hover:bg-purple-50 text-gray-800 hover:transform hover:scale-102 shadow-md";
                  } else {
                    if (index === question.correctAnswer) {
                      buttonClass += "border-green-500 bg-green-200 text-green-900 shadow-lg transform scale-105";
                    } else if (index === selectedAnswer && index !== question.correctAnswer) {
                      buttonClass += "border-red-500 bg-red-200 text-red-900 shadow-lg";
                    } else {
                      buttonClass += "border-gray-300 bg-gray-100 text-gray-600";
                    }
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      className={`${buttonClass} min-h-[70px] touch-manipulation active:scale-95`}
                      disabled={showFeedback}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="flex-shrink-0 w-10 h-10 rounded-full border-3 border-current flex items-center justify-center text-lg font-bold shadow-md">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span className="text-left flex-1 text-lg font-medium">{option}</span>
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
                <div className={`mt-6 p-6 rounded-2xl border-3 ${selectedAnswer === question.correctAnswer ? 'bg-green-100 border-green-400' : 'bg-orange-100 border-orange-400'}`}>
                  <div className="flex items-start space-x-3">
                    <div className="text-3xl">
                      {selectedAnswer === question.correctAnswer ? "🎉" : "🤔"}
                    </div>
                    <div>
                      <p className={`font-bold text-xl mb-2 ${selectedAnswer === question.correctAnswer ? 'text-green-800' : 'text-orange-800'}`}>
                        {selectedAnswer === question.correctAnswer ? "🌟 Rätt svar! Bra jobbat!" : "💪 Inte rätt den här gången!"}
                      </p>
                      {question.explanation && (
                        <p className={`text-lg ${selectedAnswer === question.correctAnswer ? 'text-green-700' : 'text-orange-700'}`}>
                          💡 {question.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {showFeedback && timeLeft !== null && (
                <div className="mt-6 text-center p-4 bg-purple-100 rounded-2xl border-2 border-purple-300">
                  <p className="text-purple-800 font-bold text-lg">
                    🚀 Nästa fråga om <span className="text-purple-600 text-xl bg-white px-3 py-1 rounded-full">{timeLeft}</span> sekunder...
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 text-center">
            <div className="bg-white rounded-2xl shadow-lg p-4 border-3 border-purple-200 inline-block">
              <p className="text-purple-800 font-bold text-lg">
                🏆 Poäng: <span className="text-green-600 text-xl bg-green-100 px-3 py-1 rounded-full">{score}</span> / <span className="text-purple-600">{currentQuestion + (showFeedback ? 1 : 0)}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}