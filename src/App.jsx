import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

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
      // Soccer
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
          matches: [], // Will fetch matches when league is clicked
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
  const handleLeagueClick = async (league) => {
    // Soccer league toggle & fetch matches
    if (selectedSportName.toLowerCase() === "soccer") {
      const isExpanded = expandedLeague === league.name;
      setExpandedLeague(isExpanded ? null : league.name);

      // Fetch matches only if not loaded
      if (!league.matches || league.matches.length === 0) {
        try {
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
          const leagueMatches = events.filter(
            (ev) =>
              ev.competition_name === league.name && ev.event_type_id === 1
          );

          league.matches = leagueMatches;
        } catch (err) {
          console.error("Error fetching soccer league matches:", err);
        }
      }

      setMatches(league.matches || []);
    }

    // Tennis logic unchanged
    if (selectedSportName.toLowerCase() === "tennis") {
      const toggle = expandedLeague === league.name ? null : league.name;
      setExpandedLeague(toggle);
      setMatches(league.matches);
    }

    setSelectedLeague(league);
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

                {/* Soccer matches display */}
                {selectedSportName.toLowerCase() === "soccer" &&
                  expandedLeague === league.name &&
                  matches.length > 0 && (
                    <div className="soccer-matches-container">
                      {matches.map((match) => (
                        <div key={match.event_id} className="soccer-match-box">
                          <p>{match.name}</p>
                          <p>Date: {new Date(match.open_date).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
