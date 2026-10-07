import { useEffect, useRef, useState } from "react";

import {
  ExternalLink,
  Heart,
  Share2,
  MoreVertical,
  X,
  ChevronUp,
  ChevronDown,
  Globe2,
} from "lucide-react";

// ============================================================
// TIME FORMAT
// ============================================================

const formatTime = (date) => {
  if (!date) return "Recently";

  const published = new Date(date);

  if (Number.isNaN(published.getTime())) {
    return "Recently";
  }

  const diff = Date.now() - published.getTime();

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return published.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// ============================================================
// SOURCE NAME
// ============================================================

const getSourceName = (story) => {
  if (
    story?.sources &&
    Array.isArray(story.sources) &&
    story.sources.length > 0
  ) {
    return story.sources[0]?.sourceName || "News Source";
  }

  return "News Source";
};

// ============================================================
// ORIGINAL ARTICLE
// ============================================================

const getOriginalUrl = (story) => {
  if (
    story?.sources &&
    Array.isArray(story.sources) &&
    story.sources.length > 0
  ) {
    return story.sources[0]?.url || "";
  }

  return "";
};

// ============================================================
// IMAGE
// ============================================================

const getImage = (story) => {
  if (story?.imageUrl) {
    return story.imageUrl;
  }

  if (
    story?.sources &&
    Array.isArray(story.sources)
  ) {
    const sourceWithImage = story.sources.find(
      (source) => source?.imageUrl
    );

    if (sourceWithImage?.imageUrl) {
      return sourceWithImage.imageUrl;
    }
  }

  return "";
};

// ============================================================
// FALLBACK BACKGROUND
// ============================================================

const getFallbackBackground = (category = "General") => {
  const backgrounds = {
    AI: "from-violet-950 via-indigo-950 to-slate-950",

    Startups:
      "from-emerald-950 via-slate-950 to-zinc-950",

    Sports:
      "from-orange-950 via-red-950 to-slate-950",

    Movies:
      "from-fuchsia-950 via-purple-950 to-slate-950",

    Smartphones:
      "from-blue-950 via-cyan-950 to-slate-950",

    Technology:
      "from-cyan-950 via-blue-950 to-slate-950",

    India:
      "from-amber-950 via-orange-950 to-slate-950",

    World:
      "from-slate-900 via-blue-950 to-black",

    General:
      "from-slate-900 via-zinc-950 to-black",
  };

  return (
    backgrounds[category] ||
    backgrounds.General
  );
};

// ============================================================
// COMPONENT
// ============================================================

const ShortsFeed = ({
  stories = [],
  currentStoryIndex = 0,
  setCurrentStoryIndex,
  onClose,
}) => {
  const feedRef = useRef(null);

  const [likedStories, setLikedStories] = useState(
    new Set()
  );

  const [activeStory, setActiveStory] =
    useState(currentStoryIndex || 0);

  const [selectedSources, setSelectedSources] =
    useState(null);

  // ==========================================================
  // INITIAL STORY POSITION
  // ==========================================================

  useEffect(() => {
    if (!feedRef.current || !stories.length) {
      return;
    }

    const index = Math.min(
      Math.max(currentStoryIndex || 0, 0),
      stories.length - 1
    );

    const target =
      feedRef.current.querySelector(
        `[data-story-index="${index}"]`
      );

    if (target) {
      requestAnimationFrame(() => {
        target.scrollIntoView({
          behavior: "instant",
          block: "start",
        });
      });
    }

    setActiveStory(index);
  }, [currentStoryIndex, stories]);

  // ==========================================================
  // TRACK ACTIVE STORY
  // ==========================================================

  useEffect(() => {
    const feed = feedRef.current;

    if (!feed) return;

    const storyElements =
      feed.querySelectorAll(
        "[data-story-index]"
      );

    if (!storyElements.length) return;

    const observer =
      new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (
              entry.isIntersecting &&
              entry.intersectionRatio >= 0.65
            ) {
              const index = Number(
                entry.target.dataset.storyIndex
              );

              if (!Number.isNaN(index)) {
                setActiveStory(index);

                if (setCurrentStoryIndex) {
                  setCurrentStoryIndex(index);
                }
              }
            }
          });
        },
        {
          root: feed,
          threshold: [0.65, 0.8, 1],
        }
      );

    storyElements.forEach((element) =>
      observer.observe(element)
    );

    return () => observer.disconnect();
  }, [stories, setCurrentStoryIndex]);

  // ==========================================================
  // KEYBOARD NAVIGATION
  // ==========================================================

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (selectedSources) {
          setSelectedSources(null);
        } else {
          onClose?.();
        }

        return;
      }

      if (selectedSources) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        goToStory(activeStory + 1);
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        goToStory(activeStory - 1);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [activeStory, selectedSources]);

  // ==========================================================
  // GO TO STORY
  // ==========================================================

  const goToStory = (index) => {
    if (!feedRef.current) return;

    if (
      index < 0 ||
      index >= stories.length
    ) {
      return;
    }

    const target =
      feedRef.current.querySelector(
        `[data-story-index="${index}"]`
      );

    if (!target) return;

    target.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    setActiveStory(index);

    if (setCurrentStoryIndex) {
      setCurrentStoryIndex(index);
    }
  };

  // ==========================================================
  // LIKE
  // ==========================================================

  const toggleLike = (index) => {
    setLikedStories((previous) => {
      const updated = new Set(previous);

      if (updated.has(index)) {
        updated.delete(index);
      } else {
        updated.add(index);
      }

      return updated;
    });
  };

  // ==========================================================
  // SHARE
  // ==========================================================

  const shareStory = async (story) => {
    const url = getOriginalUrl(story);

    const shareData = {
      title:
        story?.headline ||
        "AI News Shorts",

      text:
        story?.summary ||
        "Check out this news story.",

      url:
        url ||
        window.location.href,
    };

    try {
      if (
        navigator.share &&
        typeof navigator.share === "function"
      ) {
        await navigator.share(shareData);
        return;
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(
          url || window.location.href
        );

        alert("Story link copied!");
      }
    } catch (error) {
      if (
        error?.name !== "AbortError"
      ) {
        console.error(
          "Share failed:",
          error
        );
      }
    }
  };

  // ==========================================================
  // OPEN ARTICLE
  // ==========================================================

  const openArticle = (url) => {
    if (!url) return;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // ==========================================================
  // SOURCE PANEL
  // ==========================================================

  const openSources = (story) => {
    if (
      !story?.sources ||
      !Array.isArray(story.sources) ||
      story.sources.length === 0
    ) {
      return;
    }

    setSelectedSources(story.sources);
  };

  // ==========================================================
  // EMPTY STATE
  // ==========================================================

  if (!stories || stories.length === 0) {
    return (
      <section className="fixed inset-0 z-[100] flex items-center justify-center bg-black px-6">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl">
            📰
          </div>

          <h2 className="text-xl font-semibold text-white">
            No stories yet
          </h2>

          <p className="mt-2 text-sm text-zinc-400">
            Search for a topic to generate
            news shorts.
          </p>

          <button
            type="button"
            onClick={onClose}
            className="mt-5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black"
          >
            Close
          </button>
        </div>
      </section>
    );
  }

  // ==========================================================
  // FEED
  // ==========================================================

  return (
    <>
      <section
        ref={feedRef}
        id="shorts-feed"
        className="
          fixed
          inset-0
          z-[100]
          flex
          w-full
          snap-y
          snap-mandatory
          flex-col
          overflow-y-auto
          overscroll-contain
          bg-black
          scroll-smooth
        "
        style={{
          scrollbarWidth: "none",
        }}
      >
        {stories.map((story, index) => {
          const image = getImage(story);

          const isLiked =
            likedStories.has(index);

          const sourceName =
            getSourceName(story);

          const originalUrl =
            getOriginalUrl(story);

          const category =
            story?.category || "General";

          const sourceCount =
            Array.isArray(story?.sources)
              ? story.sources.length
              : 0;

          return (
            <article
              key={
                story?._id ||
                `${story?.headline}-${index}`
              }
              data-story-index={index}
              className="
                relative
                h-[100dvh]
                min-h-[100dvh]
                w-full
                shrink-0
                snap-start
                snap-always
                overflow-hidden
                bg-black
              "
            >
              {/* =================================================
                  IMAGE
              ================================================= */}

              {image ? (
                <img
                  src={image}
                  alt=""
                  className="
                    absolute
                    inset-0
                    h-full
                    w-full
                    object-cover
                    object-center
                  "
                  loading={
                    index <= 1
                      ? "eager"
                      : "lazy"
                  }
                  onError={(event) => {
                    event.currentTarget.style.display =
                      "none";
                  }}
                />
              ) : (
                <div
                  className={`
                    absolute
                    inset-0
                    bg-gradient-to-br
                    ${getFallbackBackground(
                      category
                    )}
                  `}
                />
              )}

              {/* =================================================
                  OVERLAYS
              ================================================= */}

              <div className="
                absolute
                inset-0
                bg-gradient-to-b
                from-black/30
                via-black/10
                to-black/95
              " />

              <div className="
                absolute
                inset-0
                bg-gradient-to-r
                from-black/40
                via-transparent
                to-black/30
              " />

              {/* =================================================
                  TOP BAR
              ================================================= */}

              <div className="
                absolute
                left-0
                right-0
                top-0
                z-30
                flex
                items-center
                justify-between
                px-4
                pt-5
                sm:px-7
                sm:pt-7
                lg:px-10
              ">
                {/* Category */}

                <div className="
                  rounded-full
                  border
                  border-white/15
                  bg-black/40
                  px-3.5
                  py-1.5
                  text-xs
                  font-medium
                  text-white
                  backdrop-blur-md
                ">
                  {category}
                </div>

                <div className="flex items-center gap-2">
                  {/* Image Provider */}

                  {story?.imageProvider && (
                    <div className="
                      rounded-full
                      border
                      border-white/10
                      bg-black/40
                      px-3
                      py-1.5
                      text-[11px]
                      text-white/80
                      backdrop-blur-md
                    ">
                      {story.imageProvider ===
                      "Hugging Face"
                        ? "AI Generated"
                        : story.imageProvider}
                    </div>
                  )}

                  {/* Close */}

                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close shorts"
                    className="
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center
                      rounded-full
                      border
                      border-white/15
                      bg-black/40
                      text-white
                      backdrop-blur-md
                      transition
                      hover:bg-black/60
                      active:scale-95
                    "
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* =================================================
                  RIGHT ACTIONS
              ================================================= */}

              <div className="
                absolute
                bottom-32
                right-3
                z-30
                flex
                flex-col
                items-center
                gap-3
                sm:right-6
                sm:gap-4
                lg:right-10
              ">
                {/* Like */}

                <button
                  type="button"
                  onClick={() =>
                    toggleLike(index)
                  }
                  aria-label={
                    isLiked
                      ? "Unlike story"
                      : "Like story"
                  }
                  className="
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-white/15
                    bg-black/40
                    text-white
                    backdrop-blur-md
                    transition
                    hover:scale-105
                    hover:bg-black/60
                    active:scale-95
                    sm:h-12
                    sm:w-12
                  "
                >
                  <Heart
                    size={21}
                    fill={
                      isLiked
                        ? "currentColor"
                        : "none"
                    }
                    className={
                      isLiked
                        ? "text-red-400"
                        : ""
                    }
                  />
                </button>

                {/* Share */}

                <button
                  type="button"
                  onClick={() =>
                    shareStory(story)
                  }
                  aria-label="Share story"
                  className="
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-white/15
                    bg-black/40
                    text-white
                    backdrop-blur-md
                    transition
                    hover:scale-105
                    hover:bg-black/60
                    active:scale-95
                    sm:h-12
                    sm:w-12
                  "
                >
                  <Share2 size={20} />
                </button>

                {/* More */}

                <button
                  type="button"
                  aria-label="More options"
                  className="
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-white/15
                    bg-black/40
                    text-white
                    backdrop-blur-md
                    transition
                    hover:scale-105
                    hover:bg-black/60
                    active:scale-95
                    sm:h-12
                    sm:w-12
                  "
                >
                  <MoreVertical size={20} />
                </button>
              </div>

              {/* =================================================
                  CONTENT
              ================================================= */}

              <div className="
                absolute
                bottom-0
                left-0
                right-0
                z-20
                px-4
                pb-6
                pr-20
                sm:px-7
                sm:pb-9
                sm:pr-28
                lg:px-10
                lg:pb-10
                lg:pr-36
              ">
                {/* Source + Time */}

                <div className="
                  mb-3
                  flex
                  flex-wrap
                  items-center
                  gap-x-2
                  gap-y-1
                  text-xs
                  text-white/70
                  sm:text-sm
                ">
                  <span className="font-semibold text-white">
                    {sourceName}
                  </span>

                  <span className="text-white/40">
                    •
                  </span>

                  <span>
                    {formatTime(
                      story?.publishedAt
                    )}
                  </span>

                  {/* SOURCE COUNT */}

                  {sourceCount > 1 && (
                    <>
                      <span className="text-white/40">
                        •
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          openSources(story)
                        }
                        className="
                          font-medium
                          text-white/80
                          underline
                          decoration-white/30
                          underline-offset-2
                          transition
                          hover:text-white
                        "
                      >
                        {sourceCount} sources
                      </button>
                    </>
                  )}
                </div>

                {/* Headline */}

                <h2 className="
                  max-w-4xl
                  text-2xl
                  font-bold
                  leading-tight
                  tracking-tight
                  text-white
                  sm:text-3xl
                  md:text-4xl
                  lg:text-5xl
                ">
                  {story?.headline ||
                    "Untitled News Story"}
                </h2>

                {/* Summary */}

                <p className="
                  mt-3
                  max-w-3xl
                  text-sm
                  leading-6
                  text-white/80
                  sm:text-base
                  sm:leading-7
                  lg:text-lg
                  lg:leading-8
                ">
                  {story?.summary ||
                    "No summary available."}
                </p>

                {/* Why It Matters */}

                {story?.whyItMatters && (
                  <div className="
                    mt-3
                    max-w-3xl
                    border-l-2
                    border-white/30
                    pl-3
                    text-xs
                    leading-5
                    text-white/65
                    sm:text-sm
                  ">
                    <span className="font-semibold text-white/90">
                      Why it matters:
                    </span>{" "}
                    {story.whyItMatters}
                  </div>
                )}

                {/* Bottom Actions */}

                <div className="
                  mt-5
                  flex
                  flex-wrap
                  items-center
                  gap-2
                  sm:gap-3
                ">
                  {originalUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        openArticle(
                          originalUrl
                        )
                      }
                      className="
                        inline-flex
                        items-center
                        gap-2
                        rounded-full
                        bg-white
                        px-4
                        py-2.5
                        text-xs
                        font-semibold
                        text-black
                        shadow-lg
                        transition
                        hover:bg-zinc-100
                        active:scale-95
                        sm:px-5
                        sm:py-3
                        sm:text-sm
                      "
                    >
                      Read Full Story

                      <ExternalLink
                        size={16}
                      />
                    </button>
                  )}

                  {/* Sources Button */}

                  {sourceCount > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        openSources(story)
                      }
                      className="
                        inline-flex
                        items-center
                        gap-2
                        rounded-full
                        border
                        border-white/15
                        bg-black/40
                        px-4
                        py-2.5
                        text-xs
                        font-medium
                        text-white
                        backdrop-blur-md
                        transition
                        hover:bg-black/60
                        active:scale-95
                        sm:py-3
                        sm:text-sm
                      "
                    >
                      <Globe2 size={16} />

                      View {sourceCount} Sources
                    </button>
                  )}
                </div>

                {/* Counter */}

                <div className="
                  mt-4
                  text-[11px]
                  text-white/45
                  sm:text-xs
                ">
                  {index + 1} /{" "}
                  {stories.length}
                </div>
              </div>

              {/* =================================================
                  NAVIGATION
              ================================================= */}

              <div className="
                absolute
                bottom-1/2
                right-3
                z-30
                hidden
                translate-y-1/2
                flex-col
                gap-2
                sm:flex
                lg:right-10
              ">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() =>
                    goToStory(index - 1)
                  }
                  aria-label="Previous story"
                  className="
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-white/10
                    bg-black/30
                    text-white
                    backdrop-blur-md
                    transition
                    hover:bg-black/60
                    disabled:pointer-events-none
                    disabled:opacity-20
                  "
                >
                  <ChevronUp size={18} />
                </button>

                <button
                  type="button"
                  disabled={
                    index ===
                    stories.length - 1
                  }
                  onClick={() =>
                    goToStory(index + 1)
                  }
                  aria-label="Next story"
                  className="
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-white/10
                    bg-black/30
                    text-white
                    backdrop-blur-md
                    transition
                    hover:bg-black/60
                    disabled:pointer-events-none
                    disabled:opacity-20
                  "
                >
                  <ChevronDown size={18} />
                </button>
              </div>
            </article>
          );
        })}
      </section>

      {/* ========================================================
          SOURCE TRANSPARENCY MODAL
      ======================================================== */}

      {selectedSources && (
        <div
          className="
            fixed
            inset-0
            z-[200]
            flex
            items-center
            justify-center
            bg-black/70
            px-4
            backdrop-blur-sm
          "
          onClick={() =>
            setSelectedSources(null)
          }
        >
          <div
            className="
              w-full
              max-w-lg
              overflow-hidden
              rounded-2xl
              border
              border-white/10
              bg-zinc-950
              shadow-2xl
            "
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {/* Modal Header */}

            <div className="
              flex
              items-center
              justify-between
              border-b
              border-white/10
              px-5
              py-4
            ">
              <div>
                <h3 className="text-base font-semibold text-white">
                  Sources
                </h3>

                <p className="mt-0.5 text-xs text-zinc-500">
                  Information combined for this story
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedSources(null)
                }
                aria-label="Close sources"
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-full
                  text-zinc-400
                  transition
                  hover:bg-white/10
                  hover:text-white
                "
              >
                <X size={18} />
              </button>
            </div>

            {/* Source List */}

            <div className="
              max-h-[65vh]
              overflow-y-auto
              p-4
              sm:p-5
            ">
              <div className="space-y-3">
                {selectedSources.map(
                  (source, sourceIndex) => (
                    <div
                      key={
                        source?.url ||
                        `${source?.sourceName}-${sourceIndex}`
                      }
                      className="
                        rounded-xl
                        border
                        border-white/10
                        bg-white/[0.03]
                        p-4
                      "
                    >
                      {/* Source name */}

                      <div className="
                        flex
                        items-center
                        justify-between
                        gap-3
                      ">
                        <div className="flex items-center gap-2">
                          <div className="
                            flex
                            h-8
                            w-8
                            shrink-0
                            items-center
                            justify-center
                            rounded-lg
                            bg-white/10
                          ">
                            <Globe2
                              size={15}
                              className="text-zinc-300"
                            />
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-white">
                              {source?.sourceName ||
                                "Unknown Source"}
                            </p>

                            <p className="text-[11px] text-zinc-500">
                              {formatTime(
                                source?.publishedAt
                              )}
                            </p>
                          </div>
                        </div>

                        <span className="
                          rounded-full
                          bg-white/5
                          px-2
                          py-1
                          text-[10px]
                          text-zinc-500
                        ">
                          Source {sourceIndex + 1}
                        </span>
                      </div>

                      {/* Original headline */}

                      <p className="
                        mt-3
                        text-sm
                        leading-5
                        text-zinc-300
                      ">
                        {source?.title ||
                          "Original article"}
                      </p>

                      {/* Open */}

                      {source?.url && (
                        <button
                          type="button"
                          onClick={() =>
                            openArticle(
                              source.url
                            )
                          }
                          className="
                            mt-3
                            inline-flex
                            items-center
                            gap-1.5
                            text-xs
                            font-medium
                            text-white
                            transition
                            hover:text-zinc-300
                          "
                        >
                          Open original article

                          <ExternalLink
                            size={13}
                          />
                        </button>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Footer */}

            <div className="
              border-t
              border-white/10
              px-5
              py-4
            ">
              <button
                type="button"
                onClick={() =>
                  setSelectedSources(null)
                }
                className="
                  w-full
                  rounded-xl
                  bg-white
                  py-2.5
                  text-sm
                  font-semibold
                  text-black
                  transition
                  hover:bg-zinc-200
                "
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ShortsFeed;