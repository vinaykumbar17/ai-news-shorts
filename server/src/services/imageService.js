require("dotenv").config();

const axios = require("axios");

const {
  InferenceClient,
} = require("@huggingface/inference");

const client = new InferenceClient(
  process.env.HF_TOKEN
);

// ============================================================
// HUGGING FACE STATE
// ============================================================

let imageGenerationDisabled = false;

// ============================================================
// UNSPLASH STATE
// ============================================================

let unsplashDisabled = false;

const unsplashCache = new Map();

const UNSPLASH_CACHE_DURATION =
  30 * 60 * 1000;

// Images already used during this server session
const usedUnsplashImages = new Set();

// Used image URLs
const usedImageUrls = new Set();

let unsplashRequestCount = 0;

const MAX_UNSPLASH_REQUESTS = 40;

// ============================================================
// HUGGING FACE IMAGE GENERATION
// ============================================================

const generateStoryImage = async ({
  headline,
  summary,
}) => {
  if (imageGenerationDisabled) {
    console.log(
      "⏭️ Image generation skipped: Hugging Face quota exhausted"
    );

    return "";
  }

  try {
    const prompt = `
Create a photorealistic professional editorial news photograph for a news short.

Headline:
${headline}

Story:
${summary}

Requirements:
- Photorealistic
- Directly related to the specific story
- Professional editorial/news photography
- Cinematic but realistic lighting
- Visually believable
- Suitable for a news Shorts/Reels feed
- No cartoon
- No anime
- No fantasy illustration
- No generic stock-style image
- No text
- No captions
- No logos
- No watermarks
- No UI
`;

    const timeoutPromise =
      new Promise((_, reject) => {
        setTimeout(
          () =>
            reject(
              new Error(
                "IMAGE_GENERATION_TIMEOUT"
              )
            ),
          10000
        );
      });

    const imagePromise =
      client.textToImage({
        model:
          "black-forest-labs/FLUX.1-schnell",
        inputs: prompt,
      });

    const image =
      await Promise.race([
        imagePromise,
        timeoutPromise,
      ]);

    const buffer = Buffer.from(
      await image.arrayBuffer()
    );

    console.log(
      "✅ Hugging Face image generated"
    );

    return `data:image/png;base64,${buffer.toString(
      "base64"
    )}`;
  } catch (error) {
    const message =
      error?.message || "";

    if (
      message
        .toLowerCase()
        .includes("depleted") ||
      message
        .toLowerCase()
        .includes("monthly") ||
      message
        .toLowerCase()
        .includes("credits") ||
      message.includes("429") ||
      message.includes("402")
    ) {
      imageGenerationDisabled = true;

      console.error(
        "🛑 Hugging Face quota unavailable. Automatically switching to Unsplash."
      );

      return "";
    }

    if (
      message ===
      "IMAGE_GENERATION_TIMEOUT"
    ) {
      console.error(
        "⏱️ Hugging Face image generation timed out. Automatically switching to Unsplash."
      );

      return "";
    }

    console.error(
      "❌ Hugging Face image generation failed:",
      message
    );

    return "";
  }
};

// ============================================================
// CREATE STORY-SPECIFIC UNSPLASH QUERIES
// ============================================================

const createImageQueries = (
  headline,
  summary = ""
) => {
  const text =
    `${headline} ${summary}`
      .toLowerCase()
      .replace(/[^\w\s]/g, " ");

  const queries = [];

  const addQuery = (query) => {
    if (
      query &&
      !queries.includes(query)
    ) {
      queries.push(query);
    }
  };

  // ==========================================================
  // POLITICS / GOVERNMENT
  // ==========================================================

  if (
    /government|minister|ministry|parliament|election|vote|voting|political|politics|president|prime minister|opposition|mp|mla|chief minister|policy|protest|resignation/.test(
      text
    )
  ) {
    if (
      /india|indian|delhi|rahul gandhi|modi|bjp|congress|lok sabha|election commission/.test(
        text
      )
    ) {
      addQuery(
        "Indian politicians political protest Delhi"
      );

      addQuery(
        "Indian parliament politicians"
      );

      addQuery(
        "India election political leaders"
      );

      addQuery(
        "Indian government officials meeting"
      );
    } else {
      addQuery(
        "politicians government protest"
      );

      addQuery(
        "parliament political leaders"
      );

      addQuery(
        "government officials meeting"
      );
    }
  }

  // ==========================================================
  // SPORTS
  // ==========================================================

  if (
    /cricket|ipl|wicket|batting|bowling|cricketer/.test(
      text
    )
  ) {
    addQuery(
      "cricket player stadium match"
    );

    addQuery(
      "cricket sports action"
    );

    addQuery(
      "cricket match stadium crowd"
    );
  }

  if (
    /football|soccer|fifa|uefa|goal|premier league/.test(
      text
    )
  ) {
    addQuery(
      "football player stadium match"
    );

    addQuery(
      "football sports action"
    );

    addQuery(
      "soccer stadium crowd"
    );
  }

  if (
    /basketball|nba|wnba/.test(text)
  ) {
    addQuery(
      "basketball player game"
    );

    addQuery(
      "basketball stadium sports"
    );
  }

  if (
    /tennis|badminton/.test(text)
  ) {
    addQuery(
      "tennis player match"
    );

    addQuery(
      "badminton sports match"
    );
  }

  // ==========================================================
  // MOVIES
  // ==========================================================

  if (
    /movie|film|cinema|actor|actress|bollywood|hollywood|tollywood|kollywood|trailer|box office/.test(
      text
    )
  ) {
    addQuery(
      "movie film production cinema"
    );

    addQuery(
      "actor actress film premiere"
    );

    addQuery(
      "cinema entertainment movie"
    );

    addQuery(
      "film set movie production"
    );
  }

  // ==========================================================
  // GAMING
  // ==========================================================

  if (
    /gaming|gamer|video game|video games|esports|console|xbox|playstation|ps5|ps6|nintendo|switch|steam|epic games|fortnite|minecraft|roblox|gta|grand theft auto|valorant|counter strike|league of legends|game studio|game developer|cloud gaming/.test(
      text
    )
  ) {
    addQuery(
      "video game gaming setup"
    );

    addQuery(
      "gaming console video game"
    );

    addQuery(
      "esports gaming tournament"
    );

    if (
      /xbox|xbox cloud gaming/.test(
        text
      )
    ) {
      addQuery(
        "Xbox gaming console"
      );
    }

    if (
      /playstation|ps5|ps6/.test(
        text
      )
    ) {
      addQuery(
        "PlayStation gaming console"
      );
    }

    if (
      /nintendo|switch/.test(text)
    ) {
      addQuery(
        "Nintendo Switch gaming"
      );
    }

    if (
      /gta|grand theft auto/.test(
        text
      )
    ) {
      addQuery(
        "GTA video game gaming"
      );
    }

    if (/fortnite/.test(text)) {
      addQuery(
        "Fortnite video game"
      );
    }

    if (/minecraft/.test(text)) {
      addQuery(
        "Minecraft video game"
      );
    }
  }

  // ==========================================================
  // SMARTPHONES
  // ==========================================================

  if (
    /iphone|smartphone|android|samsung|pixel|oneplus|xiaomi|redmi|realme|oppo|vivo|motorola|mobile phone/.test(
      text
    )
  ) {
    addQuery(
      "modern smartphone technology"
    );

    addQuery(
      "smartphone product photography"
    );

    addQuery(
      "mobile phone technology"
    );

    if (/iphone/.test(text)) {
      addQuery(
        "iPhone smartphone technology"
      );
    }

    if (/samsung/.test(text)) {
      addQuery(
        "Samsung smartphone technology"
      );
    }

    if (/pixel/.test(text)) {
      addQuery(
        "Google Pixel smartphone"
      );
    }

    if (/oneplus/.test(text)) {
      addQuery(
        "OnePlus smartphone"
      );
    }
  }

  // ==========================================================
  // AI
  // ==========================================================

  if (
    /artificial intelligence|\bai\b|machine learning|deep learning|generative ai|llm|chatgpt|openai|gemini|claude|anthropic|copilot/.test(
      text
    )
  ) {
    addQuery(
      "artificial intelligence technology"
    );

    addQuery(
      "AI research laboratory"
    );

    addQuery(
      "AI computer technology"
    );

    addQuery(
      "artificial intelligence research"
    );

    addQuery(
      "AI technology business"
    );

    addQuery(
      "machine learning technology"
    );

    addQuery(
      "AI data center"
    );
  }

  // ==========================================================
  // ROBOTICS
  // ==========================================================

  if (
    /robot|robotics|automation/.test(
      text
    )
  ) {
    addQuery(
      "robotics technology laboratory"
    );

    addQuery(
      "industrial robot technology"
    );

    addQuery(
      "robot artificial intelligence"
    );
  }

  // ==========================================================
  // CYBERSECURITY
  // ==========================================================

  if (
    /cyber|hacking|hack|data breach|ransomware|malware|cyber attack/.test(
      text
    )
  ) {
    addQuery(
      "cybersecurity computer technology"
    );

    addQuery(
      "cyber security technology"
    );

    addQuery(
      "computer security"
    );
  }

  // ==========================================================
  // SEMICONDUCTOR
  // ==========================================================

  if (
    /semiconductor|chip|processor|microchip/.test(
      text
    )
  ) {
    addQuery(
      "semiconductor computer chip"
    );

    addQuery(
      "computer processor technology"
    );

    addQuery(
      "microchip technology"
    );
  }

  // ==========================================================
  // STARTUPS
  // ==========================================================

  if (
    /startup|startups|founder|entrepreneur|venture capital|vc|funding|funded|unicorn|series a|series b|seed round|investment|investor/.test(
      text
    )
  ) {
    addQuery(
      "startup founders business meeting"
    );

    addQuery(
      "startup company office"
    );

    addQuery(
      "entrepreneurs business meeting"
    );

    addQuery(
      "startup technology business"
    );

    addQuery(
      "venture capital business"
    );

    addQuery(
      "business investment meeting"
    );
  }

  // ==========================================================
  // FINANCE
  // ==========================================================

  if (
    /stock market|shares|ipo|bank|banking|loan|credit|finance|financial/.test(
      text
    )
  ) {
    addQuery(
      "business finance stock market"
    );

    addQuery(
      "financial business meeting"
    );

    addQuery(
      "banking finance business"
    );
  }

  // ==========================================================
  // HEALTH
  // ==========================================================

  if (
    /hospital|doctor|medical|health|medicine|healthcare/.test(
      text
    )
  ) {
    addQuery(
      "hospital healthcare medical"
    );

    addQuery(
      "doctor healthcare"
    );

    addQuery(
      "medical research laboratory"
    );
  }

  // ==========================================================
  // EDUCATION
  // ==========================================================

  if (
    /education|school|college|university|student|exam/.test(
      text
    )
  ) {
    addQuery(
      "education university students"
    );

    addQuery(
      "college students campus"
    );

    addQuery(
      "university education"
    );
  }

  // ==========================================================
  // JOBS
  // ==========================================================

  if (
    /job|jobs|hiring|career|employment|recruitment/.test(
      text
    )
  ) {
    addQuery(
      "job interview office career"
    );

    addQuery(
      "business hiring interview"
    );

    addQuery(
      "career recruitment office"
    );
  }

  // ==========================================================
  // FOOD
  // ==========================================================

  if (
    /restaurant|food|qsr|cafe|delivery|swiggy|zomato/.test(
      text
    )
  ) {
    addQuery(
      "restaurant food business"
    );

    addQuery(
      "restaurant business"
    );

    addQuery(
      "food delivery business"
    );
  }

  // ==========================================================
  // AUTOMOBILE
  // ==========================================================

  if (
    /car|automobile|vehicle|ev|electric vehicle|tesla/.test(
      text
    )
  ) {
    addQuery(
      "automobile electric vehicle"
    );

    addQuery(
      "electric car technology"
    );

    addQuery(
      "modern automobile"
    );
  }

  // ==========================================================
  // SPACE
  // ==========================================================

  if (
    /space|nasa|isro|rocket|satellite|moon|mars/.test(
      text
    )
  ) {
    addQuery(
      "space rocket satellite"
    );

    addQuery(
      "space technology"
    );

    addQuery(
      "rocket launch"
    );
  }

  // ==========================================================
  // CLIMATE
  // ==========================================================

  if (
    /climate|environment|pollution|weather|flood|earthquake|cyclone/.test(
      text
    )
  ) {
    addQuery(
      "climate environment nature"
    );

    addQuery(
      "environment climate change"
    );

    addQuery(
      "natural disaster environment"
    );
  }

  // ==========================================================
  // GENERAL TECHNOLOGY
  // ==========================================================

  if (
    /technology|tech|software|app|computer|cloud|internet|google|microsoft|apple|amazon/.test(
      text
    )
  ) {
    addQuery(
      "technology computer innovation"
    );

    addQuery(
      "modern technology business"
    );

    addQuery(
      "software technology"
    );
  }

  // ==========================================================
  // IMPORTANT:
  // Only use generic queries when no specific query exists.
  // This prevents political stories from getting random
  // technology/business images.
  // ==========================================================

  if (queries.length === 0) {
    addQuery(
      "editorial news photography"
    );

    addQuery(
      "breaking news journalism"
    );

    addQuery(
      "modern news photography"
    );
  }

  return queries;
};

// ============================================================
// SELECT UNIQUE + DIVERSE IMAGE
// ============================================================

const selectUnusedImage = (
  photos
) => {
  const availablePhotos =
    photos.filter(
      (photo) =>
        photo?.id &&
        photo?.urls?.regular &&
        !usedUnsplashImages.has(
          photo.id
        ) &&
        !usedImageUrls.has(
          photo.urls.regular
        )
    );

  if (
    availablePhotos.length === 0
  ) {
    return null;
  }

  // ----------------------------------------------------------
  // Instead of always taking the first Unsplash result,
  // choose from several relevant results.
  // This prevents repetitive visuals.
  // ----------------------------------------------------------

  const candidateCount =
    Math.min(
      availablePhotos.length,
      10
    );

  const randomIndex =
    Math.floor(
      Math.random() *
        candidateCount
    );

  const selectedPhoto =
    availablePhotos[randomIndex];

  usedUnsplashImages.add(
    selectedPhoto.id
  );

  usedImageUrls.add(
    selectedPhoto.urls.regular
  );

  return selectedPhoto;
};

// ============================================================
// UNSPLASH SEARCH
// ============================================================

const searchUnsplashImage = async ({
  headline,
  summary,
}) => {
  if (unsplashDisabled) {
    console.log(
      "⏭️ Unsplash search skipped: temporarily unavailable"
    );

    return "";
  }

  const queries =
    createImageQueries(
      headline,
      summary
    );

  console.log(
    `🖼️ Unsplash will try ${queries.length} visual queries`
  );

  for (const query of queries) {
    try {
      const cacheKey =
        query
          .trim()
          .toLowerCase();

      let photos = [];

      // ======================================================
      // CACHE
      // ======================================================

      const cached =
        unsplashCache.get(
          cacheKey
        );

      if (
        cached &&
        Date.now() -
          cached.timestamp <
          UNSPLASH_CACHE_DURATION
      ) {
        console.log(
          `🟢 Unsplash cache hit: ${query}`
        );

        photos =
          cached.photos;
      } else {
        // ====================================================
        // REQUEST LIMIT
        // ====================================================

        if (
          unsplashRequestCount >=
          MAX_UNSPLASH_REQUESTS
        ) {
          console.log(
            "⏭️ Unsplash session request limit reached"
          );

          break;
        }

        unsplashRequestCount++;

        console.log(
          `🔎 Searching Unsplash: ${query}`
        );

        const response =
          await axios.get(
            "https://api.unsplash.com/search/photos",
            {
              headers: {
                Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
                "Accept-Version": "v1",
              },

              params: {
                query,

                page: 1,

                per_page: 30,

                orientation:
                  "portrait",

                content_filter:
                  "high",

                order_by:
                  "relevant",
              },

              timeout: 10000,
            }
          );

        photos = (
          response.data?.results ||
          []
        ).filter(
          (photo) =>
            photo?.id &&
            photo?.urls?.regular &&
            photo?.width &&
            photo?.height
        );

        unsplashCache.set(
          cacheKey,
          {
            timestamp: Date.now(),
            photos,
          }
        );

        console.log(
          `📸 Unsplash returned ${photos.length} usable images`
        );
      }

      // ======================================================
      // UNIQUE IMAGE SELECTION
      // ======================================================

      const selectedPhoto =
        selectUnusedImage(
          photos
        );

      if (selectedPhoto) {
        console.log(
          `✅ Unsplash selected unique image: ${selectedPhoto.id}`
        );

        return {
          imageUrl:
            selectedPhoto
              .urls.regular,
        };
      }

      console.log(
        `⚠️ No unused images remaining for: ${query}`
      );

      // Continue to next query.
    } catch (error) {
      const status =
        error.response?.status;

      if (status === 429) {
        console.error(
          "🛑 Unsplash rate limit reached. Stopping Unsplash requests."
        );

        unsplashDisabled =
          true;

        break;
      }

      console.error(
        `❌ Unsplash failed for "${query}":`,
        error.response?.data ||
          error.message
      );

      // Continue to next query.
    }
  }

  console.log(
    "❌ Unsplash could not find an unused image"
  );

  return "";
};

// ============================================================
// FINAL IMAGE FALLBACK
// ============================================================

const getFallbackImage = ({
  sourceImage,
}) => {
  if (
    sourceImage &&
    typeof sourceImage ===
      "string" &&
    sourceImage.trim()
  ) {
    console.log(
      "📰 Using original source image as final fallback"
    );

    return sourceImage;
  }

  return "";
};

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  generateStoryImage,
  searchUnsplashImage,
  getFallbackImage,
};