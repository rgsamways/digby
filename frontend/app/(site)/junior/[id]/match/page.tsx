"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Timer } from "lucide-react";
import { api } from "@/lib/api";

// Each pair: mineral name ↔ key property
const PAIRS = [
  { a: "Quartz", b: "Hardness 7 — scratches glass", emoji: "🔷" },
  { a: "Calcite", b: "Fizzes in acid", emoji: "🤍" },
  { a: "Pyrite", b: "Fool's Gold — cubic crystals", emoji: "✨" },
  { a: "Magnetite", b: "Attracts a magnet", emoji: "🖤" },
  { a: "Fluorite", b: "Glows under UV light", emoji: "💚" },
  { a: "Mica", b: "Splits into thin flat sheets", emoji: "⬜" },
  { a: "Halite", b: "Tastes salty — it's salt!", emoji: "🟤" },
  { a: "Graphite", b: "Leaves a grey streak — used in pencils", emoji: "✏️" },
];

interface Card {
  id: string;
  pairId: number;
  text: string;
  emoji: string;
  side: "a" | "b";
  matched: boolean;
  flipped: boolean;
}

function buildDeck(numPairs: number): Card[] {
  const selected = [...PAIRS].sort(() => Math.random() - 0.5).slice(0, numPairs);
  const cards: Card[] = [];
  selected.forEach((pair, i) => {
    cards.push({ id: `a-${i}`, pairId: i, text: pair.a, emoji: pair.emoji, side: "a", matched: false, flipped: false });
    cards.push({ id: `b-${i}`, pairId: i, text: pair.b, emoji: pair.emoji, side: "b", matched: false, flipped: false });
  });
  return cards.sort(() => Math.random() - 0.5);
}

const DIFFICULTY = [
  { label: "Easy", pairs: 4, cols: "grid-cols-4" },
  { label: "Medium", pairs: 6, cols: "grid-cols-4" },
  { label: "Hard", pairs: 8, cols: "grid-cols-4" },
];

export default function MineralMatchPage() {
  const { id } = useParams<{ id: string }>();
  const [diffIdx, setDiffIdx] = useState(0);
  const diff = DIFFICULTY[diffIdx];

  const [deck, setDeck] = useState<Card[]>(() => buildDeck(diff.pairs));
  const [selected, setSelected] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [locked, setLocked] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [won, setWon] = useState(false);
  const [newBadges, setNewBadges] = useState<string[]>([]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  function reset(newDiff?: number) {
    const d = newDiff !== undefined ? newDiff : diffIdx;
    if (newDiff !== undefined) setDiffIdx(newDiff);
    setDeck(buildDeck(DIFFICULTY[d].pairs));
    setSelected([]);
    setMoves(0);
    setMatches(0);
    setLocked(false);
    setElapsed(0);
    setRunning(false);
    setWon(false);
    setNewBadges([]);
  }

  async function submitWin(mineralNames: string[]) {
    try {
      const res = await api.post<{ new_cards: string[]; new_badges: string[] }>(
        `/api/junior/${id}/dig-complete`,
        { mineral_names: mineralNames },
        { auth: true }
      );
      if (res.new_badges?.length) setNewBadges(res.new_badges);
    } catch {
      // non-fatal
    }
  }

  function flip(cardId: string) {
    if (locked || won) return;
    const card = deck.find((c) => c.id === cardId);
    if (!card || card.flipped || card.matched) return;

    if (!running) setRunning(true);

    const newSelected = [...selected, cardId];
    setDeck((d) => d.map((c) => c.id === cardId ? { ...c, flipped: true } : c));
    setSelected(newSelected);

    if (newSelected.length === 2) {
      setMoves((m) => m + 1);
      setLocked(true);
      const [aId, bId] = newSelected;
      const cardA = deck.find((c) => c.id === aId)!;
      const cardB = { ...card };

      setTimeout(() => {
        if (cardA.pairId === cardB.pairId && cardA.side !== cardB.side) {
          // Match!
          setDeck((d) => d.map((c) =>
            c.id === aId || c.id === bId ? { ...c, matched: true } : c
          ));
          const newMatches = matches + 1;
          setMatches(newMatches);
          if (newMatches === diff.pairs) {
            setRunning(false);
            setWon(true);
            // All A-side cards represent every mineral in the current deck
            const matchedNames = deck.filter((c) => c.side === "a").map((c) => c.text);
            submitWin(matchedNames);
          }
        } else {
          // No match — flip back
          setDeck((d) => d.map((c) =>
            c.id === aId || c.id === bId ? { ...c, flipped: false } : c
          ));
        }
        setSelected([]);
        setLocked(false);
      }, 900);
    }
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link href={`/junior/${id}`} className="text-stone-400 hover:text-stone-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold text-stone-900">🃏 Mineral Match</h1>
          <p className="text-sm text-stone-500">Match minerals to their properties!</p>
        </div>
        <button onClick={() => reset()} className="text-stone-400 hover:text-stone-600">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Difficulty + stats */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1.5">
          {DIFFICULTY.map((d, i) => (
            <button
              key={d.label}
              onClick={() => reset(i)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                diffIdx === i
                  ? "bg-brand-600 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-sm text-stone-500">
          <span className="flex items-center gap-1">
            <Timer className="h-3.5 w-3.5" /> {formatTime(elapsed)}
          </span>
          <span>{moves} moves</span>
        </div>
      </div>

      {/* Win screen */}
      {won && (
        <div className="rounded-2xl bg-gradient-to-r from-brand-500 to-violet-600 p-6 text-white text-center mb-5">
          <div className="text-5xl mb-2">🎉</div>
          <p className="font-extrabold text-xl mb-1">You matched them all!</p>
          <p className="text-brand-200 text-sm mb-4">{moves} moves · {formatTime(elapsed)}</p>
          {newBadges.length > 0 && (
            <div className="mb-4 rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold">
              🏅 Badge{newBadges.length > 1 ? "s" : ""} earned: {newBadges.join(", ")}
            </div>
          )}
          <button onClick={() => reset()} className="bg-white text-brand-700 font-bold rounded-xl px-6 py-2">
            Play again
          </button>
        </div>
      )}

      {/* Card grid */}
      <div className={`grid ${diff.cols} gap-2`}>
        {deck.map((card) => (
          <button
            key={card.id}
            onClick={() => flip(card.id)}
            className={`aspect-[3/4] rounded-xl border-2 flex flex-col items-center justify-center p-2 text-center transition-all duration-200
              ${card.matched
                ? "border-green-300 bg-green-50 cursor-default"
                : card.flipped
                  ? "border-brand-300 bg-brand-50"
                  : "border-stone-200 bg-gradient-to-br from-stone-600 to-stone-800 hover:from-stone-500 hover:to-stone-700 cursor-pointer"
              }`}
          >
            {card.flipped || card.matched ? (
              <>
                <span className="text-xl mb-1">{card.emoji}</span>
                <p className={`text-xs font-semibold leading-tight ${card.matched ? "text-green-700" : "text-stone-800"}`}>
                  {card.text}
                </p>
              </>
            ) : (
              <span className="text-2xl">❓</span>
            )}
          </button>
        ))}
      </div>

      <p className="text-center text-xs text-stone-400 mt-4">
        {matches} / {diff.pairs} pairs matched
      </p>
    </div>
  );
}
