// ======================================================
// CLUSTERING SERVICE
// ======================================================

const getWords = (title = "") => {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 2)
  );
};

// ======================================================
// JACCARD SIMILARITY
// ======================================================

const calculateSimilarity = (
  titleA,
  titleB
) => {
  const wordsA = getWords(titleA);
  const wordsB = getWords(titleB);

  if (!wordsA.size || !wordsB.size) {
    return 0;
  }

  const intersection = [
    ...wordsA,
  ].filter((word) =>
    wordsB.has(word)
  );

  const union = new Set([
    ...wordsA,
    ...wordsB,
  ]);

  return (
    intersection.length /
    union.size
  );
};

// ======================================================
// CLUSTER ARTICLES
// ======================================================

const clusterArticles = (
  articles,
  threshold = 0.25
) => {
  const clusters = [];

  for (const article of articles) {
    let matchingCluster = null;

    for (const cluster of clusters) {
      const isRelated =
        cluster.articles.some(
          (existingArticle) =>
            calculateSimilarity(
              article.title,
              existingArticle.title
            ) >= threshold
        );

      if (isRelated) {
        matchingCluster = cluster;
        break;
      }
    }

    if (matchingCluster) {
      matchingCluster.articles.push(
        article
      );
    } else {
      clusters.push({
        articles: [article],
      });
    }
  }

  return clusters;
};

module.exports = {
  calculateSimilarity,
  clusterArticles,
};