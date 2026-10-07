# AI Usage

## Overview

AI News Shorts uses AI to transform collected news information into concise and understandable short-form stories.

AI is used as part of the story-processing pipeline for summarization and visual generation.

## AI Technologies Used

### Google Gemini

Google Gemini is used to generate:

- Concise news summaries
- "Why it matters" explanations
- Story-level text based on collected source information

The application instructs the model to use only information available from the collected news snippets.

### Hugging Face

Hugging Face image generation is used to generate visuals related to news stories.

The generated image prompt is created from the story context so that the visual is relevant to the story rather than being a generic placeholder.

### Unsplash

Unsplash is used as a fallback when AI image generation is unavailable or rate-limited.

The application selects relevant images based on the story category and topic.

## AI Processing Pipeline

```text
News Sources
     ↓
Normalization
     ↓
Relevance Filtering
     ↓
Deduplication
     ↓
Story Clustering
     ↓
Gemini Summary
     ↓
Story Visual Generation
     ↓
MongoDB
     ↓
Shorts Feed