import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

export default function App() {
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState(null);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [marketData, setMarketData] = useState({});
  const [marketLoading, setMarketLoading] = useState(false);

  const priorityOrder = ["cricket", "tennis", "soccer"];
  const BASE_URL = "https://sports-panel.onrender.com"; // ✅ Live backend

  // Fetch sports
  useEffect(() => {
    async function fetchSports() {
      try {
        const res = await axios.get(`${BASE_URL}/sports`);
        let sortedSports = res.data;
        sortedSports.sort((a, b) => {
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

  // Fetch events
  const handleSportClick = async (sport) => {
    setSelectedSport(sport.id);
    setEvents([]);
    setExpandedEventId(null);
    setEventsLoading(true);

    try {
      const res = await axios.get(
        `https://central.zplay1.in/pb/api/v1/events/matches/${sport.id}`
      );
      if (res.data.success) {
        const filtered = res.data.data.filter(
          (ev) => ev.league_name !== "Exclusive League"
        );
        setEvents(filtered);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
    } finally {
      setEventsLoading(false);
    }
  };

  // Fetch market data
  const handleEventClick = async (event) => {
    const eventId = event.eventId || event.event_id;

    if (expandedEventId === eventId) {
      setExpandedEventId(null); // collapse
      return;
    }

    setExpandedEventId(eventId);
    setMarketData((prev) => ({ ...prev, [eventId]: null }));
    setMarketLoading(true);

    try {
      const res = await axios.get(
        `https://zplay1.in/pb/api/v1/events/matchDetails/${eventId}`
      );
      if (res.data.success) {
        setMarketData((prev) => ({
          ...prev,
          [eventId]: res.data.data.match?.matchOddData || [],
        }));
      }
    } catch (err) {
      console.error("Error fetching market data:", err);
    } finally {
      setMarketLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <p className="loading-text">Loading sports...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <h1 className="app-title">Sports Panel 🚀</h1>

      {/* Sports horizontal scroll */}
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

      {/* Events Table */}
      <div className="events-container">
        {eventsLoading && <p className="loading-text">Loading events...</p>}
        {!eventsLoading && events.length === 0 && selectedSport && (
          <p className="loading-text">No events found for this sport.</p>
        )}

        {!eventsLoading && events.length > 0 && (
          <table className="events-table">
            <thead>
              <tr>
                <th>League</th>
                <th>Event</th>
                <th>Date / Time</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => {
                const eventId = ev.eventId || ev.event_id;
                return (
                  <React.Fragment key={eventId}>
                    {/* Event row */}
                    <tr
                      onClick={() => handleEventClick(ev)}
                      className="event-row"
                    >
                      <td>{ev.leaguesName || ev.league_name}</td>
                      <td>{ev.eventName || ev.event_name}</td>
                      <td>
                        {new Date(ev.eventDate || ev.event_date).toLocaleString()}
                      </td>
                    </tr>

                    {/* Market row */}
                    {expandedEventId === eventId && marketLoading && (
                      <tr className="market-row">
                        <td colSpan="3">Loading market data...</td>
                      </tr>
                    )}

                    {expandedEventId === eventId &&
                      !marketLoading &&
                      marketData[eventId]?.length > 0 &&
                      marketData[eventId].map((market) => (
                        <tr key={market.id} className="market-row">
                          <td colSpan="3">
                            <div className="market-card">
                              <p className="market-name">{market.marketName}</p>
                              <p>
                                Inplay Stake Limit: {market.inplay_stake_limit} | Max Market Limit:{" "}
                                {market.max_market_limit} | Min Stake Limit: {market.min_stake_limit} | Odd Limit: {market.odd_limit}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ))}

                    {expandedEventId === eventId &&
                      !marketLoading &&
                      (!marketData[eventId] || marketData[eventId].length === 0) && (
                        <tr className="market-row">
                          <td colSpan="3">No market data available</td>
                        </tr>
                      )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
