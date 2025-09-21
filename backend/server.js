import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import axios from "axios";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors());
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
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
          "Referer": "https://www.shoutpe247.com/",
          "Origin": "https://www.shoutpe247.com"
        }
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

app.get("/sports", async (req, res) => {
  try {
    const sports = await Sport.find().sort({ rank: 1, name: 1 });
    res.json(sports);
  } catch (err) {
    console.error("❌ Error fetching sports:", err.message);
    res.status(500).json({ message: "Error fetching sports" });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
