const { generateStorySummary } = require("./aiService");

const {
  generateStoryImage,
  searchUnsplashImage,
  getFallbackImage,
} = require("./imageService");

// ============================================================
// CONFIGURATION
// ============================================================

const MAX_AI_STORIES = 12;
const BATCH_SIZE = 2;

// ============================================================
// CATEGORY DETECTION
// ============================================================

const detectCategory = (text = "") => {
  const value = text.toLowerCase();

  // ==========================================================
  // SMARTPHONES
  // ==========================================================

  if (
    /iphone|smartphone|android|samsung|pixel|oneplus|xiaomi|mobile phone/.test(
      value
    )
  ) {
    return "Smartphones";
  }

  // ==========================================================
  // SPORTS
  // ==========================================================

  if (
    /cricket|football|soccer|nba|basketball|tennis|badminton|ipl|fifa|sports|formula 1|f1|motogp/.test(
      value
    )
  ) {
    return "Sports";
  }

  // ==========================================================
  // MOVIES
  // ==========================================================

  if (
    /movie|movies|film|cinema|actor|actress|bollywood|hollywood|trailer|box office/.test(
      value
    )
  ) {
    return "Movies";
  }

  // ==========================================================
  // GAMING
  // ==========================================================

  if (
    /gaming|gamer|video game|video games|esports|esport|console|xbox|playstation|ps5|ps6|nintendo|switch|steam|epic games|fortnite|minecraft|roblox|gta|grand theft auto|valorant|counter strike|league of legends|game studio|game developer|cloud gaming/.test(
      value
    )
  ) {
    return "Gaming";
  }

  // ==========================================================
  // AI
  // ==========================================================

  if (
    /artificial intelligence|\bai\b|machine learning|deep learning|generative ai|llm|chatgpt|openai|gemini|claude|anthropic|copilot|robotics/.test(
      value
    )
  ) {
    return "AI";
  }

  // ==========================================================
  // STARTUPS
  // ==========================================================

  if (
    /startup|startups|founder|entrepreneur|venture capital|funding|funded|unicorn|investment|investor|seed round|series a|series b/.test(
      value
    )
  ) {
    return "Startups";
  }

  // ==========================================================
  // INDIA
  // ==========================================================

  if (
    /india|indian|new delhi|mumbai|bengaluru|bangalore|hyderabad|chennai|karnataka|pune/.test(
      value
    )
  ) {
    return "India";
  }

  // ==========================================================
  // TECHNOLOGY
  // ==========================================================

  if (
    /technology|tech|software|computer|cloud|cybersecurity|internet|digital|innovation|app|microsoft|google|apple|amazon/.test(
      value
    )
  ) {
    return "Technology";
  }

  // ==========================================================
  // WORLD
  // ==========================================================

  if (
    /government|minister|ministry|parliament|election|political|president|prime minister|policy/.test(
      value
    )
  ) {
    return "World";
  }

  return "General";
};

// ============================================================
// SOURCE-BASED FALLBACK SUMMARY
// ============================================================

const createFallbackSummary = (article) => {
  const title = (article.title || "").trim();
  const snippet = (article.snippet || "").trim();

  let summary = "";

  if (snippet) {
    summary = snippet;
  } else if (title) {
    summary = title;
  } else {
    summary =
      "News story available from the original source.";
  }

  const words = summary
    .split(/\s+/)
    .filter(Boolean);

  if (words.length > 60) {
    summary = `${words
      .slice(0, 60)
      .join(" ")}...`;
  }

  return summary;
};

// ============================================================
// SOURCE-BASED WHY IT MATTERS
// ============================================================

const createFallbackWhyItMatters = (article) => {
  const category = detectCategory(
    `${article.title || ""} ${
      article.snippet || ""
    }`
  );

  const messages = {
    AI:
      "The development could influence how AI technology is developed, used, or adopted.",

    Startups:
      "The development could affect businesses, investors, founders, or the wider startup ecosystem.",

    Sports:
      "The development could affect teams, players, competitions, or sports fans.",

    Movies:
      "The development could influence the film industry, audiences, or upcoming entertainment releases.",

    Gaming:
      "The development could affect players, gaming platforms, developers, publishers, or the wider gaming industry.",

    Smartphones:
      "The development could affect smartphone users, manufacturers, or the mobile technology market.",

    Technology:
      "The development could influence technology products, companies, or users.",

    India:
      "The development could have an impact on people, businesses, or organizations in India.",

    World:
      "The development could have broader implications for people, organizations, or governments.",

    General:
      "The development may be relevant to people following this topic.",
  };

  return messages[category] || messages.General;
};

// ============================================================
// LIMIT WORDS
// ============================================================

const limitWords = (text, maxWords) => {
  const words = (text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length <= maxWords) {
    return text.trim();
  }

  return `${words
    .slice(0, maxWords)
    .join(" ")}...`;
};

// ============================================================
// SORT ARTICLES BY NEWEST
// ============================================================

const sortArticlesByNewest = (articles = []) => {
  return [...articles].sort((a, b) => {
    const dateA = a?.publishedAt
      ? new Date(a.publishedAt).getTime()
      : 0;

    const dateB = b?.publishedAt
      ? new Date(b.publishedAt).getTime()
      : 0;

    return dateB - dateA;
  });
};

// ============================================================
// BUILD ONE STORY
// ============================================================

const buildStoryFromCluster = async (
  cluster,
  keyword,
  useAI = true
) => {
  const articles = sortArticlesByNewest(
    cluster?.articles || []
  );

  if (!articles.length) {
    return null;
  }

  // Newest article becomes primary article
  const primaryArticle = articles[0];

  const snippets = articles
    .slice(0, 5)
    .map((article) => article.snippet)
    .filter(Boolean);

  let summary = "";
  let whyItMatters = "";

  let imageUrl = "";
  let imageProvider = "";

  // ==========================================================
  // SUMMARY
  // ==========================================================

  if (useAI) {
    try {
      console.log(
        `🤖 Generating AI summary for: ${primaryArticle.title}`
      );

      const startTime = Date.now();

      const aiResult =
        await generateStorySummary({
          title: primaryArticle.title,
          snippets,
        });

      const duration = (
        (Date.now() - startTime) /
        1000
      ).toFixed(2);

      console.log(
        `⏱️ Gemini summary: ${duration}s`
      );

      summary = limitWords(
        aiResult.summary,
        60
      );

      whyItMatters = limitWords(
        aiResult.whyItMatters,
        40
      );
    } catch (error) {
      console.log(
        "📝 Using source-based fallback for story"
      );

      summary =
        createFallbackSummary(
          primaryArticle
        );

      whyItMatters =
        createFallbackWhyItMatters(
          primaryArticle
        );
    }
  } else {
    console.log(
      "📝 Using source-based fallback for story"
    );

    summary =
      createFallbackSummary(
        primaryArticle
      );

    whyItMatters =
      createFallbackWhyItMatters(
        primaryArticle
      );
  }

  // ==========================================================
  // IMAGE PIPELINE
  //
  // Priority:
  // 1. Hugging Face
  // 2. Unsplash
  // 3. Original source image
  // ==========================================================

  if (useAI) {
    try {
      console.log(
        `🎨 Trying Hugging Face image for: ${primaryArticle.title}`
      );

      imageUrl =
        await generateStoryImage({
          headline: primaryArticle.title,
          summary,
        });

      if (imageUrl) {
        imageProvider =
          "Hugging Face";

        console.log(
          "✅ Using Hugging Face image"
        );
      }
    } catch (error) {
      console.error(
        "❌ Hugging Face image error:",
        error?.message || error
      );

      imageUrl = "";
    }
  }

  // ==========================================================
  // AUTOMATIC UNSPLASH FALLBACK
  // ==========================================================

  if (!imageUrl) {
    console.log(
      "🔄 Hugging Face unavailable. Trying Unsplash..."
    );

    try {
      const unsplashResult =
        await searchUnsplashImage({
          headline: primaryArticle.title,
          summary,
        });

      if (unsplashResult?.imageUrl) {
        imageUrl =
          unsplashResult.imageUrl;

        imageProvider =
          "Unsplash";

        console.log(
          "✅ Using Unsplash fallback image"
        );
      }
    } catch (error) {
      console.error(
        "❌ Unsplash fallback error:",
        error?.message || error
      );
    }
  }

  // ==========================================================
  // ORIGINAL SOURCE IMAGE FALLBACK
  // ==========================================================

  if (!imageUrl) {
    const sourceImage =
      getFallbackImage({
        sourceImage:
          primaryArticle.imageUrl,
      });

    if (sourceImage) {
      imageUrl = sourceImage;
      imageProvider = "Source";

      console.log(
        "📰 Using original source image"
      );
    }
  }

  // ==========================================================
  // FINAL IMAGE STATUS
  // ==========================================================

  if (!imageUrl) {
    console.warn(
      `⚠️ No image available for story: ${primaryArticle.title}`
    );
  }

  // ==========================================================
  // CATEGORY
  // ==========================================================

  const combinedText = [
    keyword,
    primaryArticle.title,
    primaryArticle.snippet,
  ]
    .filter(Boolean)
    .join(" ");

  const category =
    detectCategory(combinedText);

  // ==========================================================
  // SOURCE INFORMATION
  // ==========================================================

  const sources = articles.map(
    (article) => ({
      sourceName:
        article.sourceName ||
        "Unknown",

      title:
        article.title || "",

      url:
        article.url || "",

      author:
        article.author ||
        "Unknown",

      publishedAt:
        article.publishedAt || null,

      snippet:
        article.snippet || "",

      imageUrl:
        article.imageUrl || "",
    })
  );

  // ==========================================================
  // FINAL STORY OBJECT
  // ==========================================================

  return {
    headline:
      primaryArticle.title,

    summary,

    whyItMatters,

    imageUrl,

    imageProvider,

    keywords: [keyword],

    category,

    publishedAt:
      primaryArticle.publishedAt ||
      new Date(),

    sources,
  };
};

// ============================================================
// BUILD MULTIPLE STORIES
// ============================================================

const buildStoriesFromClusters = async (
  clusters,
  keyword
) => {
  const selectedClusters =
    clusters.slice(0, 20);

  console.log(
    `📰 Preparing ${selectedClusters.length} stories`
  );

  // First 12 stories use Gemini + image pipeline.
  const aiStoryCount = Math.min(
    selectedClusters.length,
    MAX_AI_STORIES
  );

  console.log(
    `🤖 Gemini will process up to ${aiStoryCount} stories`
  );

  const stories = [];

  // ==========================================================
  // PROCESS IN BATCHES
  // ==========================================================

  for (
    let start = 0;
    start < selectedClusters.length;
    start += BATCH_SIZE
  ) {
    const batch =
      selectedClusters.slice(
        start,
        start + BATCH_SIZE
      );

    const batchNumber =
      Math.floor(
        start / BATCH_SIZE
      ) + 1;

    console.log(
      `🤖 Processing AI batch ${batchNumber}`
    );

    const batchResults =
      await Promise.all(
        batch.map(
          (cluster, index) => {
            const storyIndex =
              start + index;

            const useAI =
              storyIndex <
              aiStoryCount;

            return buildStoryFromCluster(
              cluster,
              keyword,
              useAI
            );
          }
        )
      );

    for (const story of batchResults) {
      if (story) {
        stories.push(story);
      }
    }
  }

  // ==========================================================
  // FINAL RESULT
  // ==========================================================

  console.log(
    `✅ Built ${stories.length} stories`
  );

  return stories;
};

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  buildStoryFromCluster,
  buildStoriesFromClusters,
};