const normalizeTitle = (title) => {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const getTitleWords = (title) => {
  return new Set(
    normalizeTitle(title)
      .split(" ")
      .filter((word) => word.length > 2)
  );
};

const calculateSimilarity = (titleA, titleB) => {
  const wordsA = getTitleWords(titleA);
  const wordsB = getTitleWords(titleB);

  if (wordsA.size === 0 || wordsB.size === 0) {
    return 0;
  }

  const intersection = [...wordsA].filter((word) =>
    wordsB.has(word)
  );

  const union = new Set([...wordsA, ...wordsB]);

  return intersection.length / union.size;
};

const deduplicateArticles = (articles, threshold = 0.5) => {
  const uniqueArticles = [];

  for (const article of articles) {
    const isDuplicate = uniqueArticles.some((existingArticle) => {
      return (
        calculateSimilarity(article.title, existingArticle.title) >=
        threshold
      );
    });

    if (!isDuplicate) {
      uniqueArticles.push(article);
    }
  }

  return uniqueArticles;
};

module.exports = {
  normalizeTitle,
  calculateSimilarity,
  deduplicateArticles,
};