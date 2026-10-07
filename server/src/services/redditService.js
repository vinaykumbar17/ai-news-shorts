const axios = require("axios");
const Parser = require("rss-parser");

const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"],
    ],
  },
});

// -----------------------------------------
// Reddit cache
// -----------------------------------------

const redditCache = new Map();

const CACHE_DURATION = 10 * 60 * 1000;

// -----------------------------------------
// Reddit request headers
// -----------------------------------------

const getHeaders = () => ({
  "User-Agent":
    "AI-News-Shorts/1.0 (news aggregation project)",
  Accept:
    "application/rss+xml, application/xml, text/xml",
});

// -----------------------------------------
// Extract image from Reddit RSS item
// -----------------------------------------

const extractImageUrl = (item) => {
  // media:content
  if (
    item.mediaContent &&
    item.mediaContent.url
  ) {
    return item.mediaContent.url;
  }

  // media:thumbnail
  if (
    item.mediaThumbnail &&
    item.mediaThumbnail.url
  ) {
    return item.mediaThumbnail.url;
  }

  // enclosure
  if (
    item.enclosure &&
    item.enclosure.url
  ) {
    return item.enclosure.url;
  }

  return "";
};

// -----------------------------------------
// Fetch Reddit news
// -----------------------------------------

const fetchRedditNews = async (keyword) => {
  const normalizedKeyword = keyword
    .trim()
    .toLowerCase();

  if (!normalizedKeyword) {
    return [];
  }

  // -----------------------------------------
  // Check cache
  // -----------------------------------------

  const cached = redditCache.get(
    normalizedKeyword
  );

  if (
    cached &&
    Date.now() - cached.timestamp <
      CACHE_DURATION
  ) {
    console.log(
      `🟢 Reddit cache hit: ${normalizedKeyword}`
    );

    return cached.posts;
  }

  const encodedKeyword =
    encodeURIComponent(normalizedKeyword);

  const feedUrl =
    `https://www.reddit.com/search.rss` +
    `?q=${encodedKeyword}` +
    `&sort=new` +
    `&t=week` +
    `&limit=20`;

  try {
    console.log(
      `🔴 Fetching Reddit: ${feedUrl}`
    );

    const response = await axios.get(
      feedUrl,
      {
        timeout: 10000,
        headers: getHeaders(),
        validateStatus: (status) =>
          status >= 200 && status < 500,
      }
    );

    // -----------------------------------------
    // Handle Reddit rate limit
    // -----------------------------------------

    if (response.status === 429) {
      const retryAfter =
        response.headers?.["retry-after"];

      console.warn(
        `⚠️ Reddit rate limited (429).` +
          (retryAfter
            ? ` Retry-After: ${retryAfter}s`
            : "")
      );

      return [];
    }

    // -----------------------------------------
    // Handle other HTTP errors
    // -----------------------------------------

    if (response.status >= 400) {
      console.error(
        `❌ Reddit returned HTTP ${response.status}`
      );

      return [];
    }

    // -----------------------------------------
    // Parse RSS
    // -----------------------------------------

    const feed = await parser.parseString(
      response.data
    );

    const posts = (feed.items || [])
      .map((item) => {
        const imageUrl =
          extractImageUrl(item);

        return {
          sourceName: "Reddit",

          title:
            item.title || "",

          url:
            item.link || "",

          publishedAt:
            item.pubDate
              ? new Date(item.pubDate)
              : null,

          author:
            item.creator ||
            item.author ||
            "Unknown",

          snippet:
            item.contentSnippet ||
            item.content ||
            item.summary ||
            "",

          imageUrl,
        };
      })
      .filter(
        (post) =>
          post.title &&
          post.url
      );

    console.log(
      `🔴 Reddit returned ${posts.length} posts`
    );

    // -----------------------------------------
    // Save successful result to cache
    // -----------------------------------------

    redditCache.set(
      normalizedKeyword,
      {
        timestamp: Date.now(),
        posts,
      }
    );

    return posts;
  } catch (error) {
    console.error(
      `❌ Reddit request failed: ${error.message}`
    );

    if (error.response) {
      console.error(
        `Reddit status: ${error.response.status}`
      );
    }

    return [];
  }
};

module.exports = {
  fetchRedditNews,
};