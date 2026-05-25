"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { MessageSquare, Users, Megaphone, Lock } from "lucide-react";

type Section = "board" | "messages" | "network";

const BOARD_POSTS = [
  {
    id: "1", author: "Bancroft Heritage Digs", avatar: "B", time: "2 hours ago",
    title: "Anyone else seeing increased no-show rates this spring?",
    body: "Had 3 no-shows last weekend on confirmed bookings. Wondering if the rain forecast is causing it or if others are seeing the same pattern.",
    replies: 4, category: "Operations",
  },
  {
    id: "2", author: "Kirk Lake Minerals", avatar: "K", time: "Yesterday",
    title: "Fluorite pricing — what are you charging per pound?",
    body: "Doing a pricing review and curious what other operators in the region are getting for quality fluorite access. Not looking to undercut anyone, just want to make sure I'm in the right range.",
    replies: 7, category: "Pricing",
  },
  {
    id: "3", author: "Digby Team", avatar: "D", time: "3 days ago",
    title: "New Specimen Drop feature launching July 1 — operator preview",
    body: "We're giving operators early access to list limited-release finds on the Specimen Drop marketplace. Priority placement goes to operators who join in the first week.",
    replies: 12, category: "Digby Update",
    pinned: true,
  },
  {
    id: "4", author: "Haliburton Rock Centre", avatar: "H", time: "4 days ago",
    title: "Waiver template recommendations?",
    body: "Working on updating our liability waivers ahead of summer season. Anyone have a template they're happy with that covers group bookings and minors?",
    replies: 5, category: "Legal / Safety",
  },
];

const NETWORK = [
  { name: "Kirk Lake Minerals", region: "Kaladar, ON", specialties: ["Fluorite", "Calcite"], type: "operator" },
  { name: "Ontario Mineral Exchange", region: "Bancroft, ON", specialties: ["Wholesale", "Sodalite", "Amethyst"], type: "supplier" },
  { name: "Bancroft Heritage Digs", region: "Bancroft, ON", specialties: ["Multi-mineral", "Group bookings"], type: "operator" },
  { name: "Crystal Ridge Lapidary", region: "Madoc, ON", specialties: ["Lapidary supplies", "Cutting"], type: "supplier" },
  { name: "Haliburton Rock Centre", region: "Haliburton, ON", specialties: ["Feldspars", "Mica", "Kids programs"], type: "operator" },
];

export default function CommunityPage() {
  const user = useAuthStore((s) => s.user);
  const [section, setSection] = useState<Section>("board");
  const [newPost, setNewPost] = useState("");
  const firstName = user?.name?.split(" ")[0] ?? "there";

  const sections: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: "board", label: "Operator Board", icon: <Megaphone className="h-4 w-4" /> },
    { id: "messages", label: "Messages", icon: <MessageSquare className="h-4 w-4" /> },
    { id: "network", label: "Supplier Network", icon: <Users className="h-4 w-4" /> },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 pb-24 md:pb-8">
      <div>
        <h1 className="font-display text-2xl text-stone-900">Community</h1>
        <p className="mt-0.5 text-sm text-stone-400">Operator board, direct messages, and supplier connections</p>
      </div>

      {/* Section switcher */}
      <div className="flex gap-1 rounded-xl border border-stone-200 bg-stone-100 p-1">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              section === s.id ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
            )}
          >
            {s.icon}
            <span className="hidden sm:inline">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Operator Board */}
      {section === "board" && (
        <div className="space-y-4">
          {/* Post composer */}
          <div className="card p-4">
            <p className="mb-2 text-sm text-stone-500">Share something with the operator network, {firstName}…</p>
            <textarea
              className="input resize-none text-sm"
              rows={2}
              placeholder="Ask a question, share intel, or start a conversation…"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
            />
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-stone-400">Board posts are visible to all Digby operators.</p>
              <button className="btn-primary text-sm py-1.5" disabled={!newPost.trim()}>Post</button>
            </div>
            <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              <Lock className="h-3.5 w-3.5 shrink-0" />
              Community board is launching soon — posts will go live when the feature ships.
            </div>
          </div>

          {/* Posts */}
          {BOARD_POSTS.map((post) => (
            <div key={post.id} className={cn("card p-5", post.pinned && "border-brand-200 bg-brand-50/30")}>
              {post.pinned && (
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-brand-600">📌 Pinned</p>
              )}
              <div className="mb-3 flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-200 text-xs font-bold text-stone-600">
                  {post.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-stone-800">{post.author}</span>
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-500">{post.category}</span>
                    <span className="ml-auto text-xs text-stone-400">{post.time}</span>
                  </div>
                  <h3 className="mt-1 text-sm font-semibold text-stone-900">{post.title}</h3>
                </div>
              </div>
              <p className="text-sm text-stone-600 leading-relaxed">{post.body}</p>
              <div className="mt-3 flex items-center gap-4 border-t border-stone-100 pt-3">
                <button className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-brand-600">
                  <MessageSquare className="h-3.5 w-3.5" /> {post.replies} replies
                </button>
                <span className="text-xs text-stone-300">·</span>
                <button className="text-xs text-stone-400 hover:text-brand-600">Reply</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      {section === "messages" && (
        <div className="card">
          <div className="flex flex-col items-center gap-4 px-8 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
              <MessageSquare className="h-8 w-8 text-stone-300" />
            </div>
            <div>
              <h2 className="font-display text-xl text-stone-800">Direct messages are coming</h2>
              <p className="mt-2 text-sm text-stone-500 max-w-sm">
                Message other operators, suppliers, and the Digby team directly. Launching with the Community update.
              </p>
            </div>
            <div className="mt-2 space-y-2 text-left w-full max-w-sm opacity-50 pointer-events-none">
              {[
                { name: "Ontario Mineral Exchange", preview: "Interested in stocking your sodalite…" },
                { name: "Digby Team", preview: "New payout schedule update — action required…" },
                { name: "Bancroft Heritage Digs", preview: "Can we coordinate the Aug long weekend…" },
              ].map((m) => (
                <div key={m.name} className="flex items-center gap-3 rounded-xl border border-stone-200 p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-200 text-xs font-bold text-stone-600">
                    {m.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-800">{m.name}</p>
                    <p className="truncate text-xs text-stone-400">{m.preview}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Supplier Network */}
      {section === "network" && (
        <div className="space-y-4">
          <p className="text-sm text-stone-500">
            Other operators and suppliers in the Digby network. Use the community board or direct messages to connect.
          </p>
          <div className="space-y-3">
            {NETWORK.map((n) => (
              <div key={n.name} className="card flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-200 text-sm font-bold text-stone-600">
                  {n.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-stone-900">{n.name}</p>
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                      n.type === "supplier" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                    )}>
                      {n.type}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400">{n.region}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {n.specialties.map((s) => (
                      <span key={s} className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] text-stone-500">{s}</span>
                    ))}
                  </div>
                </div>
                <button className="shrink-0 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 hover:border-brand-300 hover:text-brand-600 transition-colors">
                  Message
                </button>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-stone-400">More operators and suppliers join as the network grows.</p>
        </div>
      )}
    </div>
  );
}
