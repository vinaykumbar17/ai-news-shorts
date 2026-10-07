const normalizeArticle = (article) => ({
  sourceName:
    article.sourceName || "Unknown",

  title:
    (article.title || "").trim(),

  url:
    article.url || "",

  author:
    article.author || "Unknown",

  publishedAt:
    article.publishedAt
      ? new Date(article.publishedAt)
      : null,

  snippet:
    (article.snippet || "").trim(),

  imageUrl:
    article.imageUrl || "",
});


const normalizeArticles = (articles) => {
  return articles
    .map(normalizeArticle)
    .filter(
      (article) =>
        article.title &&
        article.url
    );
};


module.exports = {
  normalizeArticle,
  normalizeArticles,
};