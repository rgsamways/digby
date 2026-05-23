"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { RARITY_LABELS, RARITY_COLORS } from "@/lib/junior";

// Static mineral data for the dig game — a curated subset with site associations
const DIG_MINERALS = [
  { name: "Fluorapatite", emoji: "💚", rarity: "uncommon" as const, fact: "Bancroft is world-famous for its beautiful green apatite!", site: "bancroft" },
  { name: "Rose Quartz", emoji: "🌸", rarity: "uncommon" as const, fact: "Pink from tiny amounts of titanium and iron trapped inside!", site: "bancroft" },
  { name: "Sodalite", emoji: "💙", rarity: "rare" as const, fact: "Only found in a handful of places in the whole world.", site: "bancroft" },
  { name: "Pyrite", emoji: "✨", rarity: "common" as const, fact: "Fool's Gold! Harder than real gold, and it sparks when struck.", site: "haliburton" },
  { name: "Calcite", emoji: "🤍", rarity: "common" as const, fact: "Makes up chalk, limestone, and marble — very useful!", site: "haliburton" },
  { name: "Quartz", emoji: "🔷", rarity: "common" as const, fact: "The most common mineral on Earth's surface.", site: "haliburton" },
  { name: "Amethyst", emoji: "💜", rarity: "rare" as const, fact: "Thunder Bay is the amethyst capital of North America!", site: "thunder-bay" },
  { name: "Native Silver", emoji: "🥈", rarity: "legendary" as const, fact: "Cobalt, Ontario was one of the richest silver deposits ever found!", site: "cobalt" },
  { name: "Garnet", emoji: "❤️", rarity: "uncommon" as const, fact: "Red garnets were used as gemstones by ancient Egyptians.", site: "haliburton" },
  { name: "Magnetite", emoji: "🖤", rarity: "common" as const, fact: "A natural magnet — it can actually attract iron filings!", site: "haliburton" },
  { name: "Amazonite", emoji: "🟦", rarity: "rare" as const, fact: "This blue-green feldspar was used in ancient Egyptian jewellery.", site: "bancroft" },
  { name: "Muscovite", emoji: "⬜", rarity: "common" as const, fact: "This sparkling mica was used as window glass before actual glass!", site: "bancroft" },
];

const SITES = [
  { id: "bancroft", name: "Bancroft Gem Trail", region: "Bancroft, Ontario", emoji: "💚" },
  { id: "thunder-bay", name: "Amethyst Mine Panorama", region: "Thunder Bay, Ontario", emoji: "💜" },
  { id: "haliburton", name: "Haliburton Highlands", region: "Haliburton, Ontario", emoji: "🏔️" },
  { id: "cobalt", name: "Cobalt Mining District", region: "Cobalt, Ontario", emoji: "🥈" },
];

const GRID_SIZE = 12;
const MAX_DIGS = 8;

interface Spot {
  index: number;
  type: "mineral" | "rock" | "empty";
  mineral?: (typeof DIG_MINERALS)[0];
  dug: boolean;
}

function generateSpots(siteId: string): Spot[] {
  const siteMinerals = DIG_MINERALS.filter((m) => m.site === siteId || m.rarity === "common");
  const spots: Spot[] = [];

  // Randomly assign 5 minerals and 7 rocks/empty
  const mineralIndices = new Set<number>();
  while (mineralIndices.size < 5) {
    mineralIndices.add(Math.floor(Math.random() * GRID_SIZE));
  }

  for (let i = 0; i < GRID_SIZE; i++) {
    if (mineralIndices.has(i)) {
      const mineral = siteMinerals[Math.floor(Math.random() * siteMinerals.length)];
      spots.push({ index: i, type: "mineral", mineral, dug: false });
    } else if (Math.random() > 0.4) {
      spots.push({ index: i, type: "rock", dug: false });
    } else {
      spots.push({ index: i, type: "empty", dug: false });
    }
  }
  return spots;
}

export default function DigSitePage() {
  const { id } = useParams<{ id: string }>();
  const [selectedSite, setSelectedSite] = useState(SITES[0]);
  const [spots, setSpots] = useState<Spot[]>(() => generateSpots(SITES[0].id));
  const [digsLeft, setDigsLeft] = useState(MAX_DIGS);
  const [lastFind, setLastFind] = useState<(typeof DIG_MINERALS)[0] | null>(null);
  const [gameOver, setGameOver] = useState(false);

  const found = spots.filter((s) => s.dug && s.type === "mineral").map((s) => s.mineral!);

  function changeSite(site: (typeof SITES)[0]) {
    setSelectedSite(site);
    setSpots(generateSpots(site.id));
    setDigsLeft(MAX_DIGS);
    setLastFind(null);
    setGameOver(false);
  }

  function reset() {
    setSpots(generateSpots(selectedSite.id));
    setDigsLeft(MAX_DIGS);
    setLastFind(null);
    setGameOver(false);
  }

  function dig(index: number) {
    if (gameOver || digsLeft === 0 || spots[index].dug) return;
    const newSpots = spots.map((s) =>
      s.index === index ? { ...s, dug: true } : s
    );
    setSpots(newSpots);
    const spot = spots[index];
    if (spot.type === "mineral" && spot.mineral) {
      setLastFind(spot.mineral);
    } else {
      setLastFind(null);
    }
    const newDigsLeft = digsLeft - 1;
    setDigsLeft(newDigsLeft);
    if (newDigsLeft === 0) setGameOver(true);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link href={`/junior/${id}`} className="text-stone-400 hover:text-stone-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold text-stone-900">⛏️ Dig Site</h1>
          <p className="text-sm text-stone-500">{selectedSite.name}</p>
        </div>
        <button
          onClick={reset}
          className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700"
        >
          <RefreshCw className="h-4 w-4" /> New dig
        </button>
      </div>

      {/* Site selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-5">
        {SITES.map((site) => (
          <button
            key={site.id}
            onClick={() => changeSite(site)}
            className={`shrink-0 rounded-xl border-2 px-3 py-1.5 text-sm font-medium transition ${
              selectedSite.id === site.id
                ? "border-brand-400 bg-brand-50 text-brand-700"
                : "border-stone-200 text-stone-600 hover:border-stone-300"
            }`}
          >
            {site.emoji} {site.name}
          </button>
        ))}
      </div>

      {/* Digs remaining */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1.5">
          {Array.from({ length: MAX_DIGS }).map((_, i) => (
            <div
              key={i}
              className={`h-3 w-3 rounded-full ${i < digsLeft ? "bg-brand-500" : "bg-stone-200"}`}
            />
          ))}
        </div>
        <span className="text-sm text-stone-500">{digsLeft} digs left</span>
      </div>

      {/* Last find notification */}
      {lastFind && (
        <div
          className="mb-4 rounded-2xl border-2 p-4 flex items-center gap-3 animate-bounce-once"
          style={{ borderColor: RARITY_COLORS[lastFind.rarity], backgroundColor: `${RARITY_COLORS[lastFind.rarity]}18` }}
        >
          <span className="text-4xl">{lastFind.emoji}</span>
          <div>
            <p className="font-extrabold text-stone-900">{lastFind.name}!</p>
            <span
              className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white"
              style={{ backgroundColor: RARITY_COLORS[lastFind.rarity] }}
            >
              {RARITY_LABELS[lastFind.rarity]}
            </span>
            <p className="text-xs text-stone-500 mt-1">{lastFind.fact}</p>
          </div>
        </div>
      )}

      {/* Dig grid */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {spots.map((spot) => (
          <button
            key={spot.index}
            onClick={() => dig(spot.index)}
            disabled={spot.dug || gameOver || digsLeft === 0}
            className={`aspect-square rounded-xl border-2 flex items-center justify-center text-2xl transition
              ${spot.dug
                ? spot.type === "mineral"
                  ? "border-amber-300 bg-amber-50 scale-100"
                  : spot.type === "rock"
                    ? "border-stone-200 bg-stone-100"
                    : "border-stone-100 bg-stone-50"
                : "border-stone-300 bg-gradient-to-br from-amber-100 to-amber-200 hover:from-amber-200 hover:to-amber-300 hover:scale-105 active:scale-100 cursor-pointer"
              }`}
          >
            {spot.dug
              ? spot.type === "mineral"
                ? spot.mineral!.emoji
                : spot.type === "rock"
                  ? "🪨"
                  : ""
              : ""}
          </button>
        ))}
      </div>

      {/* Game over summary */}
      {gameOver && (
        <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5">
          <p className="font-extrabold text-stone-900 text-lg mb-3">
            Dig complete! You found {found.length} mineral{found.length !== 1 ? "s" : ""}!
          </p>
          {found.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-4">
              {found.map((m, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-white border border-stone-200 px-3 py-1 text-sm font-medium">
                  {m.emoji} {m.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-stone-500 text-sm mb-4">Better luck next time! Try a different site.</p>
          )}
          <button onClick={reset} className="btn-primary w-full">
            Dig again ⛏️
          </button>
        </div>
      )}

      {/* Region info */}
      <div className="mt-4 text-xs text-stone-400 text-center">
        📍 {selectedSite.region}
      </div>
    </div>
  );
}
