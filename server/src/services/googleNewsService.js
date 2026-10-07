const Parser = require("rss-parser");

const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"],
      ["media:group", "mediaGroup"],
      ["source", "rssSource"],
    ],
  },
});

// ============================================================
// EXTRACT IMAGE FROM RSS ITEM
// ============================================================

const getImageUrl = (item) => {
  // 1. Standard RSS enclosure
  if (
    item.enclosure &&
    item.enclosure.url
  ) {
    return item.enclosure.url;
  }

  // 2. media:content
  if (
    item.mediaContent &&
    item.mediaContent.url
  ) {
    return item.mediaContent.url;
  }

  // 3. media:thumbnail
  if (
    item.mediaThumbnail &&
    item.mediaThumbnail.url
  ) {
    return item.mediaThumbnail.url;
  }

  // 4. media:group
  if (
    item.mediaGroup &&
    item.mediaGroup["media:content"] &&
    item.mediaGroup["media:content"].url
  ) {
    return item.mediaGroup["media:content"].url;
  }

  return "";
};

// ============================================================
// EXTRACT ORIGINAL PUBLISHER
// ============================================================

const getPublisherName = (item) => {
  // ----------------------------------------------------------
  // 1. Try RSS source field
  // ----------------------------------------------------------

  if (item.rssSource) {
    if (typeof item.rssSource === "string") {
      const source = item.rssSource.trim();

      if (source) {
        return source;
      }
    }

    if (
      typeof item.rssSource === "object"
    ) {
      const sourceName =
        item.rssSource.title ||
        item.rssSource["#"] ||
        item.rssSource._;

      if (
        typeof sourceName === "string" &&
        sourceName.trim()
      ) {
        return sourceName.trim();
      }
    }
  }

  // ----------------------------------------------------------
  // 2. Google News commonly appends publisher
  //    to the article title:
  //
  //    "Headline - The Times of India"
  // ----------------------------------------------------------

  const title =
    typeof item.title === "string"
      ? item.title.trim()
      : "";

  const separatorIndex =
    title.lastIndexOf(" - ");

  if (separatorIndex !== -1) {
    const possiblePublisher =
      title
        .slice(separatorIndex + 3)
        .trim();

    if (
      possiblePublisher &&
      possiblePublisher.length <= 100
    ) {
      return possiblePublisher;
    }
  }

  // ----------------------------------------------------------
  // 3. creator can sometimes contain publisher/author
  // ----------------------------------------------------------

  if (
    item.creator &&
    typeof item.creator === "string" &&
    item.creator.trim()
  ) {
    return item.creator.trim();
  }

  // ----------------------------------------------------------
  // 4. Unknown publisher
  // ----------------------------------------------------------

  return "News Source";
};

// ============================================================
// REMOVE PUBLISHER FROM GOOGLE NEWS TITLE
// ============================================================

const cleanHeadline = (
  title,
  publisher
) => {
  if (!title) {
    return "";
  }

  let cleanedTitle = title.trim();

  if (
    publisher &&
    publisher !== "News Source"
  ) {
    const suffix =
      ` - ${publisher}`;

    if (
      cleanedTitle.endsWith(suffix)
    ) {
      cleanedTitle =
        cleanedTitle.slice(
          0,
          -suffix.length
        ).trim();
    }
  }

  return cleanedTitle;
};

// ============================================================
// FETCH GOOGLE NEWS
// ============================================================

const fetchGoogleNews = async (keyword) => {
  try {
    const encodedKeyword =
      encodeURIComponent(keyword);

    const feedUrl =
      `https://news.google.com/rss/search?q=${encodedKeyword}&hl=en-IN&gl=IN&ceid=IN:en`;

    const feed =
      await parser.parseURL(feedUrl);

    const articles = feed.items
      .map((item) => {
        const publisher =
          getPublisherName(item);

        const title =
          cleanHeadline(
            item.title || "",
            publisher
          );

        return {
          // IMPORTANT:
          // This is the actual publisher,
          // NOT Google News.
          sourceName: publisher,

          title,

          url:
            item.link || "",

          publishedAt:
            item.pubDate
              ? new Date(item.pubDate)
              : null,

          author:
            item.creator ||
            "Unknown",

          snippet:
            item.contentSnippet ||
            item.content ||
            "",

          imageUrl:
            getImageUrl(item),
        };
      })
      .filter(
        (article) =>
          article.title &&
          article.url
      );

    // ========================================================
    // LOG SOURCE INFORMATION
    // ========================================================

    console.log(
      `📰 Google News RSS returned ${articles.length} articles`
    );

    const sourceCounts = {};

    articles.forEach((article) => {
      sourceCounts[article.sourceName] =
        (sourceCounts[article.sourceName] || 0) + 1;
    });

    console.log(
      "📰 Publishers found:",
      Object.entries(sourceCounts)
        .slice(0, 10)
        .map(
          ([source, count]) =>
            `${source} (${count})`
        )
        .join(", ")
    );

    console.log(
      `🖼️ Google News images found: ${
        articles.filter(
          (article) =>
            article.imageUrl
        ).length
      }/${articles.length}`
    );

    return articles;
  } catch (error) {
    console.error(
      "Google News fetch error:",
      error.message
    );

    return [];
  }
};

module.exports = {
  fetchGoogleNews,
};