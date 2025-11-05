import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";
import OddsDashboard from "./OddsDashboard"; // Path सही करें जहां OddsDashboard है

export default function App() {
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState(null);
  const [selectedSportName, setSelectedSportName] = useState("");
  const [expandedLeague, setExpandedLeague] = useState(null);

  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [matches, setMatches] = useState([]);
  const [matchDetails, setMatchDetails] = useState({});
  const [expandedMatch, setExpandedMatch] = useState(null);

  const [showOdds, setShowOdds] = useState(false); // Toggle for Odds Dashboard

  const BASE_URL = "https://sports-panel.onrender.com";

  // Fetch sports
  useEffect(() => {
    async function fetchSports() {
      try {
        const res = await axios.get(`${BASE_URL}/sports`);
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

  // Handle sport click
  const handleSportClick = async (sport) => {
    setSelectedSport(sport.id);
    setSelectedSportName(sport.name);
    setLeagues([]);
    setSelectedLeague(null);
    setMatches([]);
    setExpandedLeague(null);

    try {
      if (sport.name.toLowerCase() === "soccer") {
        const res = await axios.get(
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

        const events = res.data?.data?.events || [];
        const soccerEvents = events.filter((ev) => ev.event_type_id === 1);
        const uniqueCompetitions = [
          ...new Set(
            soccerEvents.map((ev) => ev.competition_name).filter(Boolean)
          ),
        ];

        const leagueArray = uniqueCompetitions.map((name) => ({
          name,
          matches: soccerEvents.filter((ev) => ev.competition_name === name),
        }));

        setLeagues(leagueArray);
        return;
      }

      // Other sports including tennis
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
      } else {
        console.error("Error fetching matches:", res.data.message);
      }
    } catch (err) {
      console.error("Error handling sport click:", err);
    }
  };

  // Handle league click
  const handleLeagueClick = (league) => {
    if (selectedSportName.toLowerCase() === "soccer") {
      const isExpanded = expandedLeague === league.name;
      setExpandedLeague(isExpanded ? null : league.name);
      setMatches(isExpanded ? [] : league.matches);
    }

    if (selectedSportName.toLowerCase() === "tennis") {
      const toggle = expandedLeague === league.name ? null : league.name;
      setExpandedLeague(toggle);
      setMatches(league.matches);
    }

    setSelectedLeague(league);
  };

  // Handle match click (tennis only)
  const handleMatchClick = async (match) => {
    setExpandedMatch(expandedMatch === match.matchId ? null : match.matchId);

    if (matchDetails[match.matchId]) return;

    try {
      const res = await axios.get(
        `https://central.zplay1.in/pb/api/v1/events/matchDetails/${match.event_id}`
      );

      if (res.data.success && res.data.data?.match) {
        const oddData = res.data.data.match.matchOddData || [];

        setMatchDetails((prev) => ({
          ...prev,
          [match.matchId]: oddData,
        }));
      }
    } catch (err) {
      console.error("Error fetching match details:", err);
    }
  };

  if (loading) return <p>Loading sports...</p>;

  return (
    <div className="app-container">
      <h1 className="app-title">Sports Panel 🚀</h1>

      {/* Toggle Odds Dashboard */}
      <button
        onClick={() => setShowOdds(!showOdds)}
        style={{ marginBottom: "20px", padding: "8px 12px" }}
      >
        {showOdds ? "Hide Odds Dashboard" : "Show Odds Dashboard"}
      </button>

      {/* Sports List */}
      <div className="sports-scroll-container">
        {sports.map((sport) => (
          <div
            key={sport.id}
            className={`sport-box ${selectedSport === sport.id ? "selected" : ""}`}
            onClick={() => handleSportClick(sport)}
          >
            {sport.name}
          </div>
        ))}
      </div>

      {/* Leagues */}
      {leagues.length > 0 && (
        <div className="leagues-container">
          <h2>
            {selectedSportName.toLowerCase() === "soccer"
              ? "Soccer Competitions"
              : "Leagues"}
          </h2>
          <div className="leagues-scroll">
            {leagues.map((league, idx) => (
              <div key={idx}>
                <div
                  className={`league-box ${
                    selectedLeague?.name === league.name ? "selected" : ""
                  }`}
                  onClick={() => handleLeagueClick(league)}
                >
                  <p className="league-name">{league.name}</p>
                  {selectedSportName.toLowerCase() !== "soccer" && (
                    <p className="league-count">{league.matches.length} matches</p>
                  )}
                </div>

                {/* Soccer matches table */}
                {selectedSportName.toLowerCase() === "soccer" &&
                  expandedLeague === league.name &&
                  matches.length > 0 && (
                    <div className="events-container">
                      <table className="events-table">
                        <thead>
                          <tr>
                            <th>Event</th>
                            <th>Date / Time</th>
                            <th>Live</th>
                          </tr>
                        </thead>
                        <tbody>
                          {matches.map((match) => (
                            <tr key={match.event_id}>
                              <td>{match.name}</td>
                              <td>{new Date(match.open_date).toLocaleString()}</td>
                              <td>{match.in_play ? "Yes" : "No"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tennis Matches Table */}
      {selectedSportName.toLowerCase() === "tennis" && matches.length > 0 && (
        <div className="events-container">
          <h3>Tennis Matches - {selectedLeague?.name}</h3>
          <table className="events-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>League</th>
                <th>Date / Time</th>
                <th>Live</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => (
                <React.Fragment key={match.matchId}>
                  <tr onClick={() => handleMatchClick(match)}>
                    <td>{match.event_name}</td>
                    <td>{match.league_name}</td>
                    <td>{new Date(match.event_date).toLocaleString()}</td>
                    <td>{match.isMatchLive ? "Yes" : "No"}</td>
                  </tr>
                  {expandedMatch === match.matchId &&
                    matchDetails[match.matchId]?.map((odd) => (
                      <tr key={odd.id} className="market-card">
                        <td colSpan={4}>
                          <p className="market-name">{odd.marketName}</p>
                          <p>Odd Limit: {odd.odd_limit}</p>
                          <p>Stake Limit: {odd.stake_limit}</p>
                          <p>Inplay Stake Limit: {odd.inplay_stake_limit}</p>
                          <p>Min Stake Limit: {odd.min_stake_limit}</p>
                          <p>Max Market Limit: {odd.max_market_limit}</p>
                        </td>
                      </tr>
                    ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Other sports (non-soccer, non-tennis) */}
      {selectedSportName.toLowerCase() !== "soccer" &&
        selectedSportName.toLowerCase() !== "tennis" &&
        matches.length > 0 && (
          <div className="events-container">
            <h3>Matches</h3>
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
                      {new Date(match.eventDate || match.event_date).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      {/* Odds Dashboard */}
      {showOdds && (
        <div style={{ marginTop: "40px" }}>
          <OddsDashboard />
        </div>
      )}
    </div>
  );
}
