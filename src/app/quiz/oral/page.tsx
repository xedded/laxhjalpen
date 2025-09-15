'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Question {
  id: number;
  question: string;
  expectedAnswer: string;
}

// Mock questions - in real app these would come from AI analysis
const mockQuestions: Question[] = [
  { id: 1, question: "Vad betyder ordet 'serendipity' på svenska?", expectedAnswer: "en lycklig tillfällighet eller ett oväntat fynd" },
  { id: 2, question: "Vilken är huvudstaden i Australien?", expectedAnswer: "Canberra" },
  { id: 3, question: "Vad är 15 × 8?", expectedAnswer: "120" },
  { id: 4, question: "Vad kallas det när vatten övergår från flytande till gasform?", expectedAnswer: "förångning" },
  { id: 5, question: "Vem skrev boken 'Pippi Långstrump'?", expectedAnswer: "Astrid Lindgren" },
  { id: 6, question: "Vilket år startade andra världskriget?", expectedAnswer: "1939" },
  { id: 7, question: "Vad är symbolen för grundämnet guld?", expectedAnswer: "Au" },
  { id: 8, question: "Hur många kontinenter finns det?", expectedAnswer: "sju" },
  { id: 9, question: "Vad kallas en grupp av lejon?", expectedAnswer: "flock eller pride" },
  { id: 10, question: "Vad är 7² (sju upphöjt till 2)?", expectedAnswer: "49" }
];

export default function OralQuizPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const router = useRouter();

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
    // Simulate AI analysis of the audio
    // In real app, this would:
    // 1. Send audio to speech-to-text service
    // 2. Compare transcribed text with expected answer using AI
    // 3. Generate feedback

    setTimeout(() => {
      const isCorrect = Math.random() > 0.3; // Mock 70% correct rate
      const feedbackText = isCorrect
        ? "Bra jobbat! Det var rätt svar."
        : `Inte helt rätt. Rätt svar är: ${mockQuestions[currentQuestion].expectedAnswer}`;

      setFeedback(feedbackText);
      setIsAnalyzing(false);

      if (isCorrect) {
        setScore(score + 1);
      }

      // Auto-advance after 3 seconds
      setTimeout(() => {
        nextQuestion();
      }, 3000);
    }, 2000);
  };

  const nextQuestion = () => {
    if (currentQuestion >= mockQuestions.length - 1) {
      setShowResults(true);
    } else {
      setCurrentQuestion(currentQuestion + 1);
      setFeedback(null);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setFeedback(null);
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
          <p className="text-lg text-gray-600 mb-6">
            Du fick <span className="font-bold text-green-600">{score}</span> av {mockQuestions.length} rätt
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-gray-800">Muntligt förhör</h1>
              <span className="text-gray-600">
                {currentQuestion + 1} / {mockQuestions.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${((currentQuestion + 1) / mockQuestions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {mockQuestions[currentQuestion].question}
              </h2>

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

              {feedback && (
                <div className={`p-4 rounded-lg ${
                  feedback.includes('Bra jobbat')
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {feedback}
                </div>
              )}
            </div>

            <div className="text-center">
              {!isRecording && !feedback && !isAnalyzing ? (
                <button
                  onClick={startRecording}
                  className="bg-red-500 hover:bg-red-600 text-white rounded-full w-20 h-20 flex items-center justify-center text-2xl transition-colors shadow-lg"
                >
                  🎤
                </button>
              ) : isRecording ? (
                <button
                  onClick={stopRecording}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-full w-20 h-20 flex items-center justify-center text-2xl transition-colors shadow-lg animate-pulse"
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