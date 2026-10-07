const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const storyRoutes = require("./routes/storyRoutes");

const PORT = process.env.PORT || 5000;

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/stories", storyRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "AI News Shorts API is running",
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});