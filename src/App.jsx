import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

export default function App() {
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState(null);
  const [selectedSportName, setSelectedSportName] = useState("");

  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [matches, setMatches] = useState([]);

  const BASE_URL = "https://sports-panel.onrender.com"; // ✅ Your backend URL

  // Fetch sports
  useEffect(() => {
    async function fetchSports() {
      try {
        const res = await axios.get(`${BASE_URL}/sports`);

        // Priority order: cricket, tennis, soccer
        const priorityOrder = ["cricket", "tennis", "soccer"];
        const sortedSports = res.data.sort((a, b) => {
          const aIndex = priorityOrder.indexOf(a.name.toLowerCase());
          const bIndex = priorityOrder.indexOf(b.name.toLowerCase());
          if (aIndex === -1 && bIndex === -1) return 0;
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          return aIndex - bIndex;
        });

        setSports(sortedSports);
      } catch (err) {
        console.error("Error fetching sports:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchSports();
  }, []);

  // ✅ Handle Sport Click
  const handleSportClick = async (sport) => {
    setSelectedSport(sport.id);
    setSelectedSportName(sport.name);
    setLeagues([]);
    setSelectedLeague(null);
    setMatches([]);

    try {
      // ⚽ If sport is soccer → hit your backend API
     // ⚽ If sport is soccer → fetch directly from Dramo247 API (frontend)
if (sport.name.toLowerCase() === "soccer") {
  const res = await axios.get("https://api.dramo247.com/api/guest/event_list", {
    headers: {
      "Accept": "application/json, text/plain, */*",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Referer": "https://dramo247.com/",
      "Origin": "https://dramo247.com",
    },
  });

  const events = res.data?.data?.events || [];

  // Filter only soccer events
  const soccerEvents = events.filter(ev => ev.event_type_id === 1);

  // Unique competition names
  const uniqueCompetitions = [
    ...new Set(soccerEvents.map(ev => ev.competition_name).filter(Boolean))
  ];

  const leagueArray = uniqueCompetitions.map(name => ({ name, matches: [] }));
  setLeagues(leagueArray);
  return;
}


      // 🏏 Otherwise, fetch from original API
      const res = await axios.get(
        `https://central.zplay1.in/pb/api/v1/events/matches/${sport.id}`
      );

      if (res.data.success) {
        const leagueMap = {};
        res.data.data.forEach((match) => {
          if (match.league_name !== "Exclusive League") {
            if (!leagueMap[match.league_name]) leagueMap[match.league_name] = [];
            leagueMap[match.league_name].push(match);
          }
        });

        const leagueArray = Object.keys(leagueMap).map((leagueName) => ({
          name: leagueName,
          matches: leagueMap[leagueName],
        }));

        setLeagues(leagueArray);
      }
    } catch (err) {
      console.error("Error fetching leagues:", err);
    }
  };

  if (loading) return <p>Loading sports...</p>;

  return (
    <div className="app-container">
      <h1 className="app-title">Sports Panel 🚀</h1>

      {/* Sports List */}
      <div className="sports-scroll-container">
        {sports.map((sport) => (
          <div
            key={sport.id}
            className={`sport-box ${
              selectedSport === sport.id ? "selected" : ""
            }`}
            onClick={() => handleSportClick(sport)}
          >
            {sport.name}
          </div>
        ))}
      </div>

      {/* Leagues (for Soccer this will show unique competitions) */}
      {leagues.length > 0 && (
        <div className="leagues-container">
          <h2>
            {selectedSportName.toLowerCase() === "soccer"
              ? "Soccer Competitions"
              : "Leagues"}
          </h2>
          <div className="leagues-scroll">
            {leagues.map((league, idx) => (
              <div
                key={idx}
                className={`league-box ${
                  selectedLeague?.name === league.name ? "selected" : ""
                }`}
              >
                <p className="league-name">{league.name}</p>
                {selectedSportName.toLowerCase() !== "soccer" && (
                  <p className="league-count">
                    {league.matches.length} matches
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* For soccer, matches section will not show */}
      {selectedSportName.toLowerCase() !== "soccer" && matches.length > 0 && (
        <div className="matches-container">
          <h3>Matcheds</h3>
          <table className="events-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Date / Time</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => (
                <tr key={match.eventId || match.event_id}>
                  <td>{match.eventName || match.event_name}</td>
                  <td>
                    {new Date(
                      match.eventDate || match.event_date
                    ).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
