import express from "express";
import axios from "axios";
import Odds from "../models/Odds.js";

const router = express.Router();

// ---------------------------
// Status tracker
// ---------------------------
let lastFetchStatus = {
  lastRun: null,
  success: false,
  message: "",
  eventsSaved: 0,
};

// ---------------------------
// Function to fetch & save odds
// ---------------------------
const fetchAndSaveOdds = async () => {
  const runTime = new Date();
  try {
    console.log(`[${runTime.toLocaleString()}] Starting fetch...`);

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

    let savedCount = 0;

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

      await Odds.findOneAndUpdate(
        { marketId },
        {
          marketId,
          eventId: ev.event_id,
          eventName: ev.name,
          competition: ev.competition_name,
          odds: oddsData,
          timestamp: new Date(),
        },
        { upsert: true }
      );

      savedCount++;
    }

    console.log(
      `[${runTime.toLocaleString()}] Fetched & saved ${savedCount} soccer events ✅`
    );

    lastFetchStatus = {
      lastRun: runTime,
      success: true,
      message: "Fetch successful",
      eventsSaved: savedCount,
    };
  } catch (err) {
    console.error(`[${runTime.toLocaleString()}] Error fetching soccer odds:`, err.message);

    lastFetchStatus = {
      lastRun: runTime,
      success: false,
      message: err.message,
      eventsSaved: 0,
    };
  }
};

// ---------------------------
// Call fetch function every X minutes
// ---------------------------
const FETCH_INTERVAL = 5 * 60 * 1000; // 5 मिनट में एक बार
setInterval(fetchAndSaveOdds, FETCH_INTERVAL);

// तुरंत fetch start
fetchAndSaveOdds();

// ---------------------------
// API endpoints
// ---------------------------

// Odds history
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

// Last fetch status
router.get("/status", (req, res) => {
  res.json({ success: true, status: lastFetchStatus });
});

export default router;
