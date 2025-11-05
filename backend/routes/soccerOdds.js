import express from "express";
import axios from "axios";
import Odds from "../models/Odds.js";

const router = express.Router();

// ---------------------------
// 1️⃣ Fetch & Save Soccer Odds
// ---------------------------
router.get("/fetch", async (req, res) => {
  try {
    // 1. Fetch soccer events
    const eventsRes = await axios.get(
      "https://api.dramo247.com/api/guest/event_list",
      {
        headers: {
          Accept: "application/json, text/plain, */*",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: "https://dramo247.com/",
          Origin: "https://dramo247.com",
        },
      }
    );

    const events = eventsRes.data?.data?.events || [];
    const soccerEvents = events.filter((ev) => ev.event_type_id === 1);

    // 2. Fetch odds for each match
    for (const ev of soccerEvents) {
      const marketId = ev.market_id || ev.event_id?.toString();
      if (!marketId) continue;

      const payload = new URLSearchParams();
      payload.append("market_id", marketId);

      const oddsRes = await axios.post(
        "https://odds.oramo247.com/ws/getMarketDataNew",
        payload.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Origin: "https://fairplaypro.com",
            Referer: "https://fairplaypro.com",
          },
        }
      );

      const oddsData = oddsRes.data?.data;
      if (!oddsData) continue;

      // Save to DB
      const entry = new Odds({
        marketId,
        eventId: ev.event_id,
        eventName: ev.name,
        competition: ev.competition_name,
        odds: oddsData,
      });

      await entry.save();
    }

    res.json({ success: true, message: "Soccer odds fetched & saved ✅", count: soccerEvents.length });
  } catch (err) {
    console.error("Error fetching soccer odds:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------------------
// 2️⃣ Get Odds History by Market
// ---------------------------
router.get("/history/:marketId", async (req, res) => {
  try {
    const { marketId } = req.params;
    const history = await Odds.find({ marketId }).sort({ timestamp: 1 });
    res.json({ success: true, data: history });
  } catch (err) {
    console.error("Error fetching odds history:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
