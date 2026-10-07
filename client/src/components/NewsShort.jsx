import { useEffect, useRef } from "react";
import {
  ExternalLink,
  Clock3,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

function formatTime(dateValue) {
  if (!dateValue) return "Recently";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function NewsShort({
  story,
  isDarkMode,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}) {
  const touchStartY = useRef(null);
  const wheelLocked = useRef(false);

  const theme = {
    card: isDarkMode
      ? "bg-[#101116] text-white"
      : "bg-white text-zinc-900",

    muted: isDarkMode
      ? "text-zinc-400"
      : "text-zinc-600",

    subtle: isDarkMode
      ? "text-zinc-500"
      : "text-zinc-500",

    border: isDarkMode
      ? "border-white/10"
      : "border-black/10",

    overlay: isDarkMode
      ? "bg-black/50"
      : "bg-white/70",
  };

  const primarySource = story?.sources?.[0];

  // -----------------------------------------
  // Keyboard navigation
  // -----------------------------------------

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Don't interfere while typing in an input
      const target = event.target;

      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (event.key === "ArrowDown" || event.key === "PageDown") {
        event.preventDefault();

        if (hasNext) {
          onNext();
        }
      }

      if (event.key === "ArrowUp" || event.key === "PageUp") {
        event.preventDefault();

        if (hasPrevious) {
          onPrevious();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [hasNext, hasPrevious, onNext, onPrevious]);

  // -----------------------------------------
  // Mouse wheel / trackpad navigation
  // -----------------------------------------

  const handleWheel = (event) => {
    // Prevent accidental rapid story changes
    if (wheelLocked.current) {
      return;
    }

    const delta = event.deltaY;

    // Ignore very small trackpad movements
    if (Math.abs(delta) < 20) {
      return;
    }

    wheelLocked.current = true;

    if (delta > 0) {
      // Scroll down → next story
      if (hasNext) {
        onNext();
      }
    } else {
      // Scroll up → previous story
      if (hasPrevious) {
        onPrevious();
      }
    }

    setTimeout(() => {
      wheelLocked.current = false;
    }, 500);
  };

  // -----------------------------------------
  // Mobile swipe
  // -----------------------------------------

  const handleTouchStart = (event) => {
    touchStartY.current = event.touches[0].clientY;
  };

  const handleTouchEnd = (event) => {
    if (touchStartY.current === null) {
      return;
    }

    const touchEndY = event.changedTouches[0].clientY;

    const difference =
      touchStartY.current - touchEndY;

    const minimumSwipeDistance = 60;

    if (Math.abs(difference) >= minimumSwipeDistance) {
      if (difference > 0) {
        // Swipe up → next story
        if (hasNext) {
          onNext();
        }
      } else {
        // Swipe down → previous story
        if (hasPrevious) {
          onPrevious();
        }
      }
    }

    touchStartY.current = null;
  };

  return (
    <article
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`relative mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-5xl overflow-hidden rounded-3xl border shadow-2xl ${theme.card} ${theme.border}`}
    >
      {/* Background image */}

      {story?.imageUrl ? (
        <img
          src={story.imageUrl}
          alt={
            story.headline ||
            "AI generated news visual"
          }
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div
          className={`absolute inset-0 ${
            isDarkMode
              ? "bg-gradient-to-br from-violet-950 via-[#101116] to-blue-950"
              : "bg-gradient-to-br from-violet-100 via-white to-blue-100"
          }`}
        />
      )}

      {/* Image overlay */}

      <div
        className={`absolute inset-0 ${
          isDarkMode
            ? "bg-gradient-to-t from-black via-black/40 to-black/10"
            : "bg-gradient-to-t from-white via-white/60 to-white/10"
        }`}
      />

      {/* Content */}

      <div className="relative z-10 flex w-full flex-col justify-end p-5 sm:p-8 lg:p-10">
        {/* Top information */}

        <div className="absolute left-5 right-5 top-5 flex items-center justify-between sm:left-8 sm:right-8 sm:top-8">
          <div
            className={`rounded-full border px-3 py-1.5 text-[11px] backdrop-blur-md ${theme.border} ${theme.overlay}`}
          >
            AI News Shorts
          </div>

          {story?.category && (
            <div
              className={`rounded-full border px-3 py-1.5 text-[11px] backdrop-blur-md ${theme.border} ${theme.overlay}`}
            >
              {story.category}
            </div>
          )}
        </div>

        {/* Story content */}

        <div className="max-w-3xl">
          {/* Headline */}

          <h2 className="text-3xl font-bold leading-tight tracking-tight drop-shadow-lg sm:text-4xl lg:text-5xl">
            {story?.headline || "Untitled story"}
          </h2>

          {/* Summary */}

          {story?.summary && (
            <p
              className={`mt-5 max-w-2xl text-sm leading-6 drop-shadow-md sm:text-base sm:leading-7 ${theme.muted}`}
            >
              {story.summary}
            </p>
          )}

          {/* Why it matters */}

          {story?.whyItMatters && (
            <div
              className={`mt-5 max-w-2xl rounded-2xl border p-4 backdrop-blur-md ${theme.border} ${theme.overlay}`}
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">
                Why it matters
              </p>

              <p
                className={`mt-2 text-sm leading-6 ${theme.muted}`}
              >
                {story.whyItMatters}
              </p>
            </div>
          )}

          {/* Metadata */}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div
              className={`flex items-center gap-1.5 text-xs ${theme.subtle}`}
            >
              <Clock3 className="h-3.5 w-3.5" />

              {formatTime(story?.publishedAt)}
            </div>

            {primarySource?.sourceName && (
              <div
                className={`text-xs ${theme.subtle}`}
              >
                Source: {primarySource.sourceName}
              </div>
            )}
          </div>

          {/* Original article */}

          {primarySource?.url && (
            <a
              href={primarySource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-violet-500 active:scale-[0.98]"
            >
              Read original article

              <ExternalLink className="h-4 w-4" />
            </a>
          )}

          {/* Source count */}

          {story?.sources?.length > 0 && (
            <p
              className={`mt-4 text-xs ${theme.subtle}`}
            >
              Based on {story.sources.length} source
              {story.sources.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      {/* Navigation */}

      <div className="absolute bottom-6 right-5 z-20 flex flex-col gap-2 sm:bottom-8 sm:right-8">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!hasPrevious}
          aria-label="Previous story"
          className={`flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-md transition ${
            theme.border
          } ${theme.overlay} ${
            hasPrevious
              ? "hover:scale-105"
              : "cursor-not-allowed opacity-30"
          }`}
        >
          <ChevronUp className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext}
          aria-label="Next story"
          className={`flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-md transition ${
            theme.border
          } ${theme.overlay} ${
            hasNext
              ? "hover:scale-105"
              : "cursor-not-allowed opacity-30"
          }`}
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>
    </article>
  );
}

export default NewsShort;