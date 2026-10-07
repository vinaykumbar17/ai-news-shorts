import {
  Clock3,
  ExternalLink,
  Heart,
  MoreVertical,
  Play,
  Share2,
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

function getFallbackStyle(category, isDarkMode) {
  const categoryName = (category || "General").toLowerCase();

  if (categoryName.includes("movie")) {
    return isDarkMode
      ? "bg-gradient-to-br from-fuchsia-950 via-zinc-900 to-purple-950"
      : "bg-gradient-to-br from-fuchsia-100 via-white to-purple-100";
  }

  if (
    categoryName.includes("technology") ||
    categoryName.includes("tech")
  ) {
    return isDarkMode
      ? "bg-gradient-to-br from-blue-950 via-zinc-900 to-cyan-950"
      : "bg-gradient-to-br from-blue-100 via-white to-cyan-100";
  }

  if (categoryName.includes("ai")) {
    return isDarkMode
      ? "bg-gradient-to-br from-violet-950 via-zinc-900 to-indigo-950"
      : "bg-gradient-to-br from-violet-100 via-white to-indigo-100";
  }

  if (categoryName.includes("sports")) {
    return isDarkMode
      ? "bg-gradient-to-br from-emerald-950 via-zinc-900 to-green-950"
      : "bg-gradient-to-br from-emerald-100 via-white to-green-100";
  }

  if (categoryName.includes("india")) {
    return isDarkMode
      ? "bg-gradient-to-br from-orange-950 via-zinc-900 to-amber-950"
      : "bg-gradient-to-br from-orange-100 via-white to-amber-100";
  }

  return isDarkMode
    ? "bg-gradient-to-br from-violet-950 via-zinc-900 to-blue-950"
    : "bg-gradient-to-br from-violet-100 via-white to-blue-100";
}

function NewsGlanceCard({
  story,
  isDarkMode,
  onOpen,
}) {
  const primarySource = story?.sources?.[0];
  const sourceCount = story?.sources?.length || 0;

  const handleShare = async () => {
    const shareData = {
      title: story?.headline || "AI News Shorts",
      text: story?.summary || "",
      url: primarySource?.url || window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(
          primarySource?.url || window.location.href
        );
      }
    } catch (error) {
      console.log("Share cancelled");
    }
  };

  return (
    <article
      className={`overflow-hidden rounded-3xl border shadow-sm transition-all duration-300 ${
        isDarkMode
          ? "border-white/10 bg-[#191a1f] hover:border-white/15"
          : "border-black/10 bg-white hover:shadow-lg"
      }`}
    >
      {/* -----------------------------------------
          News image
      ----------------------------------------- */}

      <button
        type="button"
        onClick={onOpen}
        className="group relative block aspect-video w-full overflow-hidden text-left"
      >
        {story?.imageUrl ? (
          <>
            {/* Actual story image */}
            <img
              src={story.imageUrl}
              alt={story?.headline || "News visual"}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
            />

            {/* Image provider label */}
            {story?.imageProvider && (
              <div className="absolute left-3 top-3 z-20 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-md">
                {story.imageProvider === "Unsplash"
                  ? "Unsplash"
                  : story.imageProvider === "Hugging Face"
                    ? "AI Generated"
                    : story.imageProvider}
              </div>
            )}

            {/* Unsplash photographer attribution */}
            {story?.imageProvider === "Unsplash" &&
              story?.imagePhotographer && (
                <div className="absolute bottom-3 left-3 right-3 z-20 text-[10px] text-white drop-shadow-md">
                  Photo by{" "}
                  {story.imagePhotographerUrl ? (
                    <a
                      href={story.imagePhotographerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(event) =>
                        event.stopPropagation()
                      }
                      className="underline hover:text-violet-200"
                    >
                      {story.imagePhotographer}
                    </a>
                  ) : (
                    story.imagePhotographer
                  )}{" "}
                  on Unsplash
                </div>
              )}
          </>
        ) : (
          /* -----------------------------------------
             Fallback visual
          ----------------------------------------- */
          <div
            className={`flex h-full w-full items-center justify-center ${getFallbackStyle(
              story?.category,
              isDarkMode
            )}`}
          >
            <div className="max-w-[85%] text-center">
              <p
                className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${
                  isDarkMode
                    ? "text-white/50"
                    : "text-zinc-500"
                }`}
              >
                AI News Shorts
              </p>

              <p
                className={`mt-2 line-clamp-2 text-lg font-semibold leading-6 sm:text-xl ${
                  isDarkMode
                    ? "text-white/90"
                    : "text-zinc-800"
                }`}
              >
                {story?.headline || "Latest news"}
              </p>

              <p
                className={`mt-2 text-[11px] ${
                  isDarkMode
                    ? "text-white/50"
                    : "text-zinc-500"
                }`}
              >
                Visual unavailable
              </p>
            </div>
          </div>
        )}

        {/* Image overlay */}
        <div className="pointer-events-none absolute inset-0 bg-black/10" />

        {/* Bottom gradient */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />

        {/* View Short */}
        <div className="absolute bottom-3 left-3">
          <div className="flex items-center gap-2 rounded-full bg-black/65 px-3 py-2 text-xs font-medium text-white backdrop-blur-md transition group-hover:bg-violet-600">
            <Play className="h-3.5 w-3.5 fill-current" />
            View Short
          </div>
        </div>
      </button>

      {/* -----------------------------------------
          Content
      ----------------------------------------- */}

      <div className="p-4 sm:p-5">
        {/* Category + time */}

        <div className="flex items-center gap-2">
          {story?.category && (
            <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-[10px] font-semibold text-violet-500">
              {story.category}
            </span>
          )}

          <div
            className={`flex items-center gap-1.5 text-[11px] ${
              isDarkMode
                ? "text-zinc-500"
                : "text-zinc-500"
            }`}
          >
            <Clock3 className="h-3 w-3" />

            {formatTime(story?.publishedAt)}
          </div>
        </div>

        {/* Headline */}

        <button
          type="button"
          onClick={onOpen}
          className="mt-3 block w-full text-left"
        >
          <h2
            className={`text-xl font-semibold leading-7 tracking-tight transition sm:text-2xl ${
              isDarkMode
                ? "text-white hover:text-violet-300"
                : "text-zinc-900 hover:text-violet-600"
            }`}
          >
            {story?.headline || "Untitled story"}
          </h2>
        </button>

        {/* Summary */}

        {story?.summary && (
          <p
            className={`mt-3 line-clamp-3 text-sm leading-6 sm:text-[15px] ${
              isDarkMode
                ? "text-zinc-400"
                : "text-zinc-600"
            }`}
          >
            {story.summary}
          </p>
        )}

        {/* -----------------------------------------
            Source information
        ----------------------------------------- */}

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {/* Source icons */}

            <div className="flex -space-x-1.5">
              {story?.sources
                ?.slice(0, 3)
                .map((source, index) => (
                  <div
                    key={source.url || index}
                    className={`flex h-7 w-7 items-center justify-center rounded-full border text-[9px] font-semibold ${
                      isDarkMode
                        ? "border-[#191a1f] bg-zinc-800 text-zinc-300"
                        : "border-white bg-zinc-100 text-zinc-600"
                    }`}
                    title={source.sourceName}
                  >
                    {(source.sourceName || "S")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                ))}
            </div>

            <div className="min-w-0">
              <p
                className={`truncate text-xs font-medium ${
                  isDarkMode
                    ? "text-zinc-300"
                    : "text-zinc-700"
                }`}
              >
                {primarySource?.sourceName ||
                  "Multiple sources"}
              </p>

              {sourceCount > 1 && (
                <p
                  className={`text-[10px] ${
                    isDarkMode
                      ? "text-zinc-500"
                      : "text-zinc-400"
                  }`}
                >
                  +{sourceCount - 1} more source
                  {sourceCount - 1 !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}

          <div className="flex shrink-0 items-center gap-1">
            {/* Like */}

            <button
              type="button"
              aria-label="Like story"
              className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                isDarkMode
                  ? "text-zinc-500 hover:bg-white/[0.06] hover:text-white"
                  : "text-zinc-400 hover:bg-black/[0.04] hover:text-zinc-900"
              }`}
            >
              <Heart className="h-4 w-4" />
            </button>

            {/* Share */}

            <button
              type="button"
              aria-label="Share story"
              onClick={handleShare}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                isDarkMode
                  ? "text-zinc-500 hover:bg-white/[0.06] hover:text-white"
                  : "text-zinc-400 hover:bg-black/[0.04] hover:text-zinc-900"
              }`}
            >
              <Share2 className="h-4 w-4" />
            </button>

            {/* More */}

            <button
              type="button"
              aria-label="More options"
              className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                isDarkMode
                  ? "text-zinc-500 hover:bg-white/[0.06] hover:text-white"
                  : "text-zinc-400 hover:bg-black/[0.04] hover:text-zinc-900"
              }`}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Original article */}

        {primarySource?.url && (
          <a
            href={primarySource.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) =>
              event.stopPropagation()
            }
            className={`mt-4 inline-flex items-center gap-1.5 text-xs font-medium transition ${
              isDarkMode
                ? "text-zinc-400 hover:text-white"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            Read original article

            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </article>
  );
}

export default NewsGlanceCard;