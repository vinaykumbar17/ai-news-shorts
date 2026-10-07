const Story = require("../models/Story");

const {
  fetchGoogleNews,
} = require("../services/googleNewsService");

const {
  fetchRedditNews,
} = require("../services/redditService");

const {
  normalizeArticles,
} = require("../utils/normalize");

const {
  deduplicateArticles,
} = require("../utils/deduplicate");

const {
  clusterArticles,
} = require("../services/clusteringService");

const {
  buildStoriesFromClusters,
} = require("../services/storyBuilderService");

const {
  searchUnsplashImage,
} = require("../services/imageService");

// ============================================================
// CATEGORY KEYWORDS
// ============================================================

const CATEGORY_KEYWORDS = {
  Sports: [
    "sport",
    "sports",
    "cricket",
    "football",
    "soccer",
    "tennis",
    "basketball",
    "baseball",
    "hockey",
    "golf",
    "rugby",
    "volleyball",
    "badminton",
    "wrestling",
    "boxing",
    "ufc",
    "mma",
    "formula 1",
    "f1",
    "motogp",
    "racing",
    "athlete",
    "athletes",
    "player",
    "players",
    "team",
    "teams",
    "coach",
    "coaches",
    "match",
    "matches",
    "tournament",
    "league",
    "championship",
    "championships",
    "cup",
    "final",
    "semifinal",
    "quarterfinal",
    "olympics",
    "medal",
    "medals",
    "world cup",
    "ipl",
    "bcci",
    "icc",
    "nba",
    "nfl",
    "nhl",
    "mlb",
    "wta",
    "atp",
    "espn",
  ],

  AI: [
    "ai",
    "artificial intelligence",
    "machine learning",
    "deep learning",
    "generative ai",
    "genai",
    "chatgpt",
    "openai",
    "gemini",
    "claude",
    "anthropic",
    "copilot",
    "llm",
    "large language model",
    "neural network",
    "robotics",
  ],

  Startups: [
    "startup",
    "startups",
    "founder",
    "founders",
    "funding",
    "fundraise",
    "fundraising",
    "venture capital",
    "vc",
    "seed funding",
    "series a",
    "series b",
    "series c",
    "unicorn",
    "entrepreneur",
    "entrepreneurship",
    "investor",
    "investors",
    "acquisition",
    "valuation",
    "ipo",
  ],

  Gaming: [
    "gaming",
    "game",
    "games",
    "gamer",
    "gamers",
    "playstation",
    "xbox",
    "nintendo",
    "steam",
    "epic games",
    "gta",
    "grand theft auto",
    "fortnite",
    "minecraft",
    "esports",
    "e-sports",
    "console",
    "pc gaming",
    "video game",
    "video games",
  ],

  Movies: [
    "movie",
    "movies",
    "film",
    "films",
    "cinema",
    "actor",
    "actress",
    "director",
    "hollywood",
    "bollywood",
    "tollywood",
    "kollywood",
    "box office",
    "trailer",
    "release",
    "netflix",
    "prime video",
    "disney",
    "marvel",
    "dc",
  ],

  Smartphones: [
    "smartphone",
    "smartphones",
    "phone",
    "phones",
    "iphone",
    "android",
    "samsung galaxy",
    "pixel",
    "oneplus",
    "xiaomi",
    "redmi",
    "realme",
    "oppo",
    "vivo",
    "motorola",
    "mobile",
    "mobile phone",
  ],

  Technology: [
    "technology",
    "tech",
    "software",
    "hardware",
    "cloud",
    "cybersecurity",
    "cyber security",
    "internet",
    "microsoft",
    "google",
    "apple",
    "amazon",
    "meta",
    "nvidia",
    "intel",
    "amd",
    "chip",
    "chips",
    "semiconductor",
    "data center",
  ],

  India: [
    "india",
    "indian",
    "delhi",
    "mumbai",
    "bengaluru",
    "bangalore",
    "hyderabad",
    "chennai",
    "kolkata",
    "pune",
    "karnataka",
    "kerala",
    "maharashtra",
    "tamil nadu",
    "uttar pradesh",
  ],

  World: [
    "world",
    "international",
    "global",
    "united states",
    "usa",
    "uk",
    "united kingdom",
    "china",
    "russia",
    "europe",
    "european union",
    "middle east",
    "united nations",
  ],
};

// ============================================================
// NORMALIZE TEXT
// ============================================================

const normalizeText = (text = "") => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

// ============================================================
// CHECK KEYWORD
// ============================================================

const containsKeyword = (text, keyword) => {
  const normalizedText = normalizeText(text);
  const normalizedKeyword = normalizeText(keyword);

  if (!normalizedText || !normalizedKeyword) {
    return false;
  }

  if (normalizedKeyword.includes(" ")) {
    return normalizedText.includes(normalizedKeyword);
  }

  return normalizedText
    .split(/\s+/)
    .includes(normalizedKeyword);
};

// ============================================================
// DETECT CATEGORY
// ============================================================

const detectCategory = (keyword = "") => {
  const normalizedKeyword = normalizeText(keyword);

  if (!normalizedKeyword) {
    return "General";
  }

  for (const category of Object.keys(CATEGORY_KEYWORDS)) {
    if (
      normalizedKeyword ===
      category.toLowerCase()
    ) {
      return category;
    }

    if (
      CATEGORY_KEYWORDS[category].some(
        (term) =>
          normalizeText(term) ===
          normalizedKeyword
      )
    ) {
      return category;
    }
  }

  return "General";
};

// ============================================================
// ARTICLE RELEVANCE SCORE
// ============================================================

const calculateRelevanceScore = (
  article,
  keyword
) => {
  const category = detectCategory(keyword);

  const title = normalizeText(
    article.title || ""
  );

  const snippet = normalizeText(
    article.snippet || ""
  );

  if (category !== "General") {
    const terms =
      CATEGORY_KEYWORDS[category] || [];

    let score = 0;

    for (const term of terms) {
      if (containsKeyword(title, term)) {
        score += 10;
      }

      if (containsKeyword(snippet, term)) {
        score += 3;
      }
    }

    return score;
  }

  let score = 0;

  if (containsKeyword(title, keyword)) {
    score += 10;
  }

  if (containsKeyword(snippet, keyword)) {
    score += 4;
  }

  return score;
};

// ============================================================
// FILTER RELEVANT ARTICLES
// ============================================================

const filterRelevantArticles = (
  articles,
  keyword
) => {
  const category = detectCategory(keyword);

  if (category === "General") {
    return articles;
  }

  const terms =
    CATEGORY_KEYWORDS[category] || [];

  const filtered = articles.filter(
    (article) => {
      const title = normalizeText(
        article.title || ""
      );

      const snippet = normalizeText(
        article.snippet || ""
      );

      const titleMatches = terms.filter(
        (term) =>
          containsKeyword(title, term)
      );

      if (titleMatches.length > 0) {
        return true;
      }

      const snippetMatches = terms.filter(
        (term) =>
          containsKeyword(snippet, term)
      );

      return snippetMatches.length >= 2;
    }
  );

  console.log(
    `🎯 ${category} article filter: ${filtered.length}/${articles.length}`
  );

  return filtered;
};

// ============================================================
// CLUSTER RELEVANCE
// ============================================================

const calculateClusterRelevance = (
  cluster,
  keyword
) => {
  const articles =
    cluster?.articles || [];

  if (!articles.length) {
    return 0;
  }

  const scores = articles.map(
    (article) =>
      calculateRelevanceScore(
        article,
        keyword
      )
  );

  const highestScore = Math.max(
    ...scores
  );

  const totalScore = scores.reduce(
    (sum, score) => sum + score,
    0
  );

  const sourceBonus =
    Math.min(articles.length, 5) * 2;

  return (
    highestScore +
    totalScore * 0.25 +
    sourceBonus
  );
};

// ============================================================
// REPAIR MISSING IMAGE
// ============================================================

const repairStoryImage = async (story) => {
  try {
    if (!story) {
      return story;
    }

    // --------------------------------------------------------
    // Image already exists
    // --------------------------------------------------------

    if (
      story.imageUrl &&
      typeof story.imageUrl === "string" &&
      story.imageUrl.trim()
    ) {
      return story;
    }

    console.log(
      `🖼️ Missing image detected: ${story.headline}`
    );

    // --------------------------------------------------------
    // 1. Try original source image
    // --------------------------------------------------------

    const sourceWithImage =
      (story.sources || []).find(
        (source) =>
          source?.imageUrl &&
          typeof source.imageUrl === "string" &&
          source.imageUrl.trim()
      );

    if (sourceWithImage) {
      story.imageUrl =
        sourceWithImage.imageUrl;

      story.imageProvider = "Source";

      await story.save();

      console.log(
        "✅ Repaired using original source image"
      );

      return story;
    }

    // --------------------------------------------------------
    // 2. Try Unsplash
    // --------------------------------------------------------

    console.log(
      "🔄 No source image. Trying Unsplash..."
    );

    const result =
      await searchUnsplashImage({
        headline:
          story.headline || "",
        summary:
          story.summary || "",
      });

    if (
      result?.imageUrl &&
      typeof result.imageUrl === "string"
    ) {
      story.imageUrl =
        result.imageUrl;

      story.imageProvider =
        "Unsplash";

      await story.save();

      console.log(
        "✅ Repaired using Unsplash"
      );

      return story;
    }

    // --------------------------------------------------------
    // 3. Nothing available
    // --------------------------------------------------------

    console.log(
      "⚠️ Could not repair story image"
    );

    return story;
  } catch (error) {
    console.error(
      "❌ Image repair failed:",
      error?.message || error
    );

    return story;
  }
};

// ============================================================
// REPAIR MULTIPLE STORIES
// ============================================================

const repairMissingImages = async (
  stories
) => {
  const repairedStories = [];

  for (const story of stories) {
    const repaired =
      await repairStoryImage(story);

    repairedStories.push(repaired);
  }

  return repairedStories;
};

// ============================================================
// CREATE TEST STORY
// ============================================================

const createStory = async (req, res) => {
  try {
    const story = await Story.create({
      headline:
        "OpenAI announces a new AI development",

      summary:
        "This is a test story created to verify the MongoDB connection.",

      whyItMatters:
        "This test confirms that our backend can store and retrieve news stories.",

      imageUrl: "",

      keywords: [
        "AI",
        "Technology",
        "OpenAI",
      ],

      category: "AI",

      sources: [
        {
          sourceName: "Test Source",

          title:
            "OpenAI announces a new AI development",

          url: "https://example.com",

          author: "Test Author",

          snippet:
            "Test source used for database verification.",
        },
      ],
    });

    res.status(201).json({
      success: true,
      message:
        "Test story created successfully",
      story,
    });
  } catch (error) {
    console.error(
      "Create story error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to create story",
    });
  }
};

// ============================================================
// GET ALL STORIES
// ============================================================

const getStories = async (req, res) => {
  try {
    let stories = await Story.find()
      .sort({ publishedAt: -1 })
      .limit(20);

    // Repair old stories which have no image
    stories =
      await repairMissingImages(stories);

    res.json({
      success: true,
      count: stories.length,
      stories,
    });
  } catch (error) {
    console.error(
      "Get stories error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch stories",
    });
  }
};

// ============================================================
// GOOGLE NEWS
// ============================================================

const getGoogleNews = async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message:
          "Keyword is required",
      });
    }

    const articles =
      await fetchGoogleNews(keyword);

    res.json({
      success: true,
      keyword,
      count: articles.length,
      articles,
    });
  } catch (error) {
    console.error(
      "Google News controller error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch Google News",
    });
  }
};

// ============================================================
// REDDIT
// ============================================================

const getRedditNews = async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message:
          "Keyword is required",
      });
    }

    const posts =
      await fetchRedditNews(keyword);

    res.json({
      success: true,
      keyword,
      count: posts.length,
      posts,
    });
  } catch (error) {
    console.error(
      "Reddit controller error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch Reddit posts",
    });
  }
};

// ============================================================
// SEARCH NEWS
// ============================================================

const searchNews = async (req, res) => {
  console.time("TOTAL SEARCH");

  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message:
          "Keyword is required",
      });
    }

    const cleanKeyword =
      keyword.trim();

    const category =
      detectCategory(cleanKeyword);

    console.log(
      `\n🔎 Searching news for: ${cleanKeyword}`
    );

    console.log(
      `🎯 Detected category: ${category}`
    );

    // ========================================================
    // 1. COLLECT NEWS
    // ========================================================

    console.time(
      "1. NEWS COLLECTION"
    );

    const [
      googleArticles,
      redditPosts,
    ] = await Promise.all([
      fetchGoogleNews(cleanKeyword),
      fetchRedditNews(cleanKeyword),
    ]);

    console.timeEnd(
      "1. NEWS COLLECTION"
    );

    console.log(
      `📰 Google News: ${googleArticles.length}`
    );

    console.log(
      `🔴 Reddit: ${redditPosts.length}`
    );

    // ========================================================
    // 2. COMBINE
    // ========================================================

    const combinedArticles = [
      ...googleArticles,
      ...redditPosts,
    ];

    console.log(
      `📚 Combined articles: ${combinedArticles.length}`
    );

    // ========================================================
    // 3. NORMALIZE
    // ========================================================

    console.time(
      "2. NORMALIZATION"
    );

    const normalizedArticles =
      normalizeArticles(
        combinedArticles
      );

    console.timeEnd(
      "2. NORMALIZATION"
    );

    console.log(
      `📄 Normalized articles: ${normalizedArticles.length}`
    );

    // ========================================================
    // 4. RELEVANCE FILTER
    // ========================================================

    console.time(
      "3. RELEVANCE FILTER"
    );

    const relevantArticles =
      filterRelevantArticles(
        normalizedArticles,
        cleanKeyword
      );

    console.timeEnd(
      "3. RELEVANCE FILTER"
    );

    console.log(
      `🎯 Relevant articles: ${relevantArticles.length}`
    );

    // ========================================================
    // NO RELEVANT ARTICLES
    // ========================================================

    if (
      category !== "General" &&
      relevantArticles.length === 0
    ) {
      console.log(
        `⚠️ No relevant ${category} articles found.`
      );

      console.timeEnd(
        "TOTAL SEARCH"
      );

      return res.json({
        success: true,
        keyword: cleanKeyword,
        category,
        googleNewsCount:
          googleArticles.length,
        redditCount:
          redditPosts.length,
        totalBeforeDeduplication:
          normalizedArticles.length,
        totalAfterRelevanceFilter: 0,
        totalAfterDeduplication: 0,
        clusterCount: 0,
        newClusterCount: 0,
        storyCount: 0,
        newStoryCount: 0,
        stories: [],
      });
    }

    // ========================================================
    // 5. DEDUPLICATION
    // ========================================================

    console.time(
      "4. DEDUPLICATION"
    );

    const uniqueArticles =
      deduplicateArticles(
        relevantArticles
      );

    console.timeEnd(
      "4. DEDUPLICATION"
    );

    console.log(
      `🧹 Unique relevant articles: ${uniqueArticles.length}`
    );

    // ========================================================
    // 6. CLUSTERING
    // ========================================================

    console.time(
      "5. CLUSTERING"
    );

    const clusters =
      clusterArticles(
        uniqueArticles
      );

    console.timeEnd(
      "5. CLUSTERING"
    );

    console.log(
      `📊 Relevant clusters: ${clusters.length}`
    );

    // ========================================================
    // 7. DATABASE CHECK
    //
    // IMPORTANT:
    // Existing stories are NOT thrown away anymore.
    // We reuse them and repair missing images.
    // ========================================================

    console.time(
      "6. DATABASE CHECK"
    );

    const clusterSourceUrls =
      clusters.flatMap(
        (cluster) =>
          (cluster.articles || []).map(
            (article) =>
              article.url
          )
      );

    let existingStories = [];

    if (clusterSourceUrls.length > 0) {
      existingStories =
        await Story.find({
          "sources.url": {
            $in: clusterSourceUrls,
          },
        });
    }

    // --------------------------------------------------------
    // Map source URL -> existing MongoDB story
    // --------------------------------------------------------

    const existingStoryByUrl =
      new Map();

    for (const story of existingStories) {
      for (const source of story.sources || []) {
        if (source?.url) {
          existingStoryByUrl.set(
            source.url,
            story
          );
        }
      }
    }

    // --------------------------------------------------------
    // Separate existing and new clusters
    // --------------------------------------------------------

    const existingClusterStories = [];
    const newClusters = [];

    for (const cluster of clusters) {
      const matchingStory =
        cluster.articles
          .map((article) =>
            existingStoryByUrl.get(
              article.url
            )
          )
          .find(Boolean);

      if (matchingStory) {
        existingClusterStories.push({
          cluster,
          story: matchingStory,
        });
      } else {
        newClusters.push(cluster);
      }
    }

    console.timeEnd(
      "6. DATABASE CHECK"
    );

    console.log(
      `♻️ Existing clusters: ${existingClusterStories.length}`
    );

    console.log(
      `🆕 New clusters: ${newClusters.length}`
    );

    // ========================================================
    // 8. RANK NEW CLUSTERS
    // ========================================================

    const rankedNewClusters =
      [...newClusters]
        .map((cluster) => {
          const articles =
            cluster.articles || [];

          const relevanceScore =
            calculateClusterRelevance(
              cluster,
              cleanKeyword
            );

          const sourceScore =
            Math.min(
              articles.length,
              5
            ) * 3;

          const newestDate =
            articles.reduce(
              (latest, article) => {
                const date =
                  article.publishedAt
                    ? new Date(
                        article.publishedAt
                      )
                    : null;

                if (
                  !date ||
                  Number.isNaN(
                    date.getTime()
                  )
                ) {
                  return latest;
                }

                return (
                  !latest ||
                  date > latest
                )
                  ? date
                  : latest;
              },
              null
            );

          let recencyScore = 0;

          if (newestDate) {
            const ageHours =
              (Date.now() -
                newestDate.getTime()) /
              (1000 * 60 * 60);

            if (ageHours <= 6) {
              recencyScore = 5;
            } else if (
              ageHours <= 24
            ) {
              recencyScore = 3;
            } else if (
              ageHours <= 72
            ) {
              recencyScore = 1;
            }
          }

          const finalScore =
            relevanceScore * 3 +
            sourceScore +
            recencyScore;

          return {
            cluster,
            score: finalScore,
          };
        })
        .sort(
          (a, b) =>
            b.score - a.score
        )
        .map(
          (item) =>
            item.cluster
        );

    // ========================================================
    // 9. TOP 20 NEW CLUSTERS
    // ========================================================

    const topClusters =
      rankedNewClusters.slice(
        0,
        20
      );

    console.log(
      `🤖 New AI clusters being processed: ${topClusters.length}`
    );

    // ========================================================
    // 10. AI + IMAGE GENERATION
    // ========================================================

    console.time(
      "7. AI PROCESSING"
    );

    const newStories =
      await buildStoriesFromClusters(
        topClusters,
        cleanKeyword
      );

    console.timeEnd(
      "7. AI PROCESSING"
    );

    console.log(
      `📝 New stories built: ${newStories.length}`
    );

    // ========================================================
    // 11. SAVE NEW STORIES
    // ========================================================

    console.time(
      "8. DATABASE SAVE"
    );

    const allSourceUrls =
      newStories.flatMap(
        (story) =>
          (story.sources || []).map(
            (source) =>
              source.url
          )
      );

    let existingUrlsAfterBuild =
      new Set();

    if (
      allSourceUrls.length > 0
    ) {
      const existingStoriesAfterBuild =
        await Story.find(
          {
            "sources.url": {
              $in: allSourceUrls,
            },
          },
          {
            "sources.url": 1,
          }
        );

      existingUrlsAfterBuild =
        new Set(
          existingStoriesAfterBuild.flatMap(
            (story) =>
              (story.sources || []).map(
                (source) =>
                  source.url
              )
          )
        );
    }

    const storiesToSave =
      newStories.filter(
        (story) =>
          (story.sources || []).every(
            (source) =>
              !existingUrlsAfterBuild.has(
                source.url
              )
          )
      );

    let savedStories = [];

    if (
      storiesToSave.length > 0
    ) {
      savedStories =
        await Story.insertMany(
          storiesToSave
        );
    }

    console.timeEnd(
      "8. DATABASE SAVE"
    );

    console.log(
      `💾 New stories saved: ${savedStories.length}`
    );

    // ========================================================
    // 12. REUSE EXISTING STORIES
    // ========================================================

    let reusedStories =
      existingClusterStories.map(
        (item) => item.story
      );

    // ========================================================
    // 13. REPAIR OLD MISSING IMAGES
    // ========================================================

    console.time(
      "9. IMAGE REPAIR"
    );

    reusedStories =
      await repairMissingImages(
        reusedStories
      );

    console.timeEnd(
      "9. IMAGE REPAIR"
    );

    // ========================================================
    // 14. COMBINE NEW + EXISTING
    //
    // Existing stories are reused instead of regenerated.
    // ========================================================

    const combinedStoriesForResponse = [
      ...savedStories,
      ...reusedStories,
    ];

    // --------------------------------------------------------
    // Remove duplicate MongoDB documents
    // --------------------------------------------------------

    const seenStoryIds =
      new Set();

    const uniqueResponseStories =
      combinedStoriesForResponse.filter(
        (story) => {
          const storyId =
            story._id?.toString();

          if (!storyId) {
            return true;
          }

          if (
            seenStoryIds.has(
              storyId
            )
          ) {
            return false;
          }

          seenStoryIds.add(
            storyId
          );

          return true;
        }
      );

    // ========================================================
    // 15. LIMIT TO 20
    // ========================================================

    const storiesForResponse =
      uniqueResponseStories.slice(
        0,
        20
      );

    // ========================================================
    // 16. RESPONSE
    // ========================================================

    console.log(
      `📰 Returning ${storiesForResponse.length} stories`
    );

    console.timeEnd(
      "TOTAL SEARCH"
    );

    console.log(
      "✅ Search completed\n"
    );

    res.json({
      success: true,

      keyword: cleanKeyword,

      category,

      googleNewsCount:
        googleArticles.length,

      redditCount:
        redditPosts.length,

      totalBeforeDeduplication:
        normalizedArticles.length,

      totalAfterRelevanceFilter:
        relevantArticles.length,

      totalAfterDeduplication:
        uniqueArticles.length,

      clusterCount:
        clusters.length,

      newClusterCount:
        newClusters.length,

      storyCount:
        storiesForResponse.length,

      newStoryCount:
        savedStories.length,

      stories:
        storiesForResponse,
    });
  } catch (error) {
    console.timeEnd(
      "TOTAL SEARCH"
    );

    console.error(
      "❌ Search news error:",
      error.message
    );

    console.error(
      error.stack
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to search news",
    });
  }
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  createStory,
  getStories,
  getGoogleNews,
  getRedditNews,
  searchNews,
};