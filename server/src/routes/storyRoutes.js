const express = require("express");

const {
  createStory,
  getStories,
  getGoogleNews,
  getRedditNews,
  searchNews,
} = require("../controllers/storyController");

const router = express.Router();

// Create a story
router.post("/", createStory);

// Get all stories
router.get("/", getStories);

// Fetch news from Google News
router.get("/google-news", getGoogleNews);

// Fetch news from Reddit
router.get("/reddit", getRedditNews);

// Search and combine news sources
router.get("/search", searchNews);

module.exports = router;