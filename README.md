# AI News Shorts

AI News Shorts is a full-stack web application that transforms real-time news into concise, visual short-form stories.

Users can search for a topic or category and discover related news collected from multiple sources. The application combines related articles, generates a concise AI-powered summary, creates a relevant visual, and presents the result in a vertical Shorts/Reels-style feed.

## Features

- Real-time news search
- Google News RSS integration
- Reddit news integration
- Multiple-source story aggregation
- Duplicate and related-story clustering
- AI-generated story summaries
- Story summaries limited to 60 words
- AI-generated or relevant fallback visuals
- Category-based news discovery
- Source transparency
- Original article links
- Vertical Shorts/Reels-style news feed
- Responsive design for mobile, tablet, and desktop
- MongoDB story storage
- Automatic news refresh

## Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS
- Lucide React

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose

### AI & Data
- Google Gemini
- Google News RSS
- Reddit RSS
- Hugging Face image generation
- Unsplash image fallback

## How It Works

```text
User Search
     ↓
News Collection
     ↓
Google News + Reddit
     ↓
Normalization
     ↓
Relevance Filtering
     ↓
Deduplication
     ↓
Story Clustering
     ↓
AI Summary Generation
     ↓
Visual Generation
     ↓
MongoDB
     ↓
Shorts Feed