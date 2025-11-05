import React, { useState } from "react";
import axios from "axios";

export default function OddsDashboard() {
  const [marketId, setMarketId] = useState("");
  const [oddsHistory, setOddsHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchMessage, setFetchMessage] = useState("");

  const BASE_URL = "https://casino-project.onrender.com/api/odds"; // Change to your backend URL

  // Fetch & save soccer odds
  const fetchOdds = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/fetch`);
      setFetchMessage(res.data.message);
    } catch (err) {
      console.error(err);
      setFetchMessage("Error fetching odds");
    } finally {
      setLoading(false);
    }
  };

  // Get odds history for a market
  const getHistory = async () => {
    if (!marketId) return alert("Please enter a Market ID");
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/history/${marketId}`);
      setOddsHistory(res.data.data);
    } catch (err) {
      console.error(err);
      setOddsHistory([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Soccer Odds Dashboard ⚽</h1>

      <button onClick={fetchOdds} style={{ margin: "10px 0", padding: "8px 12px" }}>
        {loading ? "Fetching..." : "Fetch & Save Soccer Odds"}
      </button>
      {fetchMessage && <p>{fetchMessage}</p>}

      <div style={{ marginTop: "20px" }}>
        <input
          type="text"
          placeholder="Enter Market ID"
          value={marketId}
          onChange={(e) => setMarketId(e.target.value)}
          style={{ padding: "6px", marginRight: "8px" }}
        />
        <button onClick={getHistory} style={{ padding: "6px 12px" }}>
          Get Odds History
        </button>
      </div>

      {oddsHistory.length > 0 && (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "20px",
          }}
        >
          <thead>
            <tr style={{ background: "#eee" }}>
              <th style={{ border: "1px solid #ccc", padding: "6px" }}>Timestamp</th>
              <th style={{ border: "1px solid #ccc", padding: "6px" }}>Event Name</th>
              <th style={{ border: "1px solid #ccc", padding: "6px" }}>Competition</th>
              <th style={{ border: "1px solid #ccc", padding: "6px" }}>Odds</th>
            </tr>
          </thead>
          <tbody>
            {oddsHistory.map((item) => (
              <tr key={item._id}>
                <td style={{ border: "1px solid #ccc", padding: "6px" }}>
                  {new Date(item.timestamp).toLocaleString()}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "6px" }}>{item.eventName}</td>
                <td style={{ border: "1px solid #ccc", padding: "6px" }}>{item.competition}</td>
                <td style={{ border: "1px solid #ccc", padding: "6px" }}>
                  <pre>{JSON.stringify(item.odds, null, 2)}</pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
