const API_BASE_URL = "http://localhost:5000/api";

export const searchNews = async (keyword, limit = 10) => {
  const response = await fetch(
    `${API_BASE_URL}/stories/search?keyword=${encodeURIComponent(
      keyword
    )}&limit=${limit}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch news");
  }

  return response.json();
};

export const getStories = async () => {
  const response = await fetch(
    `${API_BASE_URL}/stories`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch stories");
  }

  return response.json();
};