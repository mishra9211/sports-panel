import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import axios from "axios";
import cors from "cors";

dotenv.config();

const app = express();

// ✅ CORS setup: frontend URL allow करो
const FRONTEND_URL = "https://sports-panel-1.onrender.com"; // Render frontend URL
app.use(
  cors({
    origin: FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

// MongoDB connect
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// Schema & Model
const sportSchema = new mongoose.Schema({
  id: Number,
  slug: String,
  sport_icon: String,
  banner_image: String,
  name: String,
  created_at: Date,
  rank: Number,
  is_custom: Number,
});
const Sport = mongoose.model("Sport", sportSchema);

// Sync sports route
app.get("/sync-sports", async (req, res) => {
  try {
    const existingCount = await Sport.countDocuments();
    if (existingCount > 0) {
      return res.json({ message: "Sports already exist ✅", count: existingCount });
    }

    const { data } = await axios.get(
      "https://central.zplay1.in/pb/api/v1/sports/management/getSport",
      {
        headers: {
          "Accept": "application/json, text/plain, */*",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
          "Referer": "https://www.shoutpe247.com/",
          "Origin": "https://www.shoutpe247.com",
        },
      }
    );

    if (!data.success) {
      return res.status(400).json({ message: "Failed to fetch sports" });
    }

    await Sport.insertMany(data.data);
    res.json({ message: "Sports fetched & saved ✅", count: data.data.length });
  } catch (err) {
    console.error("❌ Error:", err.message);
    res.status(500).json({ message: "Error syncing sports", error: err.message });
  }
});

// Get all sports
app.get("/sports", async (req, res) => {
  try {
    const sports = await Sport.find().sort({ rank: 1, name: 1 });
    res.json(sports);
  } catch (err) {
    console.error("❌ Error fetching sports:", err.message);
    res.status(500).json({ message: "Error fetching sports" });
  }
});



// ⚽ Soccer Competitions route
app.get("/soccer-competitions", async (req, res) => {
  try {
    const response = await axios.get("https://api.dramo247.com/api/guest/event_list");
    const apiData = response.data;

    if (!apiData?.success || !Array.isArray(apiData?.data)) {
      return res.status(400).json({ message: "Invalid data format from API" });
    }

    // ✅ Filter only soccer matches (custom_active === "G")
    const soccerEvents = apiData.data.filter((ev) => ev.custom_active === "G");

    // ✅ Get unique competition names
    const uniqueCompetitions = [
      ...new Set(
        soccerEvents.map((ev) => ev.competition_name).filter(Boolean)
      ),
    ];

    res.json({
      count: uniqueCompetitions.length,
      competitions: uniqueCompetitions,
    });
  } catch (err) {
    console.error("❌ Error fetching soccer competitions:", err.message);
    res.status(500).json({
      message: "Error fetching soccer competitions",
      error: err.message,
    });
  }
});



const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));


