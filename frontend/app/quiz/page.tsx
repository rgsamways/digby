"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { CheckCircle, XCircle, Gem, Trophy, RotateCcw } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";

interface Question {
  id: string;
  question: string;
  options: string[];
}

interface QuizResultDetail {
  id: string;
  correct: boolean;
  correct_answer: string;
  explanation: string;
}

interface SubmitResponse {
  score: number;
  max_score: number;
  points_awarded: number;
  perfect: boolean;
  results: QuizResultDetail[];
}

type Phase = "ready" | "playing" | "reviewing" | "done";

export default function QuizPage() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const [phase, setPhase] = useState<Phase>("ready");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [chosen, setChosen] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<SubmitResponse | null>(null);

  const { data: questions, refetch } = useQuery<Question[]>({
    queryKey: ["quiz-questions"],
    queryFn: () => api.get("/api/quiz/questions", { auth: true }),
    enabled: false,
  });

  const submit = useMutation<SubmitResponse, Error, Record<string, string>>({
    mutationFn: (ans: Record<string, string>) =>
      api.post("/api/quiz/submit", { answers: ans }, { auth: true }),
    onSuccess: (data: SubmitResponse) => {
      setSubmitResult(data);
      setPhase("done");
      qc.invalidateQueries({ queryKey: ["passport"] });
    },
  });

  async function startQuiz() {
    const result = await refetch();
    if (result.data) {
      setCurrent(0);
      setAnswers({});
      setChosen(null);
      setSubmitResult(null);
      setPhase("playing");
    }
  }

  function selectAnswer(option: string) {
    if (!questions) return;
    const q = questions[current];
    setChosen(option);
    setAnswers((prev) => ({ ...prev, [q.id]: option }));
    setPhase("reviewing");
  }

  function nextQuestion() {
    if (!questions) return;
    if (current + 1 >= questions.length) {
      submit.mutate(answers);
    } else {
      setCurrent((c) => c + 1);
      setChosen(null);
      setPhase("playing");
    }
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center px-4">
        <Gem className="h-12 w-12 text-brand-600" />
        <h1 className="text-2xl font-bold text-stone-900">Mineral Quiz</h1>
        <p className="text-stone-500">Sign in to play and earn points.</p>
        <Link href="/login" className="btn-primary">Log in</Link>
      </div>
    );
  }

  // Ready screen
  if (phase === "ready") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-600">
          <Gem className="h-10 w-10 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-stone-900">Mineral Quiz</h1>
          <p className="mt-2 text-stone-500 max-w-sm">
            10 questions about Ontario minerals, geology, and rockhounding. How well do you know your rocks?
          </p>
        </div>
        <div className="flex gap-6 text-center">
          <div>
            <p className="text-2xl font-bold text-brand-600">5 pts</p>
            <p className="text-xs text-stone-500">per correct answer</p>
          </div>
          <div className="w-px bg-stone-200" />
          <div>
            <p className="text-2xl font-bold text-brand-600">+25 pts</p>
            <p className="text-xs text-stone-500">perfect score bonus</p>
          </div>
          <div className="w-px bg-stone-200" />
          <div>
            <p className="text-2xl font-bold text-brand-600">75 pts</p>
            <p className="text-xs text-stone-500">max per session</p>
          </div>
        </div>
        <button onClick={startQuiz} className="btn-primary px-8 py-3 text-base">
          Start Quiz
        </button>
      </div>
    );
  }

  // Results screen
  if (phase === "done" && submitResult) {
    const pct = Math.round((submitResult.score / submitResult.max_score) * 100);
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        {submitResult.perfect ? (
          <Trophy className="mx-auto mb-4 h-16 w-16 text-amber-500" />
        ) : (
          <Gem className="mx-auto mb-4 h-16 w-16 text-brand-600" />
        )}
        <h1 className="text-3xl font-extrabold text-stone-900">
          {submitResult.perfect ? "Perfect score!" : `${submitResult.score} / ${submitResult.max_score}`}
        </h1>
        <p className="mt-1 text-stone-500">{pct}% correct</p>

        <div className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-6 py-3">
          <span className="text-2xl font-extrabold text-white">+{submitResult.points_awarded}</span>
          <span className="text-sm font-medium text-brand-200">pts earned</span>
        </div>

        {/* Answer review */}
        <div className="mt-8 space-y-3 text-left">
          {questions?.map((q) => {
            const r = submitResult.results.find((x) => x.id === q.id);
            if (!r) return null;
            return (
              <div key={q.id} className={`card p-4 ${r.correct ? "border-green-200 bg-green-50" : "border-red-100 bg-red-50"}`}>
                <div className="flex items-start gap-2">
                  {r.correct
                    ? <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  }
                  <div>
                    <p className="text-sm font-medium text-stone-800">{q.question}</p>
                    {!r.correct && (
                      <p className="text-xs text-red-600 mt-0.5">
                        Your answer: {answers[q.id]} · Correct: {r.correct_answer}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-stone-500">{r.explanation}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center gap-3">
          <button onClick={startQuiz} className="btn-secondary flex items-center gap-2">
            <RotateCcw className="h-4 w-4" /> Play again
          </button>
          <Link href="/passport" className="btn-primary">View passport</Link>
        </div>
      </div>
    );
  }

  // Playing / reviewing
  if (!questions) return null;
  const q = questions[current];
  const resultForCurrent = submitResult?.results.find((r) => r.id === q.id);
  const correctAnswer = resultForCurrent?.correct_answer;
  const explanation = resultForCurrent?.explanation;

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      {/* Progress */}
      <div className="mb-6">
        <div className="mb-1 flex justify-between text-sm text-stone-500">
          <span>Question {current + 1} of {questions.length}</span>
          <span>{Math.round((current / questions.length) * 100)}%</span>
        </div>
        <div className="h-2 rounded-full bg-stone-200">
          <div
            className="h-2 rounded-full bg-brand-500 transition-all"
            style={{ width: `${((current + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="card p-6">
        <p className="mb-5 text-lg font-semibold text-stone-900">{q.question}</p>

        <div className="space-y-2">
          {q.options.map((opt) => {
            let style = "border-stone-200 bg-white hover:border-brand-300 hover:bg-brand-50 cursor-pointer";
            if (phase === "reviewing") {
              if (opt === correctAnswer) {
                style = "border-green-400 bg-green-50";
              } else if (opt === chosen && opt !== correctAnswer) {
                style = "border-red-300 bg-red-50";
              } else {
                style = "border-stone-200 bg-stone-50 opacity-60";
              }
            }
            return (
              <button
                key={opt}
                onClick={() => phase === "playing" && selectAnswer(opt)}
                disabled={phase === "reviewing"}
                className={`w-full rounded-lg border p-3 text-left text-sm font-medium transition-colors ${style}`}
              >
                <div className="flex items-center gap-2">
                  {phase === "reviewing" && opt === correctAnswer && (
                    <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
                  )}
                  {phase === "reviewing" && opt === chosen && opt !== correctAnswer && (
                    <XCircle className="h-4 w-4 shrink-0 text-red-400" />
                  )}
                  {opt}
                </div>
              </button>
            );
          })}
        </div>

        {phase === "reviewing" && (
          <div className="mt-4 rounded-lg bg-stone-50 border border-stone-200 p-3">
            <p className="text-xs text-stone-600">{explanation ?? resultForCurrent?.explanation}</p>
          </div>
        )}
      </div>

      {phase === "reviewing" && (
        <button
          onClick={nextQuestion}
          disabled={submit.isPending}
          className="mt-4 w-full btn-primary"
        >
          {submit.isPending ? "Calculating…" : current + 1 >= questions.length ? "See results" : "Next question"}
        </button>
      )}
    </div>
  );
}
