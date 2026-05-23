"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Lock, Microscope, XCircle } from "lucide-react";
import { useAuthStore } from "@/lib/auth";
import {
  juniorApi,
  DIFF_COLORS,
  type DetectiveCaseInfo,
  type DetectiveSubmitResult,
} from "@/lib/junior";

export default function DetectivePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [activeCase, setActiveCase] = useState<DetectiveCaseInfo | null>(null);

  const { data: cases, isLoading } = useQuery({
    queryKey: ["junior-detective", id],
    queryFn: () => juniorApi.getDetectiveCases(id),
    enabled: !!user && !!id,
  });

  if (!user) return null;

  if (activeCase) {
    return (
      <CaseView
        juniorId={id}
        caseInfo={activeCase}
        onBack={() => setActiveCase(null)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/junior/${id}`} className="text-stone-400 hover:text-stone-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-stone-900">🔍 Rock Detective</h1>
          <p className="text-sm text-stone-500">Solve mineral mysteries to earn rare cards!</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-stone-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {(cases ?? []).map((c) => (
            <CaseCard
              key={c.case_id}
              caseInfo={c}
              onOpen={() => setActiveCase(c)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CaseCard({
  caseInfo,
  onOpen,
}: {
  caseInfo: DetectiveCaseInfo;
  onOpen: () => void;
}) {
  const { unlocked, solved, attempts, title, region, difficulty } = caseInfo;

  return (
    <button
      onClick={unlocked && !solved ? onOpen : undefined}
      disabled={!unlocked || solved}
      className={`w-full rounded-2xl border-2 p-4 text-left transition
        ${solved
          ? "border-green-200 bg-green-50 cursor-default"
          : unlocked
            ? "border-stone-200 bg-white hover:border-brand-300 hover:shadow-sm"
            : "border-stone-100 bg-stone-50 opacity-60 cursor-not-allowed"
        }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${DIFF_COLORS[difficulty]}`}>
              {difficulty}
            </span>
            <span className="text-xs text-stone-400">{region}</span>
          </div>
          <p className={`font-bold text-stone-900 ${!unlocked ? "text-stone-400" : ""}`}>{title}</p>
          {solved && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> Solved in {attempts} attempt{attempts !== 1 ? "s" : ""}
            </p>
          )}
          {!unlocked && (
            <p className="text-xs text-stone-400 mt-1 flex items-center gap-1">
              <Lock className="h-3 w-3" /> Not yet unlocked
            </p>
          )}
        </div>
        {solved ? (
          <CheckCircle className="h-6 w-6 text-green-500 shrink-0" />
        ) : !unlocked ? (
          <Lock className="h-6 w-6 text-stone-300 shrink-0" />
        ) : (
          <Microscope className="h-6 w-6 text-brand-400 shrink-0" />
        )}
      </div>
    </button>
  );
}

function CaseView({
  juniorId,
  caseInfo,
  onBack,
}: {
  juniorId: string;
  caseInfo: DetectiveCaseInfo;
  onBack: () => void;
}) {
  const qc = useQueryClient();
  const [result, setResult] = useState<DetectiveSubmitResult | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);

  const submitMutation = useMutation({
    mutationFn: (answerId: string) =>
      juniorApi.submitDetective(juniorId, caseInfo.case_id, answerId),
    onSuccess: (data) => {
      setResult(data);
      qc.invalidateQueries({ queryKey: ["junior-detective", juniorId] });
      qc.invalidateQueries({ queryKey: ["junior-badges", juniorId] });
      qc.invalidateQueries({ queryKey: ["junior-summary"] });
    },
  });

  function handleSubmit(answerId: string) {
    setChosen(answerId);
    submitMutation.mutate(answerId);
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="text-stone-400 hover:text-stone-600">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${DIFF_COLORS[caseInfo.difficulty]}`}>
            {caseInfo.difficulty}
          </span>
          <h1 className="text-lg font-extrabold text-stone-900 mt-0.5">{caseInfo.title}</h1>
          <p className="text-xs text-stone-400">{caseInfo.region}</p>
        </div>
      </div>

      {/* Scene */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 mb-2">The Scene</p>
        <p className="text-stone-700 text-sm leading-relaxed">{caseInfo.scene}</p>
      </div>

      {/* Clues */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 mb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Clues</p>
        <ul className="space-y-2">
          {caseInfo.clues.map((clue, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-stone-700">
              <span className="text-brand-400 font-bold mt-0.5">{i + 1}.</span>
              {clue}
            </li>
          ))}
        </ul>
      </div>

      {/* Answer choices */}
      {!result && (
        <div>
          <p className="text-sm font-semibold text-stone-700 mb-3">Which mineral is it?</p>
          <div className="grid grid-cols-2 gap-2">
            {caseInfo.options.map((option) => (
              <button
                key={option}
                onClick={() => handleSubmit(option)}
                disabled={submitMutation.isPending}
                className="rounded-xl border-2 border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-800 hover:border-brand-300 hover:bg-brand-50 transition active:scale-95 disabled:opacity-50"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`rounded-2xl border-2 p-5 ${result.correct ? "border-green-300 bg-green-50" : "border-red-200 bg-red-50"}`}>
          <div className="flex items-center gap-2 mb-3">
            {result.correct ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500" />
            )}
            <p className={`font-extrabold text-lg ${result.correct ? "text-green-800" : "text-red-700"}`}>
              {result.correct ? "Correct! 🎉" : `Not quite — it was ${result.correct_mineral}`}
            </p>
          </div>

          {result.explanation && (
            <p className="text-stone-700 text-sm mb-3">{result.explanation}</p>
          )}

          {result.correct && result.card_reward && (
            <div className="rounded-xl bg-white border border-green-200 px-4 py-3 mb-3">
              <p className="text-xs text-stone-500 mb-1">Card reward unlocked!</p>
              <p className="font-bold text-stone-900">💎 {result.card_reward}</p>
              <p className="text-xs text-stone-500 mt-0.5">
                {result.attempts === 1 ? "Rare card — first try!" : result.attempts === 2 ? "Uncommon card" : "Common card"}
              </p>
            </div>
          )}

          {result.new_badges.length > 0 && (
            <p className="text-sm text-amber-700 font-medium">
              🏅 Badge earned: {result.new_badges.join(", ")}
            </p>
          )}

          <button onClick={onBack} className="btn-primary w-full mt-4">
            Back to cases
          </button>
        </div>
      )}
    </div>
  );
}
