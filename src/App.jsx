import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

export default function App() {
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState(null);
  const [selectedSportName, setSelectedSportName] = useState(""); // ✅ Tennis Max Profit logic

  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState(null);

  const [matches, setMatches] = useState([]);
  const [expandedMatchId, setExpandedMatchId] = useState(null);
  const [marketData, setMarketData] = useState({});
  const [marketLoading, setMarketLoading] = useState(false);

  const BASE_URL = "https://sports-panel.onrender.com"; // Live backend

  // Fetch sports
  useEffect(() => {
    async function fetchSports() {
      try {
        const res = await axios.get(`${BASE_URL}/sports`);

        // Priority order: cricket, tennis, soccer
        const priorityOrder = ["cricket", "tennis", "soccer"];
        let sortedSports = res.data.sort((a, b) => {
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

  // Fetch leagues for selected sport
  const handleSportClick = async (sport) => {
    setSelectedSport(sport.id);
    setSelectedSportName(sport.name); // ✅ store sport name for Tennis logic
    setLeagues([]);
    setSelectedLeague(null);
    setMatches([]);
    setExpandedMatchId(null);

    try {
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

  // Show matches for selected league
  const handleLeagueClick = (league) => {
    setSelectedLeague(league);
    setMatches(league.matches);
    setExpandedMatchId(null);
  };

  // Fetch market data for a match
  const handleMatchClick = async (match) => {
    const matchId = match.eventId || match.event_id;
    if (expandedMatchId === matchId) {
      setExpandedMatchId(null);
      return;
    }

    setExpandedMatchId(matchId);
    setMarketData((prev) => ({ ...prev, [matchId]: null }));
    setMarketLoading(true);

    try {
      const res = await axios.get(
        `https://zplay1.in/pb/api/v1/events/matchDetails/${matchId}`
      );
      if (res.data.success) {
        setMarketData((prev) => ({
          ...prev,
          [matchId]: res.data.data.match?.matchOddData || [],
        }));
      }
    } catch (err) {
      console.error("Error fetching market data:", err);
    } finally {
      setMarketLoading(false);
    }
  };

  if (loading) return <p>Loading sports...</p>;

  return (
    <div className="app-container">
      <h1 className="app-title">Sports Panel 🚀</h1>

      {/* Sports */}
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
          <h2>Leagues</h2>
          <div className="leagues-scroll">
            {leagues.map((league, idx) => (
              <div
                key={idx}
                className={`league-box ${
                  selectedLeague?.name === league.name ? "selected" : ""
                }`}
                onClick={() => handleLeagueClick(league)}
              >
                <p className="league-name">{league.name}</p>
                <p className="league-count">{league.matches.length} matches</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Matches */}
      {matches.length > 0 && (
        <div className="matches-container">
          <h3>Matches</h3>
          <table className="events-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Date / Time</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => {
                const matchId = match.eventId || match.event_id;

                return (
                  <React.Fragment key={matchId}>
                    <tr
                      className="event-row"
                      onClick={() => handleMatchClick(match)}
                    >
                      <td>{match.eventName || match.event_name}</td>
                      <td>
                        {new Date(
                          match.eventDate || match.event_date
                        ).toLocaleString()}
                      </td>
                    </tr>

                    {/* Market row */}
                    {expandedMatchId === matchId && marketLoading && (
                      <tr>
                        <td colSpan="2">Loading market data...</td>
                      </tr>
                    )}

                    {expandedMatchId === matchId &&
                      !marketLoading &&
                      marketData[matchId]?.length > 0 &&
                      marketData[matchId].map((market) => {
                        // ✅ Max Profit Limit logic for Tennis + Soccer
let maxProfitLimit = null;
const sportName = selectedSportName.toLowerCase();
if (sportName === "tennis" || sportName === "soccer") {
  const stake = Number(market.inplay_stake_limit);
  if (stake === 5000) maxProfitLimit = 100000;
  else if (stake === 10000) maxProfitLimit = 200000;
  else if (stake === 25000) maxProfitLimit = 300000;
  else if (stake === 50000) maxProfitLimit = 400000;
  else if (stake === 100000) maxProfitLimit = 500000;
  else if (stake === 200000) maxProfitLimit = 700000;
}

                        return (
                          <tr key={market.id}>
                            <td colSpan="2">
                              <div className="market-card">
                                <p>{market.marketName}</p>
                                <p>
                                  Inplay Stake Limit: {market.inplay_stake_limit} | Max Market Limit:{" "}
                                  {market.max_market_limit} | Min Stake Limit: {market.min_stake_limit} | Odd Limit: {market.odd_limit}
                                  {maxProfitLimit !== null &&
                                    ` | Max Profit Limit: ${maxProfitLimit}`}
                                </p>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                    {expandedMatchId === matchId &&
                      !marketLoading &&
                      (!marketData[matchId] || marketData[matchId].length === 0) && (
                        <tr>
                          <td colSpan="2">No market data available</td>
                        </tr>
                      )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
