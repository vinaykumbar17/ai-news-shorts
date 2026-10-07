import { useEffect, useState } from "react";

import {
  ArrowRight,
  Search,
  Sparkles,
  TrendingUp,
  Clock3,
  Zap,
  Sun,
  Moon,
} from "lucide-react";

import { searchNews } from "./services/newsApi";
import ShortsFeed from "./components/ShortsFeed";
import NewsGlanceCard from "./components/NewsGlanceCard";

const trendingTopics = [
  "Artificial Intelligence",
  "OpenAI",
  "India Startups",
  "Technology",
];

const recentSearches = [
  "OpenAI",
  "AI startups",
  "Google AI",
];

const newsCategories = [
  "All",
  "India",
  "World",
  "AI",
  "Technology",
  "Smartphones",
  "Movies",
  "Gaming",
  "Sports",
  "Startups",
];

function App() {
  // -----------------------------------------
  // Theme
  // -----------------------------------------

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
  });

  // -----------------------------------------
  // Search / API state
  // -----------------------------------------

  const [search, setSearch] = useState("news");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stories, setStories] = useState([]);

  // -----------------------------------------
  // Shorts state
  // -----------------------------------------

  const [currentStoryIndex, setCurrentStoryIndex] =
    useState(0);

  const [isShortsOpen, setIsShortsOpen] =
    useState(false);

  // -----------------------------------------
  // Category state
  // -----------------------------------------

  const [selectedCategory, setSelectedCategory] =
    useState("All");

  // -----------------------------------------
  // Follow system theme
  // -----------------------------------------

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    const handleThemeChange = (event) => {
      setIsDarkMode(event.matches);
    };

    mediaQuery.addEventListener(
      "change",
      handleThemeChange
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        handleThemeChange
      );
    };
  }, []);

  // -----------------------------------------
  // Load default news
  // -----------------------------------------

  useEffect(() => {
    const loadDefaultNews = async () => {
      try {
        setLoading(true);
        setError("");

        console.log("📰 Loading default All category...");

        const data = await searchNews("news", 20);

        setStories(data.stories || []);
        setSelectedCategory("All");
      } catch (error) {
        console.error(
          "❌ Default news loading error:",
          error
        );

        setError("Failed to fetch news");
      } finally {
        setLoading(false);
      }
    };

    loadDefaultNews();
  }, []);

  // -----------------------------------------
  // Manual theme toggle
  // -----------------------------------------

  const toggleTheme = () => {
    setIsDarkMode((current) => !current);
  };

  // -----------------------------------------
  // Search news
  // -----------------------------------------

  const handleSearch = async (event) => {
    event.preventDefault();

    const keyword = search.trim();

    if (!keyword || loading) {
      return;
    }

    setLoading(true);
    setError("");
    setStories([]);
    setCurrentStoryIndex(0);
    setSelectedCategory("All");

    try {
      console.log("🔎 Searching for:", keyword);

      const data = await searchNews(
        keyword,
        20
      );

      console.log(
        "📰 News API response:",
        data
      );

      if (!data?.success) {
        throw new Error(
          data?.message ||
            "Failed to fetch news"
        );
      }

      setStories(data.stories || []);
    } catch (error) {
      console.error(
        "❌ Search error:",
        error
      );

      setError(
        error?.message ||
          "Something went wrong while fetching news."
      );
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------
  // Select topic
  // -----------------------------------------

  const selectTopic = (topic) => {
    setSearch(topic);
  };

  // -----------------------------------------
  // Category search
  // -----------------------------------------

  const handleCategorySelect = async (
    category
  ) => {
    if (loading) {
      return;
    }

    setSelectedCategory(category);

    const searchKeyword =
      category === "All"
        ? "news"
        : category;

    setSearch(searchKeyword);
    setLoading(true);
    setError("");
    setStories([]);
    setCurrentStoryIndex(0);

    try {
      console.log(
        "🔎 Searching category:",
        searchKeyword
      );

      const data = await searchNews(
        searchKeyword,
        20
      );

      console.log(
        "📰 Category response:",
        data
      );

      if (!data?.success) {
        throw new Error(
          data?.message ||
            "Failed to fetch category news"
        );
      }

      setStories(data.stories || []);
    } catch (error) {
      console.error(
        "❌ Category search error:",
        error
      );

      setError(
        error?.message ||
          "Something went wrong while fetching category news."
      );
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------
  // Automatic refresh every 5 minutes
  // -----------------------------------------

  useEffect(() => {
    if (!search.trim()) {
      return;
    }

    const refreshNews = async () => {
      if (loading) {
        return;
      }

      try {
        console.log(
          "🔄 Refreshing news:",
          search.trim()
        );

        const data = await searchNews(
          search.trim(),
          20
        );

        if (data?.success) {
          setStories(data.stories || []);

          console.log(
            `✅ Refreshed ${
              data.stories?.length || 0
            } stories`
          );
        }
      } catch (error) {
        console.error(
          "❌ Automatic refresh failed:",
          error
        );
      }
    };

    const interval = setInterval(
      refreshNews,
      5 * 60 * 1000
    );

    return () => {
      clearInterval(interval);
    };
  }, [search]);

  // -----------------------------------------
  // Open Shorts
  // -----------------------------------------

  const openStory = (index) => {
    setCurrentStoryIndex(index);
    setIsShortsOpen(true);
  };

  // -----------------------------------------
  // Close Shorts
  // -----------------------------------------

  const closeShorts = () => {
    setIsShortsOpen(false);
  };

  // -----------------------------------------
  // Stories
  // -----------------------------------------

  const filteredStories = stories;

  // -----------------------------------------
  // Theme classes
  // -----------------------------------------

  const theme = {
    page: isDarkMode
      ? "bg-[#08090b] text-white"
      : "bg-[#f7f8fc] text-zinc-900",

    mutedText: isDarkMode
      ? "text-zinc-400"
      : "text-zinc-600",

    subtleText: isDarkMode
      ? "text-zinc-500"
      : "text-zinc-500",

    verySubtleText: isDarkMode
      ? "text-zinc-600"
      : "text-zinc-400",

    border: isDarkMode
      ? "border-white/10"
      : "border-black/10",

    softBorder: isDarkMode
      ? "border-white/8"
      : "border-black/8",

    softBackground: isDarkMode
      ? "bg-white/[0.035]"
      : "bg-white",

    glassBackground: isDarkMode
      ? "bg-white/[0.06]"
      : "bg-white/80",

    inputText: isDarkMode
      ? "text-white"
      : "text-zinc-900",

    inputPlaceholder: isDarkMode
      ? "placeholder:text-zinc-600"
      : "placeholder:text-zinc-400",

    hoverBackground: isDarkMode
      ? "hover:bg-white/[0.05]"
      : "hover:bg-black/[0.04]",

    chipBackground: isDarkMode
      ? "bg-white/[0.03]"
      : "bg-black/[0.025]",

    chipHover: isDarkMode
      ? "hover:bg-white/[0.07]"
      : "hover:bg-black/[0.05]",

    headerBadge: isDarkMode
      ? "bg-white/[0.03]"
      : "bg-black/[0.025]",
  };

  return (
    <main
      className={`min-h-screen overflow-hidden transition-colors duration-300 ${theme.page}`}
    >
      {/* -----------------------------------------
          Background glow
      ----------------------------------------- */}

      <div className="pointer-events-none fixed inset-0">
        <div
          className={`absolute left-1/2 top-[-180px] h-[500px] w-[500px] -translate-x-1/2 rounded-full blur-[140px] ${
            isDarkMode
              ? "bg-violet-600/10"
              : "bg-violet-400/15"
          }`}
        />

        <div
          className={`absolute bottom-[-200px] right-[-100px] h-[450px] w-[450px] rounded-full blur-[140px] ${
            isDarkMode
              ? "bg-blue-500/10"
              : "bg-blue-400/10"
          }`}
        />
      </div>

      {/* -----------------------------------------
          Header
      ----------------------------------------- */}

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8 lg:px-10">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl border shadow-lg transition-colors ${theme.border} ${
              isDarkMode
                ? "bg-white/[0.06] shadow-violet-950/20"
                : "bg-white shadow-violet-200/40"
            }`}
          >
            <Sparkles className="h-5 w-5 text-violet-500" />
          </div>

          <div>
            <h1 className="text-sm font-semibold tracking-wide">
              AI News Shorts
            </h1>

            <p
              className={`text-[11px] ${theme.subtleText}`}
            >
              News. Simplified.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
  className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3 py-2 text-[11px] backdrop-blur-md sm:px-4 sm:text-xs ${theme.border} ${theme.headerBadge} ${theme.mutedText}`}
>
  <span className="live-dot h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />

  Live news discovery
</div>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={
              isDarkMode
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
            title={
              isDarkMode
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
            className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 active:scale-95 ${theme.border} ${theme.headerBadge} ${theme.mutedText} ${
              isDarkMode
                ? "hover:bg-white/[0.08] hover:text-white"
                : "hover:bg-black/[0.05] hover:text-zinc-900"
            }`}
          >
            {isDarkMode ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
        </div>
      </header>

      {/* -----------------------------------------
          Hero
      ----------------------------------------- */}

      <section className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-5 pb-16 pt-16 text-center sm:px-8 sm:pt-24 lg:pt-28">
        <div
          className={`mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs backdrop-blur-md ${theme.border} ${theme.headerBadge} ${theme.mutedText}`}
        >
          <Zap className="h-3.5 w-3.5 text-violet-500" />

          AI-powered news discovery
        </div>

        <h2 className="max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
          Understand the news
          <br />

          <span
            className={`bg-gradient-to-r bg-clip-text text-transparent ${
              isDarkMode
                ? "from-violet-300 via-white to-blue-300"
                : "from-violet-600 via-zinc-900 to-blue-600"
            }`}
          >
            in seconds.
          </span>
        </h2>

        <p
          className={`mt-7 max-w-2xl text-base leading-7 sm:text-lg ${theme.mutedText}`}
        >
          Search any topic and discover concise,
          AI-powered news stories gathered from
          multiple sources.
        </p>

        {/* Search */}

        <form
          onSubmit={handleSearch}
          className="mt-10 w-full max-w-2xl"
        >
          <div
            className={`group flex items-center rounded-2xl border p-1.5 shadow-2xl backdrop-blur-xl transition duration-300 focus-within:border-violet-400/50 ${theme.border} ${theme.glassBackground} ${
              isDarkMode
                ? "shadow-black/30 focus-within:bg-white/[0.08] focus-within:shadow-violet-950/20"
                : "shadow-zinc-200/60 focus-within:shadow-violet-200/40"
            }`}
          >
            <Search className="ml-4 h-5 w-5 shrink-0 text-zinc-500 transition group-focus-within:text-violet-500" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search topics, companies, people..."
              disabled={loading}
              className={`min-w-0 flex-1 bg-transparent px-4 py-4 text-sm outline-none sm:text-base ${theme.inputText} ${theme.inputPlaceholder} ${
                loading
                  ? "cursor-not-allowed opacity-60"
                  : ""
              }`}
            />

            <button
              type="submit"
              disabled={loading}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white transition hover:bg-violet-500 active:scale-95 ${
                loading
                  ? "cursor-not-allowed opacity-60"
                  : ""
              }`}
              aria-label="Search"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <ArrowRight className="h-5 w-5" />
              )}
            </button>
          </div>
        </form>

        {/* Trending */}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <span
            className={`mr-1 text-xs ${theme.verySubtleText}`}
          >
            Try
          </span>

          {trendingTopics.map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => selectTopic(topic)}
              disabled={loading}
              className={`rounded-full border px-3.5 py-2 text-xs transition ${theme.softBorder} ${theme.chipBackground} ${theme.mutedText} ${theme.chipHover} ${
                isDarkMode
                  ? "hover:border-white/15 hover:text-white"
                  : "hover:border-black/15 hover:text-zinc-900"
              } ${
                loading
                  ? "cursor-not-allowed opacity-50"
                  : ""
              }`}
            >
              {topic}
            </button>
          ))}
        </div>

        {/* Categories */}

        <div className="mt-10 w-full max-w-5xl">
          <div
            className={`flex gap-2 overflow-x-auto pb-2 ${
              isDarkMode
                ? "text-zinc-400"
                : "text-zinc-600"
            }`}
          >
            {newsCategories.map((category) => {
              const isSelected =
                selectedCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() =>
                    handleCategorySelect(category)
                  }
                  disabled={loading}
                  className={`shrink-0 rounded-full border px-4 py-2.5 text-xs font-medium transition-all duration-200 ${
                    isSelected
                      ? "border-violet-500 bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                      : `${theme.softBorder} ${theme.chipBackground} ${theme.mutedText} ${
                          isDarkMode
                            ? "hover:border-white/15 hover:bg-white/[0.06] hover:text-white"
                            : "hover:border-black/15 hover:bg-black/[0.04] hover:text-zinc-900"
                        }`
                  } ${
                    loading
                      ? "cursor-not-allowed opacity-50"
                      : "active:scale-95"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* -----------------------------------------
          Loading
      ----------------------------------------- */}

      {loading && (
        <section className="relative z-10 mx-auto max-w-2xl px-5 pb-12 text-center sm:px-8">
          <div
            className={`rounded-3xl border p-8 backdrop-blur-xl ${theme.softBorder} ${theme.softBackground}`}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-violet-500/20 bg-violet-500/10">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
            </div>

            <h3 className="mt-5 text-sm font-semibold">
              Finding the latest stories
            </h3>

            <p
              className={`mx-auto mt-2 max-w-md text-xs leading-5 ${theme.mutedText}`}
            >
              Gathering news from multiple sources
              and creating your AI summary...
            </p>

            <div className="mx-auto mt-6 flex max-w-sm flex-wrap justify-center gap-2">
              <span
                className={`rounded-full border px-3 py-1.5 text-[11px] ${theme.softBorder} ${theme.chipBackground} ${theme.subtleText}`}
              >
                Google News
              </span>

              <span
                className={`rounded-full border px-3 py-1.5 text-[11px] ${theme.softBorder} ${theme.chipBackground} ${theme.subtleText}`}
              >
                Reddit
              </span>

              <span
                className={`rounded-full border px-3 py-1.5 text-[11px] ${theme.softBorder} ${theme.chipBackground} ${theme.subtleText}`}
              >
                AI Summary
              </span>
            </div>
          </div>
        </section>
      )}

      {/* -----------------------------------------
          Error
      ----------------------------------------- */}

      {error && !loading && (
        <section className="relative z-10 mx-auto max-w-2xl px-5 pb-12 sm:px-8">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 text-center">
            <p className="text-sm font-medium text-red-400">
              Something went wrong
            </p>

            <p
              className={`mt-2 text-xs leading-5 ${theme.mutedText}`}
            >
              {error}
            </p>

            <button
              type="button"
              onClick={() => setError("")}
              className="mt-4 rounded-lg bg-red-500/10 px-4 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/20"
            >
              Dismiss
            </button>
          </div>
        </section>
      )}

      {/* -----------------------------------------
          News feed
      ----------------------------------------- */}

      {!loading && filteredStories.length > 0 && (
        <section className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-16 sm:px-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p
                className={`text-xs ${theme.subtleText}`}
              >
                Latest stories
              </p>

              <h3 className="mt-1 text-2xl font-semibold tracking-tight">
                {selectedCategory === "All"
                  ? "News for you"
                  : `${selectedCategory} news`}
              </h3>

              <p
                className={`mt-1 text-sm ${theme.mutedText}`}
              >
                Quick stories from multiple sources
              </p>
            </div>

            <div
              className={`hidden rounded-full border px-3 py-1.5 text-xs sm:block ${theme.softBorder} ${theme.chipBackground} ${theme.subtleText}`}
            >
              {filteredStories.length} stories
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
            {filteredStories.map((story) => (
              <NewsGlanceCard
                key={story._id}
                story={story}
                isDarkMode={isDarkMode}
                onOpen={() => {
                  const storyIndex =
                    stories.findIndex(
                      (item) =>
                        item._id === story._id
                    );

                  if (storyIndex !== -1) {
                    openStory(storyIndex);
                  }
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* -----------------------------------------
          No stories
      ----------------------------------------- */}

      {!loading &&
        stories.length === 0 &&
        !error &&
        search.trim() && (
          <section className="relative z-10 mx-auto max-w-2xl px-5 pb-16 text-center sm:px-8">
            <div
              className={`rounded-3xl border p-8 ${theme.softBorder} ${theme.softBackground}`}
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/10">
                <Search className="h-5 w-5 text-violet-500" />
              </div>

              <h3 className="mt-5 text-base font-semibold">
                No stories found
              </h3>

              <p
                className={`mx-auto mt-2 max-w-md text-sm leading-6 ${theme.mutedText}`}
              >
                Try searching for another topic.
              </p>
            </div>
          </section>
        )}

      {/* -----------------------------------------
          Lower content
      ----------------------------------------- */}

      {!loading &&
        stories.length === 0 &&
        !error &&
        !search.trim() && (
          <section className="relative z-10 mx-auto max-w-5xl px-5 pb-20 sm:px-8">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Trending */}

              <div
                className={`rounded-3xl border p-6 backdrop-blur-sm transition-colors ${theme.softBorder} ${theme.softBackground}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
                    <TrendingUp className="h-5 w-5 text-violet-500" />
                  </div>

                  <div>
                    <h3 className="text-sm font-medium">
                      Explore trending
                    </h3>

                    <p
                      className={`mt-0.5 text-xs ${theme.subtleText}`}
                    >
                      What people are reading
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  {trendingTopics.map(
                    (topic, index) => (
                      <button
                        key={topic}
                        type="button"
                        onClick={() =>
                          selectTopic(topic)
                        }
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition ${theme.hoverBackground}`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-5 text-xs ${theme.verySubtleText}`}
                          >
                            0{index + 1}
                          </span>

                          <span
                            className={`text-sm ${
                              isDarkMode
                                ? "text-zinc-300"
                                : "text-zinc-700"
                            }`}
                          >
                            {topic}
                          </span>
                        </div>

                        <ArrowRight
                          className={`h-4 w-4 ${theme.verySubtleText}`}
                        />
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Recent searches */}

              <div
                className={`rounded-3xl border p-6 backdrop-blur-sm transition-colors ${theme.softBorder} ${theme.softBackground}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                    <Clock3 className="h-5 w-5 text-blue-500" />
                  </div>

                  <div>
                    <h3 className="text-sm font-medium">
                      Recent searches
                    </h3>

                    <p
                      className={`mt-0.5 text-xs ${theme.subtleText}`}
                    >
                      Jump back into a topic
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  {recentSearches.map(
                    (topic) => (
                      <button
                        key={topic}
                        type="button"
                        onClick={() =>
                          selectTopic(topic)
                        }
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition ${theme.hoverBackground}`}
                      >
                        <div className="flex items-center gap-3">
                          <Search
                            className={`h-4 w-4 ${theme.verySubtleText}`}
                          />

                          <span
                            className={`text-sm ${
                              isDarkMode
                                ? "text-zinc-300"
                                : "text-zinc-700"
                            }`}
                          >
                            {topic}
                          </span>
                        </div>

                        <ArrowRight
                          className={`h-4 w-4 ${theme.verySubtleText}`}
                        />
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="mt-10 text-center">
              <p
                className={`text-xs ${theme.verySubtleText}`}
              >
                Multiple sources · AI summaries ·
                Original article links
              </p>
            </div>
          </section>
        )}

      {/* -----------------------------------------
          Footer
      ----------------------------------------- */}

      {/* -----------------------------------------
    Footer / News Intelligence
----------------------------------------- */}

{!loading && filteredStories.length > 0 && (
  <section className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-14 pt-2 sm:px-8 lg:px-10">

    {/* Section heading */}
    <div className="mb-8 text-center">
      <p
        className={`text-[11px] font-medium uppercase tracking-[0.18em] ${theme.verySubtleText}`}
      >
        News intelligence
      </p>

      <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
        Stay informed, without the noise.
      </h2>

      <p
        className={`mx-auto mt-2 max-w-xl text-sm leading-6 ${theme.mutedText}`}
      >
        Search a topic, explore multiple perspectives, and understand the
        important details faster.
      </p>
    </div>

    {/* Feature cards */}
    <div className="grid gap-4 md:grid-cols-3">

      {/* Discover */}
      <div
        className={`group rounded-2xl border p-6 transition-all duration-300 ${
          isDarkMode
            ? "border-white/10 bg-white/[0.025] hover:border-violet-400/60 hover:bg-white/[0.045] hover:shadow-[0_0_25px_rgba(139,92,246,0.10)]"
            : "border-black/10 bg-white/70 hover:border-violet-200 hover:bg-white"
        }`}
      >
        <div
          className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl ${
            isDarkMode
              ? "bg-violet-500/10 text-violet-300"
              : "bg-violet-50 text-violet-600"
          }`}
        >
          <Search className="h-5 w-5" />
        </div>

        <p
          className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${theme.verySubtleText}`}
        >
          Discover
        </p>

        <h3 className="mt-2 text-base font-semibold">
          Search what matters
        </h3>

        <p className={`mt-2 text-sm leading-6 ${theme.mutedText}`}>
          Find current stories about the topics, companies, and ideas you
          care about.
        </p>
      </div>

      {/* Connect */}
      <div
        className={`group rounded-2xl border p-6 transition-all duration-300 ${
          isDarkMode
            ? "border-white/10 bg-white/[0.025] hover:border-blue-400/60 hover:bg-white/[0.045] hover:shadow-[0_0_25px_rgba(59,130,246,0.10)]"
            : "border-black/10 bg-white/70 hover:border-blue-200 hover:bg-white"
        }`}
      >
        <div
          className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl ${
            isDarkMode
              ? "bg-blue-500/10 text-blue-300"
              : "bg-blue-50 text-blue-600"
          }`}
        >
          <TrendingUp className="h-5 w-5" />
        </div>

        <p
          className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${theme.verySubtleText}`}
        >
          Connect
        </p>

        <h3 className="mt-2 text-base font-semibold">
          See the bigger picture
        </h3>

        <p className={`mt-2 text-sm leading-6 ${theme.mutedText}`}>
          Related coverage from multiple sources is brought together into
          one story.
        </p>
      </div>

      {/* Understand */}
      <div
        className={`group rounded-2xl border p-6 transition-all duration-300 ${
          isDarkMode
            ? "border-white/10 bg-white/[0.025] hover:border-emerald-400/60 hover:bg-white/[0.045] hover:shadow-[0_0_25px_rgba(16,185,129,0.10)]"
            : "border-black/10 bg-white/70 hover:border-emerald-200 hover:bg-white"
        }`}
      >
        <div
          className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl ${
            isDarkMode
              ? "bg-emerald-500/10 text-emerald-300"
              : "bg-emerald-50 text-emerald-600"
          }`}
        >
          <Zap className="h-5 w-5" />
        </div>

        <p
          className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${theme.verySubtleText}`}
        >
          Understand
        </p>

        <h3 className="mt-2 text-base font-semibold">
          AI-powered clarity
        </h3>

        <p className={`mt-2 text-sm leading-6 ${theme.mutedText}`}>
          Get concise summaries with source attribution and links to the
          original reporting.
        </p>
      </div>
    </div>

    {/* Bottom brand line */}
    <div className="mt-10 flex flex-col items-center justify-center gap-2 text-center">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-violet-500" />

        <span className="text-sm font-semibold">
          AI News Shorts
        </span>
      </div>

      <p className={`text-xs ${theme.verySubtleText}`}>
        News. Simplified. · Multiple sources · AI-assisted
      </p>
    </div>

  </section>
)}

      {/* -----------------------------------------
          Shorts viewer
      ----------------------------------------- */}

      {isShortsOpen && stories.length > 0 && (
        <ShortsFeed
          stories={stories}
          currentStoryIndex={currentStoryIndex}
          setCurrentStoryIndex={
            setCurrentStoryIndex
          }
          onClose={closeShorts}
        />
      )}
    </main>
  );
}

export default App;