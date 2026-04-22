"use client";

import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Clock, ChevronDown, Bookmark, X } from "lucide-react";

type BookmarkItem = {
  id: string;
  createdAt: Date;
  notes: string | null;
  reviewCount: number;
  nextReviewAt: Date | null;
  score: number | null;
  modelAnswer: string | null;
  message: {
    id: string;
    content: string;
    questionIndex: number | null;
    session: {
      id: string;
      category: string;
      difficulty: string;
      createdAt: Date;
    };
  };
};

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70
      ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
      : score >= 40
        ? "text-yellow-400 border-yellow-400/30 bg-yellow-400/10"
        : "text-red-400 border-red-400/30 bg-red-400/10";

  return (
    <span className={clsx("inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-xs font-bold", color)}>
      {score}/100
    </span>
  );
}

function DueLabel({ nextReviewAt }: { nextReviewAt: Date | null }) {
  const t = useTranslations("Bookmarks");
  if (!nextReviewAt) return <span className="font-mono text-xs text-amber-400">{t("dueNow")}</span>;

  const now = new Date();
  const diffMs = nextReviewAt.getTime() - now.getTime();
  if (diffMs <= 0) return <span className="font-mono text-xs text-amber-400">{t("dueNow")}</span>;

  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return (
    <span className="font-mono text-xs text-text-secondary">
      {diffDays === 1 ? "Due in 1 day" : `Due in ${diffDays} days`}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const t = useTranslations("Bookmarks");
  const labels: Record<string, string> = {
    technical: t("technical"),
    coding: t("coding"),
    system_design: t("systemDesign"),
    behavioral: t("behavioral"),
  };
  return (
    <span className="rounded border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
      {labels[category] ?? category}
    </span>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const t = useTranslations("Bookmarks");
  const labels: Record<string, string> = {
    junior: t("junior"),
    mid: t("mid"),
    senior: t("senior"),
  };
  const color =
    difficulty === "senior"
      ? "border-red-400/30 bg-red-400/10 text-red-400"
      : difficulty === "mid"
        ? "border-amber-400/30 bg-amber-400/10 text-amber-400"
        : "border-emerald-400/30 bg-emerald-400/10 text-emerald-400";

  return (
    <span className={clsx("rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", color)}>
      {labels[difficulty] ?? difficulty}
    </span>
  );
}

function BookmarkCard({
  bookmark,
  showDue,
  onRemove,
  onReviewed,
}: {
  bookmark: BookmarkItem;
  showDue: boolean;
  onRemove: (id: string) => void;
  onReviewed: (id: string) => void;
}) {
  const t = useTranslations("Bookmarks");
  const [expanded, setExpanded] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  const sessionDate = new Date(bookmark.message.session.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await fetch(`/api/bookmarks/${bookmark.id}`, { method: "DELETE" });
      onRemove(bookmark.id);
    } finally {
      setRemoving(false);
    }
  };

  const handleReview = async () => {
    setReviewing(true);
    try {
      await fetch(`/api/bookmarks/${bookmark.id}/review`, { method: "POST" });
      onReviewed(bookmark.id);
    } finally {
      setReviewing(false);
    }
  };

  const categoryLabel = {
    technical: "Technical",
    coding: "Coding",
    system_design: "System Design",
    behavioral: "Behavioral",
  }[bookmark.message.session.category] ?? bookmark.message.session.category;

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-container/70 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.3)] backdrop-blur-sm transition hover:border-primary/20 hover:bg-surface-container">
      {/* Top row */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <CategoryBadge category={bookmark.message.session.category} />
          <DifficultyBadge difficulty={bookmark.message.session.difficulty} />
        </div>
        {showDue && <DueLabel nextReviewAt={bookmark.nextReviewAt} />}
      </div>

      {/* Question text */}
      <p className="mb-3 line-clamp-2 text-sm font-medium text-text-primary">
        {bookmark.message.content}
      </p>

      {/* Session context + score */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <span className="text-xs text-text-secondary">
          From: {categoryLabel} Interview · {sessionDate}
        </span>
        {bookmark.score !== null && <ScoreBadge score={Math.round(bookmark.score)} />}
      </div>

      {/* Model answer (expanded) */}
      {expanded && (
        <div className="mb-4 rounded-lg border border-border-subtle bg-surface-lowest p-3 text-xs leading-relaxed text-text-secondary">
          {bookmark.modelAnswer ? (
            <p className="whitespace-pre-wrap font-mono">{bookmark.modelAnswer}</p>
          ) : (
            <p className="italic opacity-60">{t("noModelAnswer")}</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleReview}
          disabled={reviewing}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary-container px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary-container/80 disabled:opacity-50"
        >
          {reviewing ? t("markReviewed") + "..." : `▶ ${t("review")}`}
        </button>
        <button
          onClick={() => setExpanded(!expanded)}
          title={expanded ? t("hideAnswer") : t("showAnswer")}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle text-text-secondary transition hover:bg-surface-highest hover:text-text-primary"
        >
          <ChevronDown className={clsx("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} />
        </button>
        <button
          onClick={handleRemove}
          disabled={removing}
          title={t("unsave")}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle text-text-secondary transition hover:border-red-400/30 hover:bg-red-400/10 hover:text-red-400 disabled:opacity-50"
        >
          {removing ? <Bookmark className="h-3.5 w-3.5 animate-pulse" /> : <X className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}

const CATEGORIES = ["all", "technical", "coding", "system_design", "behavioral"];
const DIFFICULTIES = ["all", "junior", "mid", "senior"];

export function BookmarksClient({ bookmarks: initial }: { bookmarks: BookmarkItem[] }) {
  const t = useTranslations("Bookmarks");
  const [tab, setTab] = useState<"due" | "all">("due");
  const [category, setCategory] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [bookmarks, setBookmarks] = useState(initial);

  const now = new Date();

  const isDue = (b: BookmarkItem) => {
    const dueTime = b.nextReviewAt === null || new Date(b.nextReviewAt).getTime() <= now.getTime();
    const isWeak = b.score === null || b.score < 85;
    return dueTime && isWeak;
  };

  const filtered = bookmarks
    .filter((b) => (tab === "due" ? isDue(b) : true))
    .filter((b) => category === "all" || b.message.session.category === category)
    .filter((b) => difficulty === "all" || b.message.session.difficulty === difficulty);

  // In the "due" tab, prioritize lower scores
  if (tab === "due") {
    filtered.sort((a, b) => (a.score ?? 100) - (b.score ?? 100));
  }

  const dueCount = bookmarks.filter(isDue).length;

  const handleRemove = (id: string) => setBookmarks((prev) => prev.filter((b) => b.id !== id));

  const handleReviewed = (id: string) => {
    // Remove from "due" tab (nextReviewAt is now in the future after review)
    // Optimistically move it out of due by giving it a far future date
    setBookmarks((prev) =>
      prev.map((b) =>
        b.id === id
          ? { ...b, reviewCount: b.reviewCount + 1, nextReviewAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
          : b
      )
    );
  };

  const hasFilters = category !== "all" || difficulty !== "all";

  const categoryLabel = (c: string) => {
    const map: Record<string, string> = {
      all: t("all"),
      technical: t("technical"),
      coding: t("coding"),
      system_design: t("systemDesign"),
      behavioral: t("behavioral"),
    };
    return map[c] ?? c;
  };

  const difficultyLabel = (d: string) => {
    const map: Record<string, string> = {
      all: t("all"),
      junior: t("junior"),
      mid: t("mid"),
      senior: t("senior"),
    };
    return map[d] ?? d;
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      {/* Ambient background blurs */}
      <div className="pointer-events-none fixed left-0 top-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />
      <div className="pointer-events-none fixed bottom-0 right-0 h-[400px] w-[400px] translate-x-1/4 translate-y-1/4 rounded-full bg-primary/4 blur-[100px]" />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">{t("title")}</h1>
        <p className="mt-1 text-sm text-text-secondary">{t("subtitle")}</p>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex items-center gap-1 border-b border-border-subtle">
        <button
          onClick={() => setTab("due")}
          className={clsx(
            "relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition",
            tab === "due"
              ? "text-text-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-primary"
              : "text-text-secondary hover:text-text-primary"
          )}
        >
          {t("tabDue")}
          {dueCount > 0 && (
            <span className="rounded-full bg-primary/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">
              {dueCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("all")}
          className={clsx(
            "relative px-4 py-2.5 text-sm font-medium transition",
            tab === "all"
              ? "text-text-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-primary"
              : "text-text-secondary hover:text-text-primary"
          )}
        >
          {t("tabAll")}
        </button>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-container/60 px-3 py-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">
            {t("categoryLabel")}
          </span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-transparent text-sm text-text-primary outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-surface-container">
                {categoryLabel(c)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-container/60 px-3 py-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">
            {t("difficultyLabel")}
          </span>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="bg-transparent text-sm text-text-primary outline-none"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d} className="bg-surface-container">
                {difficultyLabel(d)}
              </option>
            ))}
          </select>
        </div>

        {hasFilters && (
          <button
            onClick={() => { setCategory("all"); setDifficulty("all"); }}
            className="text-xs text-text-secondary transition hover:text-text-primary"
          >
            {t("clearFilters")}
          </button>
        )}
      </div>

      {/* Due today banner */}
      {tab === "due" && dueCount > 0 && (
        <div className="mb-5 flex items-center justify-between rounded-lg border-l-2 border-primary bg-primary/5 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-text-primary">
            <Clock className="h-4 w-4 text-primary" />
            {t("dueToday", { count: dueCount })}
          </div>
        </div>
      )}

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border-subtle bg-surface-container">
            <Bookmark className="h-7 w-7 text-text-secondary opacity-40" />
          </div>
          <p className="text-base font-semibold text-text-primary">
            {tab === "due" && dueCount === 0
              ? t("noDue")
              : bookmarks.length === 0
                ? t("noBookmarks")
                : t("noMatches")}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            {tab === "due" && dueCount === 0
              ? t("noDueDesc")
              : bookmarks.length === 0
                ? t("noBookmarksDesc")
                : ""}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((b) => (
            <BookmarkCard
              key={b.id}
              bookmark={b}
              showDue={tab === "due"}
              onRemove={handleRemove}
              onReviewed={handleReviewed}
            />
          ))}
        </div>
      )}
    </div>
  );
}
