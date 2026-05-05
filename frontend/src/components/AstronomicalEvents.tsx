import { useEffect, useRef, useState } from "react";
import { getAstronomicalEvents, AstronomicalEvent } from "../api/astronomical";

interface StoredLocation {
  lat: number;
  lon: number;
  name: string;
}

const LS_KEY = "cosmo_location";

const TYPE_ICON: Record<string, string> = {
  meteor_shower: "☄",
  planet:        "★",
  eclipse:       "◎",
  solstice:      "✦",
  moon:          "◐",
};

const TYPE_LABEL: Record<string, string> = {
  meteor_shower: "Meteor Shower",
  planet:        "Planet",
  eclipse:       "Eclipse",
  solstice:      "Solstice / Equinox",
  moon:          "Moon",
};

function formatDate(iso: string): string {
  const d = new Date(iso + "T12:00:00Z");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function buildCalendarUrl(ev: AstronomicalEvent): string {
  const base = ev.date.replace(/-/g, "");
  const dates = `${base}/${base}`;
  const text = encodeURIComponent(ev.name);
  const details = encodeURIComponent(
    `${ev.description}${ev.direction ? ` Look: ${ev.direction}` : ""}${ev.time_hint ? ` · ${ev.time_hint}` : ""}`
  );
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}`;
}

async function geocode(city: string): Promise<{ lat: number; lon: number; name: string } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    if (!data.length) return null;
    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
      name: data[0].display_name.split(",").slice(0, 2).join(", "),
    };
  } catch {
    return null;
  }
}

export default function AstronomicalEvents() {
  const [events, setEvents] = useState<AstronomicalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<StoredLocation | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [cityInput, setCityInput] = useState("");
  const [geoError, setGeoError] = useState("");
  const [geoWorking, setGeoWorking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load saved location on mount
  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      try {
        setLocation(JSON.parse(saved) as StoredLocation);
        return;
      } catch {
        /* ignore corrupt data */
      }
    }
    // Try browser geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: StoredLocation = {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            name: "Your Location",
          };
          localStorage.setItem(LS_KEY, JSON.stringify(loc));
          setLocation(loc);
        },
        () => {
          // Denied or unavailable — show edit panel
          setEditMode(true);
          setLoading(false);
        },
        { timeout: 6000 }
      );
    } else {
      setEditMode(true);
      setLoading(false);
    }
  }, []);

  // Fetch events whenever location changes
  useEffect(() => {
    if (!location) return;
    setLoading(true);
    getAstronomicalEvents(location.lat, location.lon)
      .then(({ data }) => setEvents(data.events))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [location]);

  // Focus input when edit panel opens
  useEffect(() => {
    if (editMode) inputRef.current?.focus();
  }, [editMode]);

  async function handleCitySubmit(e: React.FormEvent) {
    e.preventDefault();
    const city = cityInput.trim();
    if (!city) return;
    setGeoWorking(true);
    setGeoError("");
    const result = await geocode(city);
    setGeoWorking(false);
    if (!result) {
      setGeoError("Location not found. Try a different city name.");
      return;
    }
    localStorage.setItem(LS_KEY, JSON.stringify(result));
    setLocation(result);
    setEditMode(false);
    setCityInput("");
  }

  return (
    <div className="astro-section">
      {/* Location bar */}
      <div className="astro-location-bar">
        <span className="astro-location-label">
          <span className="astro-location-pin">◎</span>
          {location ? location.name : "Set your location for sky directions"}
        </span>
        <button
          className="btn btn-ghost astro-location-btn"
          onClick={() => { setEditMode((v) => !v); setCityInput(""); setGeoError(""); }}
        >
          {editMode ? "Cancel" : "Change"}
        </button>
      </div>

      {/* Location edit panel */}
      {editMode && (
        <form className="astro-location-form" onSubmit={handleCitySubmit}>
          <input
            ref={inputRef}
            className="filter-search-input astro-city-input"
            type="text"
            placeholder="Enter city name (e.g. Brussels, New York…)"
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            disabled={geoWorking}
          />
          <button className="btn btn-primary-sm" type="submit" disabled={geoWorking || !cityInput.trim()}>
            {geoWorking ? "Searching…" : "Set"}
          </button>
          {geoError && <span className="astro-geo-error">{geoError}</span>}
        </form>
      )}

      {/* Events strip */}
      {loading && <p className="loading-text astro-loading">Loading sky events…</p>}

      {!loading && !editMode && events.length === 0 && (
        <p className="loading-text astro-loading">No upcoming events found.</p>
      )}

      {!loading && events.length > 0 && (
        <div className="astro-strip" role="list">
          {events.map((ev) => (
            <div key={ev.id} className={`astro-card astro-card--${ev.type}`} role="listitem">
              <div className="astro-card-header">
                <span className="astro-card-icon">{TYPE_ICON[ev.type] ?? "✦"}</span>
                <span className="astro-card-type">{TYPE_LABEL[ev.type] ?? ev.type}</span>
              </div>
              <div className="astro-card-name">{ev.name}</div>
              <div className="astro-card-date">{formatDate(ev.date)}</div>
              {ev.time_hint && (
                <div className="astro-card-time">{ev.time_hint}</div>
              )}
              {ev.direction && (
                <div className="astro-card-direction">
                  Look: <strong>{ev.direction}</strong>
                  {ev.altitude !== undefined && <> · {ev.altitude}°</>}
                </div>
              )}
              <p className="astro-card-desc">{ev.description}</p>
              <a
                className="astro-card-cal"
                href={buildCalendarUrl(ev)}
                target="_blank"
                rel="noopener noreferrer"
                title="Add to Google Calendar"
              >
                + Calendar
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
